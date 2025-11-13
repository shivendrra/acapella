import React from 'react';

const PageLoader: React.FC = () => (
  <div className="flex items-center justify-center h-full w-full absolute inset-0">
    {/* 
      NOTE: The 'src' path below is a placeholder for your custom loading SVG. 
      As requested, you can add your 'loading.svg' to a 'media' folder in your project's root directory, 
      and this will work upon deployment.
    */}
    <img src="../../assets/svg/loading.svg" alt="Loading..." className="w-24 h-24 animate-spin" />
  </div>
);

export default PageLoader;