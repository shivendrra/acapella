import React from 'react';
import { UserProfile, Role } from '../../types';

interface UserBadgesProps {
  user: Partial<UserProfile>;
  noMargin?: boolean;
}

const Badge: React.FC<{ text: string; className: string }> = ({ text, className }) => (
  <span
    className={`px-2 py-0.5 text-xs font-semibold font-sans uppercase rounded-full tracking-wider ${className}`}
  >
    {text}
  </span>
);


const UserBadges: React.FC<UserBadgesProps> = ({ user, noMargin }) => {
  if (!user || (!user.isCurator && user.role !== Role.ADMIN && user.role !== Role.MASTER_ADMIN)) {
    return null;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 ${noMargin ? '' : 'ml-2'}`}>
      {user.isCurator && (
        <Badge text="Curator" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300" />
      )}
      {user.role === Role.ADMIN && (
        <Badge text="Admin" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" />
      )}
      {user.role === Role.MASTER_ADMIN && (
        <Badge text="Master Admin" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300" />
      )}
    </span>
  );
};

export default UserBadges;