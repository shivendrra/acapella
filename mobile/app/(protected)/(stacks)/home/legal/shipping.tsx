import React from 'react';
import { Text, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '../../../../../hooks/useTheme';

const light = { bg: '#f9fafb', text: '#111827', muted: '#9ca3af', sub: '#374151' };
const dark = { bg: '#0f0f0f', text: '#f9fafb', muted: '#6b7280', sub: '#d1d5db' };

const ShippingPage: React.FC = () => {
  const c = useTheme().theme === 'dark' ? dark : light;
  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={s.root}>
      <Text style={[s.title, { color: c.text }]}>Shipping & Delivery</Text>
      <Text style={[s.p, { color: c.sub, fontWeight: '600', fontSize: 16 }]}>Acapella is a digital platform.</Text>
      <Text style={[s.p, { color: c.sub }]}>We do not ship physical products.</Text>
      <Text style={[s.p, { color: c.sub }]}>All services, including the Curator Membership, are delivered digitally and instantaneously upon successful payment.</Text>
    </ScrollView>
  );
};

const s = StyleSheet.create({
  root: { padding: 16, paddingBottom: 48 },
  title: { fontSize: 26, fontWeight: '700', fontFamily: 'serif', marginBottom: 16 },
  p: { fontSize: 14, lineHeight: 21, marginBottom: 8 },
});

export default ShippingPage;