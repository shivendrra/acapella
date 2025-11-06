import React, { useState, useEffect } from 'react';
import { useParams, NavLink } from 'react-router-dom';
import { collection, query, where, getDocs, limit, orderBy, startAfter, Timestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { UserProfile, Review } from '../types';
import PageLoader from '../components/common/PageLoader';
import { Star } from 'lucide-react';

const ReviewItemCard: React.FC<{ item: Review }> = ({ item }) => {
    const link = `/${item.entityType}/${item.entityId}`;
    return (
        <div className="flex flex-col sm:flex-row items-start space-x-0 sm:space-x-6 space-y-4 sm:space-y-0 p-4 border-b dark:border-gray-700">
            <NavLink to={link} className="flex-shrink-0 w-24 h-24 sm:w-32 sm:h-32 block">
                <img src={item.entityCoverArtUrl} alt={item.entityTitle} className="w-full h-full object-cover rounded-lg shadow-md" />
            </NavLink>
            <div className="flex-1">
                <h3 className="text-xl font-bold font-serif">
                    <NavLink to={link} className="hover:underline">{item.entityTitle}</NavLink>
                </h3>
                 <div className="flex items-center my-1">
                    {[...Array(5)].map((_, i) => <Star key={i} size={16} className={`${i < item.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />)}
                </div>
                <p className="text-sm text-gray-500 mb-2">
                    Reviewed on {item.createdAt instanceof Timestamp ? item.createdAt.toDate().toLocaleDateString() : 'a while ago'}
                </p>
                <blockquote className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {item.reviewText}
                </blockquote>
            </div>
        </div>
    );
};

const UserReviewsPage: React.FC = () => {
    const { username } = useParams<{ username: string }>();
    const [user, setUser] = useState<UserProfile | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [lastDoc, setLastDoc] = useState<any>(null);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchUserAndInitialReviews = async () => {
            if (!username) return;
            setLoading(true);
            setError(null);

            try {
                const usersRef = collection(db, 'users');
                const userQuery = query(usersRef, where('username', '==', username), limit(1));
                const userSnap = await getDocs(userQuery);

                if (userSnap.empty) {
                    setError('User not found.');
                    setLoading(false);
                    return;
                }
                const userData = userSnap.docs[0].data() as UserProfile;
                setUser(userData);

                const reviewsQuery = query(
                    collection(db, 'users', userData.uid, 'reviews'),
                    where('reviewText', '!=', ''),
                    orderBy('reviewText'), // Firestore requires an order by on the field used in the inequality
                    orderBy('createdAt', 'desc'),
                    limit(10)
                );
                const reviewsSnap = await getDocs(reviewsQuery);
                const reviewsData = reviewsSnap.docs.map(doc => doc.data() as Review);
                
                // We re-sort client side because Firestore order is not what we want
                reviewsData.sort((a, b) => (b.createdAt as Timestamp).toMillis() - (a.createdAt as Timestamp).toMillis());

                setReviews(reviewsData);
                setLastDoc(reviewsSnap.docs[reviewsSnap.docs.length - 1]);
                setHasMore(reviewsSnap.docs.length === 10);

            } catch (err) {
                console.error("Error fetching data:", err);
                setError("Failed to load user's reviews. An index may be required.");
            } finally {
                setLoading(false);
            }
        };

        fetchUserAndInitialReviews();
    }, [username]);

    const fetchMoreReviews = async () => {
        if (!user || !hasMore || loadingMore) return;

        setLoadingMore(true);
        try {
            const reviewsQuery = query(
                collection(db, 'users', user.uid, 'reviews'),
                where('reviewText', '!=', ''),
                orderBy('reviewText'),
                orderBy('createdAt', 'desc'),
                startAfter(lastDoc),
                limit(10)
            );
            const reviewsSnap = await getDocs(reviewsQuery);
            const newReviews = reviewsSnap.docs.map(doc => doc.data() as Review);
            newReviews.sort((a, b) => (b.createdAt as Timestamp).toMillis() - (a.createdAt as Timestamp).toMillis());


            setReviews(prev => [...prev, ...newReviews]);
            setLastDoc(reviewsSnap.docs[reviewsSnap.docs.length - 1]);
            setHasMore(reviewsSnap.docs.length === 10);
        } catch (err) {
            console.error("Error fetching more reviews:", err);
            setError("Failed to load more items.");
        } finally {
            setLoadingMore(false);
        }
    };

    if (loading) return <PageLoader />;
    if (error) return <div className="text-center py-20 text-ac-danger">{error}</div>;

    return (
        <div>
            <h1 className="text-4xl font-bold font-serif mb-2">Reviews by {user?.displayName || username}</h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">All written reviews from this user.</p>
            
            {reviews.length > 0 ? (
                 <div className="border-t dark:border-gray-700">
                    {reviews.map(item => <ReviewItemCard key={item.id} item={item} />)}
                </div>
            ) : (
                 <div className="text-center py-20 border-2 border-dashed rounded-lg text-gray-500">
                    <p>{user?.displayName || username} hasn't written any reviews yet.</p>
                </div>
            )}
            
            {hasMore && (
                <div className="text-center mt-12">
                    <button onClick={fetchMoreReviews} disabled={loadingMore} className="px-6 py-2 bg-ac-primary text-white rounded-md hover:bg-ac-primary/90 disabled:bg-gray-400">
                        {loadingMore ? 'Loading...' : 'Load More'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default UserReviewsPage;