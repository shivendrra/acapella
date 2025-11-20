
import React, { useState, useEffect } from 'react';
import { useParams, NavLink } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, Timestamp } from '@firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import { UserProfile, Playlist } from '../types';
import PageLoader from '../components/common/PageLoader';

const PlaylistCard: React.FC<{ playlist: Playlist }> = ({ playlist }) => (
    <NavLink to={`/playlist/${playlist.id}`} className="group block">
        <div className="aspect-square w-full overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-800 relative shadow-md">
            <img 
                src={playlist.coverArtUrl || 'https://placehold.co/400x400?text=Playlist'} 
                alt={playlist.title} 
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" 
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors"/>
        </div>
        <h3 className="mt-2 font-bold text-lg text-gray-900 dark:text-white truncate">{playlist.title}</h3>
        <p className="text-sm text-gray-500">{playlist.songIds.length} songs</p>
    </NavLink>
);

const UserPlaylistsPage: React.FC = () => {
    const { username } = useParams<{ username: string }>();
    const { currentUser } = useAuth();
    const [user, setUser] = useState<UserProfile | null>(null);
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!username) return;
            setLoading(true);
            try {
                const userQ = query(collection(db, 'users'), where('username', '==', username));
                const userSnap = await getDocs(userQ);
                if (userSnap.empty) {
                    setError("User not found");
                    setLoading(false);
                    return;
                }
                const userData = userSnap.docs[0].data() as UserProfile;
                setUser(userData);

                // Simplified query logic: Fetch all playlists for the user (effectively public)
                const playlistsRef = collection(db, 'playlists');
                const playlistQ = query(playlistsRef, where('userId', '==', userData.uid));
                
                const playlistSnap = await getDocs(playlistQ);
                let allPlaylists = playlistSnap.docs.map(d => ({ id: d.id, ...d.data() } as Playlist));

                // Client-side sorting
                allPlaylists.sort((a, b) => {
                     const timeA = a.updatedAt instanceof Timestamp ? a.updatedAt.toMillis() : (a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : 0);
                     const timeB = b.updatedAt instanceof Timestamp ? b.updatedAt.toMillis() : (b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : 0);
                     return timeB - timeA;
                });

                setPlaylists(allPlaylists);

            } catch (e) {
                console.error(e);
                // Don't set error state for permission denied to avoid ugly UI, just show empty if blocked
                // setError("Failed to load playlists.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [username, currentUser]);

    if (loading) return <PageLoader />;
    if (error) return <div className="text-center py-20 text-ac-danger">{error}</div>;

    return (
        <div>
            <h1 className="text-4xl font-bold font-serif mb-2">Playlists by {user?.displayName}</h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">Curated collections and mixes.</p>
            
            {playlists.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {playlists.map(playlist => (
                        <PlaylistCard key={playlist.id} playlist={playlist} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 border-2 border-dashed rounded-lg text-gray-500">
                    <p>No playlists found.</p>
                </div>
            )}
        </div>
    );
};

export default UserPlaylistsPage;
