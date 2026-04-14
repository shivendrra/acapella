import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, ActivityIndicator,
} from 'react-native';
import { doc, updateDoc } from '@firebase/firestore';
import { useAuth } from '../../../../hooks/useAuth';
import { useTheme } from '../../../../hooks/useTheme';
import { db } from '../../../../services/firebase';

const ProfileSettings: React.FC = () => {
  const { userProfile, currentUser } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const c = isDark ? colors.dark : colors.light;

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [twitter, setTwitter] = useState('');
  const [instagram, setInstagram] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || '');
      setBio(userProfile.bio || '');
      setTwitter(userProfile.socials?.twitter || '');
      setInstagram(userProfile.socials?.instagram || '');
    }
  }, [userProfile]);

  const handleSave = async () => {
    if (!currentUser || !userProfile) return;
    const unchanged =
      displayName.trim() === (userProfile.displayName || '') &&
      bio.trim() === (userProfile.bio || '') &&
      twitter.trim() === (userProfile.socials?.twitter || '') &&
      instagram.trim() === (userProfile.socials?.instagram || '');
    if (unchanged) return;

    setLoading(true); setSuccess('');
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        displayName: displayName.trim(), bio: bio.trim(),
        socials: { twitter: twitter.trim(), instagram: instagram.trim() },
      });
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fields = [
    { label: 'Display Name', value: displayName, set: setDisplayName, multiline: false, placeholder: '' },
    { label: 'Bio', value: bio, set: setBio, multiline: true, placeholder: 'Tell us about yourself...' },
    { label: 'Twitter URL', value: twitter, set: setTwitter, multiline: false, placeholder: 'https://x.com/username' },
    { label: 'Instagram URL', value: instagram, set: setInstagram, multiline: false, placeholder: 'https://instagram.com/username' },
  ];

  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={styles.root}>
      <Text style={[styles.heading, { color: c.text }]}>Public Profile</Text>
      <Text style={[styles.sub, { color: c.muted }]}>
        This information will be displayed publicly on your profile page.
      </Text>

      {fields.map(f => (
        <View key={f.label} style={styles.field}>
          <Text style={[styles.label, { color: c.label }]}>{f.label}</Text>
          <TextInput
            style={[
              styles.input,
              f.multiline && styles.textarea,
              { borderColor: c.border, backgroundColor: c.inputBg, color: c.text },
            ]}
            value={f.value}
            onChangeText={f.set}
            multiline={f.multiline}
            numberOfLines={f.multiline ? 4 : 1}
            placeholder={f.placeholder}
            placeholderTextColor={c.muted}
            autoCapitalize="none"
          />
        </View>
      ))}

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: c.accent }, loading && styles.btnDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={styles.saveBtnText}>Save Changes</Text>
          }
        </TouchableOpacity>
        {success ? <Text style={styles.successText}>{success}</Text> : null}
      </View>
    </ScrollView>
  );
};

const colors = {
  light: { bg: '#f9fafb', text: '#111827', label: '#374151', muted: '#6b7280', accent: '#63479b', border: '#d1d5db', inputBg: '#ffffff' },
  dark: { bg: '#0f0f0f', text: '#f9fafb', label: '#d1d5db', muted: '#9ca3af', accent: '#a78bdf', border: '#374151', inputBg: '#1f2937' },
};

const styles = StyleSheet.create({
  root: { padding: 16, paddingBottom: 48, gap: 4 },
  heading: { fontSize: 26, fontWeight: '700', fontFamily: 'serif', marginBottom: 4 },
  sub: { fontSize: 13, marginBottom: 20 },
  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '500', marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  textarea: { minHeight: 90, textAlignVertical: 'top' },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  saveBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  btnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  successText: { fontSize: 13, color: '#16a34a' },
});

export default ProfileSettings;