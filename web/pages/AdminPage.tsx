import React, { useState, useEffect, useCallback, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { db } from '../services/firebase';
import { collection, query, where, getDocs, doc, updateDoc, writeBatch, Timestamp, addDoc, serverTimestamp, deleteDoc, orderBy } from 'firebase/firestore';
import { Role, AdminApplication, Artist, Album, Song } from '../types';
import { X, Plus, Edit, Trash2, Link as LinkIcon } from 'lucide-react';

const GENRES = [
  'Afrobeat',
  'Afrobeats',
  'Alternative',
  'Alternative Rock',
  'Ambient',
  'Bhangra',
  'Bluegrass',
  'Blues',
  'Bollywood',
  'Chillwave',
  'Classical',
  'Contemporary R&B',
  'Country',
  'Cumbia',
  'Dancehall',
  'Disco',
  'Drum and Bass',
  'Dubstep',
  'Electro-pop',
  'Electronic',
  'Electronic Dance Music (EDM)',
  'Flamenco',
  'Folk',
  'Funk',
  'Garage',
  'Gospel',
  'Grime',
  'Hip-Hop',
  'Hip-Hop/Rap',
  'House',
  'Hyperpop',
  'Indie',
  'Industrial',
  'J-Pop',
  'Jazz',
  'K-Pop',
  'Latin',
  'Lo-fi',
  'Merengue',
  'Metal',
  'New Wave',
  'Opera',
  'Pop',
  'Punk',
  'R&B',
  'R&B/Soul',
  'Reggae',
  'Rock',
  'Salsa',
  'Ska',
  'Soul',
  'Soundtrack',
  'Sufi',
  'Synth-pop',
  'Techno',
  'Trance',
  'Trap',
  'Trap Soul',
  'Vaporwave',
  'World',
  'Zouk',
].sort();


interface ApplicationWithId extends AdminApplication {
  docId: string;
}

const ApplicationReview: React.FC = () => {
    const [applications, setApplications] = useState<ApplicationWithId[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchApplications = useCallback(async () => {
        setLoading(true);
        try {
            const q = query(collection(db, "adminApplications"), where("status", "==", "pending"));
            const querySnapshot = await getDocs(q);
            const pendingApps = querySnapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() } as ApplicationWithId));
            setApplications(pendingApps);
        } catch (err) {
            setError("Failed to fetch applications.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);
    
    useEffect(() => {
        fetchApplications();
    }, [fetchApplications]);

    const handleApplication = async (app: ApplicationWithId, newStatus: 'approved' | 'rejected') => {
        try {
            const batch = writeBatch(db);
            const appRef = doc(db, "adminApplications", app.docId);
            batch.update(appRef, { status: newStatus });

            if (newStatus === 'approved') {
                const userRef = doc(db, "users", app.userId);
                batch.update(userRef, { role: Role.ADMIN });
            }
            await batch.commit();
            fetchApplications();
        } catch (err) {
            setError(`Failed to ${newStatus === 'approved' ? 'approve' : 'reject'} application.`);
            console.error(err);
        }
    };

    if (loading) return <div>Loading applications...</div>;
    if (error) return <div className="text-ac-danger">{error}</div>;

    return (
        <div>
            <h2 className="text-2xl font-bold font-serif mb-4">Admin Applications</h2>
            {applications.length === 0 ? (
                <p>No pending applications.</p>
            ) : (
                <div className="space-y-4">
                    {applications.map(app => (
                        <div key={app.docId} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-semibold">{app.userName || app.userEmail}</p>
                                    <p className="text-sm text-gray-500">{app.userEmail}</p>
                                </div>
                                <div className="text-sm text-gray-400">
                                    {app.submittedAt instanceof Timestamp && app.submittedAt.toDate().toLocaleDateString()}
                                </div>
                            </div>
                            <p className="mt-4 text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">{app.reason}</p>
                            <div className="mt-4 flex space-x-2">
                                <button onClick={() => handleApplication(app, 'approved')} className="px-3 py-1 text-sm bg-ac-secondary text-white rounded-md hover:bg-ac-secondary/90">Approve</button>
                                <button onClick={() => handleApplication(app, 'rejected')} className="px-3 py-1 text-sm bg-ac-danger text-white rounded-md hover:bg-ac-danger/90">Reject</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// Reusable Multi-Select Combobox Component
const MultiSelectCombobox: React.FC<{
    options: { id: string; name: string }[];
    selectedIds: string[];
    onChange: (ids: string[]) => void;
    placeholder: string;
}> = ({ options, selectedIds, onChange, placeholder }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleOutsideClick = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, []);

    const toggleSelection = (id: string) => {
        const newSelectedIds = selectedIds.includes(id)
            ? selectedIds.filter(selectedId => selectedId !== id)
            : [...selectedIds, id];
        onChange(newSelectedIds);
    };

    const filteredOptions = options.filter(option => 
        option.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedItems = options.filter(option => selectedIds.includes(option.id));

    return (
        <div className="relative" ref={containerRef}>
            <div className="flex flex-wrap gap-2 p-2 border rounded bg-transparent dark:border-gray-600 min-h-[42px] cursor-text" onClick={() => setIsOpen(true)}>
                {selectedItems.map(item => (
                    <span key={item.id} className="flex items-center bg-ac-secondary/20 text-ac-secondary text-sm font-medium px-2 py-1 rounded-full">
                        {item.name}
                        <button type="button" onClick={(e) => { e.stopPropagation(); toggleSelection(item.id); }} className="ml-2 text-ac-secondary hover:text-ac-danger">
                            <X size={14} />
                        </button>
                    </span>
                ))}
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => setIsOpen(true)}
                    placeholder={selectedItems.length === 0 ? placeholder : ''}
                    className="flex-grow bg-transparent outline-none p-1"
                />
            </div>
            {isOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    <ul>
                        {filteredOptions.map(option => (
                            <li key={option.id} onClick={() => toggleSelection(option.id)} className="px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between">
                                {option.name}
                                {selectedIds.includes(option.id) && <X size={16} className="text-ac-secondary"/>}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

const ManageContent: React.FC<{
    collectionName: 'songs' | 'albums' | 'artists',
    title: string,
    FormComponent: React.FC<any>,
    allArtists?: Artist[],
    allAlbums?: Album[],
    allSongs?: Song[]
}> = ({ collectionName, title, FormComponent, ...props }) => {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [currentItem, setCurrentItem] = useState<any | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const orderByField = collectionName === 'artists' ? 'name' : 'title';
        const q = query(collection(db, collectionName), orderBy(orderByField));
        const snapshot = await getDocs(q);
        setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
    }, [collectionName]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleEdit = (item: any) => {
        setCurrentItem(item);
        setShowModal(true);
    };

    const handleAddNew = () => {
        setCurrentItem(null);
        setShowModal(true);
    };
    
    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
            await deleteDoc(doc(db, collectionName, id));
            fetchData();
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setCurrentItem(null);
        fetchData();
    };

    if (loading) return <div>Loading {title}...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold font-serif">{title}</h2>
                <button onClick={handleAddNew} className="flex items-center px-3 py-1.5 text-sm bg-ac-primary text-white rounded-md hover:bg-ac-primary/90">
                    <Plus size={16} className="mr-1" /> Add New
                </button>
            </div>
            <div className="bg-white dark:bg-ac-dark/50 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {items.map(item => (
                        <li key={item.id} className="p-4 flex justify-between items-center">
                            <div>
                                <p className="font-semibold">{item.title || item.name}</p>
                                <p className="text-sm text-gray-500">{item.id}</p>
                            </div>
                            <div className="flex space-x-2 items-center">
                                <NavLink to={`/${collectionName.slice(0, -1)}/${item.id}`} target="_blank" rel="noopener noreferrer" title="View on site" className="p-2 text-gray-500 hover:text-ac-primary">
                                    <LinkIcon size={16}/>
                                </NavLink>
                                <button onClick={() => handleEdit(item)} title="Edit" className="p-2 text-gray-500 hover:text-ac-secondary"><Edit size={16}/></button>
                                <button onClick={() => handleDelete(item.id)} title="Delete" className="p-2 text-gray-500 hover:text-ac-danger"><Trash2 size={16}/></button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
            {showModal && <FormComponent item={currentItem} onClose={handleCloseModal} {...props}/>}
        </div>
    );
};

const ArtistFormModal: React.FC<{ item: Artist | null, onClose: () => void }> = ({ item, onClose }) => {
    const [formData, setFormData] = useState({
        name: item?.name || '',
        bio: item?.bio || '',
        imageUrl: item?.imageUrl || '',
        coverImageUrl: item?.coverImageUrl || '',
        genres: item?.genres || [],
        socials: item?.socials ? Object.entries(item.socials).map(([platform, url]) => ({ platform, url })) : [{ platform: '', url: '' }],
        platformLinks: {
            spotify: item?.platformLinks?.spotify || '',
            appleMusic: item?.platformLinks?.appleMusic || '',
            youtubeMusic: item?.platformLinks?.youtubeMusic || '',
        },
    });
    const [loading, setLoading] = useState(false);
    const [genreInput, setGenreInput] = useState('');
    const [genreSuggestions, setGenreSuggestions] = useState<string[]>([]);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePlatformLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, platformLinks: { ...prev.platformLinks, [name]: value } }));
    };

    const handleGenreInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setGenreInput(value);
        if (value) {
            setGenreSuggestions(GENRES.filter(g => g.toLowerCase().startsWith(value.toLowerCase()) && !formData.genres.includes(g)));
        } else {
            setGenreSuggestions([]);
        }
    }

    const addGenre = (genre: string) => {
        if (genre && !formData.genres.includes(genre)) {
            setFormData(prev => ({ ...prev, genres: [...prev.genres, genre] }));
        }
        setGenreInput('');
        setGenreSuggestions([]);
    };

    const removeGenre = (genreToRemove: string) => {
        setFormData(prev => ({...prev, genres: prev.genres.filter(g => g !== genreToRemove)}));
    };
    
    const handleSocialChange = (index: number, field: 'platform' | 'url', value: string) => {
        const newSocials = [...formData.socials];
        newSocials[index][field] = value;
        setFormData(prev => ({ ...prev, socials: newSocials }));
    };

    const addSocialField = () => {
        setFormData(prev => ({ ...prev, socials: [...prev.socials, { platform: '', url: '' }] }));
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        
        const dataToSave = {
            name: formData.name,
            name_lowercase: formData.name.toLowerCase(),
            imageUrl: formData.imageUrl,
            coverImageUrl: formData.coverImageUrl,
            genres: formData.genres,
            bio: formData.bio,
            platformLinks: formData.platformLinks,
            socials: formData.socials.reduce((acc, { platform, url }) => {
                if (platform && url) acc[platform.toLowerCase()] = url;
                return acc;
            }, {} as Record<string, string>),
        };
        
        if (item) {
            await updateDoc(doc(db, 'artists', item.id), dataToSave);
        } else {
            await addDoc(collection(db, 'artists'), dataToSave);
        }
        
        setLoading(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-ac-light dark:bg-ac-dark rounded-lg shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold font-serif">{item ? 'Edit Artist' : 'Add New Artist'}</h3>
                    <button onClick={onClose}><X/></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="artistName" className="block text-sm font-medium mb-1">Name</label>
                        <input id="artistName" name="name" value={formData.name} onChange={handleChange} required className="w-full p-2 border rounded bg-transparent dark:border-gray-600"/>
                    </div>
                    <div>
                        <label htmlFor="imageUrl" className="block text-sm font-medium mb-1">Artist Image URL</label>
                         <div className="flex items-center space-x-4">
                            <img src={formData.imageUrl || `https://ui-avatars.com/api/?name=${formData.name || 'A'}`} alt="preview" className="w-20 h-20 rounded-md object-cover"/>
                            <input type="url" id="imageUrl" name="imageUrl" value={formData.imageUrl} onChange={handleChange} placeholder="https://..." required className="w-full p-2 border rounded bg-transparent dark:border-gray-600"/>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="coverImageUrl" className="block text-sm font-medium mb-1">Artist Cover Image URL (16:9)</label>
                        <div className="flex flex-col space-y-2">
                             <input 
                                id="coverImageUrl" 
                                name="coverImageUrl" 
                                type="url" 
                                value={formData.coverImageUrl} 
                                onChange={handleChange} 
                                placeholder="https://..." 
                                className="w-full p-2 border rounded bg-transparent dark:border-gray-600"
                            />
                            {formData.coverImageUrl && (
                                <img 
                                    src={formData.coverImageUrl} 
                                    alt="cover preview" 
                                    className="w-full aspect-video rounded-md object-cover bg-gray-200 dark:bg-gray-700"
                                />
                            )}
                        </div>
                    </div>
                    <div>
                        <label htmlFor="bio" className="block text-sm font-medium mb-1">Bio</label>
                        <textarea id="bio" name="bio" rows={4} value={formData.bio} onChange={handleChange} placeholder="Artist biography..." className="w-full p-2 border rounded bg-transparent dark:border-gray-600"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Genres</label>
                        <div className="flex flex-wrap gap-2 p-2 border rounded bg-transparent dark:border-gray-600 min-h-[40px]">
                            {formData.genres.map(genre => (
                                <span key={genre} className="flex items-center bg-ac-secondary/20 text-ac-secondary text-sm font-medium px-2 py-1 rounded-full">
                                    {genre}
                                    <button type="button" onClick={() => removeGenre(genre)} className="ml-2 text-ac-secondary hover:text-ac-danger">
                                        <X size={14} />
                                    </button>
                                </span>
                            ))}
                        </div>
                        <div className="relative mt-2">
                           <input 
                                value={genreInput}
                                onChange={handleGenreInputChange}
                                placeholder="Add a genre..."
                                className="w-full p-2 border rounded bg-transparent dark:border-gray-600"
                            />
                            {genreSuggestions.length > 0 && (
                                <ul className="absolute z-10 w-full bg-white dark:bg-gray-800 border dark:border-gray-600 rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg">
                                    {genreSuggestions.map(suggestion => (
                                        <li key={suggestion} onClick={() => addGenre(suggestion)} className="px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">
                                            {suggestion}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm font-medium mb-1">Platform Links</label>
                        <div className="space-y-3">
                             <div>
                                <label htmlFor="artistSpotify" className="sr-only">Spotify URL</label>
                                <input id="artistSpotify" name="spotify" type="url" value={formData.platformLinks.spotify} onChange={handlePlatformLinkChange} placeholder="Spotify URL" className="w-full p-2 border rounded bg-transparent dark:border-gray-600"/>
                             </div>
                             <div>
                                <label htmlFor="artistAppleMusic" className="sr-only">Apple Music URL</label>
                                <input id="artistAppleMusic" name="appleMusic" type="url" value={formData.platformLinks.appleMusic} onChange={handlePlatformLinkChange} placeholder="Apple Music URL" className="w-full p-2 border rounded bg-transparent dark:border-gray-600"/>
                             </div>
                             <div>
                                <label htmlFor="artistYoutubeMusic" className="sr-only">YouTube Music URL</label>
                                <input id="artistYoutubeMusic" name="youtubeMusic" type="url" value={formData.platformLinks.youtubeMusic} onChange={handlePlatformLinkChange} placeholder="YouTube Music URL" className="w-full p-2 border rounded bg-transparent dark:border-gray-600"/>
                             </div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Social Links</label>
                        <div className="space-y-2">
                            {formData.socials.map((social, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <input value={social.platform} onChange={e => handleSocialChange(index, 'platform', e.target.value)} placeholder="Platform (e.g. Twitter)" className="w-1/3 p-2 border rounded bg-transparent dark:border-gray-600"/>
                                    <input value={social.url} onChange={e => handleSocialChange(index, 'url', e.target.value)} type="url" placeholder="URL" className="flex-grow p-2 border rounded bg-transparent dark:border-gray-600"/>
                                </div>
                            ))}
                            <button type="button" onClick={addSocialField} className="text-sm text-ac-primary dark:text-ac-secondary font-semibold">+ Add Link</button>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-ac-primary text-white rounded disabled:bg-gray-400">
                            {loading ? 'Saving...' : 'Save Artist'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Fix: Add definition for AlbumFormModal
const AlbumFormModal: React.FC<{
    item: Album | null,
    onClose: () => void,
    allArtists: (Artist & { id: string })[],
    allSongs: (Song & { id: string })[]
}> = ({ item, onClose, allArtists, allSongs }) => {
    const [formData, setFormData] = useState({
        title: item?.title || '',
        releaseDate: item?.releaseDate || '',
        coverArtUrl: item?.coverArtUrl || '',
        artistIds: item?.artistIds || [],
        tracklist: item?.tracklist || [],
        genre: item?.genre || '',
        platformLinks: {
            spotify: item?.platformLinks?.spotify || '',
            appleMusic: item?.platformLinks?.appleMusic || '',
            youtubeMusic: item?.platformLinks?.youtubeMusic || '',
        },
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePlatformLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, platformLinks: { ...prev.platformLinks, [name]: value } }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        
        const dataToSave = {
            ...formData,
            title_lowercase: formData.title.toLowerCase(),
        };
        
        if (item) {
            await updateDoc(doc(db, 'albums', item.id), dataToSave);
        } else {
            await addDoc(collection(db, 'albums'), dataToSave);
        }
        
        setLoading(false);
        onClose();
    };

    const artistOptions = allArtists.map(a => ({ id: a.id, name: a.name }));
    const songOptions = allSongs.map(s => ({ id: s.id, name: s.title }));

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-ac-light dark:bg-ac-dark rounded-lg shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold font-serif">{item ? 'Edit Album' : 'Add New Album'}</h3>
                    <button onClick={onClose}><X/></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Title</label>
                        <input name="title" value={formData.title} onChange={handleChange} required className="w-full p-2 border rounded bg-transparent dark:border-gray-600"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Artists</label>
                        <MultiSelectCombobox
                            options={artistOptions}
                            selectedIds={formData.artistIds}
                            onChange={(ids) => setFormData(prev => ({ ...prev, artistIds: ids }))}
                            placeholder="Select artists..."
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Release Date</label>
                            <input name="releaseDate" type="date" value={formData.releaseDate} onChange={handleChange} required className="w-full p-2 border rounded bg-transparent dark:border-gray-600"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Genre</label>
                            <select name="genre" value={formData.genre} onChange={handleChange} required className="w-full p-2 border rounded bg-transparent dark:border-gray-600 dark:bg-gray-800">
                                <option value="">Select Genre</option>
                                {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Cover Art URL</label>
                        <div className="flex items-center space-x-4">
                            <img src={formData.coverArtUrl || `https://placehold.co/100x100/2d0b4c/ffffff?text=${formData.title.charAt(0) || 'A'}`} alt="preview" className="w-20 h-20 rounded-md object-cover"/>
                            <input type="url" name="coverArtUrl" value={formData.coverArtUrl} onChange={handleChange} placeholder="https://..." required className="w-full p-2 border rounded bg-transparent dark:border-gray-600"/>
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm font-medium mb-1">Tracklist</label>
                        <MultiSelectCombobox
                            options={songOptions}
                            selectedIds={formData.tracklist}
                            onChange={(ids) => setFormData(prev => ({ ...prev, tracklist: ids }))}
                            placeholder="Select songs..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Platform Links</label>
                        <div className="space-y-3">
                             <input name="spotify" type="url" value={formData.platformLinks.spotify} onChange={handlePlatformLinkChange} placeholder="Spotify URL" className="w-full p-2 border rounded bg-transparent dark:border-gray-600"/>
                             <input name="appleMusic" type="url" value={formData.platformLinks.appleMusic} onChange={handlePlatformLinkChange} placeholder="Apple Music URL" className="w-full p-2 border rounded bg-transparent dark:border-gray-600"/>
                             <input name="youtubeMusic" type="url" value={formData.platformLinks.youtubeMusic} onChange={handlePlatformLinkChange} placeholder="YouTube Music URL" className="w-full p-2 border rounded bg-transparent dark:border-gray-600"/>
                        </div>
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-ac-primary text-white rounded disabled:bg-gray-400">
                            {loading ? 'Saving...' : 'Save Album'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Fix: Add definition for SongFormModal
const SongFormModal: React.FC<{
    item: Song | null,
    onClose: () => void,
    allArtists: (Artist & { id: string })[],
    allAlbums: (Album & { id: string })[]
}> = ({ item, onClose, allArtists, allAlbums }) => {
    const initialCredits = item?.credits ? Object.entries(item.credits).map(([role, names]) => ({ role, names: names.join(', ') })) : [{ role: '', names: '' }];
    const [formData, setFormData] = useState({
        title: item?.title || '',
        artistIds: item?.artistIds || [],
        albumId: item?.albumId || '',
        duration: item?.duration || 0,
        releaseDate: item?.releaseDate || '',
        genre: item?.genre || '',
        credits: initialCredits,
        coverArtUrl: item?.coverArtUrl || '',
        platformLinks: {
            spotify: item?.platformLinks?.spotify || '',
            appleMusic: item?.platformLinks?.appleMusic || '',
            youtubeMusic: item?.platformLinks?.youtubeMusic || '',
        },
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const valueToSet = name === 'duration' ? parseInt(value, 10) : value;
        setFormData(prev => ({ ...prev, [name]: valueToSet }));
    };

    const handlePlatformLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, platformLinks: { ...prev.platformLinks, [name]: value } }));
    };

    const handleCreditChange = (index: number, field: 'role' | 'names', value: string) => {
        const newCredits = [...formData.credits];
        newCredits[index][field] = value;
        setFormData(prev => ({ ...prev, credits: newCredits }));
    };

    const addCreditField = () => {
        setFormData(prev => ({ ...prev, credits: [...prev.credits, { role: '', names: '' }] }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        
        const creditsObject = formData.credits.reduce((acc, { role, names }) => {
            if (role && names) {
                acc[role] = names.split(',').map(name => name.trim());
            }
            return acc;
        }, {} as Record<string, string[]>);
        
        const dataToSave = {
            title: formData.title,
            title_lowercase: formData.title.toLowerCase(),
            artistIds: formData.artistIds,
            albumId: formData.albumId,
            duration: formData.duration,
            releaseDate: formData.releaseDate,
            genre: formData.genre,
            credits: creditsObject,
            coverArtUrl: formData.coverArtUrl,
            platformLinks: formData.platformLinks,
        };
        
        if (item) {
            await updateDoc(doc(db, 'songs', item.id), dataToSave);
        } else {
            await addDoc(collection(db, 'songs'), { ...dataToSave, reviewCount: 0 });
        }
        
        setLoading(false);
        onClose();
    };

    const artistOptions = allArtists.map(a => ({ id: a.id, name: a.name }));
    const albumOptions = allAlbums.map(a => ({ id: a.id, name: a.title }));

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-ac-light dark:bg-ac-dark rounded-lg shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold font-serif">{item ? 'Edit Song' : 'Add New Song'}</h3>
                    <button onClick={onClose}><X/></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Title</label>
                        <input name="title" value={formData.title} onChange={handleChange} required className="w-full p-2 border rounded bg-transparent dark:border-gray-600"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Cover Art URL (1:1)</label>
                        <div className="flex items-center space-x-4">
                            <img src={formData.coverArtUrl || `https://placehold.co/100x100/2d0b4c/ffffff?text=${formData.title.charAt(0) || 'S'}`} alt="preview" className="w-20 h-20 rounded-md object-cover"/>
                            <input name="coverArtUrl" type="url" value={formData.coverArtUrl} onChange={handleChange} placeholder="https://..." className="w-full p-2 border rounded bg-transparent dark:border-gray-600"/>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Artists</label>
                        <MultiSelectCombobox
                            options={artistOptions}
                            selectedIds={formData.artistIds}
                            onChange={(ids) => setFormData(prev => ({ ...prev, artistIds: ids }))}
                            placeholder="Select artists..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Album</label>
                        <select name="albumId" value={formData.albumId} onChange={handleChange} className="w-full p-2 border rounded bg-transparent dark:border-gray-600 dark:bg-gray-800">
                            <option value="">(No Album)</option>
                            {albumOptions.map(album => <option key={album.id} value={album.id}>{album.name}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Duration (seconds)</label>
                            <input name="duration" type="number" value={formData.duration} onChange={handleChange} required className="w-full p-2 border rounded bg-transparent dark:border-gray-600"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Release Date</label>
                            <input name="releaseDate" type="date" value={formData.releaseDate} onChange={handleChange} required className="w-full p-2 border rounded bg-transparent dark:border-gray-600"/>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Genre</label>
                        <select name="genre" value={formData.genre} onChange={handleChange} required className="w-full p-2 border rounded bg-transparent dark:border-gray-600 dark:bg-gray-800">
                             <option value="">Select Genre</option>
                            {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Credits</label>
                        <div className="space-y-2">
                            {formData.credits.map((credit, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <input value={credit.role} onChange={e => handleCreditChange(index, 'role', e.target.value)} placeholder="Role (e.g. Producer)" className="w-1/3 p-2 border rounded bg-transparent dark:border-gray-600"/>
                                    <input value={credit.names} onChange={e => handleCreditChange(index, 'names', e.target.value)} placeholder="Names, comma separated" className="flex-grow p-2 border rounded bg-transparent dark:border-gray-600"/>
                                </div>
                            ))}
                            <button type="button" onClick={addCreditField} className="text-sm text-ac-primary dark:text-ac-secondary font-semibold">+ Add Credit</button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Platform Links</label>
                        <div className="space-y-3">
                            <input name="spotify" type="url" value={formData.platformLinks.spotify} onChange={handlePlatformLinkChange} placeholder="Spotify URL" className="w-full p-2 border rounded bg-transparent dark:border-gray-600"/>
                            <input name="appleMusic" type="url" value={formData.platformLinks.appleMusic} onChange={handlePlatformLinkChange} placeholder="Apple Music URL" className="w-full p-2 border rounded bg-transparent dark:border-gray-600"/>
                            <input name="youtubeMusic" type="url" value={formData.platformLinks.youtubeMusic} onChange={handlePlatformLinkChange} placeholder="YouTube Music URL" className="w-full p-2 border rounded bg-transparent dark:border-gray-600"/>
                        </div>
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-ac-primary text-white rounded disabled:bg-gray-400">
                            {loading ? 'Saving...' : 'Save Song'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 ${
            active
            ? 'border-ac-secondary text-ac-secondary'
            : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
        }`}
    >
        {children}
    </button>
);

const AdminPage: React.FC = () => {
    const { userProfile } = useAuth();
    const [activeTab, setActiveTab] = useState('artists');
    const [allArtists, setAllArtists] = useState<(Artist & { id: string })[]>([]);
    const [allAlbums, setAllAlbums] = useState<(Album & { id: string })[]>([]);
    const [allSongs, setAllSongs] = useState<(Song & { id: string })[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        const fetchAllData = async () => {
            setLoadingData(true);
            try {
                const artistsQuery = query(collection(db, 'artists'), orderBy('name'));
                const albumsQuery = query(collection(db, 'albums'), orderBy('title'));
                const songsQuery = query(collection(db, 'songs'), orderBy('title'));

                const [artistsSnap, albumsSnap, songsSnap] = await Promise.all([
                    getDocs(artistsQuery),
                    getDocs(albumsQuery),
                    getDocs(songsQuery)
                ]);

                setAllArtists(artistsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Artist & { id: string })));
                setAllAlbums(albumsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Album & { id: string })));
                setAllSongs(songsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Song & { id: string })));

            } catch (error) {
                console.error("Failed to fetch shared data for admin forms:", error);
            } finally {
                setLoadingData(false);
            }
        };
        fetchAllData();
    }, []);

    const renderContent = () => {
        if (loadingData) return <div>Loading Data...</div>;

        switch (activeTab) {
            case 'applications':
                return userProfile?.role === Role.MASTER_ADMIN ? <ApplicationReview /> : null;
            case 'artists':
                return <ManageContent collectionName="artists" title="Manage Artists" FormComponent={ArtistFormModal} />;
            case 'albums':
                return <ManageContent collectionName="albums" title="Manage Albums" FormComponent={AlbumFormModal} allArtists={allArtists} allSongs={allSongs} />;
            case 'songs':
                 return <ManageContent collectionName="songs" title="Manage Songs" FormComponent={SongFormModal} allArtists={allArtists} allAlbums={allAlbums} />;
            default:
                return null;
        }
    };
    
    return (
        <div>
            <h1 className="text-4xl font-bold font-serif mb-8">Admin Panel</h1>
            <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
                <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                    <TabButton active={activeTab === 'artists'} onClick={() => setActiveTab('artists')}>Artists</TabButton>
                    <TabButton active={activeTab === 'albums'} onClick={() => setActiveTab('albums')}>Albums</TabButton>
                    <TabButton active={activeTab === 'songs'} onClick={() => setActiveTab('songs')}>Songs</TabButton>
                    {userProfile?.role === Role.MASTER_ADMIN && (
                        <TabButton active={activeTab === 'applications'} onClick={() => setActiveTab('applications')}>Applications</TabButton>
                    )}
                </nav>
            </div>
            <div>{renderContent()}</div>
        </div>
    );
};

export default AdminPage;