import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import PageLoader from '../common/PageLoader';

const ProfileCompletionGuard: React.FC = () => {
  const { userProfile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <PageLoader />;
  }

  // If user is logged-in and their profile is not complete, redirect to setup page.
  if (userProfile && !userProfile.profileComplete) {
    // Allow access to the setup page itself.
    if (location.pathname !== '/profile-setup') {
      return <Navigate to="/profile-setup" replace />;
    }
  }

  // If the profile is complete, but they are trying to access the setup page, redirect them home.
  if (userProfile && userProfile.profileComplete && location.pathname === '/profile-setup') {
    return <Navigate to="/" replace />;
  }

  // Otherwise, render the requested route.
  return <Outlet />;
};

export default ProfileCompletionGuard;
