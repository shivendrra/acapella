import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import PageLoader from './components/common/PageLoader';
import ProtectedRoute from './components/auth/ProtectedRoute';
import RoleGuard from './components/auth/RoleGuard';
import { Role } from './types';
import { useAuth } from './hooks/useAuth';

// Lazy load pages for code splitting and better performance
const HomePage = lazy(() => import('./pages/HomePage'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const AdminApplicationPage = lazy(() => import('./pages/AdminApplicationPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const AlbumPage = lazy(() => import('./pages/AlbumPage'));
const ArtistPage = lazy(() => import('./pages/ArtistPage'));
const SongPage = lazy(() => import('./pages/SongPage'));

// Settings Sub-pages
const ProfileSettings = lazy(() => import('./pages/settings/ProfileSettings'));
const AccountSettings = lazy(() => import('./pages/settings/AccountSettings'));

const AppRouter: React.FC = () => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  return (
    <BrowserRouter>
      <Layout>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={!currentUser ? <AuthPage /> : <Navigate to="/" />} />
            
            {/* Static routes defined BEFORE dynamic username route */}
            <Route path="/discover" element={<div>Discover Page</div>} />
            <Route path="/songs" element={<div>Songs Page</div>} />
            <Route path="/albums" element={<div>Albums Page</div>} />
            <Route path="/artists" element={<div>Artists Page</div>} />
            <Route path="/song/:id" element={<SongPage />} />
            <Route path="/album/:id" element={<AlbumPage />} />
            <Route path="/artist/:id" element={<ArtistPage />} />

            {/* Authenticated Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/apply-for-admin" element={<AdminApplicationPage />} />
              <Route path="/settings" element={<SettingsPage />}>
                <Route index element={<Navigate to="profile" />} />
                <Route path="profile" element={<ProfileSettings />} />
                <Route path="account" element={<AccountSettings />} />
                {/* Add other settings sub-routes here */}
              </Route>
            </Route>

            {/* Admin Routes */}
            <Route element={<RoleGuard allowedRoles={[Role.ADMIN, Role.MASTER_ADMIN]} />}>
              <Route path="/admin" element={<AdminPage />} />
            </Route>

            {/* Dynamic Username Route - MUST BE NEAR THE END */}
            <Route path="/:username" element={<ProfilePage />} />

            {/* 404 Not Found Route - MUST BE LAST */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </Layout>
    </BrowserRouter>
  );
};

export default AppRouter;