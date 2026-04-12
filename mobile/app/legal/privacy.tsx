import React from 'react';
import { Text, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

const light = { bg: '#f9fafb', text: '#111827', muted: '#9ca3af', sub: '#374151' };
const dark = { bg: '#0f0f0f', text: '#f9fafb', muted: '#6b7280', sub: '#d1d5db' };

const PrivacyPage: React.FC = () => {
  const c = useTheme().theme === 'dark' ? dark : light;
  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={s.root}>
      <Text style={[s.title, { color: c.text }]}>Privacy Policy</Text>
      <Text style={[s.date, { color: c.muted }]}>Last Updated: {new Date().toLocaleDateString()}</Text>
      <Text style={[s.h, { color: c.text }]}>1. Data Collection</Text>
      <Text style={[s.p, { color: c.sub }]}>We collect information you provide directly to us, such as your email address, username, and profile picture when you create an account. We also track your interactions (reviews, likes, follows) to provide the service.</Text>
      <Text style={[s.h, { color: c.text }]}>2. Data Usage</Text>
      <Text style={[s.p, { color: c.sub }]}>We use your data to operate, maintain, and improve Acapella. We do not sell your personal data to third parties.</Text>
      <Text style={[s.h, { color: c.text }]}>3. Payments</Text>
      <Text style={[s.p, { color: c.sub }]}>Payment processing for the Curator Program is handled by Razorpay. We do not store your credit card information on our servers.</Text>
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

export default PrivacyPage;