import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Modal, Pressable, Alert,
} from 'react-native';
import { doc, updateDoc } from '@firebase/firestore';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../../../hooks/useAuth';
import { useTheme } from '../../../../hooks/useTheme';
import { db } from '../../../../services/firebase';

type Platform = 'spotify' | 'appleMusic' | 'youtubeMusic';

const PLATFORM_META: Record<Platform, { name: string; color: string; icon: string; desc: string }> = {
  spotify: { name: 'Spotify', color: '#1DB954', icon: 'music-note', desc: 'Connect to share Spotify playlists.' },
  appleMusic: { name: 'Apple Music', color: '#fc3c44', icon: 'apple', desc: 'Link your Apple Music profile.' },
  youtubeMusic: { name: 'YouTube Music', color: '#FF0000', icon: 'play-circle-outline', desc: 'Connect for YouTube Music sharing.' },
};

const ConnectModal: React.FC<{
  platform: Platform; onClose: () => void;
  onConnect: (id: string) => void; loading: boolean; c: any;
}> = ({ platform, onClose, onConnect, loading, c }) => {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const meta = PLATFORM_META[platform];

  const handleSubmit = () => {
    if (!value.trim()) { setError('Please enter your profile ID or username.'); return; }
    onConnect(value.trim());
  };

  return (
    <Modal visible animationType="fade" transparent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} />
      <View style={[styles.modalBox, { backgroundColor: c.bg }]}>
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: c.text }]}>Connect {meta.name}</Text>
          <TouchableOpacity onPress={onClose}><MaterialIcons name="close" size={22} color={c.icon} /></TouchableOpacity>
        </View>
        <Text style={[styles.label, { color: c.label }]}>
          Enter your {meta.name} Username or Profile ID
        </Text>
        <TextInput
          style={[styles.input, { borderColor: c.border, backgroundColor: c.inputBg, color: c.text }]}
          value={value}
          onChangeText={setValue}
          placeholder="e.g. user123 or profile URL"
          placeholderTextColor={c.muted}
          autoCapitalize="none"
          autoFocus
        />
        {error ? <Text style={[styles.hint, { color: '#ef4444' }]}>{error}</Text> : null}
        <Text style={[styles.note, { color: c.muted }]}>
          This allows others to find your profile on {meta.name}. Ensure your privacy settings on that platform allow public viewing.
        </Text>
        <View style={styles.modalBtns}>
          <TouchableOpacity style={[styles.modalBtn, { borderColor: c.border, borderWidth: 1 }]} onPress={onClose}>
            <Text style={{ color: c.text, fontWeight: '600' }}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modalBtn, { backgroundColor: c.accent }, loading && { opacity: 0.6 }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={{ color: '#fff', fontWeight: '600' }}>Connect Account</Text>
            }
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const ConnectionCard: React.FC<{
  platform: Platform; connectedId?: string;
  onConnect: () => void; onDisconnect: () => void;
  loading: boolean; c: any;
}> = ({ platform, connectedId, onConnect, onDisconnect, loading, c }) => {
  const meta = PLATFORM_META[platform];
  return (
    <View style={[styles.card, { borderColor: c.border, backgroundColor: c.cardBg }]}>
      <View style={styles.cardLeft}>
        <View style={[styles.iconCircle, { backgroundColor: c.iconBg }]}>
          <MaterialIcons name={meta.icon as any} size={24} color={meta.color} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={[styles.cardName, { color: c.text }]}>{meta.name}</Text>
            {connectedId && <MaterialIcons name="check-circle" size={16} color="#22c55e" />}
          </View>
          <Text style={[styles.cardDesc, { color: c.muted }]} numberOfLines={1}>
            {connectedId ? `Connected as ${connectedId}` : meta.desc}
          </Text>
        </View>
      </View>
      {connectedId ? (
        <TouchableOpacity
          style={[styles.actionBtn, { borderColor: '#fca5a5', backgroundColor: '#fef2f2' }]}
          onPress={onDisconnect}
          disabled={loading}
        >
          <Text style={{ color: '#dc2626', fontSize: 13, fontWeight: '600' }}>Disconnect</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.actionBtn, { borderColor: c.accentBorder, backgroundColor: c.accentFaint }]}
          onPress={onConnect}
          disabled={loading}
        >
          <Text style={{ color: c.accent, fontSize: 13, fontWeight: '600' }}>Connect</Text>
          <MaterialIcons name="open-in-new" size={12} color={c.accent} style={{ marginLeft: 4 }} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const ConnectionsSettings: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const c = isDark ? colors.dark : colors.light;

  const [connecting, setConnecting] = useState<Platform | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkedAccounts, setLinkedAccounts] = useState(userProfile?.linkedAccounts || {});

  const handleConnect = async (platform: Platform, id: string) => {
    if (!currentUser) return;
    setLoading(true); setError(null);
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), { [`linkedAccounts.${platform}`]: id });
      setLinkedAccounts(prev => ({ ...prev, [platform]: id }));
      setConnecting(null);
    } catch {
      setError('Failed to connect account. Please try again.');
    } finally { setLoading(false); }
  };

  const handleDisconnect = (platform: Platform) => {
    const meta = PLATFORM_META[platform];
    Alert.alert(`Disconnect ${meta.name}`, `Are you sure you want to disconnect your ${meta.name} account?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Disconnect', style: 'destructive', onPress: async () => {
          if (!currentUser) return;
          setLoading(true);
          try {
            await updateDoc(doc(db, 'users', currentUser.uid), { [`linkedAccounts.${platform}`]: null });
            setLinkedAccounts(prev => { const n = { ...prev }; delete (n as any)[platform]; return n; });
          } catch { setError('Failed to disconnect account.'); }
          finally { setLoading(false); }
        },
      },
    ]);
  };

  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={styles.root}>
      <Text style={[styles.heading, { color: c.text }]}>Connections</Text>
      <Text style={[styles.sub, { color: c.muted }]}>
        Connect your music accounts to easily share playlists and import your library in the future.
      </Text>

      {error && (
        <View style={[styles.errorBox, { borderColor: '#fca5a5', backgroundColor: '#fef2f2' }]}>
          <MaterialIcons name="error-outline" size={18} color="#dc2626" style={{ marginRight: 8 }} />
          <Text style={{ color: '#dc2626', fontSize: 13, flex: 1 }}>{error}</Text>
        </View>
      )}

      {(Object.keys(PLATFORM_META) as Platform[]).map(p => (
        <ConnectionCard
          key={p}
          platform={p}
          connectedId={(linkedAccounts as any)[p]}
          onConnect={() => setConnecting(p)}
          onDisconnect={() => handleDisconnect(p)}
          loading={loading}
          c={c}
        />
      ))}

      {connecting && (
        <ConnectModal
          platform={connecting}
          onClose={() => setConnecting(null)}
          onConnect={id => handleConnect(connecting, id)}
          loading={loading}
          c={c}
        />
      )}
    </ScrollView>
  );
};

const colors = {
  light: {
    bg: '#f9fafb', text: '#111827', label: '#374151', muted: '#6b7280',
    accent: '#63479b', accentFaint: 'rgba(99,71,155,0.05)', accentBorder: 'rgba(99,71,155,0.2)',
    border: '#e5e7eb', cardBg: '#ffffff', inputBg: '#ffffff', iconBg: '#f3f4f6', icon: '#374151',
  },
  dark: {
    bg: '#0f0f0f', text: '#f9fafb', label: '#d1d5db', muted: '#9ca3af',
    accent: '#a78bdf', accentFaint: 'rgba(167,139,223,0.05)', accentBorder: 'rgba(167,139,223,0.2)',
    border: '#374151', cardBg: 'rgba(31,41,55,0.5)', inputBg: '#1f2937', iconBg: '#374151', icon: '#d1d5db',
  },
};

const styles = StyleSheet.create({
  root: { padding: 16, paddingBottom: 48, gap: 12 },
  heading: { fontSize: 26, fontWeight: '700', fontFamily: 'serif', marginBottom: 4 },
  sub: { fontSize: 13, marginBottom: 8 },
  errorBox: { flexDirection: 'row', alignItems: 'flex-start', borderWidth: 1, borderRadius: 8, padding: 12 },
  card: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: 12, padding: 14, gap: 10 },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconCircle: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  cardName: { fontSize: 15, fontWeight: '700' },
  cardDesc: { fontSize: 12, marginTop: 2 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.75)' },
  modalBox: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, gap: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '700', fontFamily: 'serif' },
  label: { fontSize: 13, fontWeight: '500' },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  hint: { fontSize: 12 },
  note: { fontSize: 11, lineHeight: 16 },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 4 },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
});

export default ConnectionsSettings;