import React, { useState, useEffect } from 'react';
import { useParams, NavLink } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc, orderBy } from '@firebase/firestore';
import { db } from '../services/firebase';
import { Artist, Song } from '../types';
import PageLoader from '../components/common/PageLoader';
import { List, Grid } from 'lucide-react';
import { formatDate } from '../utils/formatters';

// Reusable Song Tile Card
const SongTileCard: React.FC<{ song: Song }> = ({ song }) => {
    const imageUrl = song.coverArtUrl || `https://placehold.co/400x400/131010/FAF8F1?text=${encodeURIComponent(song.title.charAt(0)) || '🎵'}`;

    return (
        <NavLink to={`/song/${song.id}`} className="group relative block aspect-square w-full overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-800 shadow-lg">
            <img 
                src={imageUrl} 
                alt={song.title} 
                className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" aria-hidden="true" />
            <div className="absolute inset-0 p-4 flex flex-col justify-end text-white">
                <h3 className="font-bold text-lg leading-tight drop-shadow-sm">{song.title}</h3>
                <p className="text-sm text-gray-300 drop-shadow-sm">{song.genre}</p>
            </div>
        </NavLink>
    );
};

// Reusable Song List Item
const SongListItem: React.FC<{ song: Song }> = ({ song }) => (
    <NavLink to={`/song/${song.id}`} className="flex items-center space-x-4 p-3 w-full rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
        <img 
            src={song.coverArtUrl || `https://placehold.co/100x100/131010/FAF8F1?text=${song.title.charAt(0)}`}
            alt={song.title}
            className="w-16 h-16 rounded-md object-cover flex-shrink-0"
        />
        <div className="flex-1 truncate">
            <p className="font-semibold truncate">{song.title}</p>
            <p className="text-sm text-gray-500">{formatDate(song.releaseDate)}</p>
        </div>
        <p className="text-sm text-gray-500 flex-shrink-0">{Math.floor(song.duration / 60)}:{String(song.duration % 60).padStart(2, '0')}</p>
    </NavLink>
);

const ArtistSongsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [artist, setArtist] = useState<Artist | null>(null);
    const [songs, setSongs] = useState<Song[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [layout, setLayout] = useState<'grid' | 'list'>('grid');

    useEffect(() => {
        const fetchArtistData = async () => {
            if (!id) {
                setError("Artist ID is missing.");
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                const artistRef = doc(db, 'artists', id);
                const artistSnap = await getDoc(artistRef);
                if (!artistSnap.exists()) {
                    setError("Artist not found.");
                    return;
                }
                setArtist(artistSnap.data() as Artist);

                const songsQuery = query(collection(db, 'songs'), where('artistIds', 'array-contains', id), orderBy('releaseDate', 'desc'));
                const songsSnap = await getDocs(songsQuery);
                setSongs(songsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Song)));

            } catch (err) {
                console.error("Error fetching artist data:", err);
                setError("Failed to load artist details.");
            } finally {
                setLoading(false);
            }
        };

        fetchArtistData();
    }, [id]);

    if (loading) return <PageLoader />;
    if (error) return <div className="text-center py-20 text-ac-danger">{error}</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-4xl font-bold font-serif">All Songs by {artist?.name}</h1>
                </div>
                <div className="flex items-center space-x-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <button onClick={() => setLayout('grid')} className={`p-2 rounded-md ${layout === 'grid' ? 'bg-white dark:bg-gray-700 shadow' : ''}`}>
                        <Grid className="h-5 w-5" />
                    </button>
                    <button onClick={() => setLayout('list')} className={`p-2 rounded-md ${layout === 'list' ? 'bg-white dark:bg-gray-700 shadow' : ''}`}>
                        <List className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {songs.length === 0 ? (
                <p className="text-gray-500">No songs found for this artist.</p>
            ) : layout === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {songs.map(song => <SongTileCard key={song.id} song={song} />)}
                </div>
            ) : (
                <div className="border rounded-lg dark:border-gray-700 overflow-hidden">
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                        {songs.map(song => (
                            <li key={song.id}>
                                <SongListItem song={song} />
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default ArtistSongsPage;