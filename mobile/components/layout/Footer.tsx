import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';

const Footer: React.FC = () => {
  const { theme } = useTheme();
  const router = useRouter();
  const isDark = theme === 'dark';
  const c = isDark ? colors.dark : colors.light;

  const col1 = [
    { label: 'About', path: '/about' },
    { label: 'Help & Support', path: '/help' },
    { label: 'Contact Us', path: '/legal/contact' },
  ];
  const col2 = [
    { label: 'Terms & Conditions', path: '/legal/terms' },
    { label: 'Privacy Policy', path: '/legal/privacy' },
    { label: 'Cancellation & Refunds', path: '/legal/refunds' },
    { label: 'Shipping & Delivery', path: '/legal/shipping' },
  ];

  return (
    <View style={[styles.footer, { backgroundColor: c.bg, borderTopColor: c.border }]}>
      <View style={styles.grid}>
        <View style={styles.brand}>
          <Text style={[styles.brandName, { color: c.accent }]}>Acapella</Text>
          <Text style={[styles.tagline, { color: c.muted }]}>Your personal music diary.</Text>
        </View>
        <View style={styles.col}>
          {col1.map(({ label, path }) => (
            <TouchableOpacity key={path} onPress={() => router.push(path as any)}>
              <Text style={[styles.link, { color: c.muted }]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.col}>
          {col2.map(({ label, path }) => (
            <TouchableOpacity key={path} onPress={() => router.push(path as any)}>
              <Text style={[styles.link, { color: c.muted }]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <View style={[styles.bottom, { borderTopColor: c.divider }]}>
        <Text style={[styles.copy, { color: c.muted }]}>
          © {new Date().getFullYear()} Acapella. All rights reserved.
        </Text>
      </View>
    </View>
  );
};

const colors = {
  light: {
    bg: '#ffffff', border: 'rgba(99,71,155,0.2)',
    accent: '#63479b', muted: '#6b7280', divider: '#e5e7eb',
  },
  dark: {
    bg: '#0f0f0f', border: 'rgba(99,71,155,0.2)',
    accent: '#a78bdf', muted: '#9ca3af', divider: '#1f2937',
  },
};

const styles = StyleSheet.create({
  footer: { borderTopWidth: 1, paddingHorizontal: 16, paddingTop: 32, paddingBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 24, marginBottom: 24 },
  brand: { minWidth: 140 },
  brandName: { fontSize: 18, fontWeight: '700', fontFamily: 'serif', marginBottom: 4 },
  tagline: { fontSize: 13 },
  col: { flex: 1, minWidth: 120, gap: 8 },
  link: { fontSize: 13 },
  bottom: { borderTopWidth: 1, paddingTop: 16, alignItems: 'center' },
  copy: { fontSize: 11 },
});

export default Footer;