import React, { useState, useEffect } from 'react';
import { useParams, NavLink } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Artist, Album, Song } from '../types';
import PageLoader from '../components/common/PageLoader';
import { Globe } from 'lucide-react';

const AlbumCard: React.FC<{ album: Album }> = ({ album }) => (
    <NavLink to={`/album/${album.id}`} className="group block">
        <div className="aspect-square w-full overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-800">
            <img src={album.coverArtUrl} alt={album.title} className="h-full w-full object-cover object-center group-hover:opacity-75 transition-opacity" />
        </div>
        <h3 className="mt-2 text-base font-semibold text-gray-900 dark:text-white truncate">{album.title}</h3>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{new Date(album.releaseDate).getFullYear()}</p>
    </NavLink>
);

const iconMap: Record<string, React.FC<any>> = {
    'twitter': () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" className="w-full h-full fill-current"><path d="M453.2 112L523.8 112L369.6 288.2L551 528L409 528L297.7 382.6L170.5 528L99.8 528L264.7 339.5L90.8 112L236.4 112L336.9 244.9L453.2 112zM428.4 485.8L467.5 485.8L215.1 152L173.1 152L428.4 485.8z"/></svg>,
    'instagram': () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" className="w-full h-full fill-current"><path d="M320.3 205C256.8 204.8 205.2 256.2 205 319.7C204.8 383.2 256.2 434.8 319.7 435C383.2 435.2 434.8 383.8 435 320.3C435.2 256.8 383.8 205.2 320.3 205zM319.7 245.4C360.9 245.2 394.4 278.5 394.6 319.7C394.8 360.9 361.5 394.4 320.3 394.6C279.1 394.8 245.6 361.5 245.4 320.3C245.2 279.1 278.5 245.6 319.7 245.4zM413.1 200.3C413.1 185.5 425.1 173.5 439.9 173.5C454.7 173.5 466.7 185.5 466.7 200.3C466.7 215.1 454.7 227.1 439.9 227.1C425.1 227.1 413.1 215.1 413.1 200.3zM542.8 227.5C541.1 191.6 532.9 159.8 506.6 133.6C480.4 107.4 448.6 99.2 412.7 97.4C375.7 95.3 264.8 95.3 227.8 97.4C192 99.1 160.2 107.3 133.9 133.5C107.6 159.7 99.5 191.5 97.7 227.4C95.6 264.4 95.6 375.3 97.7 412.3C99.4 448.2 107.6 480 133.9 506.2C160.2 532.4 191.9 540.6 227.8 542.4C264.8 544.5 375.7 544.5 412.7 542.4C448.6 540.7 480.4 532.5 506.6 506.2C532.8 480 541 448.2 542.8 412.3C544.9 375.3 544.9 264.5 542.8 227.5zM495 452C487.2 471.6 472.1 486.7 452.4 494.6C422.9 506.3 352.9 503.6 320.3 503.6C287.7 503.6 217.6 506.2 188.2 494.6C168.6 486.8 153.5 471.7 145.6 452C133.9 422.5 136.6 352.5 136.6 319.9C136.6 287.3 134 217.2 145.6 187.8C153.4 168.2 168.5 153.1 188.2 145.2C217.7 133.5 287.7 136.2 320.3 136.2C352.9 136.2 423 133.6 452.4 145.2C472 153 487.1 168.1 495 187.8C506.7 217.3 504 287.3 504 319.9C504 352.5 506.7 422.6 495 452z"/></svg>,
    'spotify': () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" className="w-full h-full fill-current"><path d="M320 72C183 72 72 183 72 320C72 457 183 568 320 568C457 568 568 457 568 320C568 183 457 72 320 72zM420.7 436.9C416.5 436.9 413.9 435.6 410 433.3C347.6 395.7 275 394.1 203.3 408.8C199.4 409.8 194.3 411.4 191.4 411.4C181.7 411.4 175.6 403.7 175.6 395.6C175.6 385.3 181.7 380.4 189.2 378.8C271.1 360.7 354.8 362.3 426.2 405C432.3 408.9 435.9 412.4 435.9 421.5C435.9 430.6 428.8 436.9 420.7 436.9zM447.6 371.3C442.4 371.3 438.9 369 435.3 367.1C372.8 330.1 279.6 315.2 196.7 337.7C191.9 339 189.3 340.3 184.8 340.3C174.1 340.3 165.4 331.6 165.4 320.9C165.4 310.2 170.6 303.1 180.9 300.2C208.7 292.4 237.1 286.6 278.7 286.6C343.6 286.6 406.3 302.7 455.7 332.1C463.8 336.9 467 343.1 467 351.8C466.9 362.6 458.5 371.3 447.6 371.3zM478.6 295.1C473.4 295.1 470.2 293.8 465.7 291.2C394.5 248.7 267.2 238.5 184.8 261.5C181.2 262.5 176.7 264.1 171.9 264.1C158.7 264.1 148.6 253.8 148.6 240.5C148.6 226.9 157 219.2 166 216.6C201.2 206.3 240.6 201.4 283.5 201.4C356.5 201.4 433 216.6 488.9 249.2C496.7 253.7 501.8 259.9 501.8 271.8C501.8 285.4 490.8 295.1 478.6 295.1z"/></svg>,
    'youtubemusic': () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" className="w-full h-full fill-current"><path d="M581.7 188.1C575.5 164.4 556.9 145.8 533.4 139.5C490.9 128 320.1 128 320.1 128C320.1 128 149.3 128 106.7 139.5C83.2 145.8 64.7 164.4 58.4 188.1C47 231 47 320.4 47 320.4C47 320.4 47 409.8 58.4 452.7C64.7 476.3 83.2 494.2 106.7 500.5C149.3 512 320.1 512 320.1 512C320.1 512 490.9 512 533.5 500.5C557 494.2 575.5 476.3 581.8 452.7C593.2 409.8 593.2 320.4 593.2 320.4C593.2 320.4 593.2 231 581.8 188.1zM264.2 401.6L264.2 239.2L406.9 320.4L264.2 401.6z"/></svg>,
    'applemusic': () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" className="w-full h-full fill-current"><path d="M447.1 332.7C446.9 296 463.5 268.3 497.1 247.9C478.3 221 449.9 206.2 412.4 203.3C376.9 200.5 338.1 224 323.9 224C308.9 224 274.5 204.3 247.5 204.3C191.7 205.2 132.4 248.8 132.4 337.5C132.4 363.7 137.2 390.8 146.8 418.7C159.6 455.4 205.8 545.4 254 543.9C279.2 543.3 297 526 329.8 526C361.6 526 378.1 543.9 406.2 543.9C454.8 543.2 496.6 461.4 508.8 424.6C443.6 393.9 447.1 334.6 447.1 332.7zM390.5 168.5C417.8 136.1 415.3 106.6 414.5 96C390.4 97.4 362.5 112.4 346.6 130.9C329.1 150.7 318.8 175.2 321 202.8C347.1 204.8 370.9 191.4 390.5 168.5z"/></svg>,
    'facebook': () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320C64 440 146.7 540.8 258.2 568.5L258.2 398.2L205.4 398.2L205.4 320L258.2 320L258.2 286.3C258.2 199.2 297.6 158.8 383.2 158.8C399.4 158.8 427.4 162 438.9 165.2L438.9 236C432.9 235.4 422.4 235 409.3 235C367.3 235 351.1 250.9 351.1 292.2L351.1 320L434.7 320L420.3 398.2L351 398.2L351 574.1C477.8 558.8 576 450.9 576 320z"/></svg>,
    default: Globe,
};

const SocialLinks: React.FC<{ artist: Artist }> = ({ artist }) => {
    const platformToIconKey: Record<string, string> = {
        twitter: 'twitter',
        instagram: 'instagram',
        spotify: 'spotify',
        applemusic: 'applemusic',
        youtubemusic: 'youtubemusic',
        facebook: 'facebook',
        youtube: 'youtube'
    };

    const links = [
        ...(artist.platformLinks ? Object.entries(artist.platformLinks) : []),
        ...(artist.socials ? Object.entries(artist.socials) : [])
    ].filter(([, url]) => url);

    if (links.length === 0) return null;

    return (
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3 mt-4">
            {links.map(([platform, url]) => {
                const cleanPlatform = platform.toLowerCase().replace(/\s/g, '');
                const iconKey = platformToIconKey[cleanPlatform] || 'default';
                const IconComponent = iconMap[iconKey] || iconMap.default;
                return (
                    <a
                        key={platform}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-500 hover:text-ac-primary dark:text-gray-400 dark:hover:text-ac-secondary transition-colors"
                        aria-label={platform}
                    >
                        <div className="h-6 w-6">
                           <IconComponent />
                        </div>
                    </a>
                );
            })}
        </div>
    );
};


const ArtistPage = () => {
    const { id } = useParams<{ id: string }>();
    const [artist, setArtist] = useState<Artist | null>(null);
    const [albums, setAlbums] = useState<Album[]>([]);
    const [songs, setSongs] = useState<Song[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isBioExpanded, setIsBioExpanded] = useState(false);

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
                const artistData = { id: artistSnap.id, ...artistSnap.data() } as Artist;
                setArtist(artistData);

                const albumsQuery = query(collection(db, 'albums'), where('artistIds', 'array-contains', id));
                const albumsSnap = await getDocs(albumsQuery);
                const albumsData = albumsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Album));
                albumsData.sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());
                setAlbums(albumsData);
                
                const songsQuery = query(collection(db, 'songs'), where('artistIds', 'array-contains', id));
                const songsSnap = await getDocs(songsQuery);
                const songsData = songsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Song));
                songsData.sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());
                setSongs(songsData);

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
    if (!artist) return null;

    return (
        <div className="-mt-8">
            <div className="-mx-4 sm:-mx-6 lg:-mx-8">
                <div
                    className="w-full bg-cover bg-center aspect-video"
                    style={{ backgroundImage: `url(${artist.coverImageUrl || 'https://placehold.co/1600x900/131010/FAF8F1?text=+'})` }}
                />
            </div>
            
            <div className="relative px-4 sm:px-6 lg:px-8 -mt-16 md:-mt-20">
                <div className="max-w-5xl mx-auto flex flex-col items-center text-center">
                    <div className="profile-image-wrapper w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-ac-light dark:border-ac-dark shadow-lg">
                        <img 
                            src={artist.imageUrl || `https://ui-avatars.com/api/?name=${artist.name}&background=random&size=128`} 
                            alt={artist.name}
                            className="profile-image h-full w-full object-cover"
                        />
                    </div>
                    <h1 className="mt-4 text-4xl md:text-5xl font-bold font-serif">{artist.name}</h1>
                    <div className="mt-3 flex flex-wrap justify-center gap-2">
                        {artist.genres.map(genre => (
                            <span key={genre} className="text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full">
                                {genre}
                            </span>
                        ))}
                    </div>
                    <SocialLinks artist={artist} />
                </div>
            </div>

            <div className="pt-8 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                {artist.bio && (
                    <div className="mt-8 max-w-4xl mx-auto text-center">
                        <p className={`text-gray-700 dark:text-gray-300 transition-all duration-300 ${!isBioExpanded ? 'line-clamp-3' : ''}`}>
                            {artist.bio}
                        </p>
                        <button 
                            onClick={() => setIsBioExpanded(!isBioExpanded)}
                            className="text-sm font-semibold text-ac-secondary hover:underline mt-2"
                        >
                            {isBioExpanded ? 'Read less' : 'Read more'}
                        </button>
                    </div>
                )}

                <div className="mt-12">
                    <h2 className="text-3xl font-bold font-serif border-b pb-2 mb-6">Discography</h2>
                    
                    <section>
                        <h3 className="text-2xl font-semibold font-serif mb-4">Albums</h3>
                        <div className="grid grid-cols-2 gap-y-10 sm:grid-cols-3 gap-x-6 lg:grid-cols-4 xl:grid-cols-5 xl:gap-x-8">
                            {albums.map(album => <AlbumCard key={album.id} album={album} />)}
                        </div>
                        {albums.length === 0 && <p className="text-gray-500">No albums found for this artist.</p>}
                    </section>

                    <section className="mt-12">
                        <h3 className="text-2xl font-semibold font-serif mb-4">Songs</h3>
                        <div className="bg-ac-light dark:bg-ac-dark/50 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                                {songs.map(song => (
                                    <li key={song.id}>
                                        <NavLink to={`/song/${song.id}`} className="flex items-center space-x-4 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                            <img 
                                                src={song.coverArtUrl || `https://placehold.co/100x100/131010/FAF8F1?text=${song.title.charAt(0)}`}
                                                alt={song.title}
                                                className="w-12 h-12 rounded-md object-cover flex-shrink-0"
                                            />
                                            <div>
                                                <p className="font-semibold">{song.title}</p>
                                                <p className="text-sm text-gray-500">{new Date(song.releaseDate).getFullYear()}</p>
                                            </div>
                                        </NavLink>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        {songs.length === 0 && <p className="mt-4 text-gray-500">No individual songs found for this artist.</p>}
                    </section>
                </div>
            </div>
        </div>
    );
};

export default ArtistPage;