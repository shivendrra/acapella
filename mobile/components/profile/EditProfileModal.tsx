import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, Image,
  StyleSheet, Modal, Pressable, ActivityIndicator,
} from 'react-native';
import { doc, updateDoc, collection, query, where, getDocs, limit, documentId, orderBy } from '@firebase/firestore';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { db } from '../../services/firebase';
import { UserProfile, Song, Album } from '../../types';

const FavoriteSelector: React.FC<{
  label: string;
  collectionName: 'songs' | 'albums';
  initialIds: string[];
  onSelectionChange: (ids: string[]) => void;
  c: any;
}> = ({ label, collectionName, initialIds, onSelectionChange, c }) => {
  const [selected, setSelected] = useState<(Song | Album)[]>([]);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<(Song | Album)[]>([]);
  const [searching, setSearching] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!initialIds.length) return;
    getDocs(query(collection(db, collectionName), where(documentId(), 'in', initialIds)))
      .then(snap => {
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as Song | Album));
        setSelected(initialIds.map(id => items.find(i => i.id === id)).filter(Boolean) as (Song | Album)[]);
      })
      .catch(console.error);
  }, [initialIds, collectionName]);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (search.trim().length < 2) { setResults([]); return; }
    timer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const snap = await getDocs(query(
          collection(db, collectionName),
          where('title_lowercase', '>=', search.toLowerCase()),
          where('title_lowercase', '<=', search.toLowerCase() + '\uf8ff'),
          orderBy('title_lowercase'), limit(5)
        ));
        setResults(snap.docs.map(d => ({ id: d.id, ...d.data() } as Song | Album)));
      } catch { /* ignore */ }
      finally { setSearching(false); }
    }, 300);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [search, collectionName]);

  const add = (item: Song | Album) => {
    if (selected.length >= 4 || selected.some(i => i.id === item.id)) return;
    const next = [...selected, item];
    setSelected(next);
    onSelectionChange(next.map(i => i.id));
    setSearch(''); setResults([]);
  };

  const remove = (id: string) => {
    const next = selected.filter(i => i.id !== id);
    setSelected(next);
    onSelectionChange(next.map(i => i.id));
  };

  const slots = [...selected, ...Array(Math.max(0, 4 - selected.length)).fill(null)];

  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={[styles.label, { color: c.label }]}>{label}</Text>
      <View style={styles.slotsRow}>
        {slots.map((item, i) => (
          <View key={item?.id || `slot-${i}`} style={[styles.slot, { borderColor: c.border, backgroundColor: c.slotBg }]}>
            {item ? (
              <>
                <Image source={{ uri: (item as any).coverArtUrl }} style={styles.slotImg} />
                <TouchableOpacity style={styles.slotRemove} onPress={() => remove(item.id)}>
                  <MaterialIcons name="close" size={12} color="#fff" />
                </TouchableOpacity>
              </>
            ) : (
              <MaterialIcons name="music-note" size={22} color={c.muted} />
            )}
          </View>
        ))}
      </View>
      {selected.length < 4 && (
        <View>
          <View style={[styles.searchBar, { borderColor: c.border, backgroundColor: c.inputBg }]}>
            <MaterialIcons name="search" size={16} color={c.muted} />
            <TextInput
              style={[styles.searchInput, { color: c.text }]}
              placeholder={`Search ${collectionName}...`}
              placeholderTextColor={c.muted}
              value={search}
              onChangeText={setSearch}
            />
            {searching && <ActivityIndicator size="small" color={c.accent} />}
          </View>
          {results.length > 0 && (
            <View style={[styles.dropdown, { backgroundColor: c.inputBg, borderColor: c.border }]}>
              {results.map(item => (
                <TouchableOpacity key={item.id} style={[styles.dropdownRow, { borderBottomColor: c.border }]} onPress={() => add(item)}>
                  <Image source={{ uri: (item as any).coverArtUrl }} style={styles.dropdownThumb} />
                  <Text style={[{ fontSize: 13 }, { color: c.text }]} numberOfLines={1}>{item.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
};

interface Props {
  userProfile: UserProfile;
  onClose: () => void;
  onSave: (updated: Partial<UserProfile>) => void;
}

const EditProfileModal: React.FC<Props> = ({ userProfile, onClose, onSave }) => {
  const { currentUser } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const c = isDark ? colors.dark : colors.light;

  const [displayName, setDisplayName] = useState(userProfile.displayName || '');
  const [bio, setBio] = useState(userProfile.bio || '');
  const [photoURL, setPhotoURL] = useState(userProfile.photoURL || '');
  const [twitter, setTwitter] = useState(userProfile.socials?.twitter || '');
  const [instagram, setInstagram] = useState(userProfile.socials?.instagram || '');
  const [favSongIds, setFavSongIds] = useState(userProfile.favoriteSongIds || []);
  const [favAlbumIds, setFavAlbumIds] = useState(userProfile.favoriteAlbumIds || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!currentUser) { setError('Not authenticated.'); return; }
    setLoading(true); setError(null);
    try {
      const updated: Partial<UserProfile> = {
        displayName: displayName.trim(), bio: bio.trim(), photoURL: photoURL.trim(),
        socials: { twitter: twitter.trim(), instagram: instagram.trim() },
        favoriteSongIds: favSongIds, favoriteAlbumIds: favAlbumIds,
      };
      await updateDoc(doc(db, 'users', currentUser.uid), updated);
      onSave(updated); onClose();
    } catch (err: any) { setError('Failed to update: ' + err.message); }
    finally { setLoading(false); }
  };

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: c.bg }]}>
        <View style={[styles.header, { borderBottomColor: c.border }]}>
          <Text style={[styles.title, { color: c.text }]}>Edit Profile</Text>
          <TouchableOpacity onPress={onClose}><MaterialIcons name="close" size={24} color={c.icon} /></TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
          {/* Avatar preview */}
          <View style={{ alignItems: 'center', marginBottom: 4 }}>
            <Image
              source={{ uri: photoURL || `https://ui-avatars.com/api/?name=${displayName || 'A'}&background=random&size=128` }}
              style={styles.avatar}
            />
          </View>

          {[
            { label: 'Profile Picture URL', value: photoURL, set: setPhotoURL, key: 'url', multiline: false },
            { label: 'Display Name', value: displayName, set: setDisplayName, key: 'name', multiline: false },
          ].map(f => (
            <View key={f.key}>
              <Text style={[styles.label, { color: c.label }]}>{f.label}</Text>
              <TextInput
                style={[styles.input, { borderColor: c.border, backgroundColor: c.inputBg, color: c.text }]}
                value={f.value} onChangeText={f.set}
                keyboardType={f.key === 'url' ? 'url' : 'default'}
                autoCapitalize="none" placeholderTextColor={c.muted}
              />
            </View>
          ))}

          <View>
            <Text style={[styles.label, { color: c.label }]}>Bio</Text>
            <TextInput
              style={[styles.input, styles.textarea, { borderColor: c.border, backgroundColor: c.inputBg, color: c.text }]}
              value={bio} onChangeText={setBio}
              placeholder="Tell us about yourself..." placeholderTextColor={c.muted}
              multiline numberOfLines={4}
            />
          </View>

          {[
            { label: 'Twitter URL', value: twitter, set: setTwitter },
            { label: 'Instagram URL', value: instagram, set: setInstagram },
          ].map(f => (
            <View key={f.label}>
              <Text style={[styles.label, { color: c.label }]}>{f.label}</Text>
              <TextInput
                style={[styles.input, { borderColor: c.border, backgroundColor: c.inputBg, color: c.text }]}
                value={f.value} onChangeText={f.set}
                keyboardType="url" autoCapitalize="none" placeholderTextColor={c.muted}
                placeholder="https://..."
              />
            </View>
          ))}

          <FavoriteSelector label="Favorite Songs" collectionName="songs" initialIds={userProfile.favoriteSongIds || []} onSelectionChange={setFavSongIds} c={c} />
          <FavoriteSelector label="Favorite Albums" collectionName="albums" initialIds={userProfile.favoriteAlbumIds || []} onSelectionChange={setFavAlbumIds} c={c} />

          {error && <View style={[styles.errorBox, { borderColor: '#fca5a5' }]}><Text style={{ color: '#b91c1c', fontSize: 13 }}>{error}</Text></View>}

          <View style={styles.actions}>
            <TouchableOpacity style={[styles.cancelBtn, { borderColor: c.border }]} onPress={onClose}>
              <Text style={[{ fontWeight: '600', fontSize: 14 }, { color: c.text }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: c.accent }, loading && { opacity: 0.6 }]} onPress={handleSave} disabled={loading}>
              {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const colors = {
  light: { bg: '#ffffff', text: '#111827', label: '#374151', muted: '#9ca3af', icon: '#374151', accent: '#63479b', border: '#e5e7eb', inputBg: '#ffffff', slotBg: '#f9fafb' },
  dark: { bg: '#111827', text: '#f9fafb', label: '#d1d5db', muted: '#6b7280', icon: '#d1d5db', accent: '#a78bdf', border: '#374151', inputBg: '#1f2937', slotBg: '#374151' },
};

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.75)' },
  sheet: { position: 'absolute', bottom: 0, left: 0, right: 0, top: '5%', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  title: { fontSize: 20, fontWeight: '700', fontFamily: 'serif' },
  avatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: '#d1d5db' },
  label: { fontSize: 13, fontWeight: '500', marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13 },
  textarea: { minHeight: 80, textAlignVertical: 'top' },
  slotsRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  slot: { flex: 1, aspectRatio: 1, borderRadius: 8, borderWidth: 2, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  slotImg: { ...StyleSheet.absoluteFillObject, width: undefined, height: undefined },
  slotRemove: { position: 'absolute', top: 2, right: 2, backgroundColor: '#ef4444', borderRadius: 999, padding: 2 },
  searchBar: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, gap: 6 },
  searchInput: { flex: 1, fontSize: 13 },
  dropdown: { borderWidth: 1, borderRadius: 8, marginTop: 4, overflow: 'hidden' },
  dropdownRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderBottomWidth: 1 },
  dropdownThumb: { width: 32, height: 32, borderRadius: 4 },
  errorBox: { backgroundColor: '#fef2f2', borderWidth: 1, borderRadius: 8, padding: 12 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelBtn: { flex: 1, borderWidth: 1, borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  saveBtn: { flex: 2, borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});

export default EditProfileModal;