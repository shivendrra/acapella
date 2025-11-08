import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Artist } from '../types';
import PageLoader from '../components/common/PageLoader';
import { Users } from 'lucide-react';

const PopularArtistCard: React.FC<{ artist: Artist }> = ({ artist }) => (
    <NavLink to={`/artist/${artist.id}`} className="group block text-center">
        <div className="profile-image-wrapper w-32 h-32 rounded-full mx-auto shadow-lg group-hover:scale-105 transition-transform">
            <img 
                src={artist.imageUrl} 
                alt={artist.name} 
                className="profile-image h-full w-full object-cover"
            />
        </div>
        <h3 className="mt-4 font-bold text-lg truncate">{artist.name}</h3>
        <p className="text-sm text-gray-500">{artist.genres[0]}</p>
    </NavLink>
);


const ArtistsIndexPage: React.FC = () => {
    const [popularArtists, setPopularArtists] = useState<Artist[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                // Fetch popular artists (most followed)
                // Note: Firestore requires an index for this query (users -> followersCount DESC).
                // It's better to fetch users and then find their artist profiles if artists are also users.
                // For now, let's assume 'artists' collection has a 'followersCount' field if we want to sort by it.
                // The current 'Artist' type does not, so we'll just sort by name for now.
                const popularQuery = query(collection(db, 'artists'), orderBy('name'), limit(12));
                const popularSnap = await getDocs(popularQuery);
                setPopularArtists(popularSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Artist)));

            } catch (err) {
                console.error(err);
                setError("Failed to load artists. Please try again.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <PageLoader />;
    if (error) return <div className="text-center py-20 text-ac-danger">{error}</div>;
    
    return (
        <div className="space-y-12">
            <h1 className="text-4xl font-bold font-serif">Artists</h1>

            <section>
                <h2 className="text-2xl font-bold font-serif mb-6">Popular Artists</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
                    {popularArtists.map(artist => <PopularArtistCard key={artist.id} artist={artist} />)}
                </div>
            </section>
        </div>
    );
};

export default ArtistsIndexPage;