import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;
    const inProtected = segments[0] === '(protected)';
    if (!currentUser && inProtected) {
      router.replace('/login');
    }
  }, [currentUser, loading, segments]);

  if (loading) return null;

  return <>{children}</>;
};

export default ProtectedRoute;