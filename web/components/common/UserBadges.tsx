import React from 'react';
import { UserProfile, Role } from '../../types';

interface UserBadgesProps {
  user: Partial<UserProfile>;
}

const UserBadges: React.FC<UserBadgesProps> = ({ user }) => {
  if (!user || (!user.isCurator && !user.role)) return null;

  return (
    <span className="inline-flex items-center gap-1.5 ml-2">
  {user.isCurator && (
    <span
      title="Curator"
      className="material-symbols-outlined"
      style={{ color: '#FF6C0C', fontSize: '24px' }}
      aria-label="Curator Badge"
    >
      star_shine
    </span>
  )}
  {user.role === Role.ADMIN && (
    <span
      title="Admin"
      className="material-symbols-outlined"
      style={{ color: '#0046FF', fontSize: '24px' }}
      aria-label="Admin Badge"
    >
      workspace_premium
    </span>
  )}
  {user.role === Role.MASTER_ADMIN && (
    <span
      title="Master Admin"
      className="material-symbols-outlined"
      style={{ color: '#A72703', fontSize: '24px' }}
      aria-label="Master Admin Badge"
    >
      crown
    </span>
  )}
</span>

  );
};

export default UserBadges;