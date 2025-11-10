import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, NavLink } from 'react-router-dom';
import { collection, query, where, getDocs, limit, orderBy } from '@firebase/firestore';
import { db } from '../services/firebase';
import { UserProfile, Artist, Album, Song } from '../types';
import PageLoader from '../components/common/PageLoader';
import { Search, X, History, Trash2, AlertTriangle } from 'lucide-react';

// Debounce utility
const debounce = <F extends (...args: any[]) => any>(func: F, waitFor: number) => {
  let timeout: number;
  return (...args: Parameters<F>): void => {
    clearTimeout(timeout);
    timeout = window.setTimeout(() => func(...args), waitFor);
  };
};

// LocalStorage helpers
const getSearchHistory = (): string[] => {
    try {
        const history = localStorage.getItem('acapella_search_history');
        return history ? JSON.parse(history) : [];
    } catch (e) {
        return [];
    }
};

const addToSearchHistory = (term: string) => {
    if (!term) return;
    const history = getSearchHistory();
    const newHistory = [term, ...history.filter(item => item.toLowerCase() !== term.toLowerCase())].slice(0, 10);
    localStorage.setItem('acapella_search_history', JSON.stringify(newHistory));
};

const clearSearchHistory = () => {
    localStorage.removeItem('acapella_search_history');
};


interface SearchResults {
    users: UserProfile[];
    artists: Artist[];
    albums: Album[];
    songs: Song[];
}

const SearchPage: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const q = searchParams.get('q') || '';
    
    const [inputValue, setInputValue] = useState(q);
    const [results, setResults] = useState<SearchResults>({ users: [], artists: [], albums: [], songs: [] });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [history, setHistory] = useState<string[]>(getSearchHistory());
    const [showClearConfirm, setShowClearConfirm] = useState(false);

    // Debounced function to update URL search params
    const debouncedSetSearchParams = useCallback(debounce((value) => setSearchParams(value ? { q: value } : {}), 300), [setSearchParams]);

    useEffect(() => {
        setInputValue(q);
    }, [q]);
    
    useEffect(() => {
        const performSearch = async () => {
            if (!q) {
                setResults({ users: [], artists: [], albums: [], songs: [] });
                setLoading(false);
                return;
            }
            
            setLoading(true);
            setError(null);
            
            try {
                const searchTerm = q.toLowerCase();
                const userQuery = query(collection(db, 'users'), where('username', '>=', searchTerm), where('username', '<=', searchTerm + '\uf8ff'), limit(5));
                const artistQuery = query(collection(db, 'artists'), where('name_lowercase', '>=', searchTerm), where('name_lowercase', '<=', searchTerm + '\uf8ff'), orderBy('name_lowercase'), limit(5));
                const albumQuery = query(collection(db, 'albums'), where('title_lowercase', '>=', searchTerm), where('title_lowercase', '<=', searchTerm + '\uf8ff'), orderBy('title_lowercase'), limit(5));
                const songQuery = query(collection(db, 'songs'), where('title_lowercase', '>=', searchTerm), where('title_lowercase', '<=', searchTerm + '\uf8ff'), orderBy('title_lowercase'), limit(5));

                const [userSnap, artistSnap, albumSnap, songSnap] = await Promise.all([
                    getDocs(userQuery),
                    getDocs(artistQuery),
                    getDocs(albumQuery),
                    getDocs(songQuery),
                ]);

                setResults({
                    users: userSnap.docs.map(doc => doc.data() as UserProfile),
                    artists: artistSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Artist)),
                    albums: albumSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Album)),
                    songs: songSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Song)),
                });

            } catch (err) {
                console.error("Search failed:", err);
                setError("An error occurred during the search.");
            } finally {
                setLoading(false);
            }
        };

        performSearch();
    }, [q]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInputValue(value);
        debouncedSetSearchParams(value);
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedValue = inputValue.trim();
        if(trimmedValue) {
          addToSearchHistory(trimmedValue);
          setHistory(getSearchHistory());
        }
        setSearchParams(trimmedValue ? { q: trimmedValue } : {});
    };
    
    const handleHistoryClick = (term: string) => {
        setInputValue(term);
        // No need to add to history here, as it's already there
        setSearchParams({ q: term });
    };

    const handleClearHistory = () => {
        clearSearchHistory();
        setHistory([]);
        setShowClearConfirm(false);
    };

    const ResultSection: React.FC<{ title: string; children: React.ReactNode; count: number }> = ({ title, children, count }) => {
        if (count === 0) return null;
        return (
            <section className="mb-8">
                <h2 className="text-2xl font-bold font-serif border-b pb-2 mb-4">{title}</h2>
                {children}
            </section>
        );
    };

    const totalResults = results.users.length + results.artists.length + results.albums.length + results.songs.length;

    const renderContent = () => {
        if (loading && q) {
            return <div className="mt-8"><PageLoader /></div>;
        }
        if (error) {
            return <div className="text-center py-10 text-ac-danger">{error}</div>;
        }
        if (!q) {
            if (history.length === 0) {
                return <div className="text-center py-10 text-gray-500">Start typing to search for music, artists, and friends.</div>;
            }
            return (
                <div className="mt-8">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold font-serif">Recent Searches</h2>
                        {history.length > 0 && <button onClick={() => setShowClearConfirm(true)} className="text-sm text-ac-danger hover:underline">Clear</button>}
                    </div>
                    <ul className="space-y-2">
                        {history.map((term, index) => (
                            <li key={index} onClick={() => handleHistoryClick(term)} className="flex items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                                <History className="mr-3 h-5 w-5 text-gray-500"/>
                                <span>{term}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            );
        }
        if (totalResults === 0) {
            return (
                <div className="text-center py-10 text-gray-500 mt-8">
                    <p className="text-lg">No results found for "{q}".</p>
                    <p className="text-sm mt-1">Try searching for something else.</p>
                </div>
            );
        }

        return (
            <div className="mt-8">
                <ResultSection title="Users" count={results.users.length}>
                    <div className="space-y-3">
                        {results.users.map(user => (
                            <NavLink to={`/${user.username}`} key={user.uid} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || user.username}`} alt={user.username} className="w-12 h-12 rounded-full object-cover" />
                                <div>
                                    <p className="font-semibold">{user.displayName}</p>
                                    <p className="text-sm text-gray-500">@{user.username}</p>
                                </div>
                            </NavLink>
                        ))}
                    </div>
                </ResultSection>

                <ResultSection title="Artists" count={results.artists.length}>
                    <div className="space-y-3">
                        {results.artists.map(artist => (
                            <NavLink to={`/artist/${artist.id}`} key={artist.id} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                <div className="profile-image-wrapper w-12 h-12 rounded-lg flex-shrink-0">
                                    <img src={artist.imageUrl || `https://ui-avatars.com/api/?name=${artist.name}&background=random`} alt={artist.name} className="profile-image h-full w-full object-cover" />
                                </div>
                                <div><p className="font-semibold">{artist.name}</p></div>
                            </NavLink>
                        ))}
                    </div>
                </ResultSection>

                <ResultSection title="Albums" count={results.albums.length}>
                    <div className="space-y-3">
                        {results.albums.map(album => (
                            <NavLink to={`/album/${album.id}`} key={album.id} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                <img src={album.coverArtUrl || `https://picsum.photos/seed/${album.id}/100/100`} alt={album.title} className="w-12 h-12 rounded-lg object-cover" />
                                <div><p className="font-semibold">{album.title}</p></div>
                            </NavLink>
                        ))}
                    </div>
                </ResultSection>

                <ResultSection title="Songs" count={results.songs.length}>
                   <div className="space-y-2">
                       {results.songs.map(song => (
                            <NavLink to={`/song/${song.id}`} key={song.id} className="p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors block">
                                <p className="font-semibold">{song.title}</p>
                            </NavLink>
                        ))}
                    </div>
                </ResultSection>
            </div>
        );
    };

    return (
        <div>
            <h1 className="text-3xl font-bold font-serif mb-6">Search</h1>
            <form onSubmit={handleSubmit} className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                    type="search"
                    value={inputValue}
                    onChange={handleInputChange}
                    placeholder="Search for artists, albums, songs, users..."
                    className="w-full pl-12 pr-10 py-3 text-lg border-2 border-gray-200 dark:border-gray-700 rounded-full bg-transparent focus:ring-ac-secondary focus:border-ac-secondary transition"
                />
                {inputValue && (
                    <button type="button" onClick={() => { setInputValue(''); setSearchParams({}); }} className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200">
                        <X className="h-5 w-5" />
                    </button>
                )}
            </form>

            {renderContent()}
            
            {showClearConfirm && (
                 <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-ac-light dark:bg-ac-dark rounded-lg shadow-2xl w-full max-w-sm p-6 text-center">
                        <AlertTriangle className="mx-auto h-12 w-12 text-ac-danger mb-4"/>
                        <h3 className="text-lg font-semibold mb-2">Clear Search History?</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">This action cannot be undone and will permanently remove your recent searches.</p>
                        <div className="flex justify-center space-x-4">
                            <button onClick={() => setShowClearConfirm(false)} className="px-6 py-2 border rounded-md">Cancel</button>
                            <button onClick={handleClearHistory} className="px-6 py-2 bg-ac-danger text-white rounded-md">Clear</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchPage;
