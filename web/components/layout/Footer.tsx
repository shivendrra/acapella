import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-ac-light dark:bg-ac-dark border-t border-ac-primary/20 transition-colors duration-300">
      <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8 text-center text-gray-500 dark:text-gray-400">
        <p>&copy; {new Date().getFullYear()} Acapella. All rights reserved.</p>
        <p className="text-sm mt-1">Your personal music diary.</p>
      </div>
    </footer>
  );
};

export default Footer;
