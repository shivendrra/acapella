import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider } from './context/AppThemeContext';
import { LoadingProvider } from './context/AppLoadingContext';

import './App.css';

import Navbar from './components/Navbar';
import SpiralLoader from './components/SpiralLoader';
import PageRoutes from './components/PageRoutes'; // <-- move routes into a separate file

function App() {
  return (
    <ThemeProvider>
      <LoadingProvider>
        <Router>
          <Navbar />
          <SpiralLoader />
          <PageRoutes />
        </Router>
      </LoadingProvider>
    </ThemeProvider>
  );
}

export default App;