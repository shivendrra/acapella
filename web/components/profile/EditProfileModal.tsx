import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile, Song, Album } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../services/firebase';
import { doc, updateDoc, collection, query, where, getDocs, limit, documentId, orderBy } from '@firebase/firestore';
import { X, Search, Music, PlusCircle } from 'lucide-react';

// Debounce utility
const debounce = <F extends (...args: any[]) => any>(func: F, waitFor: number) => {
  let timeout: number;
  return (...args: Parameters<F>): void => {
    clearTimeout(timeout);
    timeout = window.setTimeout(() => func(...args), waitFor);
  };
};

// Component for selecting favorite items
const FavoriteSelector: React.FC<{
    label: string;
    collectionName: 'songs' | 'albums';
    initialIds: string[];
    onSelectionChange: (ids: string[]) => void;
}> = ({ label, collectionName, initialIds, onSelectionChange }) => {
    const [selectedItems, setSelectedItems] = useState<(Song | Album)[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<(Song | Album)[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);

    useEffect(() => {
        const fetchInitialItems = async () => {
            if (initialIds.length === 0) {
                setIsInitialLoading(false);
                return;
            }
            try {
                const q = query(collection(db, collectionName), where(documentId(), 'in', initialIds));
                const snap = await getDocs(q);
                const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Song | Album));
                const orderedItems = initialIds.map(id => items.find(item => item.id === id)).filter(Boolean) as (Song | Album)[];
                setSelectedItems(orderedItems);
            } catch (e) {
                console.error("Failed to fetch initial favorites:", e);
            } finally {
                setIsInitialLoading(false);
            }
        };
        fetchInitialItems();
    }, [initialIds, collectionName]);

    const performSearch = async (term: string) => {
        if (term.trim().length < 2) {
            setSearchResults([]);
            return;
        }
        setIsLoading(true);
        try {
            const q = query(
                collection(db, collectionName),
                where('title_lowercase', '>=', term.toLowerCase()),
                where('title_lowercase', '<=', term.toLowerCase() + '\uf8ff'),
                orderBy('title_lowercase'),
                limit(5)
            );
            const snap = await getDocs(q);
            const results = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Song | Album));
            setSearchResults(results);
        } catch (e) {
            console.error("Search failed:", e);
        } finally {
            setIsLoading(false);
        }
    };
    
    const debouncedSearch = useCallback(debounce(performSearch, 300), []);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const term = e.target.value;
        setSearchTerm(term);
        debouncedSearch(term);
    };

    const handleSelect = (item: Song | Album) => {
        if (selectedItems.length < 4 && !selectedItems.some(i => i.id === item.id)) {
            const newItems = [...selectedItems, item];
            setSelectedItems(newItems);
            onSelectionChange(newItems.map(i => i.id));
        }
        setSearchTerm('');
        setSearchResults([]);
    };
    
    const handleRemove = (id: string) => {
        const newItems = selectedItems.filter(i => i.id !== id);
        setSelectedItems(newItems);
        onSelectionChange(newItems.map(i => i.id));
    };

    const slots = [...selectedItems];
    while (slots.length < 4) {
        slots.push(null as any);
    }

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{label}</label>
            <div className="grid grid-cols-4 gap-3 mb-3">
                {slots.map((item, index) => (
                    <div key={item?.id || `placeholder-${index}`} className="aspect-square rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center relative bg-gray-50 dark:bg-gray-700/50">
                        {item ? (
                            <>
                                <img src={item.coverArtUrl} alt={item.title} className="w-full h-full object-cover rounded-md"/>
                                <button type="button" onClick={() => handleRemove(item.id)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600">
                                    <X size={14} />
                                </button>
                            </>
                        ) : (
                            <Music size={24} className="text-gray-400 dark:text-gray-500"/>
                        )}
                    </div>
                ))}
            </div>
            {selectedItems.length < 4 && (
                <div className="relative">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={handleSearchChange}
                        placeholder={`Search for ${collectionName}...`}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md bg-white dark:bg-gray-800 dark:border-gray-600"
                    />
                    {searchResults.length > 0 && (
                        <ul className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border dark:border-gray-600 rounded-md shadow-lg max-h-48 overflow-y-auto">
                            {searchResults.map(item => (
                                <li key={item.id} onClick={() => handleSelect(item)} className="px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-3">
                                    <img src={item.coverArtUrl} alt={item.title} className="w-8 h-8 rounded-sm object-cover" />
                                    <span>{item.title}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
};


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
  const [twitterUrl, setTwitterUrl] = useState(userProfile.socials?.twitter || '');
  const [instagramUrl, setInstagramUrl] = useState(userProfile.socials?.instagram || '');
  const [favoriteSongIds, setFavoriteSongIds] = useState(userProfile.favoriteSongIds || []);
  const [favoriteAlbumIds, setFavoriteAlbumIds] = useState(userProfile.favoriteAlbumIds || []);
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
        socials: {
          twitter: twitterUrl.trim(),
          instagram: instagramUrl.trim(),
        },
        favoriteSongIds,
        favoriteAlbumIds,
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
        className="bg-ac-light dark:bg-ac-dark rounded-lg shadow-2xl w-full max-w-lg relative p-6 max-h-[90vh] overflow-y-auto" 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold font-serif">Edit Profile</h2>
            <button onClick={onClose} className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700">
                <X size={24} />
            </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
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
            
            <div>
              <label htmlFor="twitterUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Twitter URL</label>
              <input 
                type="url" 
                id="twitterUrl" 
                value={twitterUrl} 
                onChange={(e) => setTwitterUrl(e.target.value)}
                placeholder="https://x.com/username"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white dark:bg-gray-800 dark:border-gray-600 focus:ring-ac-accent focus:border-ac-accent sm:text-sm text-gray-900 dark:text-white" 
              />
            </div>

            <div>
              <label htmlFor="instagramUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Instagram URL</label>
              <input 
                type="url" 
                id="instagramUrl" 
                value={instagramUrl} 
                onChange={(e) => setInstagramUrl(e.target.value)}
                placeholder="https://instagram.com/username"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white dark:bg-gray-800 dark:border-gray-600 focus:ring-ac-accent focus:border-ac-accent sm:text-sm text-gray-900 dark:text-white" 
              />
            </div>

            <FavoriteSelector
                label="Favorite Songs"
                collectionName="songs"
                initialIds={userProfile.favoriteSongIds || []}
                onSelectionChange={setFavoriteSongIds}
            />
            
            <FavoriteSelector
                label="Favorite Albums"
                collectionName="albums"
                initialIds={userProfile.favoriteAlbumIds || []}
                onSelectionChange={setFavoriteAlbumIds}
            />


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