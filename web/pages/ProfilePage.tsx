import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, NavLink } from 'react-router-dom';
import { collection, query, where, getDocs, limit, doc, getDoc, runTransaction, serverTimestamp, orderBy, Timestamp, documentId, collectionGroup, writeBatch } from 'firebase/firestore';
import { db } from '../services/firebase';
import { UserProfile, Role, Review, Like, Song, Album, Follow } from '../types';
import { RESERVED_SLUGS } from '../utils/reserved-slugs';
import PageLoader from '../components/common/PageLoader';
import { useAuth } from '../hooks/useAuth';
import EditProfileModal from '../components/profile/EditProfileModal';
import { UserCheck, UserPlus, X, Star, Heart, MessageSquare } from 'lucide-react';

const FollowListModal: React.FC<{
    title: string;
    onClose: () => void;
    targetUserId: string;
    fetchType: 'followers' | 'following';
}> = ({ title, onClose, targetUserId, fetchType }) => {
    const { userProfile: currentUserProfile } = useAuth();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            try {
                // Query the appropriate subcollection based on fetchType
                const subcollectionName = fetchType === 'followers' ? 'followers' : 'following';
                const followsCollectionRef = collection(db, 'users', targetUserId, subcollectionName);
                const followsSnap = await getDocs(followsCollectionRef);
                const userIds = followsSnap.docs.map(doc => doc.id); // The user ID is the document ID

                if (userIds.length > 0) {
                     // Firestore 'in' queries are limited to 30 items. Chunk if necessary.
                    const userChunks = [];
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
                 // Fetch who the current user is following to manage button states
                if (currentUserProfile) {
                    const followingQuery = collection(db, 'users', currentUserProfile.uid, 'following');
                    const followingSnap = await getDocs(followingQuery);
                    setFollowingIds(new Set(followingSnap.docs.map(d => d.id)));
                }

            } catch (error) {
                console.error(`Failed to fetch ${fetchType}:`, error);
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

        const followingDocRef = doc(db, 'users', currentUserProfile.uid, 'following', targetId);
        const followerDocRef = doc(db, 'users', targetId, 'followers', currentUserProfile.uid);
        
        try {
            const batch = writeBatch(db);
            if (isCurrentlyFollowing) { // Unfollow
                batch.delete(followingDocRef);
                batch.delete(followerDocRef);
            } else { // Follow
                batch.set(followingDocRef, { createdAt: serverTimestamp() });
                batch.set(followerDocRef, { createdAt: serverTimestamp() });
            }
            await batch.commit();
        } catch (e) {
            console.error("Follow toggle in modal failed:", e);
            setFollowingIds(new Set(followingIds));
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-ac-light dark:bg-ac-dark rounded-lg shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold font-serif">{title}</h3>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-500 hover:text-gray-400"><X size={24} /></button>
                </div>
                <div className="max-h-96 overflow-y-auto space-y-3">
                    {loading ? <PageLoader /> : users.length > 0 ? users.map(user => (
                        <div key={user.uid} className="flex items-center justify-between">
                             <NavLink to={`/${user.username}`} className="flex items-center space-x-3 group" onClick={onClose}>
                                <img src={user.photoURL || ''} alt={user.displayName} className="w-10 h-10 rounded-full object-cover"/>
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
                    )) : <p className="text-center py-8 text-gray-500">No users to display.</p>}
                </div>
            </div>
        </div>
    );
};

const ActivityItem: React.FC<{ review: Review }> = ({ review }) => {
    const link = `/${review.entityType}/${review.entityId}`;
    return (
        <div className="flex items-start space-x-4 p-4 border-b dark:border-gray-700">
            <NavLink to={`/${review.userDisplayName}`}>
                <img src={review.userPhotoURL || ''} alt={review.userDisplayName} className="w-10 h-10 rounded-full object-cover"/>
            </NavLink>
            <div className="flex-1">
                <p className="text-sm">
                    <NavLink to={`/${review.userDisplayName}`} className="font-semibold hover:underline">{review.userDisplayName}</NavLink>
                    {' '}rated{' '}
                    <NavLink to={link} className="font-semibold hover:underline">{review.entityTitle}</NavLink>
                </p>
                <div className="flex items-center my-1">
                    {[...Array(5)].map((_, i) => <Star key={i} size={14} className={`${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />)}
                </div>
                {review.reviewText && (
                    <blockquote className="text-sm text-gray-600 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-md border-l-2 border-ac-secondary">
                        {review.reviewText}
                    </blockquote>
                )}
            </div>
        </div>
    );
};

const ProfilePreviewSection: React.FC<{ title: string; items: (Song | Album | Review | Like)[]; link: string }> = ({ title, items, link }) => {
    if (items.length === 0) return null;
    
    const getCoverUrl = (item: any) => item.coverArtUrl || item.entityCoverArtUrl || `https://placehold.co/100x100/131010/FAF8F1?text=?`;
    const getLink = (item: any) => `/${item.entityType || (item.tracklist ? 'album' : 'song')}/${item.entityId || item.id}`;

    return (
        <section>
            <div className="flex justify-between items-baseline mb-4">
                <h2 className="text-2xl font-bold font-serif">{title}</h2>
                <NavLink to={link} className="text-sm font-semibold text-ac-secondary hover:underline">View all</NavLink>
            </div>
            <div className="grid grid-cols-4 gap-4">
                {items.slice(0, 4).map((item, index) => (
                    <NavLink to={getLink(item)} key={index} className="aspect-square block">
                        <img src={getCoverUrl(item)} alt="cover" className="w-full h-full object-cover rounded-lg shadow-md hover:scale-105 transition-transform"/>
                    </NavLink>
                ))}
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

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<'followers' | 'following' | null>(null);

  const [activities, setActivities] = useState<Review[]>([]);
  const [likedItems, setLikedItems] = useState<Like[]>([]);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!username) {
        navigate('/404');
        return;
      }
      
      const lowercasedUsername = username.toLowerCase();

      if (RESERVED_SLUGS.has(lowercasedUsername)) {
        navigate('/404');
        return;
      }
      
      setLoading(true);
      setError(null);
      setProfile(null);

      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('username', '==', lowercasedUsername), limit(1));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          setError('User not found.');
          setLoading(false);
          return;
        } 
        
        const userProfileData = querySnapshot.docs[0].data() as UserProfile;
        setProfile(userProfileData);
        setFollowersCount(userProfileData.followersCount || 0);

        const userReviewsRef = collection(db, 'users', userProfileData.uid, 'reviews');
        const reviewsQuery = query(userReviewsRef, orderBy('createdAt', 'desc'), limit(10));
        
        const likesQuery = query(collection(db, 'likes'), where('userId', '==', userProfileData.uid), limit(50));
        
        const [reviewsSnap, likesSnap] = await Promise.all([getDocs(reviewsQuery), getDocs(likesQuery)]);

        const reviewsData = reviewsSnap.docs.map(doc => doc.data() as Review);
        setActivities(reviewsData);

        const likesData = likesSnap.docs.map(doc => doc.data() as Like);
        likesData.sort((a, b) => {
            const timeA = a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : 0;
            const timeB = b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : 0;
            return timeB - timeA;
        });
        setLikedItems(likesData.slice(0, 4));

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
          const followingDocRef = doc(db, 'users', currentUserProfile.uid, 'following', profile.uid);
          const followingDocSnap = await getDoc(followingDocRef);
          setIsFollowing(followingDocSnap.exists());
          setIsFollowLoading(false);
      };

      checkFollow();
  }, [currentUserProfile, profile]);

  const handleFollowToggle = async () => {
    if (!currentUserProfile || !profile || isFollowLoading) return;
    setIsFollowLoading(true);

    const followingDocRef = doc(db, 'users', currentUserProfile.uid, 'following', profile.uid);
    const followerDocRef = doc(db, 'users', profile.uid, 'followers', currentUserProfile.uid);

    try {
        const batch = writeBatch(db);

        if (isFollowing) { // Unfollow
            batch.delete(followingDocRef);
            batch.delete(followerDocRef);
        } else { // Follow
            const followData = { createdAt: serverTimestamp() };
            batch.set(followingDocRef, followData);
            batch.set(followerDocRef, followData);
        }
        await batch.commit();

        // Optimistically update UI. The actual counts on the documents will be stale
        // and should be updated by a backend function to avoid permission issues.
        setFollowersCount(prev => isFollowing ? prev - 1 : prev + 1);
        setIsFollowing(!isFollowing);

    } catch (e) {
        console.error("Follow/unfollow failed: ", e);
        setError("Could not complete action. Please try again.");
    } finally {
        setIsFollowLoading(false);
    }
  };

  const handleProfileUpdate = (updatedData: Partial<UserProfile>) => {
    setProfile(prevProfile => prevProfile ? { ...prevProfile, ...updatedData } : null);
  };
  
  const ratedItems = useMemo(() => activities, [activities]);
  const reviewedItems = useMemo(() => activities.filter(a => a.reviewText.trim() !== ''), [activities]);

  if (loading) {
    return <PageLoader />;
  }

  if (error) {
    return <div className="text-center py-20 text-ac-danger">{error}</div>;
  }

  if (!profile) {
    return null;
  }

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
            {profile.role === Role.MASTER_ADMIN && (
              <span className="text-xs font-medium bg-ac-accent text-white px-2.5 py-1 rounded-full uppercase tracking-wider mt-1 sm:mt-0">
                Master Admin
              </span>
            )}
             {profile.isCurator && (
              <span className="text-xs font-medium bg-yellow-500 text-white px-2.5 py-1 rounded-full uppercase tracking-wider mt-1 sm:mt-0">
                Curator
              </span>
            )}
          </div>
          <div className="flex items-center space-x-6 mt-3">
            <button 
                onClick={() => setModalContent('followers')} 
                disabled={!isOwnProfile}
                className="text-left hover:underline focus:outline-none focus:ring-2 focus:ring-ac-accent rounded px-1 disabled:no-underline disabled:cursor-default"
            >
              <span className="font-bold text-lg">{followersCount}</span>{' '}
              <span className="text-gray-500">Followers</span>
            </button>
            <button 
                onClick={() => setModalContent('following')} 
                disabled={!isOwnProfile}
                className="text-left hover:underline focus:outline-none focus:ring-2 focus:ring-ac-accent rounded px-1 disabled:no-underline disabled:cursor-default"
            >
              <span className="font-bold text-lg">{profile.followingCount || 0}</span>{' '}
              <span className="text-gray-500">Following</span>
            </button>
          </div>
        </div>
        <div className="flex-shrink-0 pt-2">
        {isOwnProfile ? (
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="px-4 py-2 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Edit Profile
            </button>
        ) : currentUserProfile && (
            <button
                onClick={handleFollowToggle}
                disabled={isFollowLoading}
                className={`px-6 py-2 text-sm font-semibold rounded-md transition-all duration-200 flex items-center justify-center w-32 disabled:opacity-50
                  ${isFollowing 
                    ? 'bg-transparent border border-ac-danger text-ac-danger hover:bg-ac-danger/10' 
                    : 'bg-ac-primary text-white hover:bg-ac-primary/90 dark:bg-ac-secondary dark:hover:bg-ac-secondary/90'
                  }`
                }
            >
                {isFollowLoading ? (
                    <div className="w-4 h-4 border-2 border-t-transparent border-current rounded-full animate-spin"></div>
                ) : isFollowing ? (
                    <>
                        <UserCheck className="mr-2 h-4 w-4" /> Unfollowing
                    </>
                ) : (
                    <>
                        <UserPlus className="mr-2 h-4 w-4" /> Follow
                    </>
                )}
            </button>
        )}
        </div>
      </div>
      
      {profile.bio && (
        <div className="mt-8">
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{profile.bio}</p>
        </div>
      )}

      <div className="mt-12 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <ProfilePreviewSection title="Liked Songs" items={likedItems} link={`/${username}/likes`} />
            <ProfilePreviewSection title="Rated Songs" items={ratedItems} link={`/${username}/ratings`} />
            <ProfilePreviewSection title="Reviews" items={reviewedItems} link={`/${username}/reviews`} />
        </div>

        <div>
          <h2 className="text-2xl font-bold font-serif border-b pb-2 mb-4">Activity</h2>
          {activities.length > 0 ? (
            <div className="border rounded-lg dark:border-gray-700 overflow-hidden">
                {activities.map(activity => <ActivityItem key={activity.id} review={activity} />)}
            </div>
          ) : (
            <div className="text-center py-10 border-2 border-dashed rounded-lg text-gray-400 dark:text-gray-600">
              <p>This user's activity will appear here.</p>
            </div>
          )}
        </div>
      </div>
      {isOwnProfile && isEditModalOpen && (
        <EditProfileModal
          userProfile={profile}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleProfileUpdate}
        />
      )}
      {modalContent && (
        <FollowListModal 
            title={modalContent.charAt(0).toUpperCase() + modalContent.slice(1)}
            onClose={() => setModalContent(null)}
            targetUserId={profile.uid}
            fetchType={modalContent}
        />
      )}
    </div>
  );
};

export default ProfilePage;