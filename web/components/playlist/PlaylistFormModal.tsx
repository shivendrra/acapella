
import React, { useState, useEffect, useCallback } from 'react';
import { X, Search, Trash2, Plus, Music, Save, Loader } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../services/firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp, query, where, getDocs, documentId, orderBy, limit } from '@firebase/firestore';
import { Playlist, Song } from '../../types';

interface PlaylistFormModalProps {
    onClose: () => void;
    existingPlaylist?: Playlist;
    onSuccess?: () => void;
}

// Debounce utility
const debounce = <F extends (...args: any[]) => any>(func: F, waitFor: number) => {
    let timeout: number;
    return (...args: Parameters<F>): void => {
        clearTimeout(timeout);
        timeout = window.setTimeout(() => func(...args), waitFor);
    };
};

const PlaylistFormModal: React.FC<PlaylistFormModalProps> = ({ onClose, existingPlaylist, onSuccess }) => {
    const { currentUser, userProfile } = useAuth();
    const [title, setTitle] = useState(existingPlaylist?.title || '');
    const [description, setDescription] = useState(existingPlaylist?.description || '');
    const [coverArtUrl, setCoverArtUrl] = useState(existingPlaylist?.coverArtUrl || '');
    const [platformLinks, setPlatformLinks] = useState({
        spotify: existingPlaylist?.platformLinks?.spotify || '',
        appleMusic: existingPlaylist?.platformLinks?.appleMusic || '',
        youtubeMusic: existingPlaylist?.platformLinks?.youtubeMusic || '',
    });
    
    // Song Management State
    const [selectedSongs, setSelectedSongs] = useState<Song[]>([]);
    const [songSearchTerm, setSongSearchTerm] = useState('');
    const [songSearchResults, setSongSearchResults] = useState<Song[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isLoadingSongs, setIsLoadingSongs] = useState(false);

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    // Fetch existing songs if editing
    useEffect(() => {
        const fetchExistingSongs = async () => {
            if (existingPlaylist?.songIds && existingPlaylist.songIds.length > 0) {
                setIsLoadingSongs(true);
                try {
                    // Firestore 'in' query is limited to 10. We must batch requests.
                    const chunks = [];
                    const ids = existingPlaylist.songIds;
                    for (let i = 0; i < ids.length; i += 10) {
                        chunks.push(ids.slice(i, i + 10));
                    }

                    const songPromises = chunks.map(chunk => 
                        getDocs(query(collection(db, 'songs'), where(documentId(), 'in', chunk)))
                    );
                    
                    const songSnaps = await Promise.all(songPromises);
                    const allFetchedSongs = songSnaps.flatMap(snap => snap.docs.map(d => ({ id: d.id, ...d.data() } as Song)));
                    
                    // Reorder based on original ID list to maintain sequence
                    const orderedSongs = ids.map(id => allFetchedSongs.find(s => s.id === id)).filter(Boolean) as Song[];
                    setSelectedSongs(orderedSongs);

                } catch (e) {
                    console.error("Error fetching existing playlist songs:", e);
                    setError("Failed to load existing songs.");
                } finally {
                    setIsLoadingSongs(false);
                }
            }
        };
        
        if (existingPlaylist) {
            fetchExistingSongs();
        }
    }, [existingPlaylist]);

    // Search Logic
    const performSearch = async (term: string) => {
        if (term.trim().length < 2) {
            setSongSearchResults([]);
            return;
        }
        setIsSearching(true);
        try {
            const q = query(
                collection(db, 'songs'),
                where('title_lowercase', '>=', term.toLowerCase()),
                where('title_lowercase', '<=', term.toLowerCase() + '\uf8ff'),
                orderBy('title_lowercase'),
                limit(5)
            );
            const snap = await getDocs(q);
            setSongSearchResults(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Song)));
        } catch (e) {
            console.error("Song search failed:", e);
        } finally {
            setIsSearching(false);
        }
    };

    const debouncedSearch = useCallback(debounce(performSearch, 300), []);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSongSearchTerm(e.target.value);
        debouncedSearch(e.target.value);
    };

    const addSong = (song: Song) => {
        if (!selectedSongs.some(s => s.id === song.id)) {
            setSelectedSongs(prev => [...prev, song]);
        }
        setSongSearchTerm('');
        setSongSearchResults([]);
    };

    const removeSong = (songId: string) => {
        setSelectedSongs(prev => prev.filter(s => s.id !== songId));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser || !userProfile) {
            setError("You must be logged in.");
            return;
        }
        if (!title.trim()) {
            setError('Title is required');
            return;
        }

        setSaving(true);
        setError('');

        try {
            // Sanitize data strictly. Convert undefined/null to empty strings.
            const cleanPlatformLinks = {
                spotify: (platformLinks.spotify || '').trim(),
                appleMusic: (platformLinks.appleMusic || '').trim(),
                youtubeMusic: (platformLinks.youtubeMusic || '').trim(),
            };

            const commonData = {
                title: title.trim(),
                description: (description || '').trim(),
                coverArtUrl: (coverArtUrl || '').trim(),
                platformLinks: cleanPlatformLinks,
                songIds: selectedSongs.map(s => s.id),
                updatedAt: serverTimestamp(),
                // Removed isPublic field as requested
            };

            if (existingPlaylist) {
                const playlistRef = doc(db, 'playlists', existingPlaylist.id);
                await updateDoc(playlistRef, commonData);
            } else {
                const newPlaylistData = {
                    ...commonData,
                    userId: currentUser.uid,
                    userDisplayName: userProfile.displayName || userProfile.username || 'Anonymous',
                    createdAt: serverTimestamp(),
                };
                await addDoc(collection(db, 'playlists'), newPlaylistData);
            }
            
            if (onSuccess) onSuccess();
            onClose();
        } catch (err: any) {
            console.error("Error saving playlist:", err);
            setError("Failed to save playlist. " + (err.message || "Missing or insufficient permissions."));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4" onClick={onClose}>
            <div className="bg-ac-light dark:bg-ac-dark rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col h-full md:h-auto" onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div className="flex justify-between items-center p-4 md:p-6 border-b border-gray-200 dark:border-gray-800 shrink-0 bg-ac-light dark:bg-ac-dark">
                    <h2 className="text-xl md:text-2xl font-bold font-serif text-ac-dark dark:text-ac-light">
                        {existingPlaylist ? 'Edit Playlist' : 'Create New Playlist'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Content Area */}
                {/* Mobile: overflow-y-auto on this container allows both sides to scroll as one long page */}
                {/* Desktop: md:overflow-hidden prevents this container from scrolling, delegating scrolling to the children columns */}
                <div className="flex-1 overflow-y-auto md:overflow-hidden flex flex-col md:flex-row">
                    
                    {/* Left Column: Details Form */}
                    <div className="w-full md:w-1/2 p-4 md:p-6 md:overflow-y-auto border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-800 shrink-0">
                        <form id="playlist-form" onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Playlist Title</label>
                                <input 
                                    value={title} 
                                    onChange={(e) => setTitle(e.target.value)} 
                                    className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-ac-secondary focus:outline-none transition-shadow dark:text-white"
                                    placeholder="e.g., Late Night Vibes"
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Description</label>
                                <textarea 
                                    value={description} 
                                    onChange={(e) => setDescription(e.target.value)} 
                                    className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-ac-secondary focus:outline-none transition-shadow dark:text-white"
                                    rows={3}
                                    placeholder="What's this collection about?"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Cover Image</label>
                                <div className="flex gap-4 items-start">
                                    <div className="w-24 h-24 rounded-lg bg-gray-200 dark:bg-gray-700 flex-shrink-0 overflow-hidden border border-gray-300 dark:border-gray-600">
                                         <img 
                                            src={coverArtUrl || 'https://placehold.co/100x100?text=?'} 
                                            alt="Preview" 
                                            className="w-full h-full object-cover"
                                            onError={(e) => (e.currentTarget.src = 'https://placehold.co/100x100?text=?')}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <input 
                                            value={coverArtUrl} 
                                            onChange={(e) => setCoverArtUrl(e.target.value)} 
                                            className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-ac-secondary focus:outline-none text-sm dark:text-white"
                                            placeholder="https://image-url.com..."
                                        />
                                        <p className="text-xs text-gray-500 mt-2">Paste a direct link to an image (1:1 ratio recommended).</p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                                <h3 className="font-bold text-sm text-gray-500 uppercase tracking-wider mb-4">External Links (Optional)</h3>
                                <div className="space-y-3">
                                    <div className="relative">
                                        <input 
                                            value={platformLinks.spotify} 
                                            onChange={e => setPlatformLinks({...platformLinks, spotify: e.target.value})}
                                            placeholder="Spotify URL" 
                                            className="w-full pl-10 p-2.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-ac-secondary focus:outline-none dark:text-white"
                                        />
                                        <div className="absolute left-3 top-2.5 w-4 h-4 bg-[#1DB954] rounded-full flex items-center justify-center"></div>
                                    </div>
                                    <div className="relative">
                                        <input 
                                            value={platformLinks.appleMusic} 
                                            onChange={e => setPlatformLinks({...platformLinks, appleMusic: e.target.value})}
                                            placeholder="Apple Music URL" 
                                            className="w-full pl-10 p-2.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-ac-secondary focus:outline-none dark:text-white"
                                        />
                                        <div className="absolute left-3 top-2.5 w-4 h-4 bg-black rounded-full flex items-center justify-center"></div>
                                    </div>
                                    <div className="relative">
                                        <input 
                                            value={platformLinks.youtubeMusic} 
                                            onChange={e => setPlatformLinks({...platformLinks, youtubeMusic: e.target.value})}
                                            placeholder="YouTube Music URL" 
                                            className="w-full pl-10 p-2.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-ac-secondary focus:outline-none dark:text-white"
                                        />
                                        <div className="absolute left-3 top-2.5 w-4 h-4 bg-[#FF0000] rounded-full flex items-center justify-center"></div>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* Right Column: Song Management */}
                    <div className="w-full md:w-1/2 flex flex-col bg-gray-50 dark:bg-black/20 md:h-full shrink-0 min-h-[400px]">
                         <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-ac-dark z-10 md:sticky md:top-0">
                             <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Add Songs</label>
                             <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={songSearchTerm}
                                    onChange={handleSearchChange}
                                    placeholder="Search for songs by title..."
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-ac-secondary focus:outline-none transition-all dark:text-white"
                                />
                                {songSearchResults.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-60 overflow-y-auto z-20">
                                        {songSearchResults.map(song => (
                                            <button 
                                                key={song.id} 
                                                type="button"
                                                onClick={() => addSong(song)} 
                                                className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 border-b border-gray-100 dark:border-gray-800 last:border-0"
                                            >
                                                <img src={song.coverArtUrl} alt="" className="w-10 h-10 rounded object-cover bg-gray-200" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold truncate dark:text-gray-200">{song.title}</p>
                                                    <p className="text-xs text-gray-500 truncate">{song.genre}</p>
                                                </div>
                                                <Plus size={18} className="text-ac-secondary" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                             </div>
                         </div>

                         <div className="flex-1 p-4 md:overflow-y-auto">
                            <div className="flex justify-between items-center mb-3 px-1">
                                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Tracks ({selectedSongs.length})</h3>
                            </div>
                            
                            {isLoadingSongs ? (
                                <div className="flex justify-center py-8"><Loader className="animate-spin text-gray-400"/></div>
                            ) : selectedSongs.length === 0 ? (
                                <div className="h-40 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                                    <Music size={32} className="mb-2 opacity-50"/>
                                    <p className="text-sm">No songs added yet.</p>
                                </div>
                            ) : (
                                <ul className="space-y-2">
                                    {selectedSongs.map((song, index) => (
                                        <li key={`${song.id}-${index}`} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm group">
                                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                                <span className="text-xs font-mono text-gray-400 w-6 text-center flex-shrink-0">{index + 1}</span>
                                                <img src={song.coverArtUrl} alt="" className="w-10 h-10 rounded object-cover bg-gray-200 flex-shrink-0" />
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-semibold truncate dark:text-gray-200">{song.title}</p>
                                                    <p className="text-xs text-gray-500 truncate">{song.genre}</p>
                                                </div>
                                            </div>
                                            <button 
                                                type="button"
                                                onClick={() => removeSong(song.id)}
                                                className="p-2 text-gray-400 hover:text-ac-danger hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors ml-2 shrink-0"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer: Fixed at bottom */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-ac-dark shrink-0">
                     {error && <span className="text-sm text-ac-danger text-center sm:text-left order-2 sm:order-1">{error}</span>}
                     
                     <div className="flex gap-3 w-full sm:w-auto order-1 sm:order-2">
                        <button 
                            type="button"
                            onClick={onClose}
                            className="flex-1 sm:flex-none px-5 py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            form="playlist-form"
                            disabled={saving}
                            className="flex-1 sm:flex-none px-5 py-2.5 text-sm font-semibold text-white bg-ac-primary hover:bg-ac-primary/90 dark:bg-ac-secondary dark:hover:bg-ac-secondary/90 rounded-lg shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? <Loader size={16} className="animate-spin"/> : <Save size={16} />}
                            {existingPlaylist ? 'Save Changes' : 'Create Playlist'}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default PlaylistFormModal;
