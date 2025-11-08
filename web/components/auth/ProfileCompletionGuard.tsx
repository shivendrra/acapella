import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import PageLoader from '../common/PageLoader';

const ProfileCompletionGuard: React.FC = () => {
    const { currentUser, userProfile, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <PageLoader />;
    }

    // If there is no user, they are a guest. Let them pass to view public content.
    if (!currentUser) {
        return <Outlet />;
    }

    // From this point, we know a user is logged in.
    
    // If the logged-in user's profile is incomplete, redirect them to the setup page.
    if (userProfile && !userProfile.profileComplete) {
        // Allow access to the setup page itself.
        if (location.pathname !== '/profile-setup') {
            return <Navigate to="/profile-setup" replace />;
        }
    }

    // If their profile is complete, but they are trying to access the setup page, redirect them home.
    if (userProfile && userProfile.profileComplete && location.pathname === '/profile-setup') {
        return <Navigate to="/" replace />;
    }

    // Otherwise, render the requested route for authenticated users.
    return <Outlet />;
};

export default ProfileCompletionGuard;
