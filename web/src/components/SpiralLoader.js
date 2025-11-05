import React, { useContext } from 'react';
import { LoadingContext } from '../contexts/AppLoadingContext';
import '../App.css';

export default function SpiralLoader() {
  const { loading } = useContext(LoadingContext);

  if (!loading) return null;

  return (
    <div className="loader-overlay">
      <div className="spiral-loader"></div>
    </div>
  );
}