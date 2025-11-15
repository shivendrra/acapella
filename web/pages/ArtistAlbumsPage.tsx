import React, { useState, useEffect } from 'react';
import { useParams, NavLink } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc, orderBy } from '@firebase/firestore';
import { db } from '../services/firebase';
import { Artist, Album } from '../types';
import PageLoader from '../components/common/PageLoader';
import { List, Grid } from 'lucide-react';
import { formatDate } from '../utils/formatters';

// Reusable Album Tile Card
const AlbumTileCard: React.FC<{ album: Album }> = ({ album }) => (
    <NavLink to={`/album/${album.id}`} className="group block">
        <div className="aspect-square w-full overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-800">
            <img src={album.coverArtUrl} alt={album.title} className="h-full w-full object-cover object-center group-hover:opacity-75 transition-opacity" />
        </div>
        <h3 className="mt-2 text-base font-semibold text-gray-900 dark:text-white truncate">{album.title}</h3>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{formatDate(album.releaseDate)}</p>
    </NavLink>
);

// Reusable Album List Item
const AlbumListItem: React.FC<{ album: Album }> = ({ album }) => (
     <NavLink to={`/album/${album.id}`} className="flex items-center space-x-4 p-3 w-full rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
        <img 
            src={album.coverArtUrl}
            alt={album.title}
            className="w-24 h-24 rounded-md object-cover flex-shrink-0"
        />
        <div className="flex-1 truncate">
            <p className="font-semibold text-lg truncate">{album.title}</p>
            <p className="text-sm text-gray-500">{formatDate(album.releaseDate)}</p>
            <p className="text-sm text-gray-500">{album.tracklist.length} tracks</p>
        </div>
    </NavLink>
);


const ArtistAlbumsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [artist, setArtist] = useState<Artist | null>(null);
    const [albums, setAlbums] = useState<Album[]>([]);
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

                const albumsQuery = query(collection(db, 'albums'), where('artistIds', 'array-contains', id));
                const albumsSnap = await getDocs(albumsQuery);
                const albumsData = albumsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Album));
                // Sort client-side to avoid needing a composite index
                albumsData.sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());
                setAlbums(albumsData);

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
                    <h1 className="text-4xl font-bold font-serif">All Albums by {artist?.name}</h1>
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

            {albums.length === 0 ? (
                <p className="text-gray-500">No albums found for this artist.</p>
            ) : layout === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {albums.map(album => <AlbumTileCard key={album.id} album={album} />)}
                </div>
            ) : (
                <div className="border rounded-lg dark:border-gray-700 overflow-hidden">
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                        {albums.map(album => (
                            <li key={album.id}>
                                <AlbumListItem album={album} />
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default ArtistAlbumsPage;