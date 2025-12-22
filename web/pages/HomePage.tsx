
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { db } from '../services/firebase';
import { collection, query, where, getDocs, orderBy, limit, Timestamp, collectionGroup, documentId } from '@firebase/firestore';
import { UserProfile, Review, Album, Song, Artist } from '../types';
import PageLoader from '../components/common/PageLoader';
import { Music, Star, Users, ChevronLeft, ChevronRight, Headphones, MessageSquareText } from 'lucide-react';

// --- Reusable Components ---

const SectionTitle: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
    <div className="mb-6">
        <h2 className="text-3xl font-bold text-ac-dark dark:text-ac-light font-serif">{title}</h2>
        {subtitle && <p className="text-ac-primary/80 dark:text-ac-light/70">{subtitle}</p>}
    </div>
);

const Carousel: React.FC<{ items: any[]; renderItem: (item: any) => React.ReactNode }> = ({ items, renderItem }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    if (!items || items.length === 0) return null;

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const { scrollLeft, clientWidth } = scrollRef.current;
            const scrollTo = direction === 'left' ? scrollLeft - clientWidth * 0.8 : scrollLeft + clientWidth * 0.8;
            scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
        }
    };

    return (
        <div className="relative group">
            <button onClick={() => scroll('left')} className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/80 dark:bg-black/80 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity -translate-x-4">
                <ChevronLeft />
            </button>
            <div ref={scrollRef} className="flex space-x-6 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
                {items.map((item) => (
                    <div key={item.id} className="flex-shrink-0 w-40 sm:w-48">
                        {renderItem(item)}
                    </div>
                ))}
            </div>
            <button onClick={() => scroll('right')} className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/80 dark:bg-black/80 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity translate-x-4">
                <ChevronRight />
            </button>
        </div>
    );
};

// --- Guest Landing Page ---

const GuestLandingPage: React.FC = () => {
    const [featuredAlbums, setFeaturedAlbums] = useState<Album[]>([]);
    const [loadingFeatured, setLoadingFeatured] = useState(true);

    useEffect(() => {
        const fetchFeatured = async () => {
            try {
                const albumsQuery = query(collection(db, 'albums'), orderBy('reviewCount', 'desc'), limit(6));
                const albumsSnap = await getDocs(albumsQuery);
                setFeaturedAlbums(albumsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Album)));
            } catch (e) {
                console.error("Failed to fetch featured albums for landing page:", e);
            } finally {
                setLoadingFeatured(false);
            }
        };
        fetchFeatured();
    }, []);

    return (
        <div className="bg-ac-light dark:bg-ac-dark text-ac-dark dark:text-ac-light -mx-4 sm:-mx-6 lg:-mx-8">
            {/* Hero Section */}
            <section className="relative overflow-hidden pt-24 pb-32">
                <div className="absolute inset-0 opacity-10 dark:opacity-5 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 transform -skew-y-6 scale-125">
                    {featuredAlbums.concat(featuredAlbums).slice(0, 24).map((album, i) => (
                        <div key={i} className="aspect-square bg-gray-200 dark:bg-gray-800">
                            {album?.coverArtUrl && <img src={album.coverArtUrl} className="w-full h-full object-cover grayscale" alt=""/>}
                        </div>
                    ))}
                </div>
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
                    <h1 className="text-5xl md:text-7xl font-bold font-serif text-ac-dark dark:text-ac-light">
                        Your Personal Music Diary.
                    </h1>
                    <p className="mt-6 text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        Track your listening habits. Rate and review albums. Share your taste and discover your next favorite artist with a passionate community.
                    </p>
                    <NavLink to="/login" className="mt-10 inline-block bg-ac-primary dark:bg-ac-secondary text-white font-bold text-lg px-8 py-4 rounded-lg hover:bg-ac-primary/90 dark:hover:bg-ac-secondary/90 transition-transform hover:scale-105">
                        Start Listening for Free
                    </NavLink>
                </div>
            </section>
            
            {/* Featured Albums Section */}
            {!loadingFeatured && featuredAlbums.length > 0 && (
                 <section className="py-16 bg-white dark:bg-black/50">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <h2 className="text-4xl font-bold font-serif">What People Are Reviewing</h2>
                            <p className="mt-2 text-gray-500 dark:text-gray-400">Join the conversation on today's most talked-about albums.</p>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
                            {featuredAlbums.map(album => (
                                <AlbumCard key={album.id} album={album} />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* How It Works Section */}
            <section className="py-20">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold font-serif">A Home for Your Music Life</h2>
                        <p className="mt-2 text-gray-500 dark:text-gray-400">Keep track of every tune and story.</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-12 text-center">
                        <div className="flex flex-col items-center">
                            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-ac-secondary/20 text-ac-secondary mb-4">
                                <Headphones className="w-8 h-8"/>
                            </div>
                            <h3 className="text-xl font-bold font-serif mb-2">Listen & Log</h3>
                            <p className="text-gray-600 dark:text-gray-400">As you listen to songs and albums, add them to your diary. Build a rich library of your listening history.</p>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-ac-secondary/20 text-ac-secondary mb-4">
                               <MessageSquareText className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold font-serif mb-2">Rate & Review</h3>
                            <p className="text-gray-600 dark:text-gray-400">Give a 5-star rating to quickly remember what you thought. Write detailed reviews to share your opinions.</p>
                        </div>
                        <div className="flex flex-col items-center">
                             <div className="flex items-center justify-center h-16 w-16 rounded-full bg-ac-secondary/20 text-ac-secondary mb-4">
                                <Users className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold font-serif mb-2">Share & Discover</h3>
                            <p className="text-gray-600 dark:text-gray-400">Follow friends and curators to find your next favorite artist and see what they're enjoying.</p>
                        </div>
                    </div>
                </div>
            </section>
            
            {/* Final CTA Section */}
            <section className="py-20 bg-ac-primary/90 dark:bg-ac-secondary/90 text-white">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-4xl font-bold font-serif">Join a Community of Music Nerds</h2>
                    <p className="mt-4 text-lg max-w-2xl mx-auto opacity-90">
                        Sign up today to start logging, reviewing, and connecting with fellow music fans from around the world.
                    </p>
                    <NavLink to="/login" className="mt-8 inline-block bg-white text-ac-primary dark:text-ac-secondary font-bold text-lg px-8 py-4 rounded-lg hover:bg-gray-200 transition-colors">
                        Create Your Free Account
                    </NavLink>
                </div>
            </section>
        </div>
    );
};

// --- Authenticated Home Page ---

type ActivityItem = Review & { _type: 'review' };
type ArtistsMap = { [id: string]: Artist };

const ActivityFeedItem: React.FC<{ activity: ActivityItem }> = ({ activity }) => (
    <div className="p-4 border rounded-lg flex flex-col h-full bg-white dark:bg-gray-800/50 shadow-sm">
        <div className="flex items-start space-x-3 mb-3">
            <NavLink to={`/${activity.entityUsername}`}>
                 <img src={activity.userPhotoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(activity.userDisplayName)}&background=random`} alt={activity.userDisplayName} className="w-10 h-10 rounded-full object-cover" />
            </NavLink>
            <div>
                <p className="text-sm">
                    <NavLink to={`/${activity.entityUsername}`} className="font-bold hover:underline inline-flex items-center">
                        {activity.userDisplayName}
                    </NavLink>
                    {' reviewed '} 
                    <NavLink to={`/${activity.entityType}/${activity.entityId}`} className="font-bold hover:underline">{activity.entityTitle}</NavLink>
                </p>
                <div className="flex items-center">
                    {[...Array(5)].map((_, i) => <Star key={i} size={14} className={` ${i < activity.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />)}
                </div>
            </div>
        </div>
        <div className="pl-13 flex-grow">
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-4 italic">"{activity.reviewText}"</p>
        </div>
        <NavLink to={`/review/${activity.id}`} className="text-xs text-gray-500 hover:underline self-end mt-2">
            View full review
        </NavLink>
    </div>
);

const AlbumCard: React.FC<{ album: Album; artist?: Artist }> = ({ album, artist }) => (
    <NavLink to={`/album/${album.id}`} className="group block">
        <div className="aspect-square w-full overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-800">
            <img src={album.coverArtUrl} alt={album.title} className="h-full w-full object-cover object-center group-hover:opacity-75 transition-opacity" />
        </div>
        <h3 className="mt-2 font-semibold text-gray-900 dark:text-white truncate">{album.title}</h3>
        {artist && <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{artist.name}</p>}
    </NavLink>
);

const SongCard: React.FC<{ song: Song; artist?: Artist }> = ({ song, artist }) => (
     <NavLink to={`/song/${song.id}`} className="group block">
        <div className="aspect-square w-full overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-800">
            <img src={song.coverArtUrl || `https://placehold.co/100x100/131010/FAF8F1?text=${encodeURIComponent(song.title.charAt(0)) || '🎵'}`} alt={song.title} className="h-full w-full object-cover object-center group-hover:opacity-75 transition-opacity" />
        </div>
        <h3 className="mt-2 font-semibold text-gray-900 dark:text-white truncate">{song.title}</h3>
        {artist && <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{artist.name}</p>}
    </NavLink>
);

const ArtistCard: React.FC<{ artist: Artist }> = ({ artist }) => (
    <NavLink to={`/artist/${artist.id}`} className="group flex flex-col items-center text-center">
         <div className="profile-image-wrapper w-32 h-32 rounded-full shadow-lg group-hover:scale-105 transition-transform">
            <img src={artist.imageUrl} alt={artist.name} className="profile-image h-full w-full object-cover" />
        </div>
        <h3 className="mt-3 font-bold text-gray-900 dark:text-white truncate">{artist.name}</h3>
    </NavLink>
);


const AuthenticatedHomePage: React.FC = () => {
    const { userProfile } = useAuth();
    const [activityFeed, setActivityFeed] = useState<ActivityItem[]>([]);
    const [newReleases, setNewReleases] = useState<Album[]>([]);
    const [trendingSongs, setTrendingSongs] = useState<Song[]>([]);
    const [popularArtists, setPopularArtists] = useState<Artist[]>([]);
    const [artistsMap, setArtistsMap] = useState<ArtistsMap>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            if (!userProfile) return;
            setLoading(true);
            try {
                // Step 1: Fetch primary content and following list in parallel
                const oneWeekAgo = new Date();
                oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                const oneWeekAgoTimestamp = Timestamp.fromDate(oneWeekAgo);

                const followingQuery = query(collection(db, 'follows'), where('followerId', '==', userProfile.uid));
                const newReleasesQuery = query(collection(db, 'albums'), orderBy('releaseDate', 'desc'), limit(10));
                const trendingSongsQuery = query(collection(db, 'songs'), orderBy('reviewCount', 'desc'), limit(10));
                const popularArtistsQuery = query(collection(db, 'artists'), orderBy('name'), limit(10)); // Placeholder for a real popularity metric

                const [followingSnap, releasesSnap, songsSnap, artistsSnap] = await Promise.all([
                    getDocs(followingQuery),
                    getDocs(newReleasesQuery),
                    getDocs(trendingSongsQuery),
                    getDocs(popularArtistsQuery),
                ]);

                const releasesData = releasesSnap.docs.map(doc => ({id: doc.id, ...doc.data()}) as Album);
                const songsData = songsSnap.docs.map(doc => ({id: doc.id, ...doc.data()}) as Song);
                setNewReleases(releasesData);
                setTrendingSongs(songsData);
                setPopularArtists(artistsSnap.docs.map(doc => ({id: doc.id, ...doc.data()}) as Artist));

                // Step 2: Fetch activity feed if user is following anyone
                const followingIds = followingSnap.docs.map(doc => doc.data().followingId);
                if (followingIds.length > 0) {
                     const reviewsQuery = query(
                        collectionGroup(db, 'reviews'),
                        where('userId', 'in', followingIds),
                        where('createdAt', '>=', oneWeekAgoTimestamp),
                        orderBy('createdAt', 'desc')
                    );
                    const reviewsSnap = await getDocs(reviewsQuery);
                    const feed = reviewsSnap.docs
                        .map(doc => ({ id: doc.id, ...(doc.data() as Review), _type: 'review' } as ActivityItem))
                        .filter(item => item.reviewText && item.reviewText.trim() !== ''); // Only show items with written reviews
                    setActivityFeed(feed);
                }

                // Step 3: Aggregate all needed artist IDs and fetch them
                const artistIds = new Set<string>();
                releasesData.forEach(album => album.artistIds.forEach(id => artistIds.add(id)));
                songsData.forEach(song => song.artistIds.forEach(id => artistIds.add(id)));
                if (artistIds.size > 0) {
                    const artistsQuery = query(collection(db, 'artists'), where(documentId(), 'in', Array.from(artistIds)));
                    const artistsDataSnap = await getDocs(artistsQuery);
                    const newArtistsMap: ArtistsMap = {};
                    artistsDataSnap.forEach(doc => newArtistsMap[doc.id] = {id: doc.id, ...doc.data()} as Artist);
                    setArtistsMap(newArtistsMap);
                }

            } catch (e) {
                console.error("Failed to load homepage data:", e);
                setError("Could not load your feed. It might be a network issue or missing database indexes.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [userProfile]);

    if (loading) return <PageLoader />;
    if (error) return <div className="text-center text-ac-danger py-10">{error}</div>;

    return (
        <div className="space-y-12">
            <section>
                <SectionTitle title="From Your Network" />
                {activityFeed.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                       {activityFeed.map(activity => <ActivityFeedItem key={activity.id} activity={activity} />)}
                    </div>
                ) : (
                    <div className="text-center py-10 border-2 border-dashed rounded-lg text-gray-400 dark:text-gray-600">
                        <Users className="mx-auto h-8 w-8" />
                        <p className="mt-2">Follow other users to see their reviews here.</p>
                        <NavLink to="/curators" className="text-sm font-semibold text-ac-secondary hover:underline mt-1">Find Curators to follow</NavLink>
                    </div>
                )}
            </section>
            
             <section>
                <SectionTitle title="New Releases" />
                <Carousel items={newReleases} renderItem={(album: Album) => <AlbumCard album={album} artist={artistsMap[album.artistIds[0]]}/> } />
             </section>

             <section>
                <SectionTitle title="Trending Songs" />
                <Carousel items={trendingSongs} renderItem={(song: Song) => <SongCard song={song} artist={artistsMap[song.artistIds[0]]}/>} />
             </section>
             
             <section>
                <SectionTitle title="Popular Artists" />
                <Carousel items={popularArtists} renderItem={(artist: Artist) => <ArtistCard artist={artist} />} />
             </section>
        </div>
    );
};

const HomePage: React.FC = () => {
    const { currentUser, loading } = useAuth();

    if (loading) {
        return <PageLoader />;
    }

    return currentUser ? <AuthenticatedHomePage /> : <GuestLandingPage />;
};

export default HomePage;
