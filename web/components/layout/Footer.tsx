
import React from 'react';
import { NavLink } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="hidden md:block bg-ac-light dark:bg-ac-dark border-t border-ac-primary/20 transition-colors duration-300 mt-auto">
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
            <div>
                <h3 className="font-bold font-serif text-lg mb-2 text-ac-primary dark:text-ac-secondary">Acapella</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Your personal music diary.</p>
            </div>
            
            <div className="flex flex-col space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <NavLink to="/about" className="hover:text-ac-primary dark:hover:text-ac-secondary">About</NavLink>
                <NavLink to="/help" className="hover:text-ac-primary dark:hover:text-ac-secondary">Help & Support</NavLink>
                <NavLink to="/contact" className="hover:text-ac-primary dark:hover:text-ac-secondary">Contact Us</NavLink>
            </div>

            <div className="flex flex-col space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <NavLink to="/terms" className="hover:text-ac-primary dark:hover:text-ac-secondary">Terms & Conditions</NavLink>
                <NavLink to="/privacy" className="hover:text-ac-primary dark:hover:text-ac-secondary">Privacy Policy</NavLink>
                <NavLink to="/refunds" className="hover:text-ac-primary dark:hover:text-ac-secondary">Cancellation & Refunds</NavLink>
                <NavLink to="/shipping" className="hover:text-ac-primary dark:hover:text-ac-secondary">Shipping & Delivery</NavLink>
            </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-800 text-center text-xs text-gray-500 dark:text-gray-500">
            <p>&copy; {new Date().getFullYear()} Acapella. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
