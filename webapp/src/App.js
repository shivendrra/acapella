import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LoadingProvider } from './contexts/AppLoadingContext';
import SpiralLoader from './components/SpiralLoader';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import PageRoutes from './components/PageRoutes';
import './App.css';

function App() {
  return (
    <Router>
      <LoadingProvider>
        <AuthProvider>
          <SpiralLoader />
          <div className="app-container">
            <Navbar />
            <main className="main-content">
              <PageRoutes />
            </main>
            <Footer />
          </div>
        </AuthProvider>
      </LoadingProvider>
    </Router>
  );
}

export default App;