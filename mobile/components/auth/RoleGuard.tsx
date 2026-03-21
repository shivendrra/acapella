import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { Role } from '../../types';

interface RoleGuardProps {
  allowedRoles: Role[];
  children: React.ReactNode;
}

const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles, children }) => {
  const { userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!userProfile || !allowedRoles.includes(userProfile.role)) {
      router.replace('/');
    }
  }, [userProfile, loading]);

  if (loading || !userProfile || !allowedRoles.includes(userProfile.role)) return null;

  return <>{children}</>;
};

export default RoleGuard;