// ── notifications.tsx ──────────────────────────────────────────────────────
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../../hooks/useTheme';

const NotificationsSettings: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const c = isDark ? dark : light;
  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <Text style={[styles.heading, { color: c.text }]}>Notifications</Text>
      <Text style={[styles.sub, { color: c.muted }]}>Manage how you receive notifications from Acapella.</Text>
      <View style={[styles.placeholder, { borderColor: c.border }]}>
        <Text style={{ color: c.muted }}>Notification settings will be available here soon.</Text>
      </View>
    </View>
  );
};
export default NotificationsSettings;

const light = { bg: '#f9fafb', text: '#111827', muted: '#6b7280', border: '#e5e7eb' };
const dark  = { bg: '#0f0f0f', text: '#f9fafb', muted: '#9ca3af', border: '#374151' };

const styles = StyleSheet.create({
  root: { flex: 1, padding: 16 },
  heading: { fontSize: 26, fontWeight: '700', fontFamily: 'serif', marginBottom: 4 },
  sub: { fontSize: 13, marginBottom: 20 },
  placeholder: { borderWidth: 2, borderStyle: 'dashed', borderRadius: 8, padding: 20, alignItems: 'center' },
});