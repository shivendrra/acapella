import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

const light = { bg: '#f9fafb', text: '#111827', muted: '#9ca3af', sub: '#374151' };
const dark  = { bg: '#0f0f0f', text: '#f9fafb', muted: '#6b7280', sub: '#d1d5db' };

const H = ({ t, c }: { t: string; c: any }) => <Text style={[s.h, { color: c.text }]}>{t}</Text>;
const P = ({ t, c }: { t: string; c: any }) => <Text style={[s.p, { color: c.sub }]}>{t}</Text>;

const TermsPage: React.FC = () => {
  const c = useTheme().theme === 'dark' ? dark : light;
  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={s.root}>
      <Text style={[s.title, { color: c.text }]}>Terms and Conditions</Text>
      <Text style={[s.date, { color: c.muted }]}>Last Updated: {new Date().toLocaleDateString()}</Text>
      <P t="Welcome to Acapella. By using our website, you agree to these terms." c={c} />
      <H t="1. User Accounts" c={c} />
      <P t="You are responsible for maintaining the security of your account. You must not share your password or let others access your account." c={c} />
      <H t="2. Content" c={c} />
      <P t="Users are responsible for the reviews and content they post. We reserve the right to remove content that violates our community guidelines (e.g., hate speech, harassment)." c={c} />
      <H t="3. Curator Program" c={c} />
      <P t="The Curator Program is a support tier. It does not grant ownership or special administrative rights over the platform's data, other than the visual badge and potential early access features." c={c} />
      <H t="4. Changes to Terms" c={c} />
      <P t="We may modify these terms at any time. Continued use of the platform constitutes agreement to the new terms." c={c} />
    </ScrollView>
  );
};
export default TermsPage;

const s = StyleSheet.create({
  root: { padding: 16, paddingBottom: 48 },
  title: { fontSize: 26, fontWeight: '700', fontFamily: 'serif', marginBottom: 6 },
  date: { fontSize: 13, marginBottom: 16 },
  h: { fontSize: 17, fontWeight: '700', marginTop: 20, marginBottom: 6 },
  p: { fontSize: 14, lineHeight: 21, marginBottom: 8 },
  contactCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, borderWidth: 1, borderRadius: 10, padding: 14, marginVertical: 16 },
  contactIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});