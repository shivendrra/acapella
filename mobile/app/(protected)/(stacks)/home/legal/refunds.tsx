import React from 'react';
import { Text, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '../../../../../hooks/useTheme';

const light = { bg: '#f9fafb', text: '#111827', muted: '#9ca3af', sub: '#374151' };
const dark = { bg: '#0f0f0f', text: '#f9fafb', muted: '#6b7280', sub: '#d1d5db' };

const RefundsPage: React.FC = () => {
  const c = useTheme().theme === 'dark' ? dark : light;
  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={s.root}>
      <Text style={[s.title, { color: c.text }]}>Cancellation & Refunds Policy</Text>
      <Text style={[s.date, { color: c.muted }]}>Last Updated: {new Date().toLocaleDateString()}</Text>
      <Text style={[s.p, { color: c.sub }]}>Thank you for supporting Acapella.</Text>
      <Text style={[s.h, { color: c.text }]}>Curator Membership</Text>
      <Text style={[s.p, { color: c.sub }]}>The Curator Membership is a voluntary contribution to support the platform. Membership payments are non-refundable. You may cancel your badge status at any time from your account settings, but no partial refunds will be issued for the remaining duration of your term.</Text>
      <Text style={[s.h, { color: c.text }]}>Contact Us</Text>
      <Text style={[s.p, { color: c.sub }]}>If you believe there has been an error in billing, please contact us at freakingaura@gmail.com.</Text>
    </ScrollView>
  );
};

const s = StyleSheet.create({
  root: { padding: 16, paddingBottom: 48 },
  title: { fontSize: 26, fontWeight: '700', fontFamily: 'serif', marginBottom: 6 },
  date: { fontSize: 13, marginBottom: 16 },
  h: { fontSize: 17, fontWeight: '700', marginTop: 20, marginBottom: 6 },
  p: { fontSize: 14, lineHeight: 21, marginBottom: 8 },
});

export default RefundsPage;