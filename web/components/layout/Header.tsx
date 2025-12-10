
import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { auth } from '../../services/firebase';

import { signOut } from '@firebase/auth';
import { Sun, Moon, LogOut, User, Settings, Shield, Edit, Search, Menu, X, Sparkles } from 'lucide-react';
import { Role } from '../../types';

const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };
  
  const navLinkClass = "text-gray-700 dark:text-gray-300 hover:text-ac-accent dark:hover:text-ac-accent px-3 py-2 rounded-md text-sm font-medium";
  const navLinkActiveClass = "text-ac-accent font-semibold";

  const mobileNavLinkClass = "text-gray-700 dark:text-gray-300 hover:text-ac-accent dark:hover:text-ac-accent block px-3 py-2 rounded-md text-base font-medium";
  const mobileNavLinkActiveClass = "text-ac-accent font-semibold bg-gray-100 dark:bg-gray-800";
  const mobileFooterLinkClass = "text-sm text-gray-500 hover:text-ac-primary dark:text-gray-400 dark:hover:text-ac-secondary block py-1";


  return (
    <header className="bg-ac-light dark:bg-ac-dark shadow-md sticky top-0 z-50 transition-colors duration-300 border-b border-ac-primary/20">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 inline-flex items-center justify-center rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-ac-accent md:hidden"
              aria-controls="mobile-menu"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              <Menu className="block h-6 w-6" aria-hidden="true" />
            </button>
            <NavLink to="/" className="hidden md:block text-2xl font-bold text-ac-primary dark:text-ac-secondary font-serif">
              Acapella
            </NavLink>
          </div>
          <div className="hidden md:flex md:space-x-8">
            <NavLink to="/songs" className={({isActive}) => `${navLinkClass} ${isActive ? navLinkActiveClass : ''}`}>Songs</NavLink>
            <NavLink to="/albums" className={({isActive}) => `${navLinkClass} ${isActive ? navLinkActiveClass : ''}`}>Albums</NavLink>
            <NavLink to="/artists" className={({isActive}) => `${navLinkClass} ${isActive ? navLinkActiveClass : ''}`}>Artists</NavLink>
            <NavLink to="/curators" className={({isActive}) => `${navLinkClass} ${isActive ? navLinkActiveClass : ''}`}>Curators</NavLink>
          </div>
          <div className="flex items-center justify-end space-x-2 sm:space-x-4">
             <NavLink 
                to="/search" 
                className="p-2 flex-shrink-0 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ac-accent" 
                aria-label="Search"
            >
                <Search className="h-6 w-6" />
            </NavLink>
            <button
              onClick={toggleTheme}
              className="p-2 flex-shrink-0 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ac-accent"
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? <Moon className="h-6 w-6" /> : <Sun className="h-6 w-6" />}
            </button>
            {currentUser && userProfile ? (
              <div className="relative group">
                <button className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" aria-haspopup="true" aria-expanded="false">
                   <img className="h-8 w-8 rounded-full object-cover" src={userProfile.photoURL || `https://ui-avatars.com/api/?name=${userProfile.displayName || userProfile.email}&background=random`} alt="User avatar" />
                </button>
                <div className="absolute right-0 top-full pt-3 pb-1 w-56 bg-white dark:bg-gray-800 rounded-md shadow-lg z-20 hidden group-hover:block ring-1 ring-black ring-opacity-5">
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-700 dark:text-gray-200">Signed in as</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{userProfile.displayName || userProfile.email}</p>
                  </div>
                  <div className="py-1">
                    <NavLink to={`/${userProfile.username}`} className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"><User className="mr-3 h-4 w-4"/>Profile</NavLink>
                    <NavLink to="/settings" className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"><Settings className="mr-3 h-4 w-4"/>Settings</NavLink>
                    
                    {!userProfile.isCurator && (
                       <NavLink to="/curator-program" className="flex items-center w-full text-left px-4 py-2 text-sm text-yellow-600 dark:text-yellow-400 hover:bg-gray-100 dark:hover:bg-gray-700"><Sparkles className="mr-3 h-4 w-4"/>Become a Curator</NavLink>
                    )}

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

      {/* Side Menu */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-full max-w-xs transform transition-transform duration-300 ease-in-out md:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
      >
        <div className="h-full flex flex-col bg-ac-light dark:bg-ac-dark shadow-xl overflow-y-auto">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
            <NavLink to="/" onClick={() => setIsMobileMenuOpen(false)} className="text-2xl font-bold text-ac-primary dark:text-ac-secondary font-serif">
              Acapella
            </NavLink>
            <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 -mr-2 rounded-md">
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <div className="px-2 pt-4 pb-3 space-y-1 sm:px-3 flex-grow">
              <NavLink to="/songs" onClick={() => setIsMobileMenuOpen(false)} className={({isActive}) => `${mobileNavLinkClass} ${isActive ? mobileNavLinkActiveClass : ''}`}>Songs</NavLink>
              <NavLink to="/albums" onClick={() => setIsMobileMenuOpen(false)} className={({isActive}) => `${mobileNavLinkClass} ${isActive ? mobileNavLinkActiveClass : ''}`}>Albums</NavLink>
              <NavLink to="/artists" onClick={() => setIsMobileMenuOpen(false)} className={({isActive}) => `${mobileNavLinkClass} ${isActive ? mobileNavLinkActiveClass : ''}`}>Artists</NavLink>
              <NavLink to="/curators" onClick={() => setIsMobileMenuOpen(false)} className={({isActive}) => `${mobileNavLinkClass} ${isActive ? mobileNavLinkActiveClass : ''}`}>Curators</NavLink>
          </div>

          {/* Mobile Footer Section */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-black/20">
              <h4 className="font-serif font-bold text-ac-primary dark:text-ac-secondary mb-3">Explore & Support</h4>
              <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                      <NavLink to="/about" onClick={() => setIsMobileMenuOpen(false)} className={mobileFooterLinkClass}>About</NavLink>
                      <NavLink to="/help" onClick={() => setIsMobileMenuOpen(false)} className={mobileFooterLinkClass}>Help</NavLink>
                      <NavLink to="/contact" onClick={() => setIsMobileMenuOpen(false)} className={mobileFooterLinkClass}>Contact Us</NavLink>
                  </div>
                  <div>
                      <NavLink to="/terms" onClick={() => setIsMobileMenuOpen(false)} className={mobileFooterLinkClass}>Terms</NavLink>
                      <NavLink to="/privacy" onClick={() => setIsMobileMenuOpen(false)} className={mobileFooterLinkClass}>Privacy</NavLink>
                      <NavLink to="/refunds" onClick={() => setIsMobileMenuOpen(false)} className={mobileFooterLinkClass}>Refunds</NavLink>
                      <NavLink to="/shipping" onClick={() => setIsMobileMenuOpen(false)} className={mobileFooterLinkClass}>Shipping</NavLink>
                  </div>
              </div>
              <div className="text-center text-xs text-gray-400">
                  <p>&copy; {new Date().getFullYear()} Acapella.</p>
              </div>
          </div>
        </div>
      </div>
      
      {/* Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}
    </header>
  );
};

export default Header;
