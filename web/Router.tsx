import React, { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import PageLoader from './components/common/PageLoader';
import ProtectedRoute from './components/auth/ProtectedRoute';
import RoleGuard from './components/auth/RoleGuard';
import { Role } from './types';
import { useAuth } from './hooks/useAuth';
import ProfileCompletionGuard from './components/auth/ProfileCompletionGuard';

// Lazy load pages for code splitting and better performance
const HomePage = lazy(() => import('./pages/HomePage'));
const DiscoverPage = lazy(() => import('./pages/DiscoverPage'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const AdminApplicationPage = lazy(() => import('./pages/AdminApplicationPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const AlbumPage = lazy(() => import('./pages/AlbumPage'));
const ArtistPage = lazy(() => import('./pages/ArtistPage'));
const SongPage = lazy(() => import('./pages/SongPage'));
const ProfileSetupPage = lazy(() => import('./pages/ProfileSetupPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const CuratorsPage = lazy(() => import('./pages/CuratorsPage'));
const SongsIndexPage = lazy(() => import('./pages/SongsIndexPage'));
const AlbumsIndexPage = lazy(() => import('./pages/AlbumsIndexPage'));
const ArtistsIndexPage = lazy(() => import('./pages/ArtistsIndexPage'));
const UserLikesPage = lazy(() => import('./pages/UserLikesPage'));
const UserRatingsPage = lazy(() => import('./pages/UserRatingsPage'));
const UserReviewsPage = lazy(() => import('./pages/UserReviewsPage'));

// Settings Sub-pages
const ProfileSettings = lazy(() => import('./pages/settings/ProfileSettings'));
const AccountSettings = lazy(() => import('./pages/settings/AccountSettings'));
const SecuritySettings = lazy(() => import('./pages/settings/SecuritySettings'));
const ConnectionsSettings = lazy(() => import('./pages/settings/ConnectionsSettings'));
const NotificationsSettings = lazy(() => import('./pages/settings/NotificationsSettings'));
const PrivacySettings = lazy(() => import('./pages/settings/PrivacySettings'));

const AppRouter: React.FC = () => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  return (
    <HashRouter>
      <Layout>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public auth route */}
            <Route path="/login" element={!currentUser ? <AuthPage /> : <Navigate to="/" />} />

            {/* All other routes are wrapped by the ProfileCompletionGuard */}
            <Route element={<ProfileCompletionGuard />}>
              {/* Publicly viewable routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/discover" element={<DiscoverPage />} />
              <Route path="/songs" element={<SongsIndexPage />} />
              <Route path="/albums" element={<AlbumsIndexPage />} />
              <Route path="/artists" element={<ArtistsIndexPage />} />
              <Route path="/curators" element={<CuratorsPage />} />
              <Route path="/song/:id" element={<SongPage />} />
              <Route path="/album/:id" element={<AlbumPage />} />
              <Route path="/artist/:id" element={<ArtistPage />} />
              <Route path="/search" element={<SearchPage />} />
              
              {/* User Activity Pages */}
              <Route path="/:username/likes" element={<UserLikesPage />} />
              <Route path="/:username/ratings" element={<UserRatingsPage />} />
              <Route path="/:username/reviews" element={<UserReviewsPage />} />


              {/* Authenticated Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/apply-for-admin" element={<AdminApplicationPage />} />
                <Route path="/settings" element={<SettingsPage />}>
                  <Route index element={<Navigate to="profile" />} />
                  <Route path="profile" element={<ProfileSettings />} />
                  <Route path="account" element={<AccountSettings />} />
                  <Route path="security" element={<SecuritySettings />} />
                  <Route path="connections" element={<ConnectionsSettings />} />
                  <Route path="notifications" element={<NotificationsSettings />} />
                  <Route path="privacy" element={<PrivacySettings />} />
                </Route>
                <Route path="/profile-setup" element={<ProfileSetupPage />} />
              </Route>

              {/* Admin Routes */}
              <Route element={<RoleGuard allowedRoles={[Role.ADMIN, Role.MASTER_ADMIN]} />}>
                <Route path="/admin" element={<AdminPage />} />
              </Route>

              {/* Dynamic Username Route - MUST BE NEAR THE END */}
              <Route path="/:username" element={<ProfilePage />} />
            </Route>

            {/* 404 Not Found Route - MUST BE LAST */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </Layout>
    </HashRouter>
  );
};

export default AppRouter;