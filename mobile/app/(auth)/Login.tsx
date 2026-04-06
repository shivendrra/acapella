import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Image, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import {
  GoogleAuthProvider, signInWithCredential,
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  fetchSignInMethodsForEmail, linkWithCredential,
} from '@firebase/auth';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { auth } from '../../services/firebase';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID = 'YOUR_EXPO_CLIENT_ID';
const GOOGLE_IOS_CLIENT_ID = 'YOUR_IOS_CLIENT_ID';
const GOOGLE_ANDROID_CLIENT_ID = 'YOUR_ANDROID_CLIENT_ID';

const GoogleIcon = () => (
  <Image
    source={{ uri: 'https://www.google.com/favicon.ico' }}
    style={{ width: 22, height: 22 }}
    resizeMode="contain"
  />
);

const phrases = [
  { text: 'Discover new music.', color: '#a78bdf' },
  { text: 'Share your favorites.', color: '#8b5cf6' },
  { text: 'Acapella.', color: '#ffffff' },
];

const Typewriter: React.FC = () => {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [text, setText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const current = phrases[phraseIndex];
    let timeout: ReturnType<typeof setTimeout>;

    if (isDeleting) {
      if (text.length > 0) {
        timeout = setTimeout(() => setText(t => t.slice(0, -1)), 75);
      } else {
        setIsDeleting(false);
        setPhraseIndex(p => (p + 1) % phrases.length);
      }
    } else {
      if (text.length < current.text.length) {
        timeout = setTimeout(() => setText(t => t + current.text[t.length]), 150);
      } else {
        timeout = setTimeout(() => setIsDeleting(true), 2000);
      }
    }
    return () => clearTimeout(timeout);
  }, [text, isDeleting, phraseIndex]);

  return (
    <View style={styles.typewriterRow}>
      <Text style={[styles.typewriterText, { color: phrases[phraseIndex].color }]}>{text}</Text>
      <View style={[styles.cursor, { backgroundColor: phrases[phraseIndex].color }]} />
    </View>
  );
};

const AuthPage: React.FC = () => {
  const [view, setView] = useState<'initial' | 'login' | 'signup'>('initial');
  const [email, setEmail] = useState(''), [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLinking, setIsLinking] = useState(false);
  const [pendingCredential, setPendingCredential] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const [, googleResponse, promptGoogleAsync] = Google.useAuthRequest({
    clientId: GOOGLE_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
  });

  useEffect(() => {
    if (googleResponse?.type === 'success') {
      const { id_token } = googleResponse.params;
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential)
        .then(() => router.replace('/'))
        .catch((err: any) => {
          if (err.code === 'auth/account-exists-with-different-credential') {
            const cred = GoogleAuthProvider.credentialFromError(err);
            setError(`Account exists with ${err.customData.email}. Log in to link.`);
            setPendingCredential(cred);
            setEmail(err.customData.email);
            setView('login');
            setIsLinking(true);
          } else {
            setError(err.message);
          }
        });
    }
  }, [googleResponse]);

  const handleEmailAuth = async () => {
    setError(null);
    setSubmitting(true);
    try {
      if (view === 'login') {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        if (isLinking && pendingCredential) {
          await linkWithCredential(cred.user, pendingCredential);
          setIsLinking(false);
          setPendingCredential(null);
        }
      } else {
        const methods = await fetchSignInMethodsForEmail(auth, email);
        if (methods.length > 0) {
          setError(`Account exists. Log in with ${methods[0].replace('.com', '')}.`);
          setSubmitting(false);
          return;
        }
        await createUserWithEmailAndPassword(auth, email, password);
      }
      router.replace('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setView('initial');
    setEmail(''); setPassword(''); setError(null);
    setIsLinking(false); setPendingCredential(null);
  };

  if (view === 'initial') {
    return (
      <View style={styles.initialRoot}>
        <View style={styles.heroSection}>
          <Typewriter />
        </View>
        <View style={styles.cardSection}>
          <View style={styles.cardInner}>
            <TouchableOpacity style={styles.googleBtn} onPress={() => promptGoogleAsync()}>
              <GoogleIcon />
              <Text style={styles.googleBtnText}>Continue with Google</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.signupBtn} onPress={() => setView('signup')}>
              <Text style={styles.signupBtnText}>Sign up</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.loginBtn} onPress={() => setView('login')}>
              <Text style={styles.loginBtnText}>Log in</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  const isLogin = view === 'login';
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.formRoot} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={resetForm} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={16} color="#a78bdf" />
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.formTitle}>
          {isLinking ? 'Link Your Google Account' : isLogin ? 'Welcome Back' : 'Create an Account'}
        </Text>
        {isLinking && (
          <Text style={styles.linkingSubtitle}>Enter the password for <Text style={{ fontWeight: '700' }}>{email}</Text> to continue.</Text>
        )}

        <View style={styles.inputGroup}>
          <TextInput
            style={[styles.input, styles.inputTop]}
            placeholder="Email address"
            placeholderTextColor="#9ca3af"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            editable={!isLinking}
          />
          <TextInput
            style={[styles.input, styles.inputBottom]}
            placeholder="Password"
            placeholderTextColor="#9ca3af"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        {error && (
          <View style={styles.errorBox}>
            <MaterialIcons name="warning" size={18} color="#ef4444" style={{ marginRight: 8 }} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
          onPress={handleEmailAuth}
          disabled={submitting}
        >
          {submitting
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.submitBtnText}>
              {isLinking ? 'Link Account & Log In' : isLogin ? 'Log in' : 'Create account'}
            </Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  initialRoot: { flex: 1, backgroundColor: '#2d0b4c' },
  heroSection: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  typewriterRow: { flexDirection: 'row', alignItems: 'center', minHeight: 72 },
  typewriterText: { fontSize: 40, fontWeight: '700', fontFamily: 'serif' },
  cursor: { width: 14, height: 14, borderRadius: 7, marginLeft: 10, marginTop: 4 },
  cardSection: {
    backgroundColor: '#000', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 32, paddingBottom: 48,
  },
  cardInner: { maxWidth: 360, width: '100%', alignSelf: 'center', gap: 12 },
  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fff', borderRadius: 12, paddingVertical: 14, gap: 10,
  },
  googleBtnText: { fontSize: 16, fontWeight: '600', color: '#111827' },
  signupBtn: {
    backgroundColor: '#1f2937', borderRadius: 12, paddingVertical: 14, alignItems: 'center',
  },
  signupBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  loginBtn: {
    borderWidth: 1, borderColor: '#374151', borderRadius: 12,
    paddingVertical: 14, alignItems: 'center', backgroundColor: '#000',
  },
  loginBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },

  formRoot: { flexGrow: 1, backgroundColor: '#fff', padding: 24, paddingTop: 48 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 32 },
  backBtnText: { color: '#a78bdf', fontWeight: '600' },
  formTitle: { fontSize: 28, fontWeight: '800', fontFamily: 'serif', textAlign: 'center', marginBottom: 8, color: '#111827' },
  linkingSubtitle: { fontSize: 13, color: '#6b7280', textAlign: 'center', marginBottom: 24 },
  inputGroup: { marginBottom: 16, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#d1d5db' },
  input: {
    paddingHorizontal: 12, paddingVertical: 14,
    fontSize: 14, color: '#111827', backgroundColor: '#fff',
  },
  inputTop: { borderBottomWidth: 1, borderBottomColor: '#d1d5db' },
  inputBottom: {},
  errorBox: {
    flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#fef2f2',
    borderWidth: 1, borderColor: '#fca5a5', borderRadius: 8, padding: 12, marginBottom: 16,
  },
  errorText: { flex: 1, fontSize: 13, color: '#b91c1c' },
  submitBtn: {
    backgroundColor: '#7c3aed', borderRadius: 8,
    paddingVertical: 14, alignItems: 'center',
  },
  submitBtnDisabled: { backgroundColor: '#9ca3af' },
  submitBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});

export default AuthPage;