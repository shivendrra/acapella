import { useEffect } from 'react';
import { useRouter, usePathname } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import PageLoader from '../common/PageLoader';

const ProfileCompletionGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, userProfile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading || !currentUser) return;

    if (userProfile && !userProfile.profileComplete && pathname !== '/profile-setup') {
      router.replace('/(protected)/profile-setup');
      return;
    }

    if (userProfile && userProfile.profileComplete && pathname === '/profile-setup') {
      router.replace('/');
    }
  }, [currentUser, userProfile, loading, pathname]);

  if (loading) return <PageLoader />;

  return <>{children}</>;
};

export default ProfileCompletionGuard;