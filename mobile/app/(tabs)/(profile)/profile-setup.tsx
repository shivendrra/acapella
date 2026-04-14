import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Image, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { doc, updateDoc, collection, query, where, getDocs, limit } from '@firebase/firestore';
import { useAuth } from '../../../hooks/useAuth';
import { useTheme } from '../../../hooks/useTheme';
import { db } from '../../../services/firebase';
import { RESERVED_SLUGS } from '../../../utils/reserved-slugs';

const ProfileSetupPage: React.FC = () => {
  const { userProfile, currentUser } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const c = isDark ? colors.dark : colors.light;

  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [username, setUsername] = useState('');
  const [photoURL, setPhotoURL] = useState(userProfile?.photoURL || '');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkUsername = useCallback(async (name: string) => {
    if (name.length < 3) { setUsernameStatus('invalid'); setUsernameError('Must be at least 3 characters.'); return; }
    if (!/^[a-z0-9_.]+$/.test(name)) { setUsernameStatus('invalid'); setUsernameError('Only lowercase letters, numbers, _ and . allowed.'); return; }
    if (RESERVED_SLUGS.has(name)) { setUsernameStatus('invalid'); setUsernameError('This username is reserved.'); return; }
    setUsernameStatus('checking'); setUsernameError(null);
    const snap = await getDocs(query(collection(db, 'users'), where('username', '==', name), limit(1)));
    if (!snap.empty) {
      setUsernameStatus('taken');
      setUsernameError('Already taken.');
    } else {
      setUsernameStatus('available');
    }
  }, []);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!username) { setUsernameStatus('idle'); setUsernameError(null); return; }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => { checkUsername(username); }, 500);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [username, checkUsername]);

  const handleSubmit = async () => {
    setError(null);
    if (usernameStatus !== 'available' || !displayName.trim()) {
      setError('Please set a display name and choose an available username.');
      return;
    }
    if (!currentUser) { setError('You must be logged in.'); return; }
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        displayName: displayName.trim(),
        username,
        photoURL: photoURL.trim(),
        profileComplete: true,
      });
    } catch (err: any) {
      setError('Failed to update profile. ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const avatarUri = photoURL || `https://ui-avatars.com/api/?name=${displayName || 'A'}&background=random&size=128`;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={[styles.root, { backgroundColor: c.bg }]} keyboardShouldPersistTaps="handled">
        <Text style={[styles.title, { color: c.text }]}>Welcome to Acapella!</Text>
        <Text style={[styles.subtitle, { color: c.muted }]}>{"Let's set up your profile to get you started."}</Text>

        <View style={styles.avatarRow}>
          <Image source={{ uri: avatarUri }} style={styles.avatar} />
        </View>

        <View style={styles.fields}>
          <Text style={[styles.label, { color: c.label }]}>Profile Picture URL</Text>
          <TextInput
            style={[styles.input, { borderColor: c.border, backgroundColor: c.inputBg, color: c.text }]}
            placeholder="https://..."
            placeholderTextColor={c.placeholder}
            keyboardType="url"
            autoCapitalize="none"
            value={photoURL}
            onChangeText={setPhotoURL}
          />

          <Text style={[styles.label, { color: c.label }]}>Display Name</Text>
          <TextInput
            style={[styles.input, { borderColor: c.border, backgroundColor: c.inputBg, color: c.text }]}
            placeholder="Your name"
            placeholderTextColor={c.placeholder}
            value={displayName}
            onChangeText={setDisplayName}
          />

          <Text style={[styles.label, { color: c.label }]}>Username</Text>
          <View style={[styles.usernameRow, { borderColor: c.border }]}>
            <View style={[styles.usernamePrefix, { backgroundColor: c.prefixBg, borderRightColor: c.border }]}>
              <Text style={[styles.usernamePrefixText, { color: c.muted }]}>acapella.app/</Text>
            </View>
            <TextInput
              style={[styles.usernameInput, { backgroundColor: c.inputBg, color: c.text }]}
              autoCapitalize="none"
              value={username}
              onChangeText={t => setUsername(t.toLowerCase().trim())}
            />
          </View>
          {usernameStatus === 'checking' && <Text style={[styles.hint, { color: c.muted }]}>Checking...</Text>}
          {usernameStatus === 'available' && <Text style={[styles.hint, { color: '#22c55e' }]}>Username is available!</Text>}
          {usernameError && <Text style={[styles.hint, { color: '#ef4444' }]}>{usernameError}</Text>}
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <TouchableOpacity
          style={[styles.submitBtn, (loading || usernameStatus !== 'available') && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading || usernameStatus !== 'available'}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.submitBtnText}>Complete Profile</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const colors = {
  light: {
    bg: '#f9fafb', text: '#111827', muted: '#6b7280', label: '#374151',
    border: '#d1d5db', inputBg: '#ffffff', prefixBg: '#f3f4f6', placeholder: '#9ca3af',
  },
  dark: {
    bg: '#0f0f0f', text: '#f9fafb', muted: '#9ca3af', label: '#d1d5db',
    border: '#374151', inputBg: '#1f2937', prefixBg: '#1f2937', placeholder: '#6b7280',
  },
};

const styles = StyleSheet.create({
  root: { flexGrow: 1, padding: 24, paddingTop: 48 },
  title: { fontSize: 28, fontWeight: '800', fontFamily: 'serif', textAlign: 'center' },
  subtitle: { fontSize: 13, textAlign: 'center', marginTop: 8, marginBottom: 24 },
  avatarRow: { alignItems: 'center', marginBottom: 24 },
  avatar: { width: 128, height: 128, borderRadius: 64, borderWidth: 4, borderColor: '#d1d5db' },
  fields: { gap: 4, marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '500', marginBottom: 4, marginTop: 12 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, fontSize: 14 },
  usernameRow: { flexDirection: 'row', borderWidth: 1, borderRadius: 8, overflow: 'hidden' },
  usernamePrefix: { justifyContent: 'center', paddingHorizontal: 10, borderRightWidth: 1 },
  usernamePrefixText: { fontSize: 13 },
  usernameInput: { flex: 1, paddingHorizontal: 10, paddingVertical: 10, fontSize: 14 },
  hint: { fontSize: 12, marginTop: 4 },
  errorText: { color: '#ef4444', fontSize: 13, textAlign: 'center', marginBottom: 12 },
  submitBtn: { backgroundColor: '#63479b', borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  submitBtnDisabled: { backgroundColor: '#9ca3af' },
  submitBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});

export default ProfileSetupPage;