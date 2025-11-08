import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../services/firebase';
import { doc, updateDoc } from 'firebase/firestore';

const ProfileSettings: React.FC = () => {
  const { userProfile, currentUser } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || '');
      setBio(userProfile.bio || '');
    }
  }, [userProfile]);
  
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !userProfile) return;
    
    // Only update if there are changes
    const isDisplayNameChanged = displayName.trim() !== (userProfile.displayName || '');
    const isBioChanged = bio.trim() !== (userProfile.bio || '');

    if (!isDisplayNameChanged && !isBioChanged) {
        return;
    }

    setLoading(true);
    setSuccessMessage('');
    
    try {
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, {
            displayName: displayName.trim(),
            bio: bio.trim(),
        });
        setSuccessMessage('Profile updated successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
        console.error("Error updating profile:", error);
    } finally {
        setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSave}>
      <h2 className="text-3xl font-bold font-serif mb-4">Public Profile</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        This information will be displayed publicly on your profile page.
      </p>
      <div className="space-y-6">
        <div>
          <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Display Name</label>
          <input 
            type="text" 
            id="displayName" 
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white dark:bg-gray-800 dark:border-gray-600 focus:outline-none focus:ring-ac-accent focus:border-ac-accent sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Bio</label>
          <textarea 
            id="bio" 
            rows={4} 
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white dark:bg-gray-800 dark:border-gray-600 focus:outline-none focus:ring-ac-accent focus:border-ac-accent sm:text-sm"
          ></textarea>
        </div>
        <div className="flex items-center space-x-4">
            <button type="submit" disabled={loading} className="px-5 py-2 bg-ac-primary text-white rounded-md hover:bg-ac-primary/90 disabled:bg-gray-400">
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            {successMessage && <p className="text-sm text-green-600">{successMessage}</p>}
        </div>
      </div>
    </form>
  );
};

export default ProfileSettings;