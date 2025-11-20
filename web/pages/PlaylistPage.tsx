
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, NavLink, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, documentId, updateDoc, arrayRemove, deleteDoc, serverTimestamp } from '@firebase/firestore';
import { db } from '../services/firebase';
import { Playlist, Song } from '../types';
import PageLoader from '../components/common/PageLoader';
import { useAuth } from '../hooks/useAuth';
import { Edit, Trash2, Music, Clock, Share2, PlayCircle, Loader } from 'lucide-react';
import PlaylistFormModal from '../components/playlist/PlaylistFormModal';

const PlaylistPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [playlist, setPlaylist] = useState<Playlist | null>(null);
    const [songs, setSongs] = useState<Song[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [removingId, setRemovingId] = useState<string | null>(null);

    const fetchPlaylistData = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const playlistRef = doc(db, 'playlists', id);
            const playlistSnap = await getDoc(playlistRef);

            if (!playlistSnap.exists()) {
                setError("Playlist not found.");
                setLoading(false);
                return;
            }

            const playlistData = { id: playlistSnap.id, ...playlistSnap.data() } as Playlist;
            setPlaylist(playlistData);

            // Fetch Songs in chunks of 10 to respect Firestore 'in' query limits
            if (playlistData.songIds && playlistData.songIds.length > 0) {
                const chunks = [];
                for (let i = 0; i < playlistData.songIds.length; i += 10) {
                    chunks.push(playlistData.songIds.slice(i, i + 10));
                }

                const songPromises = chunks.map(chunk => 
                    getDocs(query(collection(db, 'songs'), where(documentId(), 'in', chunk)))
                );
                
                const songSnaps = await Promise.all(songPromises);
                const allSongs = songSnaps.flatMap(snap => snap.docs.map(d => ({ id: d.id, ...d.data() } as Song)));
                
                // Order songs based on the order in songIds array
                const orderedSongs = playlistData.songIds.map(sid => allSongs.find(s => s.id === sid)).filter(Boolean) as Song[];
                setSongs(orderedSongs);
            } else {
                setSongs([]);
            }

        } catch (err) {
            console.error("Error loading playlist:", err);
            setError("Failed to load playlist.");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchPlaylistData();
    }, [fetchPlaylistData]);

    const handleRemoveSong = async (songId: string) => {
        if (!playlist || !currentUser || currentUser.uid !== playlist.userId) return;
        if(!window.confirm("Remove this song from playlist?")) return;
        
        setRemovingId(songId);

        try {
            const playlistRef = doc(db, 'playlists', playlist.id);
            await updateDoc(playlistRef, {
                songIds: arrayRemove(songId),
                updatedAt: serverTimestamp()
            });
            // Optimistic update
            setSongs(prev => prev.filter(s => s.id !== songId));
            setPlaylist(prev => prev ? { ...prev, songIds: prev.songIds.filter(id => id !== songId) } : null);
        } catch (e) {
            console.error("Error removing song:", e);
            alert("Failed to remove song. Please check your connection.");
        } finally {
            setRemovingId(null);
        }
    };

    const handleDeletePlaylist = async () => {
        if (!playlist || !currentUser || currentUser.uid !== playlist.userId) return;
        if(!window.confirm("Are you sure you want to delete this playlist? This cannot be undone.")) return;
        
        try {
            await deleteDoc(doc(db, 'playlists', playlist.id));
            navigate(`/${currentUser.displayName || 'profile'}/playlists`);
        } catch (e) {
            console.error("Error deleting playlist:", e);
            alert("Failed to delete playlist.");
        }
    };

    if (loading) return <PageLoader />;
    if (error) return <div className="text-center py-20 text-ac-danger">{error}</div>;
    if (!playlist) return null;

    const isOwner = currentUser?.uid === playlist.userId;
    const totalDuration = songs.reduce((acc, curr) => acc + (curr.duration || 0), 0);
    const formatTotalDuration = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        return hrs > 0 ? `${hrs} hr ${mins} min` : `${mins} min`;
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="w-full md:w-1/3 max-w-sm mx-auto md:mx-0 flex-shrink-0">
                    <img 
                        src={playlist.coverArtUrl || 'https://placehold.co/400x400?text=Playlist'} 
                        alt={playlist.title}
                        className="w-full aspect-square object-cover rounded-xl shadow-lg bg-gray-200 dark:bg-gray-800"
                    />
                </div>
                <div className="flex-1 w-full">
                    <h1 className="text-4xl md:text-6xl font-bold font-serif mb-2 leading-tight">{playlist.title}</h1>
                    {playlist.description && <p className="text-gray-600 dark:text-gray-300 mb-4 text-lg">{playlist.description}</p>}
                    
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
                        <span>Curated by <NavLink to={`/${playlist.userDisplayName}`} className="font-bold hover:underline text-ac-primary dark:text-ac-secondary">{playlist.userDisplayName}</NavLink></span>
                        <span>•</span>
                        <span>{songs.length} songs</span>
                        <span>•</span>
                        <span>{formatTotalDuration(totalDuration)}</span>
                    </div>

                    <div className="flex flex-wrap gap-3 items-center">
                         {playlist.platformLinks?.spotify && (
                            <a href={playlist.platformLinks.spotify} target="_blank" rel="noreferrer" className="bg-[#1DB954] text-white px-4 py-2 rounded-full text-sm font-bold hover:brightness-110 transition shadow-sm">Spotify</a>
                        )}
                        {playlist.platformLinks?.appleMusic && (
                            <a href={playlist.platformLinks.appleMusic} target="_blank" rel="noreferrer" className="bg-black text-white px-4 py-2 rounded-full text-sm font-bold hover:brightness-110 transition shadow-sm">Apple Music</a>
                        )}
                         {playlist.platformLinks?.youtubeMusic && (
                            <a href={playlist.platformLinks.youtubeMusic} target="_blank" rel="noreferrer" className="bg-[#FF0000] text-white px-4 py-2 rounded-full text-sm font-bold hover:brightness-110 transition shadow-sm">YouTube Music</a>
                        )}

                        {isOwner && (
                            <div className="ml-auto flex gap-2">
                                <button onClick={() => setIsEditModalOpen(true)} className="p-2 text-gray-500 hover:text-ac-secondary rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" title="Edit Playlist">
                                    <Edit size={20}/>
                                </button>
                                <button onClick={handleDeletePlaylist} className="p-2 text-gray-500 hover:text-ac-danger rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" title="Delete Playlist">
                                    <Trash2 size={20}/>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Tracklist */}
            <div className="border rounded-lg dark:border-gray-700 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-gray-500">
                        <tr>
                            <th className="px-4 py-3 w-12 text-center">#</th>
                            <th className="px-4 py-3">Title</th>
                            <th className="px-4 py-3 hidden sm:table-cell">Album</th>
                            <th className="px-4 py-3 w-24 text-right"><Clock size={14} className="inline"/></th>
                            {isOwner && <th className="px-4 py-3 w-12"></th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {songs.length > 0 ? songs.map((song, index) => (
                            <tr key={song.id} className="group hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                <td className="px-4 py-3 text-gray-500 text-sm text-center">{index + 1}</td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <img src={song.coverArtUrl} alt="" className="w-10 h-10 rounded object-cover bg-gray-200"/>
                                        <div className="min-w-0">
                                            <NavLink to={`/song/${song.id}`} className="font-semibold hover:underline block text-gray-900 dark:text-white truncate">{song.title}</NavLink>
                                            <span className="text-xs text-gray-500">{song.genre}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-500 hidden sm:table-cell max-w-xs truncate">
                                    {song.albumId ? <NavLink to={`/album/${song.albumId}`} className="hover:underline">View Album</NavLink> : '-'}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-500 text-right font-mono">
                                    {Math.floor(song.duration / 60)}:{String(song.duration % 60).padStart(2, '0')}
                                </td>
                                {isOwner && (
                                    <td className="px-4 py-3 text-right">
                                        <button 
                                            onClick={() => handleRemoveSong(song.id)} 
                                            disabled={removingId === song.id}
                                            className="text-gray-400 hover:text-ac-danger opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                                        >
                                            {removingId === song.id ? <Loader size={16} className="animate-spin"/> : <Trash2 size={16} />}
                                        </button>
                                    </td>
                                )}
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={isOwner ? 5 : 4} className="px-4 py-12 text-center text-gray-500">
                                    <Music className="mx-auto h-8 w-8 mb-2 opacity-50"/>
                                    <p>No songs in this playlist yet.</p>
                                    {isOwner && <button onClick={() => setIsEditModalOpen(true)} className="text-ac-secondary hover:underline mt-2 text-sm font-semibold">Add some songs</button>}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isEditModalOpen && playlist && (
                <PlaylistFormModal 
                    onClose={() => setIsEditModalOpen(false)} 
                    existingPlaylist={playlist}
                    onSuccess={fetchPlaylistData}
                />
            )}
        </div>
    );
};

export default PlaylistPage;
