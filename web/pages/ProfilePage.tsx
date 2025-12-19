
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, NavLink } from 'react-router-dom';
// FIX: Changed firebase imports to use the '@firebase' scope.
import { collection, query, where, getDocs, limit, doc, getDoc, runTransaction, serverTimestamp, orderBy, Timestamp, documentId, collectionGroup, writeBatch, deleteDoc, setDoc } from '@firebase/firestore';
import { db } from '../services/firebase';
import { UserProfile, Role, Review, Like, Song, Album, Follow, Playlist } from '../types';
import { RESERVED_SLUGS } from '../utils/reserved-slugs';
import PageLoader from '../components/common/PageLoader';
import { useAuth } from '../hooks/useAuth';
import EditProfileModal from '../components/profile/EditProfileModal';
import PlaylistFormModal from '../components/playlist/PlaylistFormModal';
import { UserCheck, UserPlus, X, Star, Heart, MessageSquare, AlertTriangle, Music, Activity, Plus } from 'lucide-react';
import { formatDate } from '../utils/formatters';
import UserBadges from '../components/common/UserBadges';

// A union type for our unified activity/diary feed
type ActivityLog = (Review & { _activityType: 'review' }) | (Like & { _activityType: 'like' }) | (Review & { _activityType: 'follow' });

const TwitterIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" className="w-full h-full fill-current">
        <path d="M453.2 112L523.8 112L369.6 288.2L551 528L409 528L297.7 382.6L170.5 528L99.8 528L264.7 339.5L90.8 112L236.4 112L336.9 244.9L453.2 112zM428.4 485.8L467.5 485.8L215.1 152L173.1 152L428.4 485.8z"/>
    </svg>
);

const InstagramIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" className="w-full h-full fill-current">
        <path d="M320.3 205C256.8 204.8 205.2 256.2 205 319.7C204.8 383.2 256.2 434.8 319.7 435C383.2 435.2 434.8 383.8 435 320.3C435.2 256.8 383.8 205.2 320.3 205zM319.7 245.4C360.9 245.2 394.4 278.5 394.6 319.7C394.8 360.9 361.5 394.4 320.3 394.6C279.1 394.8 245.6 361.5 245.4 320.3C245.2 279.1 278.5 245.6 319.7 245.4zM413.1 200.3C413.1 185.5 425.1 173.5 439.9 173.5C454.7 173.5 466.7 185.5 466.7 200.3C466.7 215.1 454.7 227.1 439.9 227.1C425.1 227.1 413.1 215.1 413.1 200.3zM542.8 227.5C541.1 191.6 532.9 159.8 506.6 133.6C480.4 107.4 448.6 99.2 412.7 97.4C375.7 95.3 264.8 95.3 227.8 97.4C192 99.1 160.2 107.3 133.9 133.5C107.6 159.7 99.5 191.5 97.7 227.4C95.6 264.4 95.6 375.3 97.7 412.3C99.4 448.2 107.6 480 133.9 506.2C160.2 532.4 191.9 540.6 227.8 542.4C264.8 544.5 375.7 544.5 412.7 542.4C448.6 540.7 480.4 532.5 506.6 506.2C532.8 480 541 448.2 542.8 412.3C544.9 375.3 544.9 264.5 542.8 227.5zM495 452C487.2 471.6 472.1 486.7 452.4 494.6C422.9 506.3 352.9 503.6 320.3 503.6C287.7 503.6 217.6 506.2 188.2 494.6C168.6 486.8 153.5 471.7 145.6 452C133.9 422.5 136.6 352.5 136.6 319.9C136.6 287.3 134 217.2 145.6 187.8C153.4 168.2 168.5 153.1 188.2 145.2C217.7 133.5 287.7 136.2 320.3 136.2C352.9 136.2 423 133.6 452.4 145.2C472 153 487.1 168.1 495 187.8C506.7 217.3 504 287.3 504 319.9C504 352.5 506.7 422.6 495 452z"/>
    </svg>
);

const SocialLinks: React.FC<{ socials?: { twitter?: string; instagram?: string; } }> = ({ socials }) => {
    if (!socials || (!socials.twitter && !socials.instagram)) {
        return null;
    }

    return (
        <div className="flex items-center space-x-4 mt-4">
            {socials.twitter && (
                <a href={socials.twitter} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-900 dark:hover:text-white h-8 w-8" aria-label="Twitter profile">
                    <TwitterIcon />
                </a>
            )}
            {socials.instagram && (
                <a href={socials.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-pink-600 h-8 w-8" aria-label="Instagram profile">
                    <InstagramIcon />
                </a>
            )}
        </div>
    );
};

const FollowListModal: React.FC<{
    title: string;
    onClose: () => void;
    targetUserId: string;
    fetchType: 'followers' | 'following';
}> = ({ title, onClose, targetUserId, fetchType }) => {
    const { userProfile: currentUserProfile } = useAuth();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            setError(null);
            try {
                const followsCollectionRef = collection(db, 'follows');
                const fieldToQuery = fetchType === 'followers' ? 'followingId' : 'followerId';
                const idToExtract = fetchType === 'followers' ? 'followerId' : 'followingId';

                const followsQuery = query(followsCollectionRef, where(fieldToQuery, '==', targetUserId));
                const followsSnap = await getDocs(followsQuery);
                const userIds = followsSnap.docs.map(doc => doc.data()[idToExtract]);

                if (userIds.length > 0) {
                    const userChunks: string[][] = [];
                    for (let i = 0; i < userIds.length; i += 30) {
                        userChunks.push(userIds.slice(i, i + 30));
                    }

                    const fetchedUsers: UserProfile[] = [];
                    for (const chunk of userChunks) {
                         const usersQuery = query(collection(db, 'users'), where(documentId(), 'in', chunk));
                         const usersSnap = await getDocs(usersQuery);
                         fetchedUsers.push(...usersSnap.docs.map(doc => doc.data() as UserProfile));
                    }
                    setUsers(fetchedUsers);
                }
                if (currentUserProfile) {
                    const followingQuery = query(collection(db, 'follows'), where('followerId', '==', currentUserProfile.uid));
                    const followingSnap = await getDocs(followingQuery);
                    setFollowingIds(new Set(followingSnap.docs.map(d => d.data().followingId)));
                }

            } catch (error) {
                console.error(`Failed to fetch ${fetchType}:`, error);
                setError(`Could not load this list. This can happen due to database permissions or missing indexes.`);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, [targetUserId, fetchType, currentUserProfile]);
    
    const handleFollowToggleInModal = async (targetId: string, isCurrentlyFollowing: boolean) => {
        if (!currentUserProfile) return;
        
        const newFollowingIds = new Set(followingIds);
        if (isCurrentlyFollowing) {
            newFollowingIds.delete(targetId);
        } else {
            newFollowingIds.add(targetId);
        }
        setFollowingIds(newFollowingIds);

        const followDocRef = doc(db, 'follows', `${currentUserProfile.uid}_${targetId}`);
        
        try {
            if (isCurrentlyFollowing) { // Unfollow
                await deleteDoc(followDocRef);
            } else { // Follow
                await setDoc(followDocRef, { 
                    followerId: currentUserProfile.uid,
                    followingId: targetId,
                    createdAt: serverTimestamp() 
                });
            }
        } catch (e) {
            console.error("Follow toggle in modal failed:", e);
            // Revert optimistic update
            setFollowingIds(new Set(followingIds));
        }
    };

    const renderContent = () => {
        if (loading) return <PageLoader />;
        if (error) {
            return (
                <div className="text-center py-8 text-gray-500">
                    <AlertTriangle className="mx-auto h-8 w-8 text-ac-danger mb-2" />
                    <p>{error}</p>
                </div>
            );
        }
        if (users.length === 0) {
            return <p className="text-center py-8 text-gray-500">No users to display.</p>;
        }
        return (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {users.map(user => (
                    <li key={user.uid} className="px-6 py-3 transition-colors odd:bg-transparent even:bg-black/[.03] dark:even:bg-white/[.03]">
                        <div className="flex items-center justify-between">
                            <NavLink to={`/${user.username}`} className="flex items-center space-x-3 group" onClick={onClose}>
                                <img src={user.photoURL || ''} alt={user.displayName ?? ''} className="w-10 h-10 rounded-full object-cover"/>
                                <div>
                                    <p className="font-semibold group-hover:underline flex items-center">
                                        {user.displayName}
                                    </p>
                                    <p className="text-sm text-gray-500">@{user.username}</p>
                                </div>
                            </NavLink>
                            {currentUserProfile && currentUserProfile.uid !== user.uid && (
                                <button
                                    onClick={() => handleFollowToggleInModal(user.uid, followingIds.has(user.uid))}
                                    className={`px-3 py-1 text-xs font-semibold rounded-full ${
                                        followingIds.has(user.uid)
                                        ? 'bg-transparent border border-ac-danger text-ac-danger'
                                        : 'bg-ac-primary text-white'
                                    }`}
                                >
                                    {followingIds.has(user.uid) ? 'Unfollow' : 'Follow'}
                                </button>
                            )}
                        </div>
                    </li>
                ))}
            </ul>
        );
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-ac-light dark:bg-ac-dark rounded-lg shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold font-serif">{title}</h3>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-500 hover:text-gray-400"><X size={24} /></button>
                </div>
                <div className="max-h-96 overflow-y-auto -mx-6">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

const DiaryItem: React.FC<{ activity: ActivityLog, profile: UserProfile }> = ({ activity, profile }) => {
    const userLink = <NavLink to={`/${profile.username}`} className="font-semibold hover:underline">{profile.displayName}</NavLink>;
    const date = formatDate(activity.createdAt);

    let actionText;
    let entityLink;
    let entityCover;
    let reviewLink;

    switch (activity._activityType) {
        case 'review': {
            const review = activity as Review;
            entityLink = <