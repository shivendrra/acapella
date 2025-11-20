
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { db } from '../services/firebase';
import { collection, query, where, getDocs, doc, updateDoc, writeBatch, Timestamp, addDoc, serverTimestamp, deleteDoc, orderBy, limit, startAfter, getDoc } from '@firebase/firestore';
import { Role, AdminApplication, Artist, Album, Song, UserProfile } from '../types';
import { X, Plus, Edit, Trash2, Link as LinkIcon, Search, UserX, UserPlus, Users, FileText, Disc, Music, Shield, ClipboardList } from 'lucide-react';
import { formatDate } from '../utils/formatters';

const debounce = <F extends (...args: any[]) => any>(func: F, waitFor: number) => {
  let timeout: number;
  return (...args: Parameters<F>): Promise<ReturnType<F>> =>
    new Promise(resolve => {
      clearTimeout(timeout);
      timeout = window.setTimeout(() => resolve(func(...args)), waitFor);
    });
};

const GENRES = [
  'Afrobeat', 'Afrobeats', 'Alternative', 'Alternative Rock', 'Ambient', 'Bhangra', 'Bluegrass', 'Blues', 'Bollywood', 'Chillwave', 'Classical', 'Contemporary R&B', 'Country', 'Cumbia', 'Dancehall', 'Disco', 'Drum and Bass', 'Dubstep', 'Electro-pop', 'Electronic', 'Electronic Dance Music (EDM)', 'Flamenco', 'Folk', 'Funk', 'Garage', 'Gospel', 'Grime', 'Hip-Hop', 'Hip-Hop/Rap', 'House', 'Hyperpop', 'Indie', 'Industrial', 'J-Pop', 'Jazz', 'K-Pop', 'Latin', 'Lo-fi', 'Merengue', 'Metal', 'New Wave', 'Opera', 'Pop', 'Punk', 'R&B', 'R&B/Soul', 'Reggae', 'Rock', 'Salsa', 'Ska', 'Soul', 'Soundtrack', 'Sufi', 'Synth-pop', 'Techno', 'Trance', 'Trap', 'Trap Soul', 'Vaporwave', 'World', 'Zouk',
].sort();


interface ApplicationWithId extends AdminApplication {
  docId: string;
}

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode; icon: React.ReactNode }> = ({ active, onClick, children, icon }) => (
    <button
        onClick={onClick}
        className={`px-3 sm:px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 flex items-center gap-2 flex-shrink-0 ${
            active
            ? 'border-ac-secondary text-ac-secondary'
            : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
        }`}
    >
        {icon}
        <span className="hidden sm:inline">{children}</span>
    </button>
);

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
            console.error("Failed to fetch applications.", err);
            let message = "Failed to fetch applications. Please try again later.";
            if (err instanceof Error && err.message.includes("indexes")) {
                message = "Failed to fetch applications. A database index is required for this query. Please check the developer console for a link to create it.";
            }
            setError(message);
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
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                        {applications.map(app => (
                            <li key={app.docId} className="p-4 transition-colors odd:bg-transparent even:bg-black/[.03] dark:even:bg-white/[.03]">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-semibold">{app.userName || app.userEmail}</p>
                                        <p className="text-sm text-gray-500">{app.userEmail}</p>
                                    </div>
                                    <div className="text-sm text-gray-400">
                                        {formatDate(app.submittedAt)}
                                    </div>
                                </div>
                                <p className="mt-4 text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">{app.reason}</p>
                                <div className="mt-4 flex space-x-2">
                                    <button onClick={() => handleApplication(app, 'approved')} className="px-3 py-1 text-sm bg-ac-secondary text-white rounded-md hover:bg-ac-secondary/90">Approve</button>
                                    <button onClick={() => handleApplication(app, 'rejected')} className="px-3 py-1 text-sm bg-ac-danger text-white rounded-md hover:bg-ac-danger/90">Reject</button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

const AdminList: React.FC = () => {
    const { userProfile: currentUserProfile } = useAuth();
    const [admins, setAdmins] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<UserProfile[]>([]);

    const fetchAdmins = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            // This query requires a composite index on the 'role' field in Firestore.
            // The console will provide a link to create it if it doesn't exist.
            const q = query(collection(db, 'users'), where('role', 'in', ['admin', 'master_admin']));
            const snapshot = await getDocs(q);
            setAdmins(snapshot.docs.map(d => d.data() as UserProfile));
        } catch (err: any) {
            console.error("Failed to fetch admins:", err);
            if (err.message.includes("index")) {
                setError("A database index is required to fetch admins. Please check the developer console for a link to create it.");
            } else {
                setError("Failed to fetch the list of admins.");
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAdmins();
    }, [fetchAdmins]);
    
    const debouncedSearch = useCallback(debounce(async (term: string) => {
        if (term.length < 3) {
            setSearchResults([]);
            return;
        }
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('username', '>=', term.toLowerCase()), where('username', '<=', term.toLowerCase() + '\uf8ff'), where('role', '==', 'user'), limit(5));
        const snapshot = await getDocs(q);
        setSearchResults(snapshot.docs.map(doc => doc.data() as UserProfile));
    }, 500), []);

    useEffect(() => {
        debouncedSearch(searchTerm);
    }, [searchTerm, debouncedSearch]);

    const handleRoleChange = async (userId: string, newRole: Role) => {
        try {
            await updateDoc(doc(db, 'users', userId), { role: newRole });
            await fetchAdmins(); // Refresh admin list
            setSearchTerm('');
            setSearchResults([]);
        } catch (e) {
            console.error("Failed to change user role:", e);
            setError("Could not update user role.");
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h3 className="text-xl font-bold font-serif mb-2">Add New Admin</h3>
                <p className="text-sm text-gray-500 mb-4">Search for a user by their username to promote them to an Admin role.</p>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input 
                        type="search"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search for users to promote..."
                        className="w-full pl-9 pr-4 py-2 border rounded-md bg-transparent dark:border-gray-600"
                    />
                </div>
                {searchResults.length > 0 && (
                    <ul className="mt-2 border rounded-md dark:border-gray-700 divide-y dark:divide-gray-700">
                        {searchResults.map(user => (
                            <li key={user.uid} className="p-3 flex justify-between items-center">
                                <div>
                                    <p className="font-semibold flex items-center">
                                        {user.displayName}
                                    </p>
                                    <p className="text-sm text-gray-500">@{user.username}</p>
                                </div>
                                <button onClick={() => handleRoleChange(user.uid, Role.ADMIN)} className="flex items-center text-xs px-2 py-1 bg-ac-secondary text-white rounded-md hover:bg-ac-secondary/90">
                                    <UserPlus size={14} className="mr-1"/> Promote
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div>
                <h2 className="text-2xl font-bold font-serif mb-4">Current Admins</h2>
                {loading && <p>Loading admins...</p>}
                {error && <p className="text-ac-danger">{error}</p>}
                {!loading && !error && (
                    <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                            {admins.map(admin => (
                                <li key={admin.uid} className="p-4 flex justify-between items-center transition-colors odd:bg-transparent even:bg-black/[.03] dark:even:bg-white/[.03]">
                                    <div>
                                        <p className="font-semibold flex items-center">
                                            {admin.displayName}
                                        </p>
                                        <p className="text-sm text-gray-500">@{admin.username}</p>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        {admin.role === Role.ADMIN && admin.uid !== currentUserProfile?.uid && (
                                            <button onClick={() => handleRoleChange(admin.uid, Role.USER)} title="Remove Admin Status" className="p-2 text-gray-500 hover:text-ac-danger">
                                                <UserX size={16}/>
                                            </button>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

const ManageAdmins: React.FC = () => {
    const [activeTab, setActiveTab] = useState('list');
    
    return (
        <div>
            <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
                <nav className="-mb-px flex space-x-1 sm:space-x-4 overflow-x-auto">
                    <TabButton active={activeTab === 'list'} onClick={() => setActiveTab('list')} icon={<Users size={16} />}>Manage Admins</TabButton>
                    <TabButton active={activeTab === 'applications'} onClick={() => setActiveTab('applications')} icon={<FileText size={16} />}>Applications</TabButton>
                </nav>
            </div>
            <div>
                {activeTab === 'list' && <AdminList />}
                {activeTab === 'applications' && <ApplicationReview />}
            </div>
        </div>
    );
}

const MultiSelectCombobox: React.FC<{
    collectionName: 'songs' | 'albums' | 'artists',
    selectedIds: string[];
    onChange: (ids: string[]) => void;
    placeholder: string;
}> = ({ collectionName, selectedIds, onChange, placeholder }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [selectedItems, setSelectedItems] = useState<{ id: string, name: string }[]>([]);
    const [searchResults, setSearchResults] = useState<{ id: string, name: string }[]>([]);

    useEffect(() => {
        const fetchInitialItems = async () => {
            if (selectedIds.length === 0) {
                setSelectedItems([]);
                return;
            };
            const itemsRef = collection(db, collectionName);
            const q = query(itemsRef, where('__name__', 'in', selectedIds));
            const snapshot = await getDocs(q);
            const items = snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name || doc.data().title }));
            setSelectedItems(items);
        };
        fetchInitialItems();
    }, [selectedIds, collectionName]);

    const debouncedSearch = useCallback(
        debounce(async (term: string) => {
            if (term.length < 2) {
                setSearchResults([]);
                return;
            }
            const field = collectionName === 'artists' ? 'name_lowercase' : 'title_lowercase';
            const itemsRef = collection(db, collectionName);
            const q = query(itemsRef, where(field, '>=', term.toLowerCase()), where(field, '<=', term.toLowerCase() + '\uf8ff'), limit(10));
            const snapshot = await getDocs(q);
            setSearchResults(snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name || doc.data().title })));
        }, 300),
        [collectionName]
    );

    useEffect(() => {
        debouncedSearch(searchTerm);
    }, [searchTerm, debouncedSearch]);

    useEffect(() => {
        const handleOutsideClick = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, []);

    const toggleSelection = (item: { id: string; name: string }) => {
        const newSelectedIds = selectedIds.includes(item.id)
            ? selectedIds.filter(selectedId => selectedId !== item.id)
            : [...selectedIds, item.id];
        onChange(newSelectedIds);
        setSearchTerm('');
        setSearchResults([]);
    };

    return (
        <div className="relative" ref={containerRef}>
            <div className="flex flex-wrap gap-2 p-2 border rounded bg-transparent dark:border-gray-600 min-h-[42px] cursor-text" onClick={() => setIsOpen(true)}>
                {selectedItems.map(item => (
                    <span key={item.id} className="flex items-center bg-ac-secondary/20 text-ac-secondary text-sm font-medium px-2 py-1 rounded-full">
                        {item.name}
                        <button type="button" onClick={(e) => { e.stopPropagation(); toggleSelection(item); }} className="ml-2 text-ac-secondary hover:text-ac-danger">
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
                        {searchResults.map(option => (
                            <li key={option.id} onClick={() => toggleSelection(option)} className="px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between">
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
}> = ({ collectionName, title, FormComponent }) => {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [currentItem, setCurrentItem] = useState<any | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchData = useCallback(async () => {
        setLoading(true);
        const nameField = collectionName === 'artists' ? 'name' : 'title';
        const lowercaseNameField = collectionName === 'artists' ? 'name_lowercase' : 'title_lowercase';
        
        let q;
        if (searchTerm) {
             q = query(collection(db, collectionName), where(lowercaseNameField, '>=', searchTerm.toLowerCase()), where(lowercaseNameField, '<=', searchTerm.toLowerCase() + '\uf8ff'), orderBy(lowercaseNameField), limit(15));
        } else {
             q = query(collection(db, collectionName), orderBy(nameField), limit(15));
        }
        
        const snapshot = await getDocs(q);
        setItems(snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as object) })));
        setLoading(false);
    }, [collectionName, searchTerm]);

    useEffect(() => {
        if (!searchTerm) {
            fetchData();
        }
    }, [searchTerm, fetchData]);
    
    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        fetchData();
    };

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

    return (
        <div>
            <div className="flex justify-between items-center mb-4 gap-4">
                <form onSubmit={handleSearchSubmit} className="flex-grow">
                    <div className="relative">
                       <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                       <input 
                           type="search"
                           value={searchTerm}
                           onChange={(e) => setSearchTerm(e.target.value)}
                           placeholder={`Search for ${collectionName}...`}
                           className="w-full pl-9 pr-4 py-2 border rounded-md bg-transparent dark:border-gray-600"
                       />
                    </div>
                </form>
                <button onClick={handleAddNew} className="flex items-center px-3 py-2 text-sm bg-ac-primary text-white rounded-md hover:bg-ac-primary/90 flex-shrink-0">
                    <Plus size={16} className="mr-1" /> Add New
                </button>
            </div>
            
            {loading ? (<div>Loading...</div>) : (
                <div className="rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                        {items.length > 0 ? items.map(item => (
                            <li key={item.id} className="p-4 flex justify-between items-center transition-colors odd:bg-transparent even:bg-black/[.03] dark:even:bg-white/[.03] hover:bg-black/[.05] dark:hover:bg-white/[.05]">
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
                        )) : (<li className="p-4 text-center text-gray-500">No items found.</li>)}
                    </ul>
                </div>
            )}
            
            {showModal && <FormComponent item={currentItem} onClose={handleCloseModal} />}
        </div>
    );
};

// --- FORM MODALS (ArtistFormModal, AlbumFormModal, SongFormModal) ---
// These large components remain unchanged, so they are omitted here for brevity but should be kept in the file.
const ArtistFormModal: React.FC<{ item: Artist | null, onClose: () => void }> = ({ item, onClose }) => {
    const [formData, setFormData] = useState({
        name: item?.name || '', bio: item?.bio || '', imageUrl: item?.imageUrl || '', coverImageUrl: item?.coverImageUrl || '', genres: item?.genres || [],
        socials: item?.socials ? Object.entries(item.socials).map(([platform, url]) => ({ platform, url })) : [{ platform: '', url: '' }],
        platformLinks: { spotify: item?.platformLinks?.spotify || '', appleMusic: item?.platformLinks?.appleMusic || '', youtubeMusic: item?.platformLinks?.youtubeMusic || '', },
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
        } else { setGenreSuggestions([]); }
    }
    const addGenre = (genre: string) => {
        if (genre && !formData.genres.includes(genre)) {
            setFormData(prev => ({ ...prev, genres: [...prev.genres, genre] }));
        }
        setGenreInput(''); setGenreSuggestions([]);
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
        e.preventDefault(); setLoading(true);
        const dataToSave = {
            name: formData.name, name_lowercase: formData.name.toLowerCase(), imageUrl: formData.imageUrl, coverImageUrl: formData.coverImageUrl,
            genres: formData.genres, bio: formData.bio, platformLinks: formData.platformLinks,
            socials: formData.socials.reduce((acc, { platform, url }) => {
                if (platform && url) acc[platform.toLowerCase()] = url;
                return acc;
            }, {} as Record<string, string>),
        };
        if (item) { await updateDoc(doc(db, 'artists', item.id), dataToSave); } 
        else { await addDoc(collection(db, 'artists'), dataToSave); }
        setLoading(false); onClose();
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
                             <input id="coverImageUrl" name="coverImageUrl" type="url" value={formData.coverImageUrl} onChange={handleChange} placeholder="https://..." className="w-full p-2 border rounded bg-transparent dark:border-gray-600"/>
                            {formData.coverImageUrl && (<img src={formData.coverImageUrl} alt="cover preview" className="w-full aspect-video rounded-md object-cover bg-gray-200 dark:bg-gray-700"/>)}
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
                                    <button type="button" onClick={() => removeGenre(genre)} className="ml-2 text-ac-secondary hover:text-ac-danger"><X size={14} /></button>
                                </span>
                            ))}
                        </div>
                        <div className="relative mt-2">
                           <input value={genreInput} onChange={handleGenreInputChange} placeholder="Add a genre..." className="w-full p-2 border rounded bg-transparent dark:border-gray-600"/>
                            {genreSuggestions.length > 0 && (
                                <ul className="absolute z-10 w-full bg-white dark:bg-gray-800 border dark:border-gray-600 rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg">
                                    {genreSuggestions.map(suggestion => (<li key={suggestion} onClick={() => addGenre(suggestion)} className="px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">{suggestion}</li>))}
                                </ul>
                            )}
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm font-medium mb-1">Platform Links</label>
                        <div className="space-y-3">
                             <div><label htmlFor="artistSpotify" className="sr-only">Spotify URL</label><input id="artistSpotify" name="spotify" type="url" value={formData.platformLinks.spotify} onChange={handlePlatformLinkChange} placeholder="Spotify URL" className="w-full p-2 border rounded bg-transparent dark:border-gray-600"/></div>
                             <div><label htmlFor="artistAppleMusic" className="sr-only">Apple Music URL</label><input id="artistAppleMusic" name="appleMusic" type="url" value={formData.platformLinks.appleMusic} onChange={handlePlatformLinkChange} placeholder="Apple Music URL" className="w-full p-2 border rounded bg-transparent dark:border-gray-600"/></div>
                             <div><label htmlFor="artistYoutubeMusic" className="sr-only">YouTube Music URL</label><input id="artistYoutubeMusic" name="youtubeMusic" type="url" value={formData.platformLinks.youtubeMusic} onChange={handlePlatformLinkChange} placeholder="YouTube Music URL" className="w-full p-2 border rounded bg-transparent dark:border-gray-600"/></div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Social Links</label>
                        <div className="space-y-2">
                            {formData.socials.map((social, index) => (<div key={index} className="flex items-center gap-2"><input value={social.platform} onChange={e => handleSocialChange(index, 'platform', e.target.value)} placeholder="Platform (e.g. Twitter)" className="w-1/3 p-2 border rounded bg-transparent dark:border-gray-600"/><input value={social.url} onChange={e => handleSocialChange(index, 'url', e.target.value)} type="url" placeholder="URL" className="flex-grow p-2 border rounded bg-transparent dark:border-gray-600"/></div>))}
                            <button type="button" onClick={addSocialField} className="text-sm text-ac-primary dark:text-ac-secondary font-semibold">+ Add Link</button>
                        </div>
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-ac-primary text-white rounded disabled:bg-gray-400">{loading ? 'Saving...' : 'Save Artist'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
const AlbumFormModal: React.FC<{item: Album | null, onClose: () => void}> = ({ item, onClose }) => {
    const [formData, setFormData] = useState({
        title: item?.title || '', releaseDate: item?.releaseDate || '', coverArtUrl: item?.coverArtUrl || '', artistIds: item?.artistIds || [],
        tracklist: item?.tracklist || [], genre: item?.genre || '',
        platformLinks: { spotify: item?.platformLinks?.spotify || '', appleMusic: item?.platformLinks?.appleMusic || '', youtubeMusic: item?.platformLinks?.youtubeMusic || '' },
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
        e.preventDefault(); setLoading(true);
        const dataToSave = { ...formData, title_lowercase: formData.title.toLowerCase() };
        if (item) { await updateDoc(doc(db, 'albums', item.id), dataToSave); } 
        else { await addDoc(collection(db, 'albums'), dataToSave); }
        setLoading(false); onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-ac-light dark:bg-ac-dark rounded-lg shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold font-serif">{item ? 'Edit Album' : 'Add New Album'}</h3>
                    <button onClick={onClose}><X/></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div><label className="block text-sm font-medium mb-1">Title</label><input name="title" value={formData.title} onChange={handleChange} required className="w-full p-2 border rounded bg-transparent dark:border-gray-600"/></div>
                    <div><label className="block text-sm font-medium mb-1">Artists</label><MultiSelectCombobox collectionName="artists" selectedIds={formData.artistIds} onChange={(ids) => setFormData(prev => ({ ...prev, artistIds: ids }))} placeholder="Search & select artists..."/></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium mb-1">Release Date</label><input name="releaseDate" type="date" value={formData.releaseDate} onChange={handleChange} required className="w-full p-2 border rounded bg-transparent dark:border-gray-600"/></div>
                        <div><label className="block text-sm font-medium mb-1">Genre</label><select name="genre" value={formData.genre} onChange={handleChange} required className="w-full p-2 border rounded bg-transparent dark:border-gray-600 dark:bg-gray-800"><option value="">Select Genre</option>{GENRES.map(g => <option key={g} value={g}>{g}</option>)}</select></div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Cover Art URL</label>
                        <div className="flex items-center space-x-4">
                            <img src={formData.coverArtUrl || `https://placehold.co/100x100/2d0b4c/ffffff?text=${formData.title.charAt(0) || 'A'}`} alt="preview" className="w-20 h-20 rounded-md object-cover"/>
                            <input type="url" name="coverArtUrl" value={formData.coverArtUrl} onChange={handleChange} placeholder="https://..." required className="w-full p-2 border rounded bg-transparent dark:border-gray-600"/>
                        </div>
                    </div>
                     <div><label className="block text-sm font-medium mb-1">Tracklist</label><MultiSelectCombobox collectionName="songs" selectedIds={formData.tracklist} onChange={(ids) => setFormData(prev => ({ ...prev, tracklist: ids }))} placeholder="Search & select songs..."/></div>
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
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-ac-primary text-white rounded disabled:bg-gray-400">{loading ? 'Saving...' : 'Save Album'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
const SongFormModal: React.FC<{item: Song | null, onClose: () => void}> = ({ item, onClose }) => {
    const initialCredits = item?.credits ? Object.entries(item.credits).map(([role, names]) => ({ role, names: Array.isArray(names) ? names.join(', ') : '' })) : [{ role: '', names: '' }];
    const [formData, setFormData] = useState({
        title: item?.title || '', artistIds: item?.artistIds || [], albumId: item?.albumId || '', duration: item?.duration || 0, releaseDate: item?.releaseDate || '',
        genre: item?.genre || '', credits: initialCredits, coverArtUrl: item?.coverArtUrl || '',
        platformLinks: { spotify: item?.platformLinks?.spotify || '', appleMusic: item?.platformLinks?.appleMusic || '', youtubeMusic: item?.platformLinks?.youtubeMusic || '' },
    });
    const [loading, setLoading] = useState(false);
    const [albumOptions, setAlbumOptions] = useState<{ id: string, name: string }[]>([]);
    useEffect(() => {
        const fetchInitialAlbum = async () => {
            if (item?.albumId) {
                const albumRef = doc(db, 'albums', item.albumId);
                const albumSnap = await getDoc(albumRef);
                if (albumSnap.exists()) { setAlbumOptions([{ id: albumSnap.id, name: albumSnap.data().title }]); }
            }
        };
        fetchInitialAlbum();
    }, [item?.albumId]);
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
        e.preventDefault(); setLoading(true);
        const creditsObject = formData.credits.reduce((acc, { role, names }) => {
            if (role && names) { acc[role] = names.split(',').map(name => name.trim()); }
            return acc;
        }, {} as Record<string, string[]>);
        const dataToSave = {
            title: formData.title, title_lowercase: formData.title.toLowerCase(), artistIds: formData.artistIds, albumId: formData.albumId, duration: formData.duration,
            releaseDate: formData.releaseDate, genre: formData.genre, credits: creditsObject, coverArtUrl: formData.coverArtUrl, platformLinks: formData.platformLinks,
        };
        if (item) { await updateDoc(doc(db, 'songs', item.id), dataToSave); } 
        else { await addDoc(collection(db, 'songs'), { ...dataToSave, reviewCount: 0 }); }
        setLoading(false); onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-ac-light dark:bg-ac-dark rounded-lg shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold font-serif">{item ? 'Edit Song' : 'Add New Song'}</h3>
                    <button onClick={onClose}><X/></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div><label className="block text-sm font-medium mb-1">Title</label><input name="title" value={formData.title} onChange={handleChange} required className="w-full p-2 border rounded bg-transparent dark:border-gray-600"/></div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Cover Art URL (1:1)</label>
                        <div className="flex items-center space-x-4">
                            <img src={formData.coverArtUrl || `https://placehold.co/100x100/2d0b4c/ffffff?text=${formData.title.charAt(0) || 'S'}`} alt="preview" className="w-20 h-20 rounded-md object-cover"/>
                            <input name="coverArtUrl" type="url" value={formData.coverArtUrl} onChange={handleChange} placeholder="https://..." className="w-full p-2 border rounded bg-transparent dark:border-gray-600"/>
                        </div>
                    </div>
                    <div><label className="block text-sm font-medium mb-1">Artists</label><MultiSelectCombobox collectionName="artists" selectedIds={formData.artistIds} onChange={(ids) => setFormData(prev => ({ ...prev, artistIds: ids }))} placeholder="Search & select artists..."/></div>
                    <div><label className="block text-sm font-medium mb-1">Album</label><select name="albumId" value={formData.albumId} onChange={handleChange} className="w-full p-2 border rounded bg-transparent dark:border-gray-600 dark:bg-gray-800"><option value="">(No Album)</option>{albumOptions.map(album => <option key={album.id} value={album.id}>{album.name}</option>)}</select></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium mb-1">Duration (seconds)</label><input name="duration" type="number" value={formData.duration} onChange={handleChange} required className="w-full p-2 border rounded bg-transparent dark:border-gray-600"/></div>
                        <div><label className="block text-sm font-medium mb-1">Release Date</label><input name="releaseDate" type="date" value={formData.releaseDate} onChange={handleChange} required className="w-full p-2 border rounded bg-transparent dark:border-gray-600"/></div>
                    </div>
                    <div><label className="block text-sm font-medium mb-1">Genre</label><select name="genre" value={formData.genre} onChange={handleChange} required className="w-full p-2 border rounded bg-transparent dark:border-gray-600 dark:bg-gray-800"><option value="">Select Genre</option>{GENRES.map(g => <option key={g} value={g}>{g}</option>)}</select></div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Credits</label>
                        <div className="space-y-2">
                            {formData.credits.map((credit, index) => (<div key={index} className="flex items-center gap-2"><input value={credit.role} onChange={e => handleCreditChange(index, 'role', e.target.value)} placeholder="Role (e.g. Producer)" className="w-1/3 p-2 border rounded bg-transparent dark:border-gray-600"/><input value={credit.names} onChange={e => handleCreditChange(index, 'names', e.target.value)} placeholder="Names, comma separated" className="flex-grow p-2 border rounded bg-transparent dark:border-gray-600"/></div>))}
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
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-ac-primary text-white rounded disabled:bg-gray-400">{loading ? 'Saving...' : 'Save Song'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const MainTabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode; icon: React.ReactNode }> = ({ active, onClick, children, icon }) => (
    <button
        onClick={onClick}
        className={`flex items-center justify-center md:justify-start gap-3 w-auto md:w-full px-3 py-2 text-sm font-medium rounded-md flex-shrink-0 ${
            active
            ? 'bg-ac-primary/10 text-ac-primary dark:bg-ac-secondary/20 dark:text-ac-secondary'
            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
        }`}
    >
        {icon}
        <span className="hidden md:inline">{children}</span>
    </button>
);

const AdminPage: React.FC = () => {
    const { userProfile } = useAuth();
    const isMaster = userProfile?.role === Role.MASTER_ADMIN;
    
    const [mainTab, setMainTab] = useState('content');
    const [contentTab, setContentTab] = useState('artists');

    const renderContentManagement = () => (
        <div>
            <h2 className="text-2xl font-bold font-serif mb-4 md:hidden">Content Management</h2>
            <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
                <nav className="-mb-px flex space-x-1 sm:space-x-4 overflow-x-auto" aria-label="Tabs">
                    <TabButton active={contentTab === 'artists'} onClick={() => setContentTab('artists')} icon={<Users size={16} />}>Artists</TabButton>
                    <TabButton active={contentTab === 'albums'} onClick={() => setContentTab('albums')} icon={<Disc size={16} />}>Albums</TabButton>
                    <TabButton active={contentTab === 'songs'} onClick={() => setContentTab('songs')} icon={<Music size={16} />}>Songs</TabButton>
                </nav>
            </div>
            <div>
                {contentTab === 'artists' && <ManageContent collectionName="artists" title="Manage Artists" FormComponent={ArtistFormModal} />}
                {contentTab === 'albums' && <ManageContent collectionName="albums" title="Manage Albums" FormComponent={AlbumFormModal} />}
                {contentTab === 'songs' && <ManageContent collectionName="songs" title="Manage Songs" FormComponent={SongFormModal} />}
            </div>
        </div>
    );
    
    return (
        <div>
            <h1 className="text-4xl font-bold font-serif mb-8">Admin Panel</h1>
            {isMaster ? (
                 <div className="flex flex-col md:flex-row gap-8 md:gap-10">
                    <aside className="md:w-1/4 lg:w-1/5">
                        <h2 className="text-xl font-bold font-serif mb-4 hidden md:block">Sections</h2>
                        <nav className="flex flex-row space-x-2 md:space-x-0 md:flex-col md:space-y-1 border-b md:border-0 border-gray-200 dark:border-gray-700 md:pb-0 pb-2 mb-6 md:mb-0 -mx-4 px-4 md:mx-0 md:px-0">
                            <MainTabButton active={mainTab === 'content'} onClick={() => setMainTab('content')} icon={<ClipboardList size={18} />}>Content</MainTabButton>
                            <MainTabButton active={mainTab === 'admins'} onClick={() => setMainTab('admins')} icon={<Shield size={18} />}>Admins</MainTabButton>
                        </nav>
                    </aside>
                    <div className="flex-1 min-w-0">
                        {mainTab === 'content' && renderContentManagement()}
                        {mainTab === 'admins' && <ManageAdmins />}
                    </div>
                </div>
            ) : (
                renderContentManagement()
            )}
        </div>
    );
};

export default AdminPage;
