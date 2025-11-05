import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { auth } from '../../services/firebase';
import { signOut } from 'firebase/auth';
import { Sun, Moon, LogOut, User, Settings, Shield, Edit } from 'lucide-react';
import { Role } from '../../types';

const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  return (
    <header className="bg-ac-light dark:bg-ac-dark shadow-md sticky top-0 z-50 transition-colors duration-300 border-b border-ac-primary/20">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <NavLink to="/" className="text-2xl font-bold text-ac-primary dark:text-ac-secondary font-serif">
              Acapella
            </NavLink>
            <div className="hidden md:flex md:ml-10 md:space-x-8">
              <NavLink to="/songs" className={({isActive}) => `text-gray-700 dark:text-gray-300 hover:text-ac-accent dark:hover:text-ac-accent px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'text-ac-accent font-semibold' : ''}`}>Songs</NavLink>
              <NavLink to="/albums" className={({isActive}) => `text-gray-700 dark:text-gray-300 hover:text-ac-accent dark:hover:text-ac-accent px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'text-ac-accent font-semibold' : ''}`}>Albums</NavLink>
              <NavLink to="/artists" className={({isActive}) => `text-gray-700 dark:text-gray-300 hover:text-ac-accent dark:hover:text-ac-accent px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'text-ac-accent font-semibold' : ''}`}>Artists</NavLink>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ac-accent"
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? <Moon className="h-6 w-6" /> : <Sun className="h-6 w-6" />}
            </button>
            {currentUser && userProfile ? (
              <div className="relative group">
                <button className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" aria-haspopup="true" aria-expanded="false">
                   <img className="h-8 w-8 rounded-full object-cover" src={userProfile.photoURL || `https://ui-avatars.com/api/?name=${userProfile.displayName || userProfile.email}&background=random`} alt="User avatar" />
                </button>
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-20 hidden group-hover:block ring-1 ring-black ring-opacity-5">
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-700 dark:text-gray-200">Signed in as</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{userProfile.displayName || userProfile.email}</p>
                  </div>
                  <div className="py-1">
                    <NavLink to={`/${userProfile.username}`} className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"><User className="mr-3 h-4 w-4"/>Profile</NavLink>
                    <NavLink to="/settings" className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"><Settings className="mr-3 h-4 w-4"/>Settings</NavLink>
                    
                    {userProfile.role === Role.USER && (
                      <NavLink to="/apply-for-admin" className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"><Edit className="mr-3 h-4 w-4"/>Apply for Admin</NavLink>
                    )}
                    
                    {(userProfile.role === Role.ADMIN || userProfile.role === Role.MASTER_ADMIN) && (
                       <NavLink to="/admin" className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"><Shield className="mr-3 h-4 w-4"/>Admin Panel</NavLink>
                    )}
                  </div>
                  <div className="py-1 border-t border-gray-200 dark:border-gray-700">
                    <button onClick={handleLogout} className="flex items-center w-full text-left px-4 py-2 text-sm text-ac-danger hover:bg-gray-100 dark:hover:bg-gray-700"><LogOut className="mr-3 h-4 w-4" />Logout</button>
                  </div>
                </div>
              </div>
            ) : (
              <NavLink to="/login" className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-ac-primary hover:bg-ac-primary/90 dark:bg-ac-secondary dark:hover:bg-ac-secondary/90">
                Log In
              </NavLink>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;