
import React from 'react';

const PageLoader: React.FC = () => (
  <div className="flex items-center justify-center h-full w-full absolute inset-0">
    <img src="../../assets/svg/loading.svg" alt="Loading..." className="w-24 h-24 animate-spin" />
  </div>
);

export default PageLoader;
