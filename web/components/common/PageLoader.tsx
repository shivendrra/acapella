
import React from 'react';

const PageLoader: React.FC = () => (
  <div className="flex items-center justify-center h-full w-full absolute inset-0">
    <img src="https://raw.githubusercontent.com/shivendrra/acapella/0231e28f1500eb57ed6880c0fee61678cc131a7c/web/assets/svg/Loading.svg" alt="Loading..." className="w-24 h-24 animate-spin" />
  </div>
);

export default PageLoader;
