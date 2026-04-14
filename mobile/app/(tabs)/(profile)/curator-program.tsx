import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { doc, updateDoc, Timestamp } from '@firebase/firestore';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import RazorpayCheckout from 'react-native-razorpay';
import { useAuth } from '../../../hooks/useAuth';
import { useTheme } from '../../../hooks/useTheme';
import { db } from '../../../services/firebase';

const RAZORPAY_KEY = 'rzp_test_Rkq0fPDN4qoV4h';

const BENEFITS = [
  { icon: 'verified', text: 'Official Curator Badge on your profile' },
  { icon: 'favorite', text: 'Directly support the Acapella platform' },
  { icon: 'bolt', text: 'Early access to new features (coming soon)' },
];

const CuratorProgramPage: React.FC = () => {
  const { userProfile, currentUser } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const isDark = theme === 'dark';
  const c = isDark ? colors.dark : colors.light;

  const [loading, setLoading] = useState<null | 'monthly' | 'yearly'>(null);
  const [error, setError] = useState('');

  const handlePayment = (plan: 'monthly' | 'yearly', amount: number) => {
    if (!currentUser || !userProfile) { setError('You must be logged in to become a Curator.'); return; }
    setLoading(plan); setError('');

    const options = {
      description: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Curator Membership`,
      image: 'https://avatars.githubusercontent.com/u/94288086?v=4',
      currency: 'USD',
      key: RAZORPAY_KEY,
      amount: amount * 100,
      name: 'Acapella',
      prefill: { email: userProfile.email || '', name: userProfile.displayName || '' },
      theme: { color: '#63479b' },
    };

    RazorpayCheckout.open(options)
      .then(async (data: any) => {
        try {
          const now = new Date();
          const expiry = new Date(now);
          plan === 'monthly' ? expiry.setDate(expiry.getDate() + 30) : expiry.setDate(expiry.getDate() + 365);
          await updateDoc(doc(db, 'users', currentUser.uid), {
            isCurator: true, curatorPlan: plan, curatorExpiresAt: Timestamp.fromDate(expiry),
          });
          Alert.alert('Welcome, Curator!', `Your membership is active until ${expiry.toLocaleDateString()}.`, [
            { text: 'OK', onPress: () => router.push(`/${userProfile.username}` as any) },
          ]);
        } catch {
          setError(`Payment successful (ID: ${data.razorpay_payment_id}) but profile update failed. Contact support.`);
        } finally { setLoading(null); }
      })
      .catch(() => { setLoading(null); });
  };

  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={styles.root}>
      {/* Hero */}
      <View style={[styles.hero, { backgroundColor: c.heroBg }]}>
        <Text style={[styles.heroTitle, { color: c.text }]}>Become a Curator</Text>
        <Text style={[styles.heroSub, { color: c.muted }]}>
          Support the platform you love, get recognized in the community, and help us build the future of music discovery.
        </Text>
      </View>

      {/* Benefits */}
      <View style={[styles.card, { borderColor: c.border, backgroundColor: c.cardBg }]}>
        <Text style={[styles.cardTitle, { color: c.text }]}>Why Join?</Text>
        {BENEFITS.map((b, i) => (
          <View key={i} style={styles.benefitRow}>
            <View style={[styles.benefitIcon, { backgroundColor: c.accentFaint }]}>
              <MaterialIcons name={b.icon as any} size={22} color={c.accent} />
            </View>
            <Text style={[styles.benefitText, { color: c.bodyText }]}>{b.text}</Text>
          </View>
        ))}
      </View>

      {/* Pricing */}
      <View style={[styles.card, { borderColor: c.border, backgroundColor: c.cardBg }]}>
        <Text style={[styles.cardTitle, { color: c.text }]}>Choose Your Plan</Text>
        <Text style={[styles.planSub, { color: c.muted }]}>Secure payment via Razorpay.</Text>

        {/* Monthly */}
        <TouchableOpacity
          style={[styles.planBtn, { borderColor: loading === 'monthly' ? c.accent : c.border }]}
          onPress={() => handlePayment('monthly', 5)}
          disabled={!!loading}
        >
          <View>
            <Text style={[styles.planName, { color: c.text }]}>Monthly</Text>
            <Text style={[styles.planDesc, { color: c.muted }]}>Flexible support</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.planPrice, { color: c.text }]}>$5</Text>
              <Text style={[styles.planPer, { color: c.muted }]}>/ month</Text>
            </View>
            {loading === 'monthly' && <ActivityIndicator size="small" color={c.accent} />}
          </View>
        </TouchableOpacity>

        {/* Yearly */}
        <TouchableOpacity
          style={[styles.planBtn, { borderColor: loading === 'yearly' ? c.accent : c.border, marginTop: 12 }]}
          onPress={() => handlePayment('yearly', 50)}
          disabled={!!loading}
        >
          <View style={[styles.saveBadge, { backgroundColor: c.accent }]}>
            <Text style={styles.saveBadgeText}>Save 16%</Text>
          </View>
          <View>
            <Text style={[styles.planName, { color: c.text }]}>Yearly</Text>
            <Text style={[styles.planDesc, { color: c.muted }]}>Best value</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.planPrice, { color: c.text }]}>$50</Text>
              <Text style={[styles.planPer, { color: c.muted }]}>/ year</Text>
            </View>
            {loading === 'yearly' && <ActivityIndicator size="small" color={c.accent} />}
          </View>
        </TouchableOpacity>

        {error ? (
          <View style={[styles.errorBox, { borderColor: '#fca5a5', backgroundColor: '#fef2f2' }]}>
            <Text style={{ color: '#dc2626', fontSize: 13, textAlign: 'center' }}>{error}</Text>
          </View>
        ) : null}

        <Text style={[styles.disclaimer, { color: c.muted }]}>
          By continuing, you agree to our Terms of Service. Payments are processed securely.
        </Text>
      </View>
    </ScrollView>
  );
};

const colors = {
  light: {
    bg: '#f9fafb', text: '#111827', bodyText: '#374151', muted: '#6b7280',
    accent: '#63479b', accentFaint: 'rgba(99,71,155,0.1)',
    border: '#e5e7eb', cardBg: '#ffffff', heroBg: 'rgba(99,71,155,0.05)',
  },
  dark: {
    bg: '#0f0f0f', text: '#f9fafb', bodyText: '#d1d5db', muted: '#9ca3af',
    accent: '#a78bdf', accentFaint: 'rgba(167,139,223,0.1)',
    border: '#374151', cardBg: '#1f2937', heroBg: 'rgba(167,139,223,0.05)',
  },
};

const styles = StyleSheet.create({
  root: { padding: 16, paddingBottom: 48, gap: 16 },
  hero: { borderRadius: 16, padding: 24, alignItems: 'center' },
  heroTitle: { fontSize: 28, fontWeight: '700', fontFamily: 'serif', textAlign: 'center', marginBottom: 8 },
  heroSub: { fontSize: 14, textAlign: 'center', lineHeight: 21 },
  card: { borderWidth: 1, borderRadius: 14, padding: 20, gap: 12 },
  cardTitle: { fontSize: 22, fontWeight: '700', fontFamily: 'serif', marginBottom: 4 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  benefitIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  benefitText: { flex: 1, fontSize: 15, fontWeight: '500' },
  planSub: { fontSize: 13, marginTop: -6 },
  planBtn: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 2, borderRadius: 12, padding: 16, overflow: 'hidden',
  },
  saveBadge: { position: 'absolute', top: 0, right: 0, paddingHorizontal: 8, paddingVertical: 4, borderBottomLeftRadius: 8 },
  saveBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  planName: { fontSize: 17, fontWeight: '700' },
  planDesc: { fontSize: 13, marginTop: 2 },
  planPrice: { fontSize: 24, fontWeight: '700' },
  planPer: { fontSize: 11 },
  errorBox: { borderWidth: 1, borderRadius: 8, padding: 12, marginTop: 4 },
  disclaimer: { fontSize: 11, textAlign: 'center', lineHeight: 16 },
});

export default CuratorProgramPage;