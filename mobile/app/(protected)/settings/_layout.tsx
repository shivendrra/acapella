import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useRouter, usePathname, Slot } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../../hooks/useTheme';

const NAV = [
  { name: 'Profile', path: '/(protected)/settings/profile', icon: 'person' },
  { name: 'Account', path: '/(protected)/settings/account', icon: 'shield' },
  { name: 'Security', path: '/(protected)/settings/security', icon: 'lock' },
  { name: 'Connections', path: '/(protected)/settings/connections', icon: 'link' },
  { name: 'Notifications', path: '/(protected)/settings/notifications', icon: 'notifications' },
  { name: 'Privacy', path: '/(protected)/settings/privacy', icon: 'visibility' },
];

const SettingsLayout: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const c = isDark ? colors.dark : colors.light;
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <Text style={[styles.heading, { color: c.text }]}>Settings</Text>

      {/* Horizontal tab strip */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.tabStrip, { borderBottomColor: c.border }]}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 4 }}
      >
        {NAV.map(item => {
          const active = pathname.includes(item.name.toLowerCase());
          return (
            <TouchableOpacity
              key={item.name}
              style={[styles.tab, active && { backgroundColor: c.activeBg }]}
              onPress={() => router.push(item.path as any)}
            >
              <MaterialIcons name={item.icon as any} size={20} color={active ? c.activeText : c.icon} />
              <Text style={[styles.tabText, { color: active ? c.activeText : c.icon }]}>{item.name}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Routed sub-page */}
      <View style={{ flex: 1 }}>
        <Slot />
      </View>
    </View>
  );
};

const colors = {
  light: { bg: '#f9fafb', text: '#111827', icon: '#6b7280', border: '#e5e7eb', activeBg: 'rgba(99,71,155,0.1)', activeText: '#63479b' },
  dark: { bg: '#0f0f0f', text: '#f9fafb', icon: '#9ca3af', border: '#374151', activeBg: 'rgba(167,139,223,0.15)', activeText: '#a78bdf' },
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  heading: { fontSize: 24, fontWeight: '700', fontFamily: 'serif', padding: 16, paddingBottom: 8 },
  tabStrip: { flexGrow: 0, borderBottomWidth: 1, paddingVertical: 8 },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  tabText: { fontSize: 13, fontWeight: '500' },
});

export default SettingsLayout;