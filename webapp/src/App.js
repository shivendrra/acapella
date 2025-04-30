import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/AppThemeContext';

import './App.css';

// importing components
import Lander from './components/Lander';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Signup from './components/Signup';
import Music from './components/Music';
import Curator from './components/Curator';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Lander />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/music" element={<Music />} />
          <Route path="/curators" element={<Curator />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;