import React, { useEffect, useContext } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { LoadingContext } from '../context/AppLoadingContext';

import Lander from './Lander';
import Login from './Login';
import Signup from './Signup';
import Music from './Music';
import Curator from './Curator';

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
      <Route path="/" element={<Lander />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/music" element={<Music />} />
      <Route path="/curators" element={<Curator />} />
    </Routes>
  );
}