import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, NavLink } from 'react-router-dom';
import { collection, query, where, getDocs, limit, doc, getDoc, runTransaction, serverTimestamp, orderBy, Timestamp, documentId, collectionGroup, writeBatch, deleteDoc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { UserProfile, Role, Review, Like, Song, Album, Follow } from '../types';
import { RESERVED_SLUGS } from '../utils/reserved-slugs';
import PageLoader from '../components/common/PageLoader';
import { useAuth } from '../hooks/useAuth';
import EditProfileModal from '../components/profile/EditProfileModal';
import { UserCheck, UserPlus, X, Star, Heart, MessageSquare, AlertTriangle, Music, Activity } from 'lucide-react';

// A union type for our unified activity/diary feed
type ActivityLog = (Review & { _activityType: 'review' }) | (Like & { _activityType: 'like' }) | (Review & { _activityType: 'follow' });


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
        return users.map(user => (
            <div key={user.uid} className="flex items-center justify-between">
                 <NavLink to={`/${user.username}`} className="flex items-center space-x-3 group" onClick={onClose}>
                    <img src={user.photoURL || ''} alt={user.displayName ?? ''} className="w-10 h-10 rounded-full object-cover"/>
                    <div>
                        <p className="font-semibold group-hover:underline">{user.displayName}</p>
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
        ));
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-ac-light dark:bg-ac-dark rounded-lg shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold font-serif">{title}</h3>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-500 hover:text-gray-400"><X size={24} /></button>
                </div>
                <div className="max-h-96 overflow-y-auto space-y-3">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

const DiaryItem: React.FC<{ activity: ActivityLog, profile: UserProfile }> = ({ activity, profile }) => {
    const userLink = <NavLink to={`/${profile.username}`} className="font-semibold hover:underline">{profile.displayName}</NavLink>;

    let actionText;
    let entityLink;
    let entityCover;

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
            break;
        }
        default:
            return null;
    }

    return (
        <div className="flex items-center space-x-4 p-4 border-b dark:border-gray-700 last:border-b-0">
            <NavLink to={`/${profile.username}`} className="flex-shrink-0">
                <img src={profile.photoURL || ''} alt={profile.displayName ?? ''} className="w-10 h-10 rounded-full object-cover"/>
            </NavLink>
            <div className="flex-1 text-sm">
                {userLink} {actionText}
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

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!username) { navigate('/404'); return; }
      if (RESERVED_SLUGS.has(username.toLowerCase())) { navigate('/404'); return; }
      
      setLoading(true);
      setError(null);
      setProfile(null);

      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('username', '==', username.toLowerCase()), limit(1));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) { setError('User not found.'); setLoading(false); return; } 
        
        const userProfileData = querySnapshot.docs[0].data() as UserProfile;
        setProfile(userProfileData);
        
        const followsRef = collection(db, 'follows');
        const followersQuery = query(followsRef, where('followingId', '==', userProfileData.uid));
        const followingQuery = query(followsRef, where('followerId', '==', userProfileData.uid));
        const [followersSnap, followingSnap] = await Promise.all([getDocs(followersQuery), getDocs(followingQuery)]);
        setFollowersCount(followersSnap.size);
        setFollowingCount(followingSnap.size);

        // Fetch all activity types
        const reviewsQuery = query(collectionGroup(db, 'reviews'), where('userId', '==', userProfileData.uid), orderBy('createdAt', 'desc'), limit(20));
        const likesQuery = query(collection(db, 'likes'), where('userId', '==', userProfileData.uid), orderBy('createdAt', 'desc'), limit(20));
        const followsByUserQuery = query(collection(db, 'follows'), where('followerId', '==', userProfileData.uid), orderBy('createdAt', 'desc'), limit(10));

        const [reviewsSnap, likesSnap, followsByUserSnap] = await Promise.all([getDocs(reviewsQuery), getDocs(likesQuery), getDocs(followsByUserQuery)]);

        // 1. Process Reviews for Diary and Previews
        const reviewsData = reviewsSnap.docs.map(doc => doc.data() as Review);
        const reviewActivities: ActivityLog[] = reviewsData.map(r => ({ ...r, _activityType: 'review' }));
        setRatedItems(reviewsData.filter(r => r.rating > 0));

        // 2. Process Likes for Diary and Previews
        const likesData = likesSnap.docs.map(doc => doc.data() as Like);
        const likeActivities: ActivityLog[] = likesData.map(l => ({ ...l, _activityType: 'like' }));
        setLikedItems(likesData.slice(0, 4));
        
        // 3. Process Follows for Diary
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
        const followActivities: ActivityLog[] = followsByUserSnap.docs.map(doc => {
            const follow = doc.data() as Follow;
            const followedUser = followedUsers[follow.followingId];
            if (!followedUser) return null;
            return {
                id: doc.id, userId: userProfileData.uid, userDisplayName: userProfileData.displayName, userPhotoURL: userProfileData.photoURL,
                createdAt: follow.createdAt, entityId: followedUser.uid, entityType: 'user', entityTitle: followedUser.displayName,
                entityUsername: followedUser.username, entityCoverArtUrl: followedUser.photoURL, rating: 0, reviewText: '', likes: [],
                _activityType: 'follow'
            };
        }).filter((item): item is ActivityLog => !!item);

        // 4. Combine all activities into the diary feed
        const allActivities = [...reviewActivities, ...likeActivities, ...followActivities];
        allActivities.sort((a, b) => {
            const timeA = (a.createdAt as Timestamp)?.toMillis() || 0;
            const timeB = (b.createdAt as Timestamp)?.toMillis() || 0;
            return timeB - timeA;
        });
        setActivities(allActivities);

      } catch (e) {
        console.error("Error fetching profile: ", e);
        setError('An error occurred while fetching the profile.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [username, navigate]);

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
                id: `${currentUserProfile.uid}_${profile.uid}`, userId: currentUserProfile.uid, userDisplayName: currentUserProfile.displayName, userPhotoURL: currentUserProfile.photoURL,
                createdAt: Timestamp.now(), entityId: profile.uid, entityType: 'user', entityTitle: profile.displayName,
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

  const handleProfileUpdate = (updatedData: Partial<UserProfile>) => {
    setProfile(prevProfile => prevProfile ? { ...prevProfile, ...updatedData } : null);
  };

  if (loading) return <PageLoader />;
  if (error) return <div className="text-center py-20 text-ac-danger">{error}</div>;
  if (!profile) return null;

  const isOwnProfile = currentUserProfile?.uid === profile.uid;

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
        <img 
          src={profile.photoURL || `https://ui-avatars.com/api/?name=${profile.displayName || profile.email}&background=random&size=128`} 
          alt={`${profile.displayName}'s avatar`}
          className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-ac-secondary flex-shrink-0"
        />
        <div className="flex-grow flex flex-col items-center sm:items-start w-full">
          <h1 className="text-4xl font-bold font-serif text-center sm:text-left">{profile.displayName || profile.username}</h1>
          <div className="flex flex-col items-center sm:flex-row sm:items-center gap-x-3 mt-1">
            <p className="text-lg text-gray-500 dark:text-gray-400">@{profile.username}</p>
            {profile.role === Role.MASTER_ADMIN && (<span className="text-xs font-medium bg-ac-accent text-white px-2.5 py-1 rounded-full uppercase tracking-wider mt-1 sm:mt-0">Master Admin</span>)}
            {profile.isCurator && (<span className="text-xs font-medium bg-yellow-500 text-white px-2.5 py-1 rounded-full uppercase tracking-wider mt-1 sm:mt-0">Curator</span>)}
          </div>
          <div className="flex items-center space-x-6 mt-3">
            <button onClick={() => setModalContent('followers')} className="text-left hover:underline focus:outline-none focus:ring-2 focus:ring-ac-accent rounded px-1">
              <span className="font-bold text-lg">{followersCount}</span>{' '}
              <span className="text-gray-500">Followers</span>
            </button>
            <button onClick={() => setModalContent('following')} className="text-left hover:underline focus:outline-none focus:ring-2 focus:ring-ac-accent rounded px-1">
              <span className="font-bold text-lg">{followingCount}</span>{' '}
              <span className="text-gray-500">Following</span>
            </button>
          </div>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <ProfilePreviewSection title="Liked Items" items={likedItems} link={`/${username}/likes`} />
            <ProfilePreviewSection title="Reviews" items={ratedItems} link={`/${username}/ratings`} />
        </div>

        <div>
          <h2 className="text-2xl font-bold font-serif border-b pb-2 mb-4">Diary</h2>
          {activities.length > 0 ? (
            <div className="border rounded-lg dark:border-gray-700 overflow-hidden">
                {activities.map(activity => <DiaryItem key={`${activity._activityType}-${activity.id}`} activity={activity} profile={profile} />)}
            </div>
          ) : (
            <div className="text-center py-10 border-2 border-dashed rounded-lg text-gray-400 dark:text-gray-600">
              <Activity className="mx-auto h-8 w-8" />
              <p className="mt-2">This user's activity