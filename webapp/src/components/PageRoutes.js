import React, { useEffect, useContext } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { LoadingContext } from '../context/AppLoadingContext';
import { useAuth } from '../context/AuthContext';

import Lander from './Lander';
import Login from './Login';
import Signup from './Signup';
import Music from './Music';
import Curator from './Curator';
import Profile from './Profile';
import User from './User';

// Protected Route wrapper component
const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return null;
  }
  return currentUser ? children : <Navigate to="/login" />;
};

export default function PageRoutes() {
  const location = useLocation();
  const { setLoading } = useContext(LoadingContext);

  useEffect(() => {
    setLoading(true);
    const timeout = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timeout);
  }, [location.pathname, setLoading]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      
      {/* Protected Routes */}
      <Route path="/" element={<ProtectedRoute><Lander /></ProtectedRoute>} />
      <Route path="/music" element={<ProtectedRoute><Music /></ProtectedRoute>} />
      <Route path="/curators" element={<ProtectedRoute><Curator /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/user" element={<ProtectedRoute><User /></ProtectedRoute>} />
    </Routes>
  );
}