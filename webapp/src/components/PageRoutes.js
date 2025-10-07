import React, { useEffect, useContext } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { LoadingContext } from '../contexts/AppLoadingContext';
import { useAuth } from '../contexts/AuthContext';

import Lander from './Lander';
import Login from './Login';
import Signup from './Signup';
import Profile from './Profile';
import User from './User';
import Home from './Home';
import NotFound from './NotFound';

const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  if (loading) return null;
  return currentUser ? children : <Navigate to="/" />;
};

const PublicRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  if (loading) return null;
  return !currentUser ? children : <Navigate to="/home" />;
};

const HomeRoute = () => {
  const { currentUser, loading } = useAuth();
  if (loading) return null;
  return currentUser ? <Home /> : <Lander />;
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
      <Route path="*" element={<NotFound />} />
      <Route path="/" element={<HomeRoute />} />
      <Route path="/auth/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/auth/signup" element={<PublicRoute><Signup /></PublicRoute>} />

      {/* <Route path='/music' element={<Music/>} />
      <Route path='/curator' element={<Curator/>} /> */}

      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/user" element={<ProtectedRoute><User /></ProtectedRoute>} />
    </Routes>
  );
}