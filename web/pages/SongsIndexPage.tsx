import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import { Song, Review } from '../types';
import PageLoader from '../components/common/PageLoader';
import { Star } from 'lucide-react';

const TrendingSongCard: React.FC<{ song: Song }> = ({ song }) => (
    <NavLink to={`/song/${song.id}`} className="block p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
        <h3 className="font-bold truncate">{song.title}</h3>
        <p className="text-sm text-gray-500">{song.genre}</p>
        <div className="flex items-center mt-2 text-sm text-yellow-500">
            <Star size={14} className="mr-1 fill-current" />
            <span>{song.reviewCount || 0} Reviews</span>
        </div>
    </NavLink>
);

const FollowingReviewCard: React.FC<{ review: Review }> = ({ review }) => (
    <div className="p-4 border rounded-lg flex flex-col h-full">
        <div className="flex items-start space-x-3 mb-2">
            <img src={review.userPhotoURL || ''} alt={review.userDisplayName} className="w-10 h-10 rounded-full" />
            <div>
                <p className="font-semibold">{review.userDisplayName}</p>
                <div className="flex items-center">
                    {[...Array(5)].map((_, i) => <Star key={i} size={14} className={` ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />)}
                </div>
            </div>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 flex-grow">"{review.reviewText}"</p>
        <NavLink to={`/song/${review.entityId}`} className="mt-3 text-sm font-semibold text-ac-secondary hover:underline self-start">
            Read more on {review.entityTitle}
        </NavLink>
    </div>
);

const SongsIndexPage: React.FC = () => {
    const { currentUser } = useAuth();
    const [trendingSongs, setTrendingSongs] = useState<Song[]>([]);
    const [followingReviews, setFollowingReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                // Fetch trending songs (most reviewed)
                const trendingQuery = query(collection(db, 'songs'), orderBy('reviewCount', 'desc'), limit(12));
                const trendingSnap = await getDocs(trendingQuery);
                setTrendingSongs(trendingSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Song)));

                // Fetch reviews from followed users
                if (currentUser) {
                    const followingRef = collection(db, 'users', currentUser.uid, 'following');
                    const followingSnap = await getDocs(followingRef);
                    const followingIds = followingSnap.docs.map(doc => doc.id);

                    if (followingIds.length > 0) {
                        const reviewPromises = followingIds.map(userId => {
                            const userReviewsRef = collection(db, 'users', userId, 'reviews');
                            const q = query(userReviewsRef, where('entityType', '==', 'song'));
                            return getDocs(q);
                        });

                        const reviewSnapshots = await Promise.all(reviewPromises);
                        const allReviews = reviewSnapshots.flatMap(snapshot =>
                            snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review))
                        );
                        
                        // Sort and limit client-side
                        allReviews.sort((a, b) => {
                            const timeA = a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : 0;
                            const timeB = b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : 0;
                            return timeB - timeA;
                        });

                        setFollowingReviews(allReviews.slice(0, 10));
                    }
                }
            } catch (err) {
                console.error(err);
                setError("Failed to load songs. Please try again. Note: This page may require a Firestore index to be created. Please check the developer console for a link to create it.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [currentUser]);

    if (loading) return <PageLoader />;
    if (error) return <div className="text-center py-20 text-ac-danger">{error}</div>;
    
    return (
        <div className="space-y-12">
            <h1 className="text-4xl font-bold font-serif">Songs</h1>

            {currentUser && followingReviews.length > 0 && (
                <section>
                    <h2 className="text-2xl font-bold font-serif mb-4">Reviews from Your Network</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {followingReviews.map(review => <FollowingReviewCard key={review.id} review={review} />)}
                    </div>
                </section>
            )}

            <section>
                <h2 className="text-2xl font-bold font-serif mb-4">Trending Songs</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {trendingSongs.map(song => <TrendingSongCard key={song.id} song={song} />)}
                </div>
            </section>
        </div>
    );
};

export default SongsIndexPage;