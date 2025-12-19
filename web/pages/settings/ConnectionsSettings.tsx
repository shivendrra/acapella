
import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../services/firebase';
import { doc, updateDoc } from '@firebase/firestore';
import { Check, X, ExternalLink, AlertCircle, Loader } from 'lucide-react';

const SpotifyIcon = () => (
    <svg viewBox="0 0 24 24" className="w-8 h-8 fill-[#1DB954]" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141 4.2-1.32 9.6-0.66 13.38 1.68.42.299.6.899.361 1.26-.12-.06-.24-.12-.36-.12zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
);

const AppleMusicIcon = () => (
    <svg viewBox="0 0 24 24" className="w-8 h-8 fill-black dark:fill-white" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm.065 17.295c-3.237 0-5.35-1.96-5.35-4.822 0-2.839 2.086-4.843 5.328-4.843 3.193 0 5.241 1.94 5.241 4.799 0 2.881-2.042 4.866-5.219 4.866zm5.669-7.291c-.347-.367-.781-.541-1.214-.541-.39 0-.824.173-1.171.563-.39.39-.563.845-.563 1.257 0 .39.173.845.541 1.192.368.368.802.563 1.236.563.39 0 .823-.173 1.192-.563.368-.368.541-.802.541-1.236 0-.39-.173-.845-.562-1.235zM7.067 8.358c-.282.282-.433.65-.433 1.04 0 .368.13.737.412 1.018.281.282.65.412 1.04.412.39 0 .758-.152 1.018-.412.282-.281.434-.65.434-1.04 0-.368-.152-.736-.412-1.018-.282-.282-.65-.433-1.04-.433-.368 0-.737.151-1.019.433z"/>
        <path d="M12.065 9.172c-2.319 0-3.793 1.344-3.793 3.327 0 1.993 1.495 3.305 3.75 3.305 2.276 0 3.707-1.344 3.707-3.284 0-1.993-1.431-3.348-3.664-3.348z" />
    </svg>
);

const YouTubeMusicIcon = () => (
    <svg viewBox="0 0 24 24" className="w-8 h-8 fill-[#FF0000]" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0C5.376 0 0 5.376 0 12s5.376 12 12 12 12-5.376 12-12S18.624 0 12 0zm0 19.344c-4.056 0-7.344-3.288-7.344-7.344S7.944 4.656 12 4.656s7.344 3.288 7.344 7.344-3.288 7.344-7.344 7.344zm3.336-7.344l-5.016 2.88v-5.76l5.016 2.88z"/>
    </svg>
);

type Platform = 'spotify' | 'appleMusic' | 'youtubeMusic';

interface ConnectModalProps {
    platform: Platform;
    onClose: () => void;
    onConnect: (id: string) => void;
    isLoading: boolean;
}

const ConnectModal: React.FC<ConnectModalProps> = ({ platform, onClose, onConnect, isLoading }) => {
    const [inputValue, setInputValue] = useState('');
    const [error, setError] = useState('');

    const platformNames: Record<Platform, string> = {
        spotify: 'Spotify',
        appleMusic: 'Apple Music',
        youtubeMusic: 'YouTube Music'
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim()) {
            setError('Please enter your profile ID or username.');
            return;
        }
        onConnect(inputValue.trim());
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-ac-light dark:bg-ac-dark rounded-xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold font-serif">Connect {platformNames[platform]}</h3>
                    <button onClick={onClose}><X size={24} /></button>
                </div>
                
                <form onSubmit={handleSubmit}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Enter your {platformNames[platform]} Username or Profile ID
                    </label>
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="e.g. user123 or profile URL"
                        className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-ac-secondary mb-4 dark:text-white"
                        autoFocus
                    />
                    {error && <p className="text-sm text-ac-danger mb-4">{error}</p>}
                    
                    <p className="text-xs text-gray-500 mb-6">
                        Note: This allows others to find your profile on {platformNames[platform]}. Ensure your privacy settings on that platform allow public viewing if you wish to share playlists.
                    </p>

                    <div className="flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 dark:border-gray-600">Cancel</button>
                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="px-4 py-2 bg-ac-primary text-white rounded-lg hover:bg-ac-primary/90 flex items-center"
                        >
                            {isLoading && <Loader size={16} className="animate-spin mr-2"/>}
                            Connect Account
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ConnectionCard: React.FC<{
    icon: React.ReactNode;
    name: string;
    description: string;
    connectedId?: string;
    onConnect: () => void;
    onDisconnect: () => void;
    isLoading: boolean;
}> = ({ icon, name, description, connectedId, onConnect, onDisconnect, isLoading }) => {
    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-full flex-shrink-0">
                    {icon}
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                        {name}
                        {connectedId && <Check size={16} className="ml-2 text-green-500" strokeWidth={3} />}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {connectedId ? `Connected as ${connectedId}` : description}
                    </p>
                </div>
            </div>
            <div>
                {connectedId ? (
                    <button
                        onClick={onDisconnect}
                        disabled={isLoading}
                        className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                    >
                        Disconnect
                    </button>
                ) : (
                    <button
                        onClick={onConnect}
                        disabled={isLoading}
                        className="px-4 py-2 text-sm font-medium text-ac-primary border border-ac-primary/20 bg-ac-primary/5 rounded-lg hover:bg-ac-primary/10 dark:text-ac-secondary dark:border-ac-secondary/20 dark:bg-ac-secondary/5 dark:hover:bg-ac-secondary/10 transition-colors flex items-center"
                    >
                        Connect <ExternalLink size={14} className="ml-2"/>
                    </button>
                )}
            </div>
        </div>
    );
};

const ConnectionsSettings: React.FC = () => {
    const { currentUser, userProfile } = useAuth();
    const [connectingPlatform, setConnectingPlatform] = useState<Platform | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleConnect = async (platform: Platform, id: string) => {
        if (!currentUser) return;
        setLoading(true);
        setError(null);
        try {
            const userRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userRef, {
                [`linkedAccounts.${platform}`]: id
            });
            // Profile updates usually propagate via AuthContext, but local state update might be needed 
            // if AuthContext doesn't listen to snapshots. However, our useAuth usually re-fetches on reload or we rely on page refresh.
            // For smoother UX, we might need to manually update local state or force a reload. 
            // Here we assume AuthContext will eventually reflect it or we reload.
            window.location.reload(); 
        } catch (err: any) {
            console.error("Connection failed:", err);
            setError("Failed to connect account. Please try again.");
        } finally {
            setLoading(false);
            setConnectingPlatform(null);
        }
    };

    const handleDisconnect = async (platform: Platform) => {
        if (!currentUser || !window.confirm(`Are you sure you want to disconnect your ${platform} account?`)) return;
        setLoading(true);
        try {
            const userRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userRef, {
                [`linkedAccounts.${platform}`]: null // Firestore merge will set this field to null
            });
            window.location.reload();
        } catch (err) {
            console.error("Disconnect failed:", err);
            setError("Failed to disconnect account.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h2 className="text-3xl font-bold font-serif mb-4">Connections</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
                Connect your music accounts to easily share playlists and import your library in the future.
            </p>

            {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start text-ac-danger">
                    <AlertCircle size={20} className="mr-3 mt-0.5 flex-shrink-0"/>
                    <p className="text-sm">{error}</p>
                </div>
            )}

            <div className="space-y-4">
                <ConnectionCard 
                    icon={<SpotifyIcon />}
                    name="Spotify"
                    description="Connect to share Spotify playlists."
                    connectedId={userProfile?.linkedAccounts?.spotify}
                    onConnect={() => setConnectingPlatform('spotify')}
                    onDisconnect={() => handleDisconnect('spotify')}
                    isLoading={loading}
                />
                <ConnectionCard 
                    icon={<AppleMusicIcon />}
                    name="Apple Music"
                    description="Link your Apple Music profile."
                    connectedId={userProfile?.linkedAccounts?.appleMusic}
                    onConnect={() => setConnectingPlatform('appleMusic')}
                    onDisconnect={() => handleDisconnect('appleMusic')}
                    isLoading={loading}
                />
                <ConnectionCard 
                    icon={<YouTubeMusicIcon />}
                    name="YouTube Music"
                    description="Connect for YouTube Music sharing."
                    connectedId={userProfile?.linkedAccounts?.youtubeMusic}
                    onConnect={() => setConnectingPlatform('youtubeMusic')}
                    onDisconnect={() => handleDisconnect('youtubeMusic')}
                    isLoading={loading}
                />
            </div>

            {connectingPlatform && (
                <ConnectModal 
                    platform={connectingPlatform} 
                    onClose={() => setConnectingPlatform(null)} 
                    onConnect={(id) => handleConnect(connectingPlatform, id)}
                    isLoading={loading}
                />
            )}
        </div>
    );
};

export default ConnectionsSettings;
