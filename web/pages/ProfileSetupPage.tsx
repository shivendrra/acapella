import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { db } from '../services/firebase';
// FIX: Changed firebase imports to use the '@firebase' scope.
import { doc, updateDoc, collection, query, where, getDocs, limit } from '@firebase/firestore';
import { RESERVED_SLUGS } from '../utils/reserved-slugs';

// A simple debounce utility
const debounce = <F extends (...args: any[]) => any>(func: F, waitFor: number) => {
  let timeout: number;
  return (...args: Parameters<F>): Promise<ReturnType<F>> =>
    new Promise(resolve => {
      clearTimeout(timeout);
      timeout = window.setTimeout(() => resolve(func(...args)), waitFor);
    });
};

const ProfileSetupPage: React.FC = () => {
  const { userProfile, currentUser } = useAuth();
  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [username, setUsername] = useState('');
  const [photoURL, setPhotoURL] = useState(userProfile?.photoURL || '');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const checkUsernameAvailability = useCallback(async (name: string) => {
    if (name.length < 3) {
      setUsernameStatus('invalid');
      setUsernameError('Username must be at least 3 characters.');
      return;
    }
    if (!/^[a-z0-9_.]+$/.test(name)) {
      setUsernameStatus('invalid');
      setUsernameError('Only lowercase letters, numbers, underscores, and periods are allowed.');
      return;
    }
    if (RESERVED_SLUGS.has(name)) {
      setUsernameStatus('invalid');
      setUsernameError('This username is reserved.');
      return;
    }
    
    setUsernameStatus('checking');
    setUsernameError(null);
    
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("username", "==", name), limit(1));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        setUsernameStatus('available');
    } else {
        setUsernameStatus('taken');
        setUsernameError('This username is already taken.');
    }
  }, []);
  
  const debouncedCheck = useCallback(debounce(checkUsernameAvailability, 500), [checkUsernameAvailability]);

  useEffect(() => {
    if (username) {
      debouncedCheck(username);
    } else {
      setUsernameStatus('idle');
      setUsernameError(null);
    }
  }, [username, debouncedCheck]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (usernameStatus !== 'available' || !displayName.trim()) {
        setError("Please ensure your display name is set and your username is available.");
        return;
    }
    if (!currentUser) {
        setError("You must be logged in to complete this action.");
        return;
    }
    setLoading(true);
    try {
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, {
            displayName: displayName.trim(),
            username: username,
            photoURL: photoURL.trim(),
            profileComplete: true,
        });
        window.location.reload();
    } catch (err: any) {
        console.error(err);
        setError("Failed to update profile. " + err.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-ac-light dark:bg-ac-dark py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg space-y-8">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-ac-dark dark:text-ac-light font-serif">
            Welcome to Acapella!
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Let's set up your profile to get you started.
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="flex flex-col items-center space-y-4">
            <img
                src={photoURL || `https://ui-avatars.com/api/?name=${displayName || 'A'}&background=random&size=128`}
                alt="Profile Preview"
                className="w-32 h-32 rounded-full object-cover border-4 border-gray-300 dark:border-gray-600 shadow-md"
            />
          </div>

          <div className="rounded-md shadow-sm space-y-4">
             <div>
                <label htmlFor="photoURL" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Profile Picture URL</label>
                <input
                  id="photoURL"
                  name="photoURL"
                  type="url"
                  placeholder="https://..."
                  className="mt-1 appearance-none relative block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-md focus:outline-none focus:ring-ac-accent focus:border-ac-accent sm:text-sm"
                  value={photoURL}
                  onChange={(e) => setPhotoURL(e.target.value)}
                />
              </div>
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Display Name</label>
              <input
                id="displayName"
                name="displayName"
                type="text"
                autoComplete="name"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-md focus:outline-none focus:ring-ac-accent focus:border-ac-accent sm:text-sm"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Username</label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400">
                  acapella.app/
                </span>
                <input 
                  type="text" 
                  id="username" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().trim())}
                  className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md sm:text-sm border border-gray-300 bg-white dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-ac-accent focus:border-ac-accent dark:text-white"
                  required
                />
              </div>
              {usernameStatus === 'checking' && <p className="mt-2 text-sm text-gray-500">Checking...</p>}
              {usernameStatus === 'available' && <p className="mt-2 text-sm text-green-500">Username is available!</p>}
              {usernameError && <p className="mt-2 text-sm text-ac-danger">{usernameError}</p>}
            </div>
          </div>

          {error && <p className="text-sm text-ac-danger text-center">{error}</p>}

          <div>
            <button
              type="submit"
              disabled={loading || usernameStatus !== 'available'}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-ac-primary hover:bg-ac-primary/90 dark:bg-ac-secondary dark:hover:bg-ac-secondary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ac-accent disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Complete Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileSetupPage;
