import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { sendPasswordResetEmail } from '@firebase/auth';
import { useAuth } from '../../../../../hooks/useAuth';
import { useTheme } from '../../../../../hooks/useTheme';
import { auth } from '../../../../../services/firebase';

const SecuritySettings: React.FC = () => {
  const { currentUser } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const c = isDark ? colors.dark : colors.light;

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!currentUser?.email) { setError('No email address is associated with this account.'); return; }
    setLoading(true); setMessage(''); setError('');
    try {
      await sendPasswordResetEmail(auth, currentUser.email);
      setMessage('Password reset link sent! Please check your email.');
    } catch { setError('Failed to send reset email. Please try again later.'); }
    finally { setLoading(false); }
  };

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <Text style={[styles.heading, { color: c.text }]}>Security</Text>
      <Text style={[styles.sub, { color: c.muted }]}>
        Manage your password and account security.
      </Text>

      <View style={[styles.card, { borderColor: c.border }]}>
        <Text style={[styles.cardTitle, { color: c.text }]}>Change Password</Text>
        <Text style={[styles.cardDesc, { color: c.muted }]}>
          {"We'll send a secure link to your email address to guide you through the process."}
        </Text>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: c.accent }, loading && styles.btnDisabled]}
          onPress={handleReset}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={styles.btnText}>Send Password Reset Link</Text>
          }
        </TouchableOpacity>
        {message ? <Text style={[styles.successText]}>{message}</Text> : null}
        {error ? <Text style={[styles.errorText]}>{error}</Text> : null}
      </View>

      <View style={[styles.card, styles.dashedCard, { borderColor: c.border }]}>
        <Text style={[{ color: c.muted, fontSize: 14 }]}>
          Two-factor authentication will be available here soon.
        </Text>
      </View>
    </View>
  );
};

const colors = {
  light: { bg: '#f9fafb', text: '#111827', muted: '#6b7280', accent: '#63479b', border: '#e5e7eb' },
  dark: { bg: '#0f0f0f', text: '#f9fafb', muted: '#9ca3af', accent: '#a78bdf', border: '#374151' },
};

const styles = StyleSheet.create({
  root: { flex: 1, padding: 16 },
  heading: { fontSize: 26, fontWeight: '700', fontFamily: 'serif', marginBottom: 4 },
  sub: { fontSize: 13, marginBottom: 20 },
  card: { borderWidth: 1, borderRadius: 10, padding: 16, marginBottom: 16 },
  dashedCard: { borderStyle: 'dashed' },
  cardTitle: { fontSize: 16, fontWeight: '600', marginBottom: 6 },
  cardDesc: { fontSize: 13, lineHeight: 18, marginBottom: 16 },
  btn: { alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  successText: { marginTop: 12, fontSize: 13, color: '#16a34a' },
  errorText: { marginTop: 12, fontSize: 13, color: '#ef4444' },
});

export default SecuritySettings;