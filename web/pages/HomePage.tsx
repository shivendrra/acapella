import React from 'react';
import { NavLink } from 'react-router-dom';
import { Plus } from 'lucide-react';

// Mock data for demonstration purposes
const featuredAlbums = [
  { id: '1', title: 'Cosmic Echoes', artist: 'Starlight Parade', coverArtUrl: 'https://picsum.photos/seed/album1/400/400' },
  { id: '2', title: 'Midnight City', artist: 'Neon Bloom', coverArtUrl: 'https://picsum.photos/seed/album2/400/400' },
  { id: '3', title: 'Oceanic Dreams', artist: 'The Sirens', coverArtUrl: 'https://picsum.photos/seed/album3/400/400' },
  { id: '4', title: 'Retrograde', artist: 'Galaxy Runners', coverArtUrl: 'https://picsum.photos/seed/album4/400/400' },
];

const newSongs = [
  { id: 's1', title: 'Electric Feel', artist: 'Starlight Parade', album: 'Cosmic Echoes' },
  { id: 's2', title: 'City Lights', artist: 'Neon Bloom', album: 'Midnight City' },
  { id: 's3', title: 'Deep Blue', artist: 'The Sirens', album: 'Oceanic Dreams' },
  { id: 's4', title: 'Star Chaser', artist: 'Galaxy Runners', album: 'Retrograde' },
  { id: 's5', title: 'Sunset Drive', artist: 'Neon Bloom', album: 'Midnight City' },
];

const SectionTitle: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => (
    <div className="mb-6">
        <h2 className="text-3xl font-bold text-ac-dark dark:text-ac-light font-serif">{title}</h2>
        <p className="text-ac-primary/80 dark:text-ac-light/70">{subtitle}</p>
    </div>
);

const AlbumCard: React.FC<{ album: typeof featuredAlbums[0] }> = ({ album }) => (
    <NavLink to={`/album/${album.id}`} className="group">
        <div className="aspect-square w-full overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-800">
            <img src={album.coverArtUrl} alt={album.title} className="h-full w-full object-cover object-center group-hover:opacity-75 transition-opacity" />
        </div>
        <h3 className="mt-2 text-base font-semibold text-gray-900 dark:text-white truncate">{album.title}</h3>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{album.artist}</p>
    </NavLink>
);

const SongListItem: React.FC<{ song: typeof newSongs[0] }> = ({ song }) => (
    <li className="flex items-center justify-between py-3 px-4 hover:bg-ac-primary/5 dark:hover:bg-ac-secondary/10 rounded-md transition-colors">
        <div>
            <p className="font-semibold text-ac-dark dark:text-ac-light">{song.title}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{song.artist} - <span className="italic">{song.album}</span></p>
        </div>
        <button className="p-2 text-sm border border-ac-accent text-ac-accent rounded-full hover:bg-ac-accent hover:text-white transition-colors">
            <Plus className="h-4 w-4" />
        </button>
    </li>
);

const HomePage: React.FC = () => {
  return (
    <div className="space-y-12">
      <section>
        <SectionTitle title="Featured Albums" subtitle="Handpicked albums you might love" />
        <div className="grid grid-cols-2 gap-y-10 sm:grid-cols-3 gap-x-6 lg:grid-cols-4 xl:grid-cols-4 xl:gap-x-8">
          {featuredAlbums.map((album) => (
            <AlbumCard key={album.id} album={album} />
          ))}
        </div>
      </section>

      <section>
        <SectionTitle title="New Releases" subtitle="The latest tracks to hit the scene" />
        <div className="bg-ac-light dark:bg-ac-dark/50 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {newSongs.map(song => <SongListItem key={song.id} song={song} />)}
            </ul>
        </div>
      </section>
    </div>
  );
};

export default HomePage;