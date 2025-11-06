import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, limit, doc, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { UserProfile, Role } from '../types';
import { RESERVED_SLUGS } from '../utils/reserved-slugs';
import PageLoader from '../components/common/PageLoader';
import { useAuth } from '../hooks/useAuth';
import EditProfileModal from '../components/profile/EditProfileModal';
import { UserCheck, UserPlus, X } from 'lucide-react';

const FollowListModal: React.FC<{ title: string; onClose: () => void }> = ({ title, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="bg-ac-light dark:bg-ac-dark rounded-lg shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold font-serif">{title}</h3>
                <button onClick={onClose} className="p-1 rounded-full text-gray-500 hover:text-gray-400"><X size={24} /></button>
            </div>
            <div className="text-center py-8 text-gray-500">
                <p>This feature is coming soon!</p>
            </div>
        </div>
    </div>
);

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

  useEffect(() => {
    const fetchProfile = async () => {
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
        } else {
          const userProfileData = querySnapshot.docs[0].data() as UserProfile;
          setProfile(userProfileData);
          setFollowersCount(userProfileData.followersCount || 0);
        }
      } catch (e) {
        console.error("Error fetching profile: ", e);
        setError('An error occurred while fetching the profile.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
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

    const currentUserRef = doc(db, 'users', currentUserProfile.uid);
    const targetUserRef = doc(db, 'users', profile.uid);
    const followDocRef = doc(db, 'follows', `${currentUserProfile.uid}_${profile.uid}`);

    try {
        await runTransaction(db, async (transaction) => {
            const currentUserDoc = await transaction.get(currentUserRef);
            const targetUserDoc = await transaction.get(targetUserRef);

            if (!currentUserDoc.exists() || !targetUserDoc.exists()) {
                throw new Error("User document not found!");
            }
            
            const currentFollowingCount = currentUserDoc.data().followingCount || 0;
            const targetFollowersCount = targetUserDoc.data().followersCount || 0;

            if (isFollowing) { // Unfollow
                transaction.delete(followDocRef);
                transaction.update(currentUserRef, { followingCount: Math.max(0, currentFollowingCount - 1) });
                transaction.update(targetUserRef, { followersCount: Math.max(0, targetFollowersCount - 1) });
            } else { // Follow
                transaction.set(followDocRef, {
                    followerId: currentUserProfile.uid,
                    followingId: profile.uid,
                    createdAt: serverTimestamp()
                });
                transaction.update(currentUserRef, { followingCount: currentFollowingCount + 1 });
                transaction.update(targetUserRef, { followersCount: targetFollowersCount + 1 });
            }
        });

        setFollowersCount(prev => isFollowing ? prev - 1 : prev + 1);
        setIsFollowing(!isFollowing);

    } catch (e) {
        console.error("Transaction failed: ", e);
        setError("Could not complete action. Please try again.");
    } finally {
        setIsFollowLoading(false);
    }
  };

  const handleProfileUpdate = (updatedData: Partial<UserProfile>) => {
    setProfile(prevProfile => prevProfile ? { ...prevProfile, ...updatedData } : null);
  };

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
            <button onClick={() => setModalContent('followers')} className="text-left hover:underline focus:outline-none focus:ring-2 focus:ring-ac-accent rounded px-1">
              <span className="font-bold text-lg">{followersCount}</span>{' '}
              <span className="text-gray-500">Followers</span>
            </button>
            <button onClick={() => setModalContent('following')} className="text-left hover:underline focus:outline-none focus:ring-2 focus:ring-ac-accent rounded px-1">
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

      <div className="mt-12">
        <h2 className="text-2xl font-bold font-serif border-b pb-2 mb-4">Activity</h2>
        <div className="text-center py-10 border-2 border-dashed rounded-lg text-gray-400 dark:text-gray-600">
          <p>This user's activity will appear here.</p>
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
            title={modalContent === 'followers' ? 'Followers' : 'Following'} 
            onClose={() => setModalContent(null)} 
        />
      )}
    </div>
  );
};

export default ProfilePage;