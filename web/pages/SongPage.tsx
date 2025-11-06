import React, { useState, useEffect, useCallback } from 'react';
import { useParams, NavLink } from 'react-router-dom';
import { doc, getDoc, collection, query, orderBy, getDocs, runTransaction, serverTimestamp, where, Timestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Song, Artist, Review as ReviewType } from '../types';
import { useAuth } from '../hooks/useAuth';
import PageLoader from '../components/common/PageLoader';
import { Star, Mic, Pen, Clock, Calendar, User, Send, Music } from 'lucide-react';

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

const ReviewCard: React.FC<{ review: ReviewType }> = ({ review }) => (
  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
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
          <span className="text-xs text-gray-500">
            {review.createdAt instanceof Timestamp ? review.createdAt.toDate().toLocaleDateString() : 'Just now'}
          </span>
        </div>
        <p className="mt-2 text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{review.reviewText}</p>
      </div>
    </div>
  </div>
);

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
    if (reviewText.trim().length < 10) {
      setError('Review must be at least 10 characters long.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const songRef = doc(db, 'songs', song.id);
      const reviewsRef = collection(db, 'songs', song.id, 'reviews');
      
      await runTransaction(db, async (transaction) => {
        const songDoc = await transaction.get(songRef);
        if (!songDoc.exists()) {
          throw new Error("Song does not exist!");
        }

        transaction.set(doc(reviewsRef), {
            userId: currentUser.uid,
            userDisplayName: userProfile.displayName,
            userPhotoURL: userProfile.photoURL,
            rating,
            reviewText,
            createdAt: serverTimestamp(),
            likes: [],
            entityId: song.id,
            entityType: 'song',
            entityTitle: song.title,
        });

        const newReviewCount = (songDoc.data().reviewCount || 0) + 1;
        transaction.update(songRef, { reviewCount: newReviewCount });
      });
      
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
    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
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
                    placeholder="Share your thoughts on this song..."
                    className="w-full p-2 border border-gray-300 rounded-md bg-white dark:bg-gray-700 dark:border-gray-600"
                    required
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

  if (loading) return <PageLoader />;
  if (error) return <div className="text-center py-20 text-ac-danger">{error}</div>;
  if (!song) return null;

  const formatDuration = (seconds: number) => `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;

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
            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-gray-500 dark:text-gray-400">
                <div className="flex items-center"><Calendar className="mr-2 h-4 w-4" /> Released: {new Date(song.releaseDate).toLocaleDateString()}</div>
                <div className="flex items-center"><Clock className="mr-2 h-4 w-4" /> Duration: {formatDuration(song.duration)}</div>
                <div className="flex items-center"><Music className="mr-2 h-4 w-4" /> Genre: {song.genre}</div>
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
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
            <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
            {Object.entries(song.credits).map(([role, names]) => (
                <div key={role}>
                <dt className="font-semibold text-gray-800 dark:text-gray-200">{role}</dt>
                <dd className="text-gray-600 dark:text-gray-400">{names.join(', ')}</dd>
                </div>
            ))}
            </dl>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold font-serif mb-4">Reviews</h2>
        <div className="space-y-6">
            {currentUser && <ReviewForm song={song} onReviewSubmit={fetchSongData} />}
            {reviews.length > 0 ? (
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    {reviews.map(review => <ReviewCard key={review.id} review={review} />)}
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