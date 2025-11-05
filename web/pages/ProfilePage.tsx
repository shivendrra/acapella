import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../services/firebase';
import { UserProfile } from '../types';
import { RESERVED_SLUGS } from '../utils/reserved-slugs';
import PageLoader from '../components/common/PageLoader';

const ProfilePage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('username', '==', lowercasedUsername), limit(1));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          setError('User not found.');
          setTimeout(() => navigate('/404'), 2000);
        } else {
          setProfile(querySnapshot.docs[0].data() as UserProfile);
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

  if (loading) {
    return <PageLoader />;
  }

  if (error) {
    return <div className="text-center py-20 text-ac-danger">{error}</div>;
  }

  if (!profile) {
    return null; // or a dedicated "not found" component
  }

  return (
    <div>
      <div className="flex items-center space-x-6">
        <img 
          src={profile.photoURL || `https://ui-avatars.com/api/?name=${profile.displayName || profile.email}&background=random&size=128`} 
          alt={`${profile.displayName}'s avatar`}
          className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-ac-secondary"
        />
        <div>
          <h1 className="text-4xl font-bold font-serif">{profile.displayName || profile.username}</h1>
          <p className="text-lg text-gray-500 dark:text-gray-400">@{profile.username}</p>
        </div>
      </div>
      <div className="mt-12">
        <h2 className="text-2xl font-bold font-serif border-b pb-2 mb-4">Activity</h2>
        {/* Placeholder for user activity, reviews, etc. */}
        <div className="text-center py-10 border-2 border-dashed rounded-lg text-gray-400 dark:text-gray-600">
          <p>This user's activity will appear here.</p>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
