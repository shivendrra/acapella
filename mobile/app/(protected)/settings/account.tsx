import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Modal, Pressable,
} from 'react-native';
import { doc, updateDoc, collection, query, where, getDocs, limit, deleteDoc, Timestamp } from '@firebase/firestore';
import { deleteUser } from '@firebase/auth';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../hooks/useAuth';
import { useTheme } from '../../../hooks/useTheme';
import { db } from '../../../services/firebase';
import { formatDate } from '../../../utils/formatters';
import { RESERVED_SLUGS } from '../../../utils/reserved-slugs';

const DiscontinueModal: React.FC<{ visible: boolean; onClose: () => void; onConfirm: () => void; c: any }> = ({ visible, onClose, onConfirm, c }) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <Pressable style={styles.overlay} onPress={onClose} />
    <View style={[styles.modalBox, { backgroundColor: c.bg }]}>
      <View style={styles.modalHeader}>
        <Text style={[styles.modalTitle, { color: '#ef4444' }]}>Cancel Membership</Text>
        <TouchableOpacity onPress={onClose}><MaterialIcons name="close" size={22} color={c.icon} /></TouchableOpacity>
      </View>
      <Text style={[styles.modalBody, { color: c.muted }]}>
        Are you sure you want to cancel your Curator badge? Since this is a one-time payment, canceling will immediately remove your badge with no refund.
      </Text>
      <View style={styles.modalBtns}>
        <TouchableOpacity style={[styles.modalBtn, { borderColor: c.border, borderWidth: 1 }]} onPress={onClose}>
          <Text style={{ color: c.text, fontWeight: '600' }}>Keep It</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#ef4444' }]} onPress={onConfirm}>
          <Text style={{ color: '#fff', fontWeight: '600' }}>Confirm Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

const DeleteModal: React.FC<{ visible: boolean; onClose: () => void; onConfirm: () => void; c: any }> = ({ visible, onClose, onConfirm, c }) => {
  const [confirmText, setConfirmText] = useState('');
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} />
      <View style={[styles.modalBox, { backgroundColor: c.bg }]}>
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: '#ef4444' }]}>Delete Account</Text>
          <TouchableOpacity onPress={onClose}><MaterialIcons name="close" size={22} color={c.icon} /></TouchableOpacity>
        </View>
        <MaterialIcons name="warning" size={44} color="#ef4444" style={{ alignSelf: 'center', marginBottom: 12 }} />
        <Text style={[styles.modalBody, { color: c.muted }]}>
          This is irreversible. All your data including profile, reviews, and activity will be permanently deleted.
        </Text>
        <Text style={[styles.label, { color: c.label, marginTop: 12 }]}>
          Type <Text style={{ color: '#ef4444', fontWeight: '700' }}>delete</Text> to confirm.
        </Text>
        <TextInput
          style={[styles.input, { borderColor: c.border, backgroundColor: c.inputBg, color: c.text, textAlign: 'center', marginTop: 8 }]}
          value={confirmText}
          onChangeText={setConfirmText}
          autoCapitalize="none"
        />
        <View style={styles.modalBtns}>
          <TouchableOpacity style={[styles.modalBtn, { borderColor: c.border, borderWidth: 1 }]} onPress={onClose}>
            <Text style={{ color: c.text, fontWeight: '600' }}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modalBtn, { backgroundColor: '#ef4444' }, confirmText !== 'delete' && { opacity: 0.4 }]}
            onPress={onConfirm}
            disabled={confirmText !== 'delete'}
          >
            <Text style={{ color: '#fff', fontWeight: '600' }}>Delete My Account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const AccountSettings: React.FC = () => {
  const { userProfile, currentUser } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const isDark = theme === 'dark';
  const c = isDark ? colors.dark : colors.light;

  const [username, setUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [discontinueOpen, setDiscontinueOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (userProfile) setUsername(userProfile.username || '');
  }, [userProfile]);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (!username) { setUsernameStatus('idle'); setUsernameError(null); return; }
    if (username === userProfile?.username) { setUsernameStatus('idle'); setUsernameError(null); return; }
    if (username.length < 3) { setUsernameStatus('invalid'); setUsernameError('Must be at least 3 characters.'); return; }
    if (!/^[a-z0-9_.]+$/.test(username)) { setUsernameStatus('invalid'); setUsernameError('Only lowercase letters, numbers, _ and . allowed.'); return; }
    if (RESERVED_SLUGS.has(username)) { setUsernameStatus('invalid'); setUsernameError('This username is RESERVED_SLUGS.'); return; }
    setUsernameStatus('checking'); setUsernameError(null);
    timer.current = setTimeout(async () => {
      const snap = await getDocs(query(collection(db, 'users'), where('username', '==', username), limit(1)));
      if (snap.empty) {
        setUsernameStatus('available');
      } else {
        setUsernameStatus('taken');
        setUsernameError('Already taken.');
      }
    }, 500);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [username, userProfile?.username]);

  const isUnchanged = username === userProfile?.username;
  const canSubmit = isUnchanged || usernameStatus === 'available';

  const handleUpdate = async () => {
    if (!currentUser || !userProfile || !canSubmit || isUnchanged) return;
    setLoading(true); setSuccess('');
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), { username: username.trim() });
      setSuccess('Username updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch { setUsernameError('Failed to update. Please try again.'); }
    finally { setLoading(false); }
  };

  const handleDiscontinue = async () => {
    if (!currentUser || !userProfile?.isCurator) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), { isCurator: false, curatorPlan: null, curatorExpiresAt: null });
      setSuccess('Curator membership cancelled.');
      setDiscontinueOpen(false);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!currentUser) return;
    setDeleteError('');
    try {
      await deleteDoc(doc(db, 'users', currentUser.uid));
      await deleteUser(currentUser);
      router.replace('/login');
    } catch (err: any) {
      if (err.code === 'auth/requires-recent-login') {
        setDeleteError('Please log out and log back in before deleting your account.');
      } else {
        setDeleteError('Failed to delete account. Please try again.');
      }
      setDeleteOpen(false);
    }
  };

  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={styles.root}>
      <Text style={[styles.heading, { color: c.text }]}>Account</Text>
      <Text style={[styles.sub, { color: c.muted }]}>Manage your username, email, and other account settings.</Text>

      {/* Username */}
      <View style={styles.field}>
        <Text style={[styles.label, { color: c.label }]}>Username</Text>
        <View style={[styles.usernameRow, { borderColor: c.border }]}>
          <View style={[styles.usernamePrefix, { backgroundColor: c.prefixBg, borderRightColor: c.border }]}>
            <Text style={{ fontSize: 13, color: c.muted }}>acapella.app/</Text>
          </View>
          <TextInput
            style={[styles.usernameInput, { backgroundColor: c.inputBg, color: c.text }]}
            value={username}
            onChangeText={t => setUsername(t.toLowerCase().trim())}
            autoCapitalize="none"
          />
        </View>
        {usernameStatus === 'checking' && <Text style={[styles.hint, { color: c.muted }]}>Checking...</Text>}
        {usernameStatus === 'available' && <Text style={[styles.hint, { color: '#16a34a' }]}>Username is available!</Text>}
        {usernameError && <Text style={[styles.hint, { color: '#ef4444' }]}>{usernameError}</Text>}
      </View>

      {/* Email (read-only) */}
      <View style={styles.field}>
        <Text style={[styles.label, { color: c.label }]}>Email Address</Text>
        <TextInput
          style={[styles.input, { borderColor: c.border, backgroundColor: c.readonlyBg, color: c.muted }]}
          value={userProfile?.email || ''}
          editable={false}
        />
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: c.accent }, (!canSubmit || loading) && styles.btnDisabled]}
          onPress={handleUpdate}
          disabled={!canSubmit || loading}
        >
          {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.btnText}>Update Account</Text>}
        </TouchableOpacity>
        {success && !userProfile?.isCurator ? <Text style={styles.successText}>{success}</Text> : null}
      </View>

      {/* Curator section */}
      {userProfile?.isCurator && (
        <View style={[styles.curatorCard, { borderColor: '#ca8a04', backgroundColor: isDark ? 'rgba(161,98,7,0.1)' : '#fefce8' }]}>
          <View style={styles.curatorHeader}>
            <View>
              <Text style={[styles.cardTitle, { color: c.text }]}>Curator Membership</Text>
              <Text style={{ fontSize: 13, color: c.muted }}>Thank you for supporting Acapella!</Text>
            </View>
            <View style={styles.activeBadge}><Text style={styles.activeBadgeText}>ACTIVE</Text></View>
          </View>
          <View style={[styles.curatorInfo, { backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : '#ffffff' }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.infoLabel, { color: c.muted }]}>PLAN</Text>
              <Text style={[styles.infoValue, { color: c.text }]}>{userProfile.curatorPlan || 'Standard'} Plan</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.infoLabel, { color: c.muted }]}>EXPIRES</Text>
              <Text style={[styles.infoValue, { color: c.text }]}>
                {userProfile.curatorExpiresAt instanceof Timestamp
                  ? formatDate(userProfile.curatorExpiresAt)
                  : 'Lifetime'}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => setDiscontinueOpen(true)}>
            <Text style={{ color: '#ef4444', fontSize: 13, fontWeight: '500', marginTop: 12 }}>Cancel Membership</Text>
          </TouchableOpacity>
          {success && userProfile.isCurator ? <Text style={[styles.successText, { marginTop: 8 }]}>{success}</Text> : null}
        </View>
      )}

      {/* Danger zone */}
      <View style={[styles.dangerCard, { borderColor: 'rgba(239,68,68,0.5)' }]}>
        <Text style={[styles.cardTitle, { color: '#ef4444' }]}>Danger Zone</Text>
        <Text style={[{ fontSize: 13, color: c.muted, marginVertical: 8 }]}>
          Deleting your account is permanent and cannot be undone.
        </Text>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => setDeleteOpen(true)}>
          <Text style={styles.deleteBtnText}>Delete My Account</Text>
        </TouchableOpacity>
        {deleteError ? <Text style={[styles.hint, { color: '#ef4444', marginTop: 8 }]}>{deleteError}</Text> : null}
      </View>

      <DiscontinueModal visible={discontinueOpen} onClose={() => setDiscontinueOpen(false)} onConfirm={handleDiscontinue} c={c} />
      <DeleteModal visible={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={handleDelete} c={c} />
    </ScrollView>
  );
};

const colors = {
  light: { bg: '#f9fafb', text: '#111827', label: '#374151', muted: '#6b7280', accent: '#63479b', border: '#d1d5db', inputBg: '#ffffff', prefixBg: '#f3f4f6', readonlyBg: '#f3f4f6', icon: '#374151' },
  dark: { bg: '#0f0f0f', text: '#f9fafb', label: '#d1d5db', muted: '#9ca3af', accent: '#a78bdf', border: '#374151', inputBg: '#1f2937', prefixBg: '#1f2937', readonlyBg: '#111827', icon: '#d1d5db' },
};

const styles = StyleSheet.create({
  root: { padding: 16, paddingBottom: 48 },
  heading: { fontSize: 26, fontWeight: '700', fontFamily: 'serif', marginBottom: 4 },
  sub: { fontSize: 13, marginBottom: 20 },
  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '500', marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  usernameRow: { flexDirection: 'row', borderWidth: 1, borderRadius: 8, overflow: 'hidden' },
  usernamePrefix: { justifyContent: 'center', paddingHorizontal: 10, borderRightWidth: 1 },
  usernameInput: { flex: 1, paddingHorizontal: 10, paddingVertical: 10, fontSize: 14 },
  hint: { fontSize: 12, marginTop: 4 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
  btn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  successText: { fontSize: 13, color: '#16a34a' },
  curatorCard: { borderWidth: 1, borderRadius: 10, padding: 16, marginBottom: 24 },
  curatorHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  activeBadge: { backgroundColor: '#7c3aed', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  activeBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
  curatorInfo: { flexDirection: 'row', borderRadius: 8, padding: 12 },
  infoLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8, marginBottom: 4 },
  infoValue: { fontSize: 14, fontWeight: '500' },
  cardTitle: { fontSize: 17, fontWeight: '700', fontFamily: 'serif', marginBottom: 4 },
  dangerCard: { borderWidth: 1, borderRadius: 10, padding: 16 },
  deleteBtn: { alignSelf: 'flex-start', backgroundColor: '#ef4444', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  deleteBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.75)' },
  modalBox: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 18, fontWeight: '700', fontFamily: 'serif' },
  modalBody: { fontSize: 14, lineHeight: 20, textAlign: 'center', marginBottom: 8 },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 16 },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
});

export default AccountSettings;