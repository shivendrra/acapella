import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Linking, LayoutAnimation,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { SafeAreaView } from 'react-native-safe-area-context';

const FAQ = [
  { q: 'What is Acapella?', a: 'Acapella is a social platform for music lovers. Log music you listen to, rate and review songs and albums, and share your musical taste with a community of friends and fellow fans. Think of it like Letterboxd or Goodreads, but for music.' },
  { q: 'How do I add a song or album?', a: 'Adding new music is restricted to users with Admin roles to maintain data quality and accuracy. If you\'re passionate about music and want to contribute, you can apply to become an admin through your profile menu.' },
  { q: 'How do ratings work?', a: 'You can rate any song or album on a scale of 1 to 5 stars. Ratings help you remember your thoughts and contribute to the overall community rating. You can also write a full review to share detailed thoughts.' },
  { q: 'What is a Curator?', a: 'The Curator program is a special tier for users who wish to support Acapella. By upgrading, you\'ll receive a Curator badge on your profile as a thank you for helping us grow.' },
  { q: 'How can I change my username or profile picture?', a: 'Update your public profile (display name, bio, favorites) in Settings > Profile. To change your username, go to Settings > Account.' },
];

const AccordionItem: React.FC<{ item: { q: string; a: string }; c: any }> = ({ item, c }) => {
  const [open, setOpen] = useState(false);
  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen(v => !v);
  };
  return (
    <View style={[styles.accordionItem, { borderBottomColor: c.border }]}>
      <TouchableOpacity style={styles.accordionHeader} onPress={toggle}>
        <Text style={[styles.accordionQ, { color: c.text }]}>{item.q}</Text>
        <MaterialIcons name={open ? 'expand-less' : 'expand-more'} size={24} color={c.muted} />
      </TouchableOpacity>
      {open && <Text style={[styles.accordionA, { color: c.muted }]}>{item.a}</Text>}
    </View>
  );
};

const HelpPage: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const c = isDark ? colors.dark : colors.light;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={styles.root}>
        <Text style={[styles.title, { color: c.text }]}>Help & Support</Text>
        <Text style={[styles.sub, { color: c.muted }]}>Find answers to your questions and get in touch with our team.</Text>

        <Text style={[styles.sectionTitle, { color: c.text }]}>Frequently Asked Questions</Text>
        <View style={styles.faqList}>
          {FAQ.map((item, i) => <AccordionItem key={i} item={item} c={c} />)}
        </View>

        <View style={[styles.ctaBox, { borderColor: c.border }]}>
          <Text style={[styles.ctaTitle, { color: c.text }]}>Still have questions?</Text>
          <Text style={[styles.ctaSub, { color: c.muted }]}>
            {"If you can't find the answer you're looking for, feel free to reach out."}
          </Text>
          <TouchableOpacity
            style={[styles.ctaBtn, { backgroundColor: c.accent }]}
            onPress={() => Linking.openURL('mailto:freakingaura@gmail.com')}
          >
            <MaterialIcons name="email" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.ctaBtnText}>Contact Support</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const colors = {
  light: { bg: '#f9fafb', text: '#111827', muted: '#6b7280', accent: '#6A9C89', border: '#e5e7eb' },
  dark: { bg: '#0f0f0f', text: '#f9fafb', muted: '#9ca3af', accent: '#6A9C89', border: '#374151' },
};

const styles = StyleSheet.create({
  root: { padding: 16, paddingBottom: 48 },
  title: { fontSize: 30, fontWeight: '700', fontFamily: 'serif', textAlign: 'center', marginBottom: 6 },
  sub: { fontSize: 14, textAlign: 'center', marginBottom: 32 },
  sectionTitle: { fontSize: 22, fontWeight: '700', fontFamily: 'serif', marginBottom: 12 },
  faqList: { marginBottom: 40 },
  accordionItem: { borderBottomWidth: 1, paddingVertical: 4 },
  accordionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
  accordionQ: { flex: 1, fontSize: 16, fontWeight: '600', marginRight: 8 },
  accordionA: { fontSize: 14, lineHeight: 21, paddingBottom: 14 },
  ctaBox: { borderWidth: 2, borderStyle: 'dashed', borderRadius: 12, padding: 24, alignItems: 'center' },
  ctaTitle: { fontSize: 20, fontWeight: '700', fontFamily: 'serif', marginBottom: 6 },
  ctaSub: { fontSize: 14, textAlign: 'center', marginBottom: 20 },
  ctaBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 },
  ctaBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});

export default HelpPage;