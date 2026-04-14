import React from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet, Linking } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';

const TECH = [
  { name: 'React Native', desc: 'Frontend Framework' },
  { name: 'TypeScript', desc: 'Language' },
  { name: 'Firebase', desc: 'Backend & Database' },
  { name: 'Expo', desc: 'Mobile Platform' },
];

const AboutPage: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const c = isDark ? colors.dark : colors.light;

  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: c.text }]}>About Acapella</Text>
        <Text style={[styles.tagline, { color: c.muted }]}>
          Your personal music diary, built with passion for music lovers.
        </Text>
      </View>

      {/* Creator */}
      <View style={styles.creator}>
        <Image
          source={{ uri: 'https://avatars.githubusercontent.com/u/94288086?v=4' }}
          style={[styles.avatar, { borderColor: c.accent }]}
        />
        <Text style={[styles.creatorName, { color: c.text }]}>{"Hi, I'm Shivendra!"}</Text>
        <Text style={[styles.creatorBio, { color: c.bodyText }]}>I wanted an app like this so I created this!</Text>
        <Text style={[styles.creatorBio, { color: c.bodyText }]}>-from one music-lover to others.</Text>
        <View style={styles.socials}>
          <TouchableOpacity style={styles.socialBtn} onPress={() => Linking.openURL('mailto:shivharsh44@gmail.com')}>
            <MaterialIcons name="email" size={26} color={c.muted} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialBtn} onPress={() => Linking.openURL('https://github.com/shivendrra')}>
            <MaterialIcons name="code" size={26} color={c.muted} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialBtn} onPress={() => Linking.openURL('https://www.linkedin.com/in/shivendrra/')}>
            <MaterialIcons name="work" size={26} color={c.muted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tech stack */}
      <View style={[styles.techSection, { borderTopColor: c.border }]}>
        <Text style={[styles.techTitle, { color: c.text }]}>The Technology</Text>
        <Text style={[styles.techSub, { color: c.muted }]}>What makes Acapella tick.</Text>
        <View style={styles.techGrid}>
          {TECH.map(t => (
            <View key={t.name} style={styles.techItem}>
              <Text style={[styles.techName, { color: c.text }]}>{t.name}</Text>
              <Text style={[styles.techDesc, { color: c.muted }]}>{t.desc}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const colors = {
  light: { bg: '#f9fafb', text: '#111827', bodyText: '#374151', muted: '#6b7280', accent: '#a78bdf', border: '#e5e7eb' },
  dark: { bg: '#0f0f0f', text: '#f9fafb', bodyText: '#d1d5db', muted: '#9ca3af', accent: '#a78bdf', border: '#374151' },
};

const styles = StyleSheet.create({
  root: { padding: 24, paddingBottom: 48, alignItems: 'center' },
  header: { alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 32, fontWeight: '700', fontFamily: 'serif', textAlign: 'center' },
  tagline: { fontSize: 15, textAlign: 'center', marginTop: 8, lineHeight: 22 },
  creator: { alignItems: 'center', marginBottom: 48 },
  avatar: { width: 128, height: 128, borderRadius: 64, borderWidth: 4, marginBottom: 16 },
  creatorName: { fontSize: 24, fontWeight: '700', fontFamily: 'serif', marginBottom: 8 },
  creatorBio: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  socials: { flexDirection: 'row', gap: 20, marginTop: 20 },
  socialBtn: { padding: 6 },
  techSection: { width: '100%', borderTopWidth: 1, paddingTop: 32 },
  techTitle: { fontSize: 24, fontWeight: '700', fontFamily: 'serif', textAlign: 'center' },
  techSub: { fontSize: 14, textAlign: 'center', marginTop: 4, marginBottom: 24 },
  techGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16 },
  techItem: { width: '42%', alignItems: 'center', padding: 12 },
  techName: { fontSize: 16, fontWeight: '700' },
  techDesc: { fontSize: 13, marginTop: 4 },
});

export default AboutPage;