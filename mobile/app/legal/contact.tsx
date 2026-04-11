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

import { TouchableOpacity, Linking } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const ContactPage: React.FC = () => {
  const c = useTheme().theme === 'dark' ? dark : light;
  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={s.root}>
      <Text style={[s.title, { color: c.text }]}>Contact Us</Text>
      <P t="We'd love to hear from you! Whether you have a question about features, pricing, or need support, our team is ready to help." c={c} />
      <View style={[s.contactCard, { backgroundColor: c.bg, borderColor: c.muted }]}>
        <View style={[s.contactIcon, { backgroundColor: '#63479b' }]}>
          <MaterialIcons name="email" size={22} color="#fff" />
        </View>
        <View>
          <Text style={[{ fontWeight: '700', fontSize: 15 }, { color: c.text }]}>Email Support</Text>
          <Text style={[{ fontSize: 13 }, { color: c.sub }]}>For general inquiries and support:</Text>
          <TouchableOpacity onPress={() => Linking.openURL('mailto:freakingaura@gmail.com')}>
            <Text style={[{ fontWeight: '700', fontSize: 14, marginTop: 2 }, { color: '#63479b' }]}>freakingaura@gmail.com</Text>
          </TouchableOpacity>
        </View>
      </View>
      <H t="Registered Address" c={c} />
      <P t={"Acapella HQ,\nSector-49, Noida,\nUP, India 201304"} c={c} />
    </ScrollView>
  );
};

export default ContactPage;

const s = StyleSheet.create({
  root: { padding: 16, paddingBottom: 48 },
  title: { fontSize: 26, fontWeight: '700', fontFamily: 'serif', marginBottom: 6 },
  date: { fontSize: 13, marginBottom: 16 },
  h: { fontSize: 17, fontWeight: '700', marginTop: 20, marginBottom: 6 },
  p: { fontSize: 14, lineHeight: 21, marginBottom: 8 },
  contactCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, borderWidth: 1, borderRadius: 10, padding: 14, marginVertical: 16 },
  contactIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});