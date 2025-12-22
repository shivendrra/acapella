
import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
const PlaylistPage = lazy(() => import('./pages/PlaylistPage'));
const UserPlaylistsPage = lazy(() => import('./pages/UserPlaylistsPage'));
const ProfileSetupPage = lazy(() => import('./pages/ProfileSetupPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const CuratorsPage = lazy(() => import('./pages/CuratorsPage'));
const SongsIndexPage = lazy(() => import('./pages/SongsIndexPage'));
const AlbumsIndexPage = lazy(() => import('./pages/AlbumsIndexPage'));
const ArtistsIndexPage = lazy(() => import('./pages/ArtistsIndexPage'));
const UserLikesPage = lazy(() => import('./pages/UserLikesPage'));
const UserRatingsPage = lazy(() => import('./pages/UserRatingsPage'));
const UserReviewsPage = lazy(() => import('./pages/UserReviewsPage'));
const ReviewPage = lazy(() => import('./pages/ReviewPage'));
const UserActivityPage = lazy(() => import('./pages/UserActivityPage'));
const ArtistSongsPage = lazy(() => import('./pages/ArtistSongsPage'));
const ArtistAlbumsPage = lazy(() => import('./pages/ArtistAlbumsPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const HelpPage = lazy(() => import('./pages/HelpPage'));
const CuratorProgramPage = lazy(() => import('./pages/CuratorProgramPage'));

// Legal Pages
const TermsPage = lazy(() => import('./pages/legal/TermsPage'));
const PrivacyPage = lazy(() => import('./pages/legal/PrivacyPage'));
const RefundsPage = lazy(() => import('./pages/legal/RefundsPage'));
const ShippingPage = lazy(() => import('./pages/legal/ShippingPage'));
const ContactPage = lazy(() => import('./pages/legal/ContactPage'));


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
    <BrowserRouter>
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
              <Route path="/artist/:id/songs" element={<ArtistSongsPage />} />
              <Route path="/artist/:id/albums" element={<ArtistAlbumsPage />} />
              <Route path="/playlist/:id" element={<PlaylistPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/review/:id" element={<ReviewPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/help" element={<HelpPage />} />
              
              {/* Legal Routes */}
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/refunds" element={<RefundsPage />} />
              <Route path="/shipping" element={<ShippingPage />} />
              <Route path="/contact" element={<ContactPage />} />
              
              {/* User Activity & Playlist Pages */}
              <Route path="/:username/likes" element={<UserLikesPage />} />
              <Route path="/:username/ratings" element={<UserRatingsPage />} />
              <Route path="/:username/reviews" element={<UserReviewsPage />} />
              <Route path="/:username/activity" element={<UserActivityPage />} />
              <Route path="/:username/playlists" element={<UserPlaylistsPage />} />


              {/* Authenticated Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/apply-for-admin" element={<AdminApplicationPage />} />
                <Route path="/curator-program" element={<CuratorProgramPage />} />
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
    </BrowserRouter>
  );
};

export default AppRouter;
