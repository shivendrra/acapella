import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { UserProfile, Role } from '../../types';

interface UserBadgesProps {
  user: Partial<UserProfile>;
  noMargin?: boolean;
}

interface BadgeProps {
  text: string;
  bg: string;
  color: string;
}

const Badge: React.FC<BadgeProps> = ({ text, bg, color }) => (
  <View style={[styles.badge, { backgroundColor: bg }]}>
    <Text style={[styles.badgeText, { color }]}>{text.toUpperCase()}</Text>
  </View>
);

const UserBadges: React.FC<UserBadgesProps> = ({ user, noMargin }) => {
  if (!user || (!user.isCurator && user.role !== Role.ADMIN && user.role !== Role.MASTER_ADMIN)) {
    return null;
  }

  return (
    <View style={[styles.container, !noMargin && styles.marginLeft]}>
      {user.isCurator && (
        <Badge text="Curator" bg="#fef9c3" color="#92400e" />
      )}
      {user.role === Role.ADMIN && (
        <Badge text="Admin" bg="#dbeafe" color="#1e40af" />
      )}
      {user.role === Role.MASTER_ADMIN && (
        <Badge text="Master Admin" bg="#fee2e2" color="#991b1b" />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  marginLeft: {
    marginLeft: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    fontFamily: 'sans-serif',
  },
});

export default UserBadges;