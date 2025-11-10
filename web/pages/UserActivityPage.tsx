import React, { useState, useEffect, useCallback } from 'react';
import { useParams, NavLink } from 'react-router-dom';
import { collection, query, where, getDocs, limit, orderBy, Timestamp, documentId, collectionGroup, startAfter, getDoc } from '@firebase/firestore';
import { db } from '../services/firebase';
import { UserProfile, Review, Like, Follow, Song, Album } from '../types';
import PageLoader from '../components/common/PageLoader';
import { useAuth } from '../hooks/useAuth';

type ActivityLog = (Review & { _activityType: 'review' }) | (Like & { _activityType: 'like' }) | (Review & { _activityType: 'follow' });

const DiaryItem: React.FC<{ activity: ActivityLog; profile: UserProfile }> = ({ activity, profile }) => {
    const userLink = <NavLink to={`/${profile.username}`} className="font-semibold hover:underline">{profile.displayName}</NavLink>;
    const date = activity.createdAt instanceof Timestamp ? activity.createdAt.toDate().toLocaleDateString() : null;

    let actionText;
    let entityLink;
    let entityCover;
    let reviewLink;

    switch (activity._activityType) {
        case 'review': {
            const review = activity as Review;
            entityLink = <NavLink to={`/${review.entityType}/${review.entityId}`} className="font-semibold hover:underline">{review.entityTitle}</NavLink>;
            entityCover = (
                <NavLink to={`/${review.entityType}/${review.entityId}`} className="flex-shrink-0">
                    <img src={review.entityCoverArtUrl || ''} alt={review.entityTitle} className="w-10 h-10 rounded-md object-cover"/>
                </NavLink>
            );
            actionText = review.reviewText ? <>reviewed {entityLink}</> : <>rated {entityLink}</>;
            reviewLink = <NavLink to={`/review/${review.id}`} className="text-xs text-gray-500 hover:underline">{date}</NavLink>;
            break;
        }
        case 'like': {
            const like = activity as Like;
            entityLink = <NavLink to={`/${like.entityType}/${like.entityId}`} className="font-semibold hover:underline">{like.entityTitle}</NavLink>;
            entityCover = (
                <NavLink to={`/${like.entityType}/${like.entityId}`} className="flex-shrink-0">
                    <img src={like.entityCoverArtUrl || ''} alt={like.entityTitle} className="w-10 h-10 rounded-md object-cover"/>
                </NavLink>
            );
            actionText = <>liked {entityLink}</>;
            reviewLink = <span className="text-xs text-gray-500">{date}</span>;
            break;
        }
        case 'follow': {
            const follow = activity as Review; // Using the Review shape for follows
            entityLink = <NavLink to={`/${follow.entityUsername}`} className="font-semibold hover:underline">{follow.entityTitle}</NavLink>;
            entityCover = (
                <NavLink to={`/${follow.entityUsername}`} className="flex-shrink-0">
                    <img src={follow.entityCoverArtUrl || ''} alt={follow.entityTitle} className="w-10 h-10 rounded-full object-cover"/>
                </NavLink>
            );
            actionText = <>started following {entityLink}</>;
            reviewLink = <span className="text-xs text-gray-500">{date}</span>;
            break;
        }
        default:
            return null;
    }

    return (
        <div className="flex items-start space-x-4 p-4">
            <NavLink to={`/${profile.username}`} className="flex-shrink-0">
                <img src={profile.photoURL || ''} alt={profile.displayName ?? ''} className="w-10 h-10 rounded-full object-cover"/>
            </NavLink>
            <div className="flex-1 text-sm">
                <p className="mb-1">{userLink} {actionText}</p>
                {date && reviewLink}
            </div>
            {entityCover}
        </div>
    );
};


const UserActivityPage: React.FC = () => {
    const { username } = useParams<{ username: string }>();
    const { currentUser } = useAuth();
    const [user, setUser] = useState<UserProfile | null>(null);
    const [activities, setActivities] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [lastDocTimestamp, setLastDocTimestamp] = useState<Timestamp | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const PAGE_SIZE = 15;

    const fetchActivities = useCallback(async (userToFetch: UserProfile, lastTimestamp: Timestamp | null) => {
        if (!currentUser) {
            setError("You must be logged in to view activity.");
            return { newActivities: [], newLastTimestamp: null, moreToLoad: false };
        }

        const reviewsQuery = query(
            collectionGroup(db, 'reviews'), 
            where('userId', '==', userToFetch.uid), 
            orderBy('createdAt', 'desc'), 
            ...(lastTimestamp ? [startAfter(lastTimestamp)] : []),
            limit(PAGE_SIZE)
        );
        const likesQuery = query(
            collection(db, 'likes'), 
            where('userId', '==', userToFetch.uid), 
            orderBy('createdAt', 'desc'),
            ...(lastTimestamp ? [startAfter(lastTimestamp)] : []),
            limit(PAGE_SIZE)
        );
        const followsQuery = query(
            collection(db, 'follows'), 
            where('followerId', '==', userToFetch.uid), 
            orderBy('createdAt', 'desc'),
            ...(lastTimestamp ? [startAfter(lastTimestamp)] : []),
            limit(PAGE_SIZE)
        );

        const [reviewsSnap, likesSnap, followsSnap] = await Promise.all([
            getDocs(reviewsQuery),
            getDocs(likesQuery),
            getDocs(followsQuery)
        ]);

        const reviewActivities: ActivityLog[] = reviewsSnap.docs.map(doc => ({ ...(doc.data() as Review), _activityType: 'review' }));
        const likeActivities: ActivityLog[] = likesSnap.docs.map(doc => ({ ...(doc.data() as Like), _activityType: 'like' }));

        const followingIds = followsSnap.docs.map(doc => doc.data().followingId);
        let followedUsers: Record<string, UserProfile> = {};
        if (followingIds.length > 0) {
            const userChunks: string[][] = [];
            for (let i = 0; i < followingIds.length; i += 30) { userChunks.push(followingIds.slice(i, i + 30)); }
            for (const chunk of userChunks) {
                const usersQuery = query(collection(db, 'users'), where(documentId(), 'in', chunk));
                const usersSnap = await getDocs(usersQuery);
                usersSnap.docs.forEach(doc => { followedUsers[doc.id] = doc.data() as UserProfile; });
            }
        }
// FIX: Explicitly type the return value of the map callback to prevent incorrect type inference that invalidates the type guard in `.filter`.
        const followActivities: ActivityLog[] = followsSnap.docs.map((doc): ActivityLog | null => {
            const follow = doc.data() as Follow;
            const followedUser = followedUsers[follow.followingId];
            if (!followedUser) return null;
            const activity: ActivityLog = {
                id: doc.id, userId: userToFetch.uid, userDisplayName: userToFetch.displayName || userToFetch.username, userPhotoURL: userToFetch.photoURL,
                createdAt: follow.createdAt, entityId: followedUser.uid, entityType: 'user', entityTitle: followedUser.displayName || followedUser.username,
                entityUsername: followedUser.username, entityCoverArtUrl: followedUser.photoURL, rating: 0, reviewText: '', likes: [],
                _activityType: 'follow'
            };
            return activity;
        }).filter((item): item is ActivityLog => !!item);

        const allNewActivities = [...reviewActivities, ...likeActivities, ...followActivities];
        allNewActivities.sort((a, b) => ((b.createdAt as Timestamp)?.toMillis() || 0) - ((a.createdAt as Timestamp)?.toMillis() || 0));
        
        const combinedAndLimited = allNewActivities.slice(0, PAGE_SIZE);
        const newLastTimestamp = combinedAndLimited.length > 0 ? combinedAndLimited[combinedAndLimited.length - 1].createdAt as Timestamp : null;
        
        return {
            newActivities: combinedAndLimited,
            newLastTimestamp,
            moreToLoad: combinedAndLimited.length === PAGE_SIZE
        };
    }, [currentUser, PAGE_SIZE]);


    useEffect(() => {
        const fetchInitialData = async () => {
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

                const { newActivities, newLastTimestamp, moreToLoad } = await fetchActivities(userData, null);
                setActivities(newActivities);
                setLastDocTimestamp(newLastTimestamp);
                setHasMore(moreToLoad);

            } catch (err) {
                console.error("Error fetching data:", err);
                setError("Failed to load user's activity.");
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, [username, fetchActivities]);

    const fetchMore = async () => {
        if (!user || !hasMore || loadingMore || !lastDocTimestamp) return;

        setLoadingMore(true);
        try {
            const { newActivities, newLastTimestamp, moreToLoad } = await fetchActivities(user, lastDocTimestamp);
            setActivities(prev => [...prev, ...newActivities]);
            setLastDocTimestamp(newLastTimestamp);
            setHasMore(moreToLoad);
        } catch (err) {
            console.error("Error fetching more activity:", err);
            setError("Failed to load more items.");
        } finally {
            setLoadingMore(false);
        }
    };

    if (loading) return <PageLoader />;
    if (error) return <div className="text-center py-20 text-ac-danger">{error}</div>;
    if (!user) return null;

    return (
        <div>
            <h1 className="text-4xl font-bold font-serif mb-2">Activity by {user.displayName || username}</h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">A feed of all their recent activity on Acapella.</p>
            
            {activities.length > 0 ? (
                 <div className="border rounded-lg dark:border-gray-700 overflow-hidden">
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                        {activities.map(item => (
                            <li key={`${item._activityType}-${item.id}`} className="transition-colors odd:bg-transparent even:bg-black/[.03] dark:even:bg-white/[.03]">
                                <DiaryItem activity={item} profile={user} />
                            </li>
                        ))}
                    </ul>
                </div>
            ) : (
                 <div className="text-center py-20 border-2 border-dashed rounded-lg text-gray-500">
                    <p>{user.displayName || username} has no public activity yet.</p>
                </div>
            )}
            
            {hasMore && (
                <div className="text-center mt-12">
                    <button onClick={fetchMore} disabled={loadingMore} className="px-6 py-2 bg-ac-primary text-white rounded-md hover:bg-ac-primary/90 disabled:bg-gray-400">
                        {loadingMore ? 'Loading...' : 'Load More'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default UserActivityPage;