import React from 'react';
import { Text, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '../../../../../hooks/useTheme';
import { SafeAreaView } from 'react-native-safe-area-context';

const light = { bg: '#f9fafb', text: '#111827', muted: '#9ca3af', sub: '#374151' };
const dark = { bg: '#0f0f0f', text: '#f9fafb', muted: '#6b7280', sub: '#d1d5db' };

const TermsPage: React.FC = () => {
  const c = useTheme().theme === 'dark' ? dark : light;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={s.root}>
        <Text style={[s.title, { color: c.text }]}>Terms and Conditions</Text>
        <Text style={[s.date, { color: c.muted }]}>Last Updated: {new Date().toLocaleDateString()}</Text>
        <Text style={[s.p, { color: c.sub }]}>Welcome to Acapella. By using our website, you agree to these terms.</Text>
        <Text style={[s.h, { color: c.text }]}>1. User Accounts</Text>
        <Text style={[s.p, { color: c.sub }]}>You are responsible for maintaining the security of your account. You must not share your password or let others access your account.</Text>
        <Text style={[s.h, { color: c.text }]}>2. Content</Text>
        <Text style={[s.p, { color: c.sub }]}>Users are responsible for the reviews and content they post. We reserve the right to remove content that violates our community guidelines.</Text>
        <Text style={[s.h, { color: c.text }]}>3. Curator Program</Text>
        <Text style={[s.p, { color: c.sub }]}>{"The Curator Program is a support tier. It does not grant ownership or special administrative rights over the platform's data."}</Text>
        <Text style={[s.h, { color: c.text }]}>4. Changes to Terms</Text>
        <Text style={[s.p, { color: c.sub }]}>We may modify these terms at any time. Continued use of the platform constitutes agreement to the new terms.</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  root: { padding: 16, paddingBottom: 48 },
  title: { fontSize: 26, fontWeight: '700', fontFamily: 'serif', marginBottom: 6 },
  date: { fontSize: 13, marginBottom: 16 },
  h: { fontSize: 17, fontWeight: '700', marginTop: 20, marginBottom: 6 },
  p: { fontSize: 14, lineHeight: 21, marginBottom: 8 },
});

export default TermsPage;