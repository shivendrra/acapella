import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../hooks/useTheme';

const NotFoundPage: React.FC = () => {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const c = isDark ? colors.dark : colors.light;

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <MaterialIcons name="music-off" size={96} color={c.accent} style={styles.icon} />
      <Text style={[styles.title, { color: c.text }]}>Page Not Found</Text>
      <Text style={[styles.sub, { color: c.muted }]}>
        {"Sorry, we couldn't find the page you're looking for. The record might be scratched."}
      </Text>
      <TouchableOpacity style={[styles.btn, { backgroundColor: c.accent }]} onPress={() => router.replace('/')}>
        <Text style={styles.btnText}>Go back home</Text>
      </TouchableOpacity>
    </View>
  );
};

const colors = {
  light: { bg: '#f9fafb', text: '#111827', muted: '#6b7280', accent: '#63479b' },
  dark: { bg: '#0f0f0f', text: '#f9fafb', muted: '#9ca3af', accent: '#a78bdf' },
};

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  icon: { marginBottom: 16 },
  title: { fontSize: 32, fontWeight: '700', fontFamily: 'serif', textAlign: 'center', marginBottom: 12 },
  sub: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  btn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});

export default NotFoundPage;