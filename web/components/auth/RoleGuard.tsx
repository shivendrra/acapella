import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Role } from '../../types';

interface RoleGuardProps {
  allowedRoles: Role[];
}

const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles }) => {
  const { userProfile, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!userProfile || !allowedRoles.includes(userProfile.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default RoleGuard;
