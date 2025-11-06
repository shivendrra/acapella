import React, { useState, useEffect } from 'react';
import { useParams, NavLink } from 'react-router-dom';
import { collection, query, where, getDocs, limit, orderBy, startAfter } from 'firebase/firestore';
import { db } from '../services/firebase';
import { UserProfile, Review } from '../types';
import PageLoader from '../components/common/PageLoader';
import { Star } from 'lucide-react';

const RatedItemCard: React.FC<{ item: Review }> = ({ item }) => {
    const link = `/${item.entityType}/${item.entityId}`;
    return (
        <NavLink to={link} className="group block">
            <div className="aspect-square w-full overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-800">
                <img src={item.entityCoverArtUrl} alt={item.entityTitle} className="h-full w-full object-cover object-center group-hover:opacity-75 transition-opacity" />
            </div>
            <h3 className="mt-2 text-base font-semibold text-gray-900 dark:text-white truncate">{item.entityTitle}</h3>
            <div className="flex items-center mt-1">
                 {[...Array(5)].map((_, i) => <Star key={i} size={14} className={` ${i < item.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />)}
            </div>
        </NavLink>
    );
};

const UserRatingsPage: React.FC = () => {
    const { username } = useParams<{ username: string }>();
    const [user, setUser] = useState<UserProfile | null>(null);
    const [ratings, setRatings] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [lastDoc, setLastDoc] = useState<any>(null);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchUserAndInitialRatings = async () => {
            if (!username) return;
            setLoading(true);
            setError(null);

            try {
                // Fetch user profile to get UID
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

                // Fetch first page of ratings
                const ratingsQuery = query(
                    collection(db, 'users', userData.uid, 'reviews'),
                    orderBy('createdAt', 'desc'),
                    limit(24)
                );
                const ratingsSnap = await getDocs(ratingsQuery);

                setRatings(ratingsSnap.docs.map(doc => doc.data() as Review));
                setLastDoc(ratingsSnap.docs[ratingsSnap.docs.length - 1]);
                setHasMore(ratingsSnap.docs.length === 24);

            } catch (err) {
                console.error("Error fetching data:", err);
                setError("Failed to load user's ratings.");
            } finally {
                setLoading(false);
            }
        };

        fetchUserAndInitialRatings();
    }, [username]);

    const fetchMoreRatings = async () => {
        if (!user || !hasMore || loadingMore) return;

        setLoadingMore(true);
        try {
            const ratingsQuery = query(
                collection(db, 'users', user.uid, 'reviews'),
                orderBy('createdAt', 'desc'),
                startAfter(lastDoc),
                limit(24)
            );
            const ratingsSnap = await getDocs(ratingsQuery);

            setRatings(prev => [...prev, ...ratingsSnap.docs.map(doc => doc.data() as Review)]);
            setLastDoc(ratingsSnap.docs[ratingsSnap.docs.length - 1]);
            setHasMore(ratingsSnap.docs.length === 24);
        } catch (err) {
            console.error("Error fetching more ratings:", err);
            setError("Failed to load more items.");
        } finally {
            setLoadingMore(false);
        }
    };

    if (loading) return <PageLoader />;
    if (error) return <div className="text-center py-20 text-ac-danger">{error}</div>;

    return (
        <div>
            <h1 className="text-4xl font-bold font-serif mb-2">Ratings by {user?.displayName || username}</h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">All songs and albums this user has rated.</p>
            
            {ratings.length > 0 ? (
                 <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {ratings.map(item => <RatedItemCard key={item.id} item={item} />)}
                </div>
            ) : (
                 <div className="text-center py-20 border-2 border-dashed rounded-lg text-gray-500">
                    <p>{user?.displayName || username} hasn't rated anything yet.</p>
                </div>
            )}
            
            {hasMore && (
                <div className="text-center mt-12">
                    <button onClick={fetchMoreRatings} disabled={loadingMore} className="px-6 py-2 bg-ac-primary text-white rounded-md hover:bg-ac-primary/90 disabled:bg-gray-400">
                        {loadingMore ? 'Loading...' : 'Load More'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default UserRatingsPage;