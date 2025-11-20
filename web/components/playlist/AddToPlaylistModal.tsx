
import React, { useState, useEffect } from 'react';
import { X, Plus, Music, Check, Loader } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../services/firebase';
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion, serverTimestamp, Timestamp } from '@firebase/firestore';
import { Playlist, Song } from '../../types';
import PlaylistFormModal from './PlaylistFormModal';

interface AddToPlaylistModalProps {
    song: Song;
    onClose: () => void;
}

const AddToPlaylistModal: React.FC<AddToPlaylistModalProps> = ({ song, onClose }) => {
    const { currentUser } = useAuth();
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [addingToId, setAddingToId] = useState<string | null>(null);

    const fetchPlaylists = async () => {
        if (!currentUser) return;
        setLoading(true);
        try {
            // Fetch all playlists for the current user.
            // We use a simple query on 'userId' to minimize index requirements and avoid permission issues.
            // Owners can always read their own playlists.
            const q = query(
                collection(db, 'playlists'),
                where('userId', '==', currentUser.uid)
            );
            const snap = await getDocs(q);
            let userPlaylists = snap.docs.map(d => ({ id: d.id, ...d.data() } as Playlist));
            
            // Client-side sort: Recently updated first
            userPlaylists.sort((a, b) => {
                const timeA = a.updatedAt instanceof Timestamp ? a.updatedAt.toMillis() : (a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : 0);
                const timeB = b.updatedAt instanceof Timestamp ? b.updatedAt.toMillis() : (b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : 0);
                return timeB - timeA;
            });
            
            setPlaylists(userPlaylists);
        } catch (e) {
            console.error("Error fetching playlists:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlaylists();
    }, [currentUser]);

    const handleAddToPlaylist = async (playlist: Playlist) => {
        if (playlist.songIds.includes(song.id)) return; 
        setAddingToId(playlist.id);
        
        try {
            const playlistRef = doc(db, 'playlists', playlist.id);
            await updateDoc(playlistRef, {
                songIds: arrayUnion(song.id),
                updatedAt: serverTimestamp()
            });
            // Optimistic update to UI
            setPlaylists(prev => prev.map(p => 
                p.id === playlist.id ? { ...p, songIds: [...p.songIds, song.id] } : p
            ));
        } catch (e) {
            console.error("Error adding song:", e);
            alert("Failed to add song. You might not have permission.");
        } finally {
            setAddingToId(null);
        }
    };

    if (isCreating) {
        return <PlaylistFormModal onClose={() => setIsCreating(false)} onSuccess={fetchPlaylists} />;
    }

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-ac-light dark:bg-ac-dark rounded-xl shadow-2xl w-full max-w-md p-6 max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold font-serif">Add to Playlist</h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"><X size={24} /></button>
                </div>

                <div className="flex-1 overflow-y-auto -mx-4 px-4 space-y-2">
                    <button 
                        onClick={() => setIsCreating(true)}
                        className="w-full flex items-center p-3 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 hover:bg-ac-primary/5 dark:hover:bg-ac-secondary/10 hover:border-ac-primary dark:hover:border-ac-secondary transition-all text-left group"
                    >
                        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-md flex items-center justify-center mr-3 group-hover:bg-ac-primary/10 dark:group-hover:bg-ac-secondary/20 transition-colors">
                            <Plus className="text-ac-primary dark:text-ac-secondary" />
                        </div>
                        <span className="font-semibold text-ac-primary dark:text-ac-secondary">Create New Playlist</span>
                    </button>

                    {loading ? (
                        <div className="text-center py-8 text-gray-400"><Loader className="animate-spin mx-auto mb-2"/>Loading playlists...</div>
                    ) : playlists.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">No playlists found. Create one above!</div>
                    ) : (
                        playlists.map(playlist => {
                            const isAdded = playlist.songIds.includes(song.id);
                            const isAdding = addingToId === playlist.id;

                            return (
                                <button 
                                    key={playlist.id}
                                    onClick={() => !isAdded && handleAddToPlaylist(playlist)}
                                    disabled={isAdded || isAdding}
                                    className="w-full flex items-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left group disabled:opacity-70"
                                >
                                    <img 
                                        src={playlist.coverArtUrl || 'https://placehold.co/100x100?text=PL'} 
                                        alt={playlist.title} 
                                        className="w-12 h-12 rounded object-cover mr-3 bg-gray-200 dark:bg-gray-700 shadow-sm"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold truncate text-gray-900 dark:text-gray-100">{playlist.title}</p>
                                        <p className="text-xs text-gray-500">{playlist.songIds.length} songs</p>
                                    </div>
                                    {isAdding && <Loader size={20} className="animate-spin text-ac-secondary" />}
                                    {isAdded && <Check size={20} className="text-ac-secondary" />}
                                </button>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default AddToPlaylistModal;
