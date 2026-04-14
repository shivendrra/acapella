import { useEffect } from 'react';
import { Slot, useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import PageLoader from '../../components/common/PageLoader';

export default function AuthLayout() {
  const { currentUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && currentUser) {
      router.replace('/');
    }
  }, [currentUser, loading]);

  if (loading) return <PageLoader />;
  if (currentUser) return null;

  return <Slot />;
}