
import React, { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, limit, getDocs, where } from '@firebase/firestore';
import { db } from '../services/firebase';
import { Album, Song } from '../types';
import PageLoader from '../components/common/PageLoader';
import { NavLink } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const SectionTitle: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => (
  <div className="mb-6">
    <h2 className="text-3xl font-bold text-ac-dark dark:text-ac-light font-serif">{title}</h2>
    <p className="text-ac-primary/80 dark:text-ac-light/70">{subtitle}</p>
  </div>
);

// FIX: Update Carousel component to pass index to renderItem prop to allow for ranked lists.
const Carousel: React.FC<{ items: (Album | Song)[]; renderItem: (item: any, index: number) => React.ReactNode }> = ({ items, renderItem }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const { scrollLeft, clientWidth } = scrollRef.current;
            const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
            scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
        }
    };

    return (
        <div className="relative group">
            <button onClick={() => scroll('left')} className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/80 dark:bg-black/80 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity -translate-x-4">
                <ChevronLeft />
            </button>
            <div ref={scrollRef} className="flex space-x-6 overflow-x-auto pb-4 scrollbar-hide">
                {items.map((item, index) => (
                    <div key={item.id} className="flex-shrink-0 w-48">
                        {renderItem(item, index)}
                    </div>
                ))}
            </div>
            <button onClick={() => scroll('right')} className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/80 dark:bg-black/80 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity translate-x-4">
                <ChevronRight />
            </button>
        </div>
    );
};

const ChartItem: React.FC<{ item: Album | Song, rank: number }> = ({ item, rank }) => {
    const isAlbum = 'tracklist' in item;
    const link = isAlbum ? `/album/${item.id}` : `/song/${item.id}`;
    
    return (
        <NavLink to={link} className="group">
            <div className="relative">
                <div className="aspect-square w-full overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-800">
                    <img src={item.coverArtUrl} alt={item.title} className="h-full w-full object-cover object-center group-hover:opacity-75 transition-opacity" />
                </div>
                 <div className="absolute bottom-0 left-0 bg-black/70 text-white font-bold text-2xl w-10 h-10 flex items-center justify-center rounded-tr-lg rounded-bl-lg">{rank}</div>
            </div>
            <h3 className="mt-2 text-base font-semibold text-gray-900 dark:text-white truncate">{item.title}</h3>
        </NavLink>
    );
};

const AlbumCard: React.FC<{ album: Album }> = ({ album }) => (
    <NavLink to={`/album/${album.id}`} className="group">
        <div className="aspect-square w-full overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-800">
            <img src={album.coverArtUrl} alt={album.title} className="h-full w-full object-cover object-center group-hover:opacity-75 transition-opacity" />
        </div>
        <h3 className="mt-2 text-base font-semibold text-gray-900 dark:text-white truncate">{album.title}</h3>
    </NavLink>
);

const DiscoverPage: React.FC = () => {
  const [topAlbums, setTopAlbums] = useState<Album[]>([]);
  const [topSongs, setTopSongs] = useState<Song[]>([]);
  const [newReleases, setNewReleases] = useState<Record<string, Album[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const topAlbumsQuery = query(collection(db, 'albums'), orderBy('likesCount', 'desc'), limit(10));
        const topSongsQuery = query(collection(db, 'songs'), orderBy('likesCount', 'desc'), limit(10));
        
        const genres = ['Pop', 'Hip-Hop/Rap', 'Rock', 'Indie'];
        const genrePromises = genres.map(genre => 
            getDocs(query(collection(db, 'albums'), where('genre', '==', genre), orderBy('releaseDate', 'desc'), limit(10)))
        );

        const [topAlbumsSnap, topSongsSnap, ...genreSnaps] = await Promise.all([
          getDocs(topAlbumsQuery),
          getDocs(topSongsQuery),
          ...genrePromises
        ]);

        setTopAlbums(topAlbumsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Album)));
        setTopSongs(topSongsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Song)));

        const releases: Record<string, Album[]> = {};
        genres.forEach((genre, index) => {
            releases[genre] = genreSnaps[index].docs.map(doc => ({ id: doc.id, ...doc.data() } as Album));
        });
        setNewReleases(releases);

      } catch (err) {
        console.error("Error fetching discover data:", err);
        setError("Could not load discover page. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <PageLoader />;
  if (error) return <div className="text-center py-20 text-ac-danger">{error}</div>;

  return (
    <div className="space-y-16">
      <section>
        <SectionTitle title="Top Charts" subtitle="What's popular right now on Acapella" />
        <div className="space-y-8">
            <div>
                <h3 className="text-xl font-semibold mb-4">Top 10 Albums</h3>
                <Carousel items={topAlbums} renderItem={(item, index) => <ChartItem item={item} rank={index + 1} />} />
            </div>
            <div>
                <h3 className="text-xl font-semibold mb-4">Top 10 Songs</h3>
                <Carousel items={topSongs} renderItem={(item, index) => <ChartItem item={item} rank={index + 1} />} />
            </div>
        </div>
      </section>

      <section>
        <SectionTitle title="New Releases by Genre" subtitle="The latest albums in your favorite genres" />
        <div className="space-y-8">
            {Object.entries(newReleases).map(([genre, albums]) => (
                // FIX: Check if `albums` is an array and has items before rendering, as its type might be `unknown`.
                Array.isArray(albums) && albums.length > 0 && (
                    <div key={genre}>
                        <h3 className="text-xl font-semibold mb-4">{genre}</h3>
                        <Carousel items={albums} renderItem={(item) => <AlbumCard album={item} />} />
                    </div>
                )
            ))}
        </div>
      </section>
      
      <section>
        <SectionTitle title="Recommended for You" subtitle="Albums we think you'll love" />
        <div className="text-center py-10 border-2 border-dashed rounded-lg text-gray-400 dark:text-gray-600">
          <p>Personalized recommendations are coming soon!</p>
          <p className="text-sm">Start liking and reviewing music to help us learn your taste.</p>
        </div>
      </section>
    </div>
  );
};

export default DiscoverPage;
