import { useEffect } from 'react';
import { Slot, useRouter, usePathname } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import PageLoader from '../../components/common/PageLoader';

export default function ProtectedLayout() {
  const { currentUser, userProfile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    if (!currentUser) {
      router.replace('/(auth)/login');
      return;
    }

    if (userProfile && !userProfile.profileComplete && pathname !== '/profile-setup') {
      router.replace('/profile-setup');
      return;
    }

    if (userProfile && userProfile.profileComplete && pathname === '/profile-setup') {
      router.replace('/');
    }
  }, [currentUser, userProfile, loading, pathname, router]);

  if (loading) return <PageLoader />;
  if (!currentUser) return null;

  return <Slot />;
}