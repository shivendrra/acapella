import React from 'react';

const PageLoader: React.FC = () => (
  <div className="flex items-center justify-center h-full w-full absolute inset-0">
    <div className="w-16 h-16 border-4 border-t-ac-accent border-gray-200 dark:border-gray-600 rounded-full animate-spin"></div>
  </div>
);

export default PageLoader;
