import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

const light = { bg: '#f9fafb', text: '#111827', muted: '#6b7280', sub: '#374151', border: '#e5e7eb' };
const dark  = { bg: '#0f0f0f', text: '#f9fafb', muted: '#9ca3af', sub: '#d1d5db', border: '#374151' };

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

const ShippingPage: React.FC = () => {
  const c = useTheme().theme === 'dark' ? dark : light;
  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={s.root}>
      <Text style={[s.title, { color: c.text }]}>Shipping & Delivery</Text>
      <P t="Acapella is a digital platform." c={c} />
      <P t="We do not ship physical products. All services, including the Curator Membership, are delivered digitally and instantaneously upon successful payment." c={c} />
    </ScrollView>
  );
};

export default ShippingPage;

const s = StyleSheet.create({
  root: { padding: 16, paddingBottom: 48 },
  title: { fontSize: 26, fontWeight: '700', fontFamily: 'serif', marginBottom: 6 },
  date: { fontSize: 13, marginBottom: 16 },
  h: { fontSize: 17, fontWeight: '700', marginTop: 20, marginBottom: 6 },
  p: { fontSize: 14, lineHeight: 21, marginBottom: 8 },
  contactCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, borderWidth: 1, borderRadius: 10, padding: 14, marginVertical: 16 },
  contactIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});