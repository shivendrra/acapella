import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { db, auth } from '../../services/firebase';
// FIX: Changed firebase imports to use the '@firebase' scope.
import { doc, updateDoc, collection, query, where, getDocs, limit, deleteDoc } from '@firebase/firestore';
// FIX: Changed firebase imports to use the '@firebase' scope.
import { deleteUser } from '@firebase/auth';
import { RESERVED_SLUGS } from '../../utils/reserved-slugs';
import { Role } from '../../types';
import { useNavigate } from 'react-router-dom';
import { X, AlertTriangle } from 'lucide-react';

// A simple debounce utility
const debounce = <F extends (...args: any[]) => any>(func: F, waitFor: number) => {
  let timeout: number;
  return (...args: Parameters<F>): Promise<ReturnType<F>> =>
    new Promise(resolve => {
      clearTimeout(timeout);
      timeout = window.setTimeout(() => resolve(func(...args)), waitFor);
    });
};

const DeleteAccountModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}> = ({ isOpen, onClose, onConfirm }) => {
    const [confirmText, setConfirmText] = useState('');
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-ac-light dark:bg-ac-dark rounded-lg shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold font-serif text-ac-danger">Delete Account</h3>
                    <button onClick={onClose}><X /></button>
                </div>
                <div className="mt-4 text-center">
                    <AlertTriangle className="mx-auto h-12 w-12 text-ac-danger mb-4"/>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        This action is irreversible. All your data, including your profile, reviews, and activity will be permanently deleted.
                    </p>
                    <label htmlFor="confirm-delete" className="font-semibold text-sm">Please type <strong className="text-ac-danger">delete</strong> to confirm.</label>
                    <input
                        id="confirm-delete"
                        type="text"
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        className="mt-2 w-full p-2 border rounded bg-transparent border-gray-400 dark:border-gray-600 text-center"
                    />
                </div>
                <div className="mt-6 flex justify-end space-x-2">
                    <button onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
                    <button
                        onClick={onConfirm}
                        disabled={confirmText !== 'delete'}
                        className="px-4 py-2 bg-ac-danger text-white rounded disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        Delete My Account
                    </button>
                </div>
            </div>
        </div>
    );
};


const AccountSettings: React.FC = () => {
  const { userProfile, currentUser } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    if (userProfile) {
      setUsername(userProfile.username || '');
    }
  }, [userProfile]);

  const checkUsernameAvailability = useCallback(async (name: string) => {
    if (name === userProfile?.username) {
        setUsernameStatus('idle');
        setUsernameError(null);
        return;
    }
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
  }, [userProfile?.username]);

  const debouncedCheck = useCallback(debounce(checkUsernameAvailability, 500), [checkUsernameAvailability]);

  useEffect(() => {
    if (username) {
      debouncedCheck(username);
    } else {
      setUsernameStatus('idle');
      setUsernameError(null);
    }
  }, [username, debouncedCheck]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !userProfile) return;

    const isUsernameChanged = username.trim() !== (userProfile.username || '');
    if (!isUsernameChanged || (usernameStatus !== 'available' && !isUsernameUnchanged)) return;

    setLoading(true);
    setSuccessMessage('');

    try {
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, { username: username.trim() });
        setSuccessMessage('Username updated successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
        console.error("Error updating username:", error);
        setUsernameError("Failed to update username. Please try again.");
    } finally {
        setLoading(false);
    }
  };
  
  const handleBecomeCurator = async () => {
    if (!currentUser || userProfile?.isCurator) return;
    setLoading(true);
    try {
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, { isCurator: true });
        setSuccessMessage('Congratulations! You are now a Curator. Refresh to see your badge!');
        setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
        console.error("Error becoming curator:", error);
    } finally {
        setLoading(false);
    }
  };
  
  const handleDeleteAccount = async () => {
    if (!currentUser) return;
    setDeleteError('');
    try {
        // A real-world app would force re-authentication here for security.
        // e.g., reauthenticateWithCredential(currentUser, credential);
        // This is a critical security step before deleting user data.
        
        await deleteDoc(doc(db, 'users', currentUser.uid));
        await deleteUser(currentUser);
        
        // This will trigger the AuthProvider to clear state and redirect.
    } catch (error: any) {
        console.error("Error deleting account:", error);
        if (error.code === 'auth/requires-recent-login') {
            setDeleteError("This is a sensitive operation. Please log out and log back in before deleting your account.");
        } else {
            setDeleteError("Failed to delete account. Please try again.");
        }
        setIsDeleteModalOpen(false);
    }
  };

  const isUsernameUnchanged = username === userProfile?.username;
  const canSubmit = isUsernameUnchanged || usernameStatus === 'available';
  const showCuratorSection = userProfile?.role !== Role.MASTER_ADMIN && !userProfile?.isCurator;

  return (
    <>
    <form onSubmit={handleUpdate}>
      <h2 className="text-3xl font-bold font-serif mb-4">Account</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Manage your username, email, and other account settings.
      </p>
      <div className="space-y-6">
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
              className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md sm:text-sm border border-gray-300 bg-white dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-ac-accent focus:border-ac-accent dark:text-white" />
          </div>
          {usernameStatus === 'checking' && <p className="mt-2 text-sm text-gray-500">Checking...</p>}
          {usernameStatus === 'available' && <p className="mt-2 text-sm text-green-500">Username is available!</p>}
          {usernameError && <p className="mt-2 text-sm text-ac-danger">{usernameError}</p>}
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
          <input 
            type="email" 
            id="email" 
            value={userProfile?.email || ''}
            readOnly
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 dark:bg-gray-800 dark:border-gray-600 sm:text-sm text-gray-500 dark:text-gray-400 cursor-not-allowed" />
        </div>
        <div className="flex items-center space-x-4">
            <button type="submit" disabled={loading || !canSubmit} className="px-5 py-2 bg-ac-primary text-white rounded-md hover:bg-ac-primary/90 disabled:bg-gray-400 disabled:cursor-not-allowed">
              {loading ? 'Saving...' : 'Update Account'}
            </button>
            {successMessage && <p className="text-sm text-green-600">{successMessage}</p>}
        </div>
      </div>
    </form>
    
    {showCuratorSection && (
        <div className="mt-12 p-6 border rounded-lg">
             <h3 className="text-xl font-bold font-serif mb-2">Become a Curator</h3>
             <p className="text-gray-600 dark:text-gray-400 mb-4">The Curator program is a special tier for users who wish to support the Acapella project. By upgrading, you'll receive a "Curator" badge on your profile as a thank you for helping us grow. This is a mock purchase for demonstration purposes.</p>
             <button onClick={handleBecomeCurator} disabled={loading} className="px-5 py-2 bg-ac-secondary text-white rounded-md hover:bg-ac-secondary/90 disabled:bg-gray-400">
                 {loading ? 'Processing...' : 'Upgrade to Curator'}
            </button>
        </div>
    )}

    <div className="mt-12 p-6 border border-ac-danger/50 rounded-lg">
        <h3 className="text-xl font-bold font-serif text-ac-danger mb-2">Danger Zone</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
            Deleting your account is permanent and cannot be undone.
        </p>
        <button onClick={() => setIsDeleteModalOpen(true)} className="px-5 py-2 bg-ac-danger text-white rounded-md hover:bg-ac-danger/90">
            Delete My Account
        </button>
        {deleteError && <p className="mt-4 text-sm text-ac-danger">{deleteError}</p>}
    </div>
    <DeleteAccountModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteAccount}
    />
    </>
  );
};

export default AccountSettings;