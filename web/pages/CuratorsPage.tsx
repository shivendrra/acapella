import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from '@firebase/firestore';
import { db } from '../services/firebase';
import { UserProfile } from '../types';
import PageLoader from '../components/common/PageLoader';
import { NavLink } from 'react-router-dom';
import UserBadges from '../components/common/UserBadges';

const CuratorCard: React.FC<{ user: UserProfile }> = ({ user }) => (
    <NavLink 
        to={`/${user.username}`} 
        className="flex flex-col items-center text-center p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
    >
        <img
            src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || user.username}&background=random`}
            alt={`${user.displayName}'s avatar`}
            className="w-24 h-24 rounded-full object-cover mb-4 border-2 border-yellow-500 group-hover:scale-105 transition-transform"
        />
        <h3 className="font-bold text-lg flex items-center justify-center">
            {user.displayName}
            <UserBadges user={user} />
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">@{user.username}</p>
    </NavLink>
);


const CuratorsPage: React.FC = () => {
    const [curators, setCurators] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCurators = async () => {
            setLoading(true);
            setError(null);
            try {
                const q = query(
                    collection(db, 'users'), 
                    where('isCurator', '==', true)
                );
                const querySnapshot = await getDocs(q);
                const curatorsData = querySnapshot.docs.map(doc => doc.data() as UserProfile);

                // Sort client-side to avoid needing a composite index
                curatorsData.sort((a, b) => {
                    const nameA = a.displayName || a.username || '';
                    const nameB = b.displayName || b.username || '';
                    return nameA.localeCompare(nameB);
                });

                setCurators(curatorsData);
            } catch (err: any) {
                console.error("Error fetching curators:", err);
                if (err.message && err.message.includes('index')) {
                     setError("Failed to load curators. A database index might be required. Please check the developer console for more information.");
                } else {
                     setError("Failed to load curators. Please try again later.");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchCurators();
    }, []);

    if (loading) return <PageLoader />;
    if (error) return <div className="text-center py-20 text-ac-danger">{error}</div>;

    return (
        <div>
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold font-serif">Meet the Curators</h1>
                <p className="mt-2 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                    A special thanks to our Curators for supporting Acapella and helping build our community.
                </p>
            </div>

            {curators.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {curators.map(user => (
                        <CuratorCard key={user.uid} user={user} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 border-2 border-dashed rounded-lg">
                    <p className="text-gray-500">No curators yet. Be the first to support us!</p>
                </div>
            )}
        </div>
    );
};

export default CuratorsPage;