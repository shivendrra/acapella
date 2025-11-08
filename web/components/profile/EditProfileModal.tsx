import React, { useState } from 'react';
import { UserProfile } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../services/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { X } from 'lucide-react';

interface EditProfileModalProps {
  userProfile: UserProfile;
  onClose: () => void;
  onSave: (updatedData: Partial<UserProfile>) => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ userProfile, onClose, onSave }) => {
  const { currentUser } = useAuth();
  const [displayName, setDisplayName] = useState(userProfile.displayName || '');
  const [bio, setBio] = useState(userProfile.bio || '');
  const [photoURL, setPhotoURL] = useState(userProfile.photoURL || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setError("Not authenticated.");
      return;
    }
    setLoading(true);
    setError(null);
    
    try {
      const updatedData: Partial<UserProfile> = {
        displayName: displayName.trim(),
        bio: bio.trim(),
        photoURL: photoURL.trim(),
      };

      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, updatedData);

      onSave(updatedData);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError("Failed to update profile: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" 
      onClick={onClose}
    >
      <div 
        className="bg-ac-light dark:bg-ac-dark rounded-lg shadow-2xl w-full max-w-md relative p-6 space-y-4" 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold font-serif">Edit Profile</h2>
            <button onClick={onClose} className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700">
                <X size={24} />
            </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col items-center space-y-4">
              <img
                  src={photoURL || `https://ui-avatars.com/api/?name=${displayName || 'A'}&background=random&size=128`}
                  alt="Profile Preview"
                  className="w-24 h-24 rounded-full object-cover border-4 border-gray-300 dark:border-gray-600"
              />
            </div>
            
            <div>
              <label htmlFor="photoURL" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Profile Picture URL</label>
              <input 
                type="url" 
                id="photoURL" 
                value={photoURL} 
                onChange={(e) => setPhotoURL(e.target.value)}
                placeholder="https://..."
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white dark:bg-gray-800 dark:border-gray-600 focus:ring-ac-accent focus:border-ac-accent sm:text-sm text-gray-900 dark:text-white" 
              />
            </div>

            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Display Name</label>
              <input 
                type="text" 
                id="displayName" 
                value={displayName} 
                onChange={(e) => setDisplayName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white dark:bg-gray-800 dark:border-gray-600 focus:ring-ac-accent focus:border-ac-accent sm:text-sm text-gray-900 dark:text-white" 
              />
            </div>
            
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Bio</label>
              <textarea 
                id="bio" 
                rows={4} 
                value={bio} 
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us a little about yourself..."
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white dark:bg-gray-800 dark:border-gray-600 focus:ring-ac-accent focus:border-ac-accent sm:text-sm text-gray-900 dark:text-white"
              ></textarea>
            </div>

            {error && <div className="text-sm text-ac-danger text-center p-3 bg-red-100 dark:bg-red-900/50 border border-red-200 dark:border-red-500/50 rounded-md">{error}</div>}

            <div className="flex justify-end space-x-4 pt-2">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-medium text-white bg-ac-primary hover:bg-ac-primary/90 dark:bg-ac-secondary dark:hover:bg-ac-secondary/90 rounded-md disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed">
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;