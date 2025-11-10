import React, { useState, useEffect, useCallback } from 'react';
import { useParams, NavLink } from 'react-router-dom';
// FIX: Changed firebase imports to use the '@firebase' scope.
import { doc, getDoc, collection, query, orderBy, getDocs, serverTimestamp, where, Timestamp, limit, setDoc, deleteDoc, updateDoc, increment, arrayUnion, arrayRemove, writeBatch } from '@firebase/firestore';
import { db } from '../services/firebase';
import { Song, Artist, Review as ReviewType } from '../types';
import { useAuth } from '../hooks/useAuth';
import PageLoader from '../components/common/PageLoader';
import { Star, Mic, Pen, Clock, Calendar, User, Send, Music, Heart } from 'lucide-react';
import { formatDate } from '../utils/formatters';

const StarRatingDisplay: React.FC<{ rating: number; size?: number }> = ({ rating, size = 5 }) => (
  <div className="flex items-center">
    {[...Array(5)].map((_, index) => (
      <Star
        key={index}
        className={`h-${size} w-${size} ${index < rating ? 'text-yellow-400 fill-current' : 'text-gray-300 dark:text-gray-600'}`}
      />
    ))}
  </div>
);

const ReviewCard: React.FC<{ review: ReviewType; songId: string }> = ({ review, songId }) => {
    const { currentUser } = useAuth();
    const [isLiked, setIsLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(review.likesCount ?? review.likes?.length ?? 0);
    const [isLikeLoading, setIsLikeLoading] = useState(false);

    useEffect(() => {
        if (currentUser && review.likes) {
            setIsLiked(review.likes.includes(currentUser.uid));
        }
    }, [currentUser, review.likes]);

    const handleLikeToggle = async () => {
        if (!currentUser || isLikeLoading) return;
        setIsLikeLoading(true);

        const reviewRef = doc(db, 'songs', songId, 'reviews', review.id);
        const newIsLiked = !isLiked;
        
        // Optimistic update
        setIsLiked(newIsLiked);
        setLikesCount(prev => newIsLiked ? prev + 1 : prev - 1);

        try {
            if (newIsLiked) {
                await updateDoc(reviewRef, {
                    likes: arrayUnion(currentUser.uid),
                    likesCount: increment(1),
                });
            } else {
                await updateDoc(reviewRef, {
                    likes: arrayRemove(currentUser.uid),
                    likesCount: increment(-1),
                });
            }
        } catch (error) {
            console.error("Failed to like review:", error);
            // Revert optimistic update on error
            setIsLiked(!newIsLiked);
            setLikesCount(prev => newIsLiked ? prev - 1 : prev + 1);
        } finally {
            setIsLikeLoading(false);
        }
    };
    
    return (
      <div className="p-4">
        <div className="flex items-start space-x-4">
          <img
            src={review.userPhotoURL || `https://ui-avatars.com/api/?name=${review.userDisplayName}&background=random`}
            alt={review.userDisplayName}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{review.userDisplayName}</p>
                <StarRatingDisplay rating={review.rating} size={4} />
              </div>
              <NavLink to={`/review/${review.id}`} className="text-xs text-gray-500 hover:underline">
                {review.createdAt instanceof Timestamp ? formatDate(review.createdAt) : 'Just now'}
              </NavLink>
            </div>
            {review.reviewText && <p className="mt-2 text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{review.reviewText}</p>}
             <div className="flex items-center space-x-4 mt-3 text-gray-500">
                {currentUser ? (
                    <button 
                        onClick={handleLikeToggle} 
                        disabled={isLikeLoading} 
                        className="flex items-center space-x-1 hover:text-red-500 disabled:opacity-50 transition-colors"
                    >
                        <Heart size={16} className={`transition-all ${isLiked ? 'text-red-500 fill-current' : ''}`} />
                        <span className="text-sm font-medium">{likesCount}</span>
                    </button>
                ) : (
                    <div className="flex items-center space-x-1">
                        <Heart size={16} />
                        <span className="text-sm font-medium">{likesCount}</span>
                    </div>
                )}
            </div>
          </div>
        </div>
      </div>
    );
};

const ReviewForm: React.FC<{ song: Song; onReviewSubmit: () => void }> = ({ song, onReviewSubmit }) => {
  const { currentUser, userProfile } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !userProfile) {
      setError('You must be logged in to post a review.');
      return;
    }
    if (rating === 0) {
      setError('Please select a rating.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const songRef = doc(db, 'songs', song.id);
      const songReviewsRef = collection(db, 'songs', song.id, 'reviews');
      
      const newReviewRef = doc(songReviewsRef);
      const reviewData = {
          id: newReviewRef.id,
          userId: currentUser.uid,
          userDisplayName: userProfile.displayName,
          userPhotoURL: userProfile.photoURL,
          rating,
          reviewText,
          createdAt: serverTimestamp(),
          likes: [],
          likesCount: 0,
          entityId: song.id,
          entityType: 'song',
          entityTitle: song.title,
          entityCoverArtUrl: song.coverArtUrl
      };

      await setDoc(newReviewRef, reviewData);

      // This part would ideally be a Cloud Function to avoid permission issues.
      // We attempt the update, but it may fail harmlessly if users don't have write access.
      try {
          const songDoc = await getDoc(songRef);
          const newReviewCount = (songDoc.data()?.reviewCount || 0) + 1;
          await updateDoc(songRef, { reviewCount: newReviewCount });
      } catch (updateError) {
          console.warn("Could not update review count, likely due to permissions.", updateError);
      }
      
      setRating(0);
      setReviewText('');
      onReviewSubmit();
    } catch (err) {
      console.error(err);
      setError('Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 bg-transparent rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700">
        <h3 className="font-serif text-xl font-bold mb-2">Leave a Review</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center space-x-1">
                {[...Array(5)].map((_, index) => {
                    const starValue = index + 1;
                    return (
                        <button
                            type="button"
                            key={starValue}
                            onClick={() => setRating(starValue)}
                            onMouseEnter={() => setHoverRating(starValue)}
                            onMouseLeave={() => setHoverRating(0)}
                            className="focus:outline-none"
                        >
                            <Star className={`h-8 w-8 transition-colors ${
                                starValue <= (hoverRating || rating)
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300 dark:text-gray-600'
                            }`} />
                        </button>
                    );
                })}
            </div>
            <div>
                <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    rows={4}
                    placeholder="Share your thoughts on this song... (optional)"
                    className="w-full p-2 border border-gray-300 rounded-md bg-white dark:bg-gray-700 dark:border-gray-600"
                />
            </div>
            {error && <p className="text-sm text-ac-danger">{error}</p>}
            <button type="submit" disabled={submitting} className="flex items-center px-4 py-2 bg-ac-primary text-white rounded-md hover:bg-ac-primary/90 disabled:bg-gray-400">
                <Send className="mr-2 h-4 w-4"/> {submitting ? 'Posting...' : 'Post Review'}
            </button>
        </form>
    </div>
  );
};

const SongPage = () => {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const [song, setSong] = useState<Song | null>(null);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [reviews, setReviews] = useState<ReviewType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isLiked, setIsLiked] = useState(false);
  const [isLikeLoading, setIsLikeLoading] = useState(true);
  const [likesCount, setLikesCount] = useState(0);

  const fetchSongData = useCallback(async () => {
    if (!id) {
        setError("Song ID is missing.");
        setLoading(false);
        return;
    }
    try {
        setLoading(true);
        // Fetch Song
        const songRef = doc(db, 'songs', id);
        const songSnap = await getDoc(songRef);
        if (!songSnap.exists()) {
            setError("Song not found.");
            return;
        }
        const songData = { id: songSnap.id, ...songSnap.data() } as Song;
        setSong(songData);
        setLikesCount(songData.likesCount || 0);

        // Fetch Artists
        if (songData.artistIds?.length > 0) {
            const artistsQuery = query(collection(db, 'artists'), where('__name__', 'in', songData.artistIds));
            const artistsSnap = await getDocs(artistsQuery);
            setArtists(artistsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Artist)));
        }

        // Fetch Reviews
        const reviewsQuery = query(collection(db, 'songs', id, 'reviews'), orderBy('createdAt', 'desc'));
        const reviewsSnap = await getDocs(reviewsQuery);
        setReviews(reviewsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ReviewType)));

    } catch (err) {
        console.error("Error fetching song data:", err);
        setError("Failed to load song details.");
    } finally {
        setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSongData();
  }, [fetchSongData]);
  
  useEffect(() => {
    if (!currentUser || !song) {
        setIsLikeLoading(false);
        return;
    }
    const checkLike = async () => {
        setIsLikeLoading(true);
        const likeDocRef = doc(db, 'likes', `${currentUser.uid}_${song.id}`);
        const likeDocSnap = await getDoc(likeDocRef);
        setIsLiked(likeDocSnap.exists());
        setIsLikeLoading(false);
    };
    checkLike();
  }, [currentUser, song]);

  const handleLikeToggle = async () => {
    if (!currentUser || !song || isLikeLoading) return;
    setIsLikeLoading(true);

    const likeDocRef = doc(db, 'likes', `${currentUser.uid}_${song.id}`);
    const songRef = doc(db, 'songs', song.id);
    const batch = writeBatch(db);

    const newIsLiked = !isLiked;
    
    // Optimistic UI update for responsiveness
    setIsLiked(newIsLiked);
    setLikesCount(prev => newIsLiked ? prev + 1 : prev - 1);

    try {
        if (newIsLiked) { // Like
            batch.set(likeDocRef, {
                userId: currentUser.uid,
                entityId: song.id,
                entityType: 'song',
                createdAt: serverTimestamp(),
                entityTitle: song.title,
                entityCoverArtUrl: song.coverArtUrl,
            });
            batch.update(songRef, { likesCount: increment(1) });
        } else { // Unlike
            batch.delete(likeDocRef);
            batch.update(songRef, { likesCount: increment(-1) });
        }
        await batch.commit();

    } catch (e: any) {
        console.error("Like toggle failed: ", e);
        setError(`Could not complete action. Error: ${e.message}`);
        // Revert optimistic update on failure
        setIsLiked(!newIsLiked);
        setLikesCount(prev => newIsLiked ? prev - 1 : prev + 1);
    } finally {
        setIsLikeLoading(false);
    }
  };


  if (loading) return <PageLoader />;
  if (error) return <div className="text-center py-20 text-ac-danger">{error}</div>;
  if (!song) return null;

  const formatDuration = (seconds: number) => `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
  
  const getCreditIcon = (role: string) => {
    const lowerRole = role.toLowerCase();
    if (lowerRole.includes('write') || lowerRole.includes('compose') || lowerRole.includes('lyric')) {
        return <Pen className="h-5 w-5 text-ac-primary dark:text-ac-secondary" />;
    }
    if (lowerRole.includes('produce')) {
        return <Mic className="h-5 w-5 text-ac-primary dark:text-ac-secondary" />;
    }
    return <User className="h-5 w-5 text-ac-primary dark:text-ac-secondary" />;
  };


  return (
    <div className="space-y-12">
      <section className="flex flex-col md:flex-row gap-8 md:gap-12">
        <div className="md:w-1/3 flex-shrink-0">
            <img
                src={song.coverArtUrl || `https://placehold.co/400x400/131010/FAF8F1?text=${encodeURIComponent(song.title.charAt(0)) || '🎵'}`}
                alt={song.title}
                className="w-full aspect-square rounded-lg shadow-xl object-cover"
            />
        </div>
        <div className="md:w-2/3">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold font-serif">{song.title}</h1>
                <div className="mt-2 text-xl text-gray-700 dark:text-gray-300">
                    by{' '}
                    {artists.map((artist, index) => (
                        <React.Fragment key={artist.id}>
                            <NavLink to={`/artist/${artist.id}`} className="font-semibold hover:underline text-ac-secondary">
                                {artist.name}
                            </NavLink>
                            {index < artists.length - 1 && ', '}
                        </React.Fragment>
                    ))}
                </div>
              </div>
              <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
                  <button onClick={handleLikeToggle} disabled={!currentUser || isLikeLoading} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                      <Heart size={24} className={`transition-all ${isLiked ? 'text-red-500 fill-current' : 'text-gray-500'}`} />
                  </button>
                  <span className="font-semibold text-lg">{likesCount}</span>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-gray-500 dark:text-gray-400">
                <div className="flex items-center"><Calendar className="mr-2 h-4 w-4" /><span className="hidden sm:inline mr-1">Released:</span> {formatDate(song.releaseDate)}</div>
                <div className="flex items-center"><Clock className="mr-2 h-4 w-4" /><span className="hidden sm:inline mr-1">Duration:</span> {formatDuration(song.duration)}</div>
                <div className="flex items-center"><Music className="mr-2 h-4 w-4" /><span className="hidden sm:inline mr-1">Genre:</span> {song.genre}</div>
            </div>

            <div className="mt-8">
                <h2 className="text-2xl font-bold font-serif mb-4">Listen On</h2>
                <div className="flex space-x-4">
                    {song.platformLinks?.spotify && <a href={song.platformLinks.spotify} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-[#1DB954] text-white rounded-md font-semibold">Spotify</a>}
                    {song.platformLinks?.appleMusic && <a href={song.platformLinks.appleMusic} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-black text-white rounded-md font-semibold">Apple Music</a>}
                    {song.platformLinks?.youtubeMusic && <a href={song.platformLinks.youtubeMusic} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-[#FF0000] text-white rounded-md font-semibold">YouTube Music</a>}
                </div>
            </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold font-serif mb-4">Credits</h2>
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {Object.entries(song.credits).map(([role, names]) => (
                <li key={role} className="px-4 py-3 flex items-center space-x-4 transition-colors odd:bg-transparent even:bg-black/[.03] dark:even:bg-white/[.03] hover:bg-black/[.05] dark:hover:bg-white/[.05]">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-ac-primary/10 dark:bg-ac-secondary/20 flex items-center justify-center">
                    {getCreditIcon(role)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-200">{role}</p>
                    <p className="text-gray-600 dark:text-gray-400">{Array.isArray(names) ? names.join(', ') : ''}</p>
                  </div>
                </li>
              ))}
            </ul>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold font-serif mb-4">Reviews</h2>
        <div className="space-y-6">
            {currentUser && <ReviewForm song={song} onReviewSubmit={fetchSongData} />}
            {reviews.length > 0 ? (
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                        {reviews.map(review => (
                            <li key={review.id} className="group transition-colors odd:bg-transparent even:bg-black/[.03] dark:even:bg-white/[.03] hover:bg-black/[.05] dark:hover:bg-white/[.05]">
                                <ReviewCard review={review} songId={song.id} />
                            </li>
                        ))}
                    </ul>
                </div>
            ) : (
                <div className="text-center py-10 border-2 border-dashed rounded-lg text-gray-400 dark:text-gray-600">
                    <Pen className="mx-auto h-8 w-8" />
                    <p className="mt-2">Be the first to review this song.</p>
                </div>
            )}
        </div>
      </section>
    </div>
  );
};

export default SongPage;