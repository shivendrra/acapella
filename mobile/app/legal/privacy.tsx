import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

const light = { bg: '#f9fafb', text: '#111827', muted: '#6b7280', sub: '#374151', border: '#e5e7eb' };
const dark  = { bg: '#0f0f0f', text: '#f9fafb', muted: '#9ca3af', sub: '#d1d5db', border: '#374151' };

const H = ({ t, c }: { t: string; c: any }) => <Text style={[s.h, { color: c.text }]}>{t}</Text>;
const P = ({ t, c }: { t: string; c: any }) => <Text style={[s.p, { color: c.sub }]}>{t}</Text>;

const LegalPage: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  const { theme } = useTheme();
  const c = theme === 'dark' ? dark : light;
  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
      <Text style={{ fontSize: 28, fontWeight: '700', fontFamily: 'serif', color: c.text, marginBottom: 20 }}>{title}</Text>
      {children}
    </ScrollView>
  );
};

const PrivacyPage: React.FC = () => {
  const c = useTheme().theme === 'dark' ? dark : light;
  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={s.root}>
      <Text style={[s.title, { color: c.text }]}>Privacy Policy</Text>
      <Text style={[s.date, { color: c.muted }]}>Last Updated: {new Date().toLocaleDateString()}</Text>
      <H t="1. Data Collection" c={c} />
      <P t="We collect information you provide directly to us, such as your email address, username, and profile picture when you create an account. We also track your interactions (reviews, likes, follows) to provide the service." c={c} />
      <H t="2. Data Usage" c={c} />
      <P t="We use your data to operate, maintain, and improve Acapella. We do not sell your personal data to third parties." c={c} />
      <H t="3. Payments" c={c} />
      <P t="Payment processing for the Curator Program is handled by Razorpay. We do not store your credit card information on our servers." c={c} />
    </ScrollView>
  );
};

export default PrivacyPage;

const s = StyleSheet.create({
  root: { padding: 16, paddingBottom: 48 },
  title: { fontSize: 26, fontWeight: '700', fontFamily: 'serif', marginBottom: 6 },
  date: { fontSize: 13, marginBottom: 16 },
  h: { fontSize: 17, fontWeight: '700', marginTop: 20, marginBottom: 6 },
  p: { fontSize: 14, lineHeight: 21, marginBottom: 8 },
  contactCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, borderWidth: 1, borderRadius: 10, padding: 14, marginVertical: 16 },
  contactIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});