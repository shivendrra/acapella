import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../../../../hooks/useTheme';
import { SafeAreaView } from 'react-native-safe-area-context';

const light = { bg: '#f9fafb', text: '#111827', muted: '#9ca3af', sub: '#374151', cardBg: '#f3f4f6' };
const dark = { bg: '#0f0f0f', text: '#f9fafb', muted: '#6b7280', sub: '#d1d5db', cardBg: '#1f2937' };

const ContactPage: React.FC = () => {
  const c = useTheme().theme === 'dark' ? dark : light;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={s.root}>
        <Text style={[s.title, { color: c.text }]}>Contact Us</Text>
        <Text style={[s.p, { color: c.sub }]}>
          {"We'd love to hear from you! Whether you have a question about features, pricing, or need support, our team is ready to help."}
        </Text>

        <View style={[s.card, { backgroundColor: c.cardBg }]}>
          <View style={s.iconWrapper}>
            <MaterialIcons name="email" size={24} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.cardTitle, { color: c.text }]}>Email Support</Text>
            <Text style={[s.p, { color: c.sub, marginBottom: 4 }]}>For general inquiries and support:</Text>
            <TouchableOpacity onPress={() => Linking.openURL('mailto:freakingaura@gmail.com')}>
              <Text style={s.email}>freakingaura@gmail.com</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={[s.h, { color: c.text }]}>Registered Address</Text>
        <Text style={[s.p, { color: c.sub }]}>{'Acapella HQ,\nSector-49, Noida,\nUP, India 201304'}</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  root: { padding: 16, paddingBottom: 48 },
  title: { fontSize: 26, fontWeight: '700', fontFamily: 'serif', marginBottom: 12 },
  h: { fontSize: 17, fontWeight: '700', marginTop: 20, marginBottom: 6 },
  p: { fontSize: 14, lineHeight: 21, marginBottom: 8 },
  card: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, borderRadius: 10, padding: 14, marginVertical: 16 },
  iconWrapper: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#63479b', alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontWeight: '700', fontSize: 15, marginBottom: 4 },
  email: { color: '#63479b', fontWeight: '700', fontSize: 14 },
});

export default ContactPage;