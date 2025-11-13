

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, NavLink } from 'react-router-dom';
// FIX: Changed firebase imports to use the '@firebase' scope.
import { collection, query, where, getDocs, limit, doc, getDoc, runTransaction, serverTimestamp, orderBy, Timestamp, documentId, collectionGroup, writeBatch, deleteDoc, setDoc } from '@firebase/firestore';
import { db } from '../services/firebase';
import { UserProfile, Role, Review, Like, Song, Album, Follow } from '../types';
import { RESERVED_SLUGS } from '../utils/reserved-slugs';
import PageLoader from '../components/common/PageLoader';
import { useAuth } from '../hooks/useAuth';
import EditProfileModal from '../components/profile/EditProfileModal';
import { UserCheck, UserPlus, X, Star, Heart, MessageSquare, AlertTriangle, Music, Activity } from 'lucide-react';
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
                                        <UserBadges user={user} />
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

const ProfilePreviewSection: React.FC<{ title: string; items: (Song | Album | Review | Like)[]; link: string }> = ({ title, items, link }) => {
    if (items.length === 0) return null;

    const getCoverUrl = (item: any): string | null => item.coverArtUrl || item.entityCoverArtUrl || null;
    const getLink = (item: any) => `/${item.entityType || (item.tracklist ? 'album' : 'song')}/${item.entityId || item.id}`;

    return (
        <section>
            <div className="flex justify-between items-baseline mb-4">
                <h2 className="text-2xl font-bold font-serif">{title}</h2>
                <NavLink to={link} className="text-sm font-semibold text-ac-secondary hover:underline">View all</NavLink>
            </div>
            <div className="grid grid-cols-4 gap-4">
                {items.slice(0, 4).map((item, index) => {
                    const coverUrl = getCoverUrl(item);
                    const linkUrl = getLink(item);
                    return (
                        <NavLink to={linkUrl} key={index} className="aspect-square block">
                            {coverUrl ? (
                                <img src={coverUrl} alt="cover" className="w-full h-full object-cover rounded-lg shadow-md hover:scale-105 transition-transform bg-gray-200 dark:bg-gray-800"/>
                            ) : (
                                <div className="w-full h-full bg-gray-200 dark:bg-gray-800 rounded-lg shadow-md flex items-center justify-center">
                                    <Music className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                                </div>
                            )}
                        </NavLink>
                    );
                })}
            </div>
        </section>
    );
};

const ProfilePage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { userProfile: currentUserProfile } = useAuth();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(true);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<'followers' | 'following' | null>(null);

  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [likedItems, setLikedItems] = useState<Like[]>([]);
  const [ratedItems, setRatedItems] = useState<Review[]>([]);
  const [favoriteSongs, setFavoriteSongs] = useState<Song[]>([]);
  const [favoriteAlbums, setFavoriteAlbums] = useState<Album[]>([]);


  useEffect(() => {
    const fetchProfileData = async () => {
      if (!username) { navigate('/404'); return; }
      if (RESERVED_SLUGS.has(username.toLowerCase())) { navigate('/404'); return; }
      
      setLoading(true);
      setError(null);
      setProfile(null);

      try {
        // STEP 1: Fetch the core user profile.
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('username', '==', username.toLowerCase()), limit(1));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) { setError('User not found.'); setLoading(false); return; } 
        
        const userProfileData = querySnapshot.docs[0].data() as UserProfile;
        setProfile(userProfileData);
        
        // STEP 2: Fetch Favorites
        const { favoriteSongIds, favoriteAlbumIds } = userProfileData;
        if (favoriteSongIds && favoriteSongIds.length > 0) {
            const songsQuery = query(collection(db, 'songs'), where(documentId(), 'in', favoriteSongIds));
            const songsSnap = await getDocs(songsQuery);
            const songsData = songsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Song));
            const orderedSongs = favoriteSongIds.map(id => songsData.find(s => s.id === id)).filter(Boolean) as Song[];
            setFavoriteSongs(orderedSongs);
        }
        if (favoriteAlbumIds && favoriteAlbumIds.length > 0) {
            const albumsQuery = query(collection(db, 'albums'), where(documentId(), 'in', favoriteAlbumIds));
            const albumsSnap = await getDocs(albumsQuery);
            const albumsData = albumsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Album));
            const orderedAlbums = favoriteAlbumIds.map(id => albumsData.find(a => a.id === id)).filter(Boolean) as Album[];
            setFavoriteAlbums(orderedAlbums);
        }
        
        // STEP 3: Fetch public data (reviews).
        const reviewsQuery = query(collectionGroup(db, 'reviews'), where('userId', '==', userProfileData.uid), orderBy('createdAt', 'desc'), limit(5)); // Limit for preview
        const reviewsSnap = await getDocs(reviewsQuery);
        const reviewsData = reviewsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
        const reviewActivities: ActivityLog[] = reviewsData.map(r => ({ ...r, _activityType: 'review' }));
        setRatedItems(reviewsData.filter(r => r.rating > 0));

        let allActivities: ActivityLog[] = [...reviewActivities];
        
        // STEP 4: Conditionally fetch protected data if a user is logged in.
        if (currentUserProfile) {
            const followsRef = collection(db, 'follows');
            const followersQuery = query(followsRef, where('followingId', '==', userProfileData.uid));
            const followingQuery = query(followsRef, where('followerId', '==', userProfileData.uid));
            const likesQuery = query(collection(db, 'likes'), where('userId', '==', userProfileData.uid), orderBy('createdAt', 'desc'), limit(5)); // Limit for preview
            const followsByUserQuery = query(collection(db, 'follows'), where('followerId', '==', userProfileData.uid), orderBy('createdAt', 'desc'), limit(5)); // Limit for preview

            const [followersSnap, followingSnap, likesSnap, followsByUserSnap] = await Promise.all([
                getDocs(followersQuery), 
                getDocs(followingQuery),
                getDocs(likesQuery), 
// FIX: Corrected a typo where followsByUserSnap was passed to getDocs instead of followsByUserQuery.
                getDocs(followsByUserQuery)
            ]);

            setFollowersCount(followersSnap.size);
            setFollowingCount(followingSnap.size);

            const likesData = likesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Like));
            const likeActivities: ActivityLog[] = likesData.map(l => ({ ...l, _activityType: 'like' }));
            setLikedItems(likesData.slice(0, 4));
            
            const followingIds = followsByUserSnap.docs.map(doc => doc.data().followingId);
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
            const followActivities: ActivityLog[] = followsByUserSnap.docs.map((doc): ActivityLog | null => {
                const follow = doc.data() as Follow;
                const followedUser = followedUsers[follow.followingId];
                if (!followedUser) return null;
                const activity: ActivityLog = {
                    id: doc.id, userId: userProfileData.uid, userDisplayName: userProfileData.displayName || userProfileData.username, userPhotoURL: userProfileData.photoURL,
                    createdAt: follow.createdAt, entityId: followedUser.uid, entityType: 'user', entityTitle: followedUser.displayName || followedUser.username,
                    entityUsername: followedUser.username, entityCoverArtUrl: followedUser.photoURL, rating: 0, reviewText: '', likes: [],
                    _activityType: 'follow'
                };
                return activity;
            }).filter((item): item is ActivityLog => !!item);
            
            allActivities.push(...likeActivities, ...followActivities);
        } else {
            // For guests, use denormalized counts and show no liked items.
            setFollowersCount(userProfileData.followersCount || 0);
            setFollowingCount(userProfileData.followingCount || 0);
            setLikedItems([]);
        }

        // STEP 5: Combine, sort, and set the final diary feed.
        allActivities.sort((a, b) => {
            const timeA = (a.createdAt as Timestamp)?.toMillis() || 0;
            const timeB = (b.createdAt as Timestamp)?.toMillis() || 0;
            return timeB - timeA;
        });
        setActivities(allActivities.slice(0, 10)); // Further limit combined activities for preview

      } catch (e) {
        console.error("Error fetching profile: ", e);
        setError('An error occurred while fetching the profile.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [username, navigate, currentUserProfile]);

  useEffect(() => {
      if (!currentUserProfile || !profile || currentUserProfile.uid === profile.uid) {
          setIsFollowLoading(false);
          return;
      }
      
      setIsFollowLoading(true);
      const checkFollow = async () => {
          const followDocRef = doc(db, 'follows', `${currentUserProfile.uid}_${profile.uid}`);
          const followDocSnap = await getDoc(followDocRef);
          setIsFollowing(followDocSnap.exists());
          setIsFollowLoading(false);
      };
      checkFollow();
  }, [currentUserProfile, profile]);

 const handleFollowToggle = async () => {
    if (!currentUserProfile || !profile || isFollowLoading) return;
    setIsFollowLoading(true);

    const followDocRef = doc(db, 'follows', `${currentUserProfile.uid}_${profile.uid}`);
    
    const initiallyFollowing = isFollowing;
    setIsFollowing(!initiallyFollowing);
    setFollowersCount(prev => initiallyFollowing ? prev - 1 : prev + 1);

    try {
        if (initiallyFollowing) { // Unfollow
            await deleteDoc(followDocRef);
            setActivities(prev => prev.filter(act => !(act._activityType === 'follow' && act.entityId === profile.uid)));
        } else { // Follow
            const followData = { 
                followerId: currentUserProfile.uid,
                followingId: profile.uid,
                createdAt: serverTimestamp(),
            };
            await setDoc(followDocRef, followData);

            const newFollowActivity: ActivityLog = {
                id: `${currentUserProfile.uid}_${profile.uid}`, userId: currentUserProfile.uid, userDisplayName: currentUserProfile.displayName || currentUserProfile.username, userPhotoURL: currentUserProfile.photoURL,
                createdAt: Timestamp.now(), entityId: profile.uid, entityType: 'user', entityTitle: profile.displayName || profile.username,
                entityUsername: profile.username, entityCoverArtUrl: profile.photoURL, rating: 0, reviewText: '', likes: [], _activityType: 'follow'
            };
            setActivities(prev => [newFollowActivity, ...prev].sort((a, b) => {
                const timeA = (a.createdAt as Timestamp)?.toMillis() || 0;
                const timeB = (b.createdAt as Timestamp)?.toMillis() || 0;
                return timeB - timeA;
            }));
        }
    } catch (e) {
        console.error("Follow/unfollow failed: ", e);
        setIsFollowing(initiallyFollowing);
        setFollowersCount(prev => initiallyFollowing ? prev + 1 : prev - 1);
        setError("Could not complete action. Please try again.");
    } finally {
        setIsFollowLoading(false);
    }
  };

  const handleProfileUpdate = async (updatedData: Partial<UserProfile>) => {
    const currentProfile = profile;
    if (!currentProfile) return;

    const newProfile = { ...currentProfile, ...updatedData };
    setProfile(newProfile);

    // Re-fetch favorites to update the UI instantly after edit
    const { favoriteSongIds, favoriteAlbumIds } = newProfile;
    if (favoriteSongIds && favoriteSongIds.length > 0) {
        const songsQuery = query(collection(db, 'songs'), where(documentId(), 'in', favoriteSongIds));
        const songsSnap = await getDocs(songsQuery);
        const songsData = songsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Song));
        const orderedSongs = favoriteSongIds.map(id => songsData.find(s => s.id === id)).filter(Boolean) as Song[];
        setFavoriteSongs(orderedSongs);
    } else {
        setFavoriteSongs([]);
    }

    if (favoriteAlbumIds && favoriteAlbumIds.length > 0) {
        const albumsQuery = query(collection(db, 'albums'), where(documentId(), 'in', favoriteAlbumIds));
        const albumsSnap = await getDocs(albumsQuery);
        const albumsData = albumsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Album));
        const orderedAlbums = favoriteAlbumIds.map(id => albumsData.find(a => a.id === id)).filter(Boolean) as Album[];
        setFavoriteAlbums(orderedAlbums);
    } else {
        setFavoriteAlbums([]);
    }
  };


  if (loading) return <PageLoader />;
  if (error) return <div className="text-center py-20 text-ac-danger">{error}</div>;
  if (!profile) return null;

  const isOwnProfile = currentUserProfile?.uid === profile.uid;
  const hasFavorites = favoriteSongs.length > 0 || favoriteAlbums.length > 0;

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
        <img 
          src={profile.photoURL || `https://ui-avatars.com/api/?name=${profile.displayName || profile.email}&background=random&size=128`} 
          alt={`${profile.displayName}'s avatar`}
          className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-ac-secondary flex-shrink-0"
        />
        <div className="flex-grow flex flex-col items-center sm:items-start w-full">
          <h1 className="text-4xl font-bold font-serif text-center sm:text-left flex items-center justify-center sm:justify-start">
            {profile.displayName || profile.username}
            <UserBadges user={profile} />
          </h1>
          <div className="flex flex-col items-center sm:flex-row sm:items-center gap-x-3 mt-1">
            <p className="text-lg text-gray-500 dark:text-gray-400">@{profile.username}</p>
          </div>
          <div className="flex items-center space-x-6 mt-3">
            <button 
                onClick={() => setModalContent('followers')} 
                disabled={!currentUserProfile}
                className="text-left hover:underline focus:outline-none focus:ring-2 focus:ring-ac-accent rounded px-1 disabled:cursor-not-allowed disabled:no-underline disabled:text-gray-500"
            >
              <span className="font-bold text-lg">{followersCount}</span>{' '}
              <span className="text-gray-500">Followers</span>
            </button>
            <button 
                onClick={() => setModalContent('following')} 
                disabled={!currentUserProfile}
                className="text-left hover:underline focus:outline-none focus:ring-2 focus:ring-ac-accent rounded px-1 disabled:cursor-not-allowed disabled:no-underline disabled:text-gray-500"
            >
              <span className="font-bold text-lg">{followingCount}</span>{' '}
              <span className="text-gray-500">Following</span>
            </button>
          </div>
          <SocialLinks socials={profile.socials} />
        </div>
        <div className="flex-shrink-0 pt-2">
        {isOwnProfile ? (
            <button onClick={() => setIsEditModalOpen(true)} className="px-4 py-2 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              Edit Profile
            </button>
        ) : currentUserProfile && (
            <button
                onClick={handleFollowToggle}
                disabled={isFollowLoading}
                className={`px-6 py-2 text-sm font-semibold rounded-md transition-all duration-200 flex items-center justify-center w-32 disabled:opacity-50
                  ${isFollowing ? 'bg-transparent border border-ac-danger text-ac-danger hover:bg-ac-danger/10' : 'bg-ac-primary text-white hover:bg-ac-primary/90 dark:bg-ac-secondary dark:hover:bg-ac-secondary/90'}`
                }
            >
                {isFollowLoading ? (<div className="w-4 h-4 border-2 border-t-transparent border-current rounded-full animate-spin"></div>) 
                : isFollowing ? (<><UserCheck className="mr-2 h-4 w-4" /> Following</>) 
                : (<><UserPlus className="mr-2 h-4 w-4" /> Follow</>)}
            </button>
        )}
        </div>
      </div>
      
      {profile.bio && (<div className="mt-8"><p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{profile.bio}</p></div>)}

      <div className="mt-12 space-y-12">
        {hasFavorites && (
            <section>
                <h2 className="text-2xl font-bold font-serif mb-4">Favorites</h2>
                <div className="space-y-6">
                    {favoriteSongs.length > 0 && (
                        <div>
                            <div className="grid grid-cols-4 gap-4">
                            {favoriteSongs.map(song => (
                                <NavLink to={`/song/${song.id}`} key={song.id} className="aspect-square block">
                                    <img src={song.coverArtUrl} alt={song.title} className="w-full h-full object-cover rounded-lg shadow-md hover:scale-105 transition-transform bg-gray-200 dark:bg-gray-800"/>
                                </NavLink>
                            ))}
                            </div>
                        </div>
                    )}
                    {favoriteAlbums.length > 0 && (
                        <div>
                            <div className="grid grid-cols-4 gap-4">
                                {favoriteAlbums.map(album => (
                                    <NavLink to={`/album/${album.id}`} key={album.id} className="aspect-square block">
                                        <img src={album.coverArtUrl} alt={album.title} className="w-full h-full object-cover rounded-lg shadow-md hover:scale-105 transition-transform bg-gray-200 dark:bg-gray-800"/>
                                    </NavLink>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </section>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <ProfilePreviewSection title="Liked Items" items={likedItems} link={`/${username}/likes`} />
            <ProfilePreviewSection title="Reviews" items={ratedItems} link={`/${username}/ratings`} />
        </div>

        <div>
          <div className="flex justify-between items-baseline mb-4">
            <h2 className="text-2xl font-bold font-serif">Diary</h2>
            {activities.length > 0 && <NavLink to={`/${username}/activity`} className="text-sm font-semibold text-ac-secondary hover:underline">View all</NavLink>}
          </div>
          {activities.length > 0 ? (
            <div className="border rounded-lg dark:border-gray-700 overflow-hidden">
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {activities.map(activity => (
                        <li key={`${activity._activityType}-${activity.id}`} className="transition-colors odd:bg-transparent even:bg-black/[.03] dark:even:bg-white/[.03]">
                            <DiaryItem activity={activity} profile={profile} />
                        </li>
                    ))}
                </ul>
            </div>
          ) : (
            <div className="text-center py-10 border-2 border-dashed rounded-lg text-gray-400 dark:text-gray-600">
              <Activity className="mx-auto h-8 w-8" />
              <p className="mt-2">This user's activity will appear here.</p>
            </div>
          )}
        </div>
      </div>
      {isOwnProfile && isEditModalOpen && <EditProfileModal userProfile={profile} onClose={() => setIsEditModalOpen(false)} onSave={handleProfileUpdate} />}
      {modalContent && <FollowListModal title={modalContent.charAt(0).toUpperCase() + modalContent.slice(1)} onClose={() => setModalContent(null)} targetUserId={profile.uid} fetchType={modalContent} />}
    </div>
  );
};

export default ProfilePage;