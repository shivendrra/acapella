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

const RefundsPage: React.FC = () => {
  const c = useTheme().theme === 'dark' ? dark : light;
  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={s.root}>
      <Text style={[s.title, { color: c.text }]}>Cancellation & Refunds Policy</Text>
      <Text style={[s.date, { color: c.muted }]}>Last Updated: {new Date().toLocaleDateString()}</Text>
      <P t="Thank you for supporting Acapella." c={c} />
      <H t="Curator Membership" c={c} />
      <P t="The Curator Membership is a voluntary contribution to support the platform. Membership payments are non-refundable. You may cancel your badge status at any time from your account settings, but no partial refunds will be issued for the remaining duration of your term." c={c} />
      <H t="Contact Us" c={c} />
      <P t="If you believe there has been an error in billing, please contact us at freakingaura@gmail.com." c={c} />
    </ScrollView>
  );
};

export default RefundsPage;

const s = StyleSheet.create({
  root: { padding: 16, paddingBottom: 48 },
  title: { fontSize: 26, fontWeight: '700', fontFamily: 'serif', marginBottom: 6 },
  date: { fontSize: 13, marginBottom: 16 },
  h: { fontSize: 17, fontWeight: '700', marginTop: 20, marginBottom: 6 },
  p: { fontSize: 14, lineHeight: 21, marginBottom: 8 },
  contactCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, borderWidth: 1, borderRadius: 10, padding: 14, marginVertical: 16 },
  contactIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});