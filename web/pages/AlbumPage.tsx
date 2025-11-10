import React, { useState, useEffect, useCallback } from 'react';
import { useParams, NavLink } from 'react-router-dom';
// FIX: Changed firebase imports to use the '@firebase' scope.
import { doc, getDoc, collection, query, where, getDocs, orderBy, serverTimestamp, Timestamp, limit, setDoc, deleteDoc, updateDoc, arrayUnion, arrayRemove, increment, writeBatch } from '@firebase/firestore';
import { db } from '../services/firebase';
import { Album, Artist, Song, Review as ReviewType, Role } from '../types';
import PageLoader from '../components/common/PageLoader';
import { MoreHorizontal, Music, Star, Pen, Send, Heart } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { formatDate } from '../utils/formatters';

const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

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
  
const ReviewCard: React.FC<{ review: ReviewType; albumId: string }> = ({ review, albumId }) => {
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

        const reviewRef = doc(db, 'albums', albumId, 'reviews', review.id);
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

const AlbumReviewForm: React.FC<{ album: Album; onReviewSubmit: () => void }> = ({ album, onReviewSubmit }) => {
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
            const albumRef = doc(db, 'albums', album.id);
            const albumReviewsRef = collection(db, 'albums', album.id, 'reviews');

            const newReviewRef = doc(albumReviewsRef);
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
                entityId: album.id,
                entityType: 'album',
                entityTitle: album.title,
                entityCoverArtUrl: album.coverArtUrl,
            };
    
            await setDoc(newReviewRef, reviewData);
    
            // This part would ideally be a Cloud Function to avoid permission issues.
            // We attempt the update, but it may fail harmlessly if users don't have write access.
            try {
                const albumDoc = await getDoc(albumRef);
                const newReviewCount = (albumDoc.data()?.reviewCount || 0) + 1;
                await updateDoc(albumRef, { reviewCount: newReviewCount });
            } catch (updateError) {
                console.warn("Could not update album review count, likely due to permissions.", updateError);
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
                      placeholder="Share your thoughts on this album... (optional)"
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

const AlbumPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { currentUser } = useAuth();
    const [album, setAlbum] = useState<Album | null>(null);
    const [artists, setArtists] = useState<Artist[]>([]);
    const [tracklist, setTracklist] = useState<Song[]>([]);
    const [reviews, setReviews] = useState<ReviewType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [isLiked, setIsLiked] = useState(false);
    const [isLikeLoading, setIsLikeLoading] = useState(true);
    const [likesCount, setLikesCount] = useState(0);

    const fetchAlbumData = useCallback(async () => {
        if (!id) {
            setError("Album ID is missing.");
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            // Fetch Album
            const albumRef = doc(db, 'albums', id);
            const albumSnap = await getDoc(albumRef);

            if (!albumSnap.exists()) {
                setError("Album not found.");
                setLoading(false);
                return;
            }
            
            const albumData = { id: albumSnap.id, ...albumSnap.data() } as Album;
            setAlbum(albumData);
            setLikesCount(albumData.likesCount || 0);

            // Fetch Artists
            if (albumData.artistIds && albumData.artistIds.length > 0) {
                const artistsQuery = query(collection(db, 'artists'), where('__name__', 'in', albumData.artistIds));
                const artistsSnap = await getDocs(artistsQuery);
                const artistsData = artistsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Artist));
                setArtists(artistsData);
            }

            // Fetch Songs (Tracklist)
            if (albumData.tracklist && albumData.tracklist.length > 0) {
                const songsQuery = query(collection(db, 'songs'), where('__name__', 'in', albumData.tracklist));
                const songsSnap = await getDocs(songsQuery);
                
                const songsData = songsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Song));
                const orderedTracklist = albumData.tracklist.map(songId => 
                    songsData.find(song => song.id === songId)
                ).filter((song): song is Song => !!song);
                setTracklist(orderedTracklist);
            }

            // Fetch Reviews
            const reviewsQuery = query(collection(db, 'albums', id, 'reviews'), orderBy('createdAt', 'desc'));
            const reviewsSnap = await getDocs(reviewsQuery);
            setReviews(reviewsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ReviewType)));


        } catch (err) {
            console.error("Error fetching album data:", err);
            setError("Failed to load album details.");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchAlbumData();
    }, [fetchAlbumData]);

    useEffect(() => {
        if (!currentUser || !album) {
            setIsLikeLoading(false);
            return;
        }
        const checkLike = async () => {
            setIsLikeLoading(true);
            const likeDocRef = doc(db, 'likes', `${currentUser.uid}_${album.id}`);
            const likeDocSnap = await getDoc(likeDocRef);
            setIsLiked(likeDocSnap.exists());
            setIsLikeLoading(false);
        };
        checkLike();
    }, [currentUser, album]);

    const handleLikeToggle = async () => {
        if (!currentUser || !album || isLikeLoading) return;
        setIsLikeLoading(true);
    
        const likeDocRef = doc(db, 'likes', `${currentUser.uid}_${album.id}`);
        const albumRef = doc(db, 'albums', album.id);
        const batch = writeBatch(db);
    
        const newIsLiked = !isLiked;
        
        // Optimistic UI update
        setIsLiked(newIsLiked);
        setLikesCount(prev => newIsLiked ? prev + 1 : prev - 1);
    
        try {
            if (newIsLiked) { // Like
                batch.set(likeDocRef, {
                    userId: currentUser.uid,
                    entityId: album.id,
                    entityType: 'album',
                    createdAt: serverTimestamp(),
                    entityTitle: album.title,
                    entityCoverArtUrl: album.coverArtUrl,
                });
                batch.update(albumRef, { likesCount: increment(1) });
            } else { // Unlike
                batch.delete(likeDocRef);
                batch.update(albumRef, { likesCount: increment(-1) });
            }
            await batch.commit();
    
        } catch (e) {
            console.error("Like toggle failed: ", e);
            setError("Could not complete action. Please try again.");
            // Revert optimistic update on failure
            setIsLiked(!newIsLiked);
            setLikesCount(prev => newIsLiked ? prev - 1 : prev + 1);
        } finally {
            setIsLikeLoading(false);
        }
    };

    if (loading) return <PageLoader />;
    if (error) return <div className="text-center py-20 text-ac-danger">{error}</div>;
    if (!album) return null;

    return (
        <div className="space-y-12">
            <div className="flex flex-col md:flex-row gap-8 md:gap-12">
                <div className="md:w-1/3 flex-shrink-0">
                    <img 
                        src={album.coverArtUrl || 'https://picsum.photos/seed/album-placeholder/400/400'} 
                        alt={album.title}
                        className="w-full aspect-square rounded-lg shadow-xl object-cover"
                    />
                </div>
                <div className="md:w-2/3">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-bold font-serif">{album.title}</h1>
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
                            <p className="mt-2 text-gray-500 dark:text-gray-400">
                                {formatDate(album.releaseDate)}
                            </p>
                        </div>
                        <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
                            <button onClick={handleLikeToggle} disabled={!currentUser || isLikeLoading} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                <Heart size={24} className={`transition-all ${isLiked ? 'text-red-500 fill-current' : 'text-gray-500'}`} />
                            </button>
                            <span className="font-semibold text-lg">{likesCount}</span>
                        </div>
                    </div>
                    
                    <div className="mt-8">
                        <h2 className="text-2xl font-bold font-serif mb-4">Tracklist</h2>
                        <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                                {tracklist.map((song, index) => (
                                    <li 
                                        key={song.id} 
                                        className="flex items-center justify-between px-3 py-3 group transition-colors odd:bg-transparent even:bg-black/[.03] dark:even:bg-white/[.03] hover:bg-black/[.05] dark:hover:bg-white/[.05]"
                                    >
                                        <div className="flex items-center flex-grow truncate">
                                            <span className="text-gray-500 dark:text-gray-400 w-8 text-center mr-3 flex-shrink-0">{index + 1}</span>
                                            <NavLink to={`/song/${song.id}`} className="font-semibold text-ac-dark dark:text-ac-light hover:underline truncate">{song.title}</NavLink>
                                        </div>
                                        <div className="flex items-center space-x-4 ml-4 flex-shrink-0">
                                            <p className="text-sm text-gray-600 dark:text-gray-400">{formatDuration(song.duration)}</p>
                                            <button 
                                                className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-ac-accent"
                                                aria-label={`More options for ${song.title}`}
                                            >
                                                <MoreHorizontal size={20} />
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        {tracklist.length === 0 && (
                            <div className="text-center py-10 border-2 border-dashed rounded-lg text-gray-400 dark:text-gray-600">
                                <Music className="mx-auto h-8 w-8" />
                                <p className="mt-2">Tracklist is not available yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <section>
                <h2 className="text-2xl font-bold font-serif mb-4">Reviews</h2>
                <div className="space-y-6">
                    {currentUser && <AlbumReviewForm album={album} onReviewSubmit={fetchAlbumData} />}
                    {reviews.length > 0 ? (
                        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                                {reviews.map(review => (
                                    <li key={review.id} className="group transition-colors odd:bg-transparent even:bg-black/[.03] dark:even:bg-white/[.03] hover:bg-black/[.05] dark:hover:bg-white/[.05]">
                                        <ReviewCard review={review} albumId={album.id} />
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                        <div className="text-center py-10 border-2 border-dashed rounded-lg text-gray-400 dark:text-gray-600">
                            <Pen className="mx-auto h-8 w-8" />
                            <p className="mt-2">Be the first to review this album.</p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default AlbumPage;