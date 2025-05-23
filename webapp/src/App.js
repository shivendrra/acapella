import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { LoadingProvider } from './context/AppLoadingContext';

import './App.css';

import Navbar from './components/Navbar';
import SpiralLoader from './components/SpiralLoader';
import PageRoutes from './components/PageRoutes'; // <-- move routes into a separate file

function App() {
  return (
    <LoadingProvider>
      <Router>
        <Navbar />
        <SpiralLoader />
        <PageRoutes />
      </Router>
    </LoadingProvider>
  );
}

export default App;