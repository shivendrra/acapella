import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, Image,
  StyleSheet, Modal, Pressable, ActivityIndicator,
} from 'react-native';
import {
  collection, addDoc, doc, updateDoc, serverTimestamp,
  query, where, getDocs, documentId, orderBy, limit,
} from '@firebase/firestore';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { db } from '../../services/firebase';
import { Playlist, Song } from '../../types';

interface Props {
  onClose: () => void;
  existingPlaylist?: Playlist;
  onSuccess?: () => void;
}

const PlaylistFormModal: React.FC<Props> = ({ onClose, existingPlaylist, onSuccess }) => {
  const { currentUser, userProfile } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const c = isDark ? colors.dark : colors.light;

  const [title, setTitle] = useState(existingPlaylist?.title || '');
  const [description, setDescription] = useState(existingPlaylist?.description || '');
  const [coverArtUrl, setCoverArtUrl] = useState(existingPlaylist?.coverArtUrl || '');
  const [platformLinks, setPlatformLinks] = useState({
    spotify: existingPlaylist?.platformLinks?.spotify || '',
    appleMusic: existingPlaylist?.platformLinks?.appleMusic || '',
    youtubeMusic: existingPlaylist?.platformLinks?.youtubeMusic || '',
  });
  const [selectedSongs, setSelectedSongs] = useState<Song[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loadingSongs, setLoadingSongs] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!existingPlaylist?.songIds?.length) return;
    setLoadingSongs(true);
    const ids = existingPlaylist.songIds;
    const chunks: string[][] = [];
    for (let i = 0; i < ids.length; i += 10) chunks.push(ids.slice(i, i + 10));
    Promise.all(chunks.map(c => getDocs(query(collection(db, 'songs'), where(documentId(), 'in', c)))))
      .then(snaps => {
        const all = snaps.flatMap(s => s.docs.map(d => ({ id: d.id, ...d.data() } as Song)));
        setSelectedSongs(ids.map(id => all.find(s => s.id === id)).filter(Boolean) as Song[]);
      })
      .catch(() => setError('Failed to load existing songs.'))
      .finally(() => setLoadingSongs(false));
  }, [existingPlaylist]);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (searchTerm.trim().length < 2) { setSearchResults([]); return; }
    searchTimer.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const snap = await getDocs(query(
          collection(db, 'songs'),
          where('title_lowercase', '>=', searchTerm.toLowerCase()),
          where('title_lowercase', '<=', searchTerm.toLowerCase() + '\uf8ff'),
          orderBy('title_lowercase'), limit(5)
        ));
        setSearchResults(snap.docs.map(d => ({ id: d.id, ...d.data() } as Song)));
      } catch { /* ignore */ }
      finally { setIsSearching(false); }
    }, 300);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [searchTerm]);

  const addSong = (song: Song) => {
    if (!selectedSongs.some(s => s.id === song.id)) setSelectedSongs(p => [...p, song]);
    setSearchTerm(''); setSearchResults([]);
  };

  const removeSong = (id: string) => setSelectedSongs(p => p.filter(s => s.id !== id));

  const handleSave = async () => {
    if (!currentUser || !userProfile) { setError('You must be logged in.'); return; }
    if (!title.trim()) { setError('Title is required.'); return; }
    setSaving(true); setError('');
    try {
      const clean = {
        spotify: (platformLinks.spotify || '').trim(),
        appleMusic: (platformLinks.appleMusic || '').trim(),
        youtubeMusic: (platformLinks.youtubeMusic || '').trim(),
      };
      const common = {
        title: title.trim(), description: (description || '').trim(),
        coverArtUrl: (coverArtUrl || '').trim(), platformLinks: clean,
        songIds: selectedSongs.map(s => s.id), updatedAt: serverTimestamp(),
      };
      if (existingPlaylist) {
        await updateDoc(doc(db, 'playlists', existingPlaylist.id), common);
      } else {
        await addDoc(collection(db, 'playlists'), { ...common, userId: currentUser.uid, userDisplayName: userProfile.displayName || userProfile.username || 'Anonymous', createdAt: serverTimestamp() });
      }
      onSuccess?.(); onClose();
    } catch (err: any) { setError('Failed to save. ' + (err.message || '')); }
    finally { setSaving(false); }
  };

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: c.bg }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: c.border }]}>
          <Text style={[styles.title, { color: c.text }]}>{existingPlaylist ? 'Edit Playlist' : 'Create New Playlist'}</Text>
          <TouchableOpacity onPress={onClose}><MaterialIcons name="close" size={24} color={c.icon} /></TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
          {/* Cover preview + URL */}
          <View style={styles.coverRow}>
            <Image source={{ uri: coverArtUrl || 'https://placehold.co/100x100?text=?' }} style={styles.coverPreview} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: c.label }]}>Cover Image URL</Text>
              <TextInput style={[styles.input, { borderColor: c.border, backgroundColor: c.inputBg, color: c.text }]} placeholder="https://..." placeholderTextColor={c.muted} value={coverArtUrl} onChangeText={setCoverArtUrl} keyboardType="url" autoCapitalize="none" />
            </View>
          </View>

          <View>
            <Text style={[styles.label, { color: c.label }]}>Title *</Text>
            <TextInput style={[styles.input, { borderColor: c.border, backgroundColor: c.inputBg, color: c.text }]} placeholder="e.g., Late Night Vibes" placeholderTextColor={c.muted} value={title} onChangeText={setTitle} />
          </View>

          <View>
            <Text style={[styles.label, { color: c.label }]}>Description</Text>
            <TextInput style={[styles.input, styles.textarea, { borderColor: c.border, backgroundColor: c.inputBg, color: c.text }]} placeholder="What is this playlist about?" placeholderTextColor={c.muted} value={description} onChangeText={setDescription} multiline numberOfLines={3} />
          </View>

          {/* Platform links */}
          <View style={[styles.platformSection, { borderTopColor: c.border }]}>
            <Text style={[styles.sectionLabel, { color: c.muted }]}>EXTERNAL LINKS (OPTIONAL)</Text>
            {[
              { key: 'spotify', color: '#1DB954', placeholder: 'Spotify URL' },
              { key: 'appleMusic', color: '#000', placeholder: 'Apple Music URL' },
              { key: 'youtubeMusic', color: '#FF0000', placeholder: 'YouTube Music URL' },
            ].map(({ key, color, placeholder }) => (
              <View key={key} style={styles.platformRow}>
                <View style={[styles.platformDot, { backgroundColor: color }]} />
                <TextInput
                  style={[styles.input, { flex: 1, borderColor: c.border, backgroundColor: c.inputBg, color: c.text }]}
                  placeholder={placeholder} placeholderTextColor={c.muted}
                  value={(platformLinks as any)[key]}
                  onChangeText={v => setPlatformLinks(p => ({ ...p, [key]: v }))}
                  keyboardType="url" autoCapitalize="none"
                />
              </View>
            ))}
          </View>

          {/* Song search */}
          <View style={[styles.platformSection, { borderTopColor: c.border }]}>
            <Text style={[styles.sectionLabel, { color: c.muted }]}>ADD SONGS</Text>
            <View style={[styles.searchBar, { borderColor: c.border, backgroundColor: c.inputBg }]}>
              <MaterialIcons name="search" size={18} color={c.muted} />
              <TextInput
                style={[styles.searchInput, { color: c.text }]}
                placeholder="Search by song title..." placeholderTextColor={c.muted}
                value={searchTerm} onChangeText={setSearchTerm}
              />
              {isSearching && <ActivityIndicator size="small" color={c.accent} />}
            </View>
            {searchResults.length > 0 && (
              <View style={[styles.searchDropdown, { backgroundColor: c.inputBg, borderColor: c.border }]}>
                {searchResults.map(song => (
                  <TouchableOpacity key={song.id} style={[styles.searchResult, { borderBottomColor: c.border }]} onPress={() => addSong(song)}>
                    <Image source={{ uri: song.coverArtUrl }} style={styles.searchThumb} />
                    <View style={{ flex: 1 }}>
                      <Text style={[{ fontSize: 13, fontWeight: '600' }, { color: c.text }]} numberOfLines={1}>{song.title}</Text>
                      <Text style={{ fontSize: 11, color: c.muted }}>{song.genre}</Text>
                    </View>
                    <MaterialIcons name="add" size={18} color={c.accent} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Tracklist */}
          <View>
            <Text style={[styles.sectionLabel, { color: c.muted }]}>TRACKS ({selectedSongs.length})</Text>
            {loadingSongs
              ? <ActivityIndicator color={c.accent} style={{ marginTop: 12 }} />
              : selectedSongs.length === 0
                ? <View style={[styles.emptyTracks, { borderColor: c.border }]}>
                    <MaterialIcons name="music-note" size={28} color={c.muted} />
                    <Text style={{ color: c.muted, marginTop: 6, fontSize: 13 }}>No songs added yet.</Text>
                  </View>
                : selectedSongs.map((song, i) => (
                  <View key={`${song.id}-${i}`} style={[styles.trackRow, { backgroundColor: c.cardBg, borderColor: c.border }]}>
                    <Text style={[styles.trackNum, { color: c.muted }]}>{i + 1}</Text>
                    <Image source={{ uri: song.coverArtUrl }} style={styles.trackThumb} />
                    <View style={{ flex: 1 }}>
                      <Text style={[{ fontSize: 13, fontWeight: '600' }, { color: c.text }]} numberOfLines={1}>{song.title}</Text>
                      <Text style={{ fontSize: 11, color: c.muted }}>{song.genre}</Text>
                    </View>
                    <TouchableOpacity onPress={() => removeSong(song.id)}>
                      <MaterialIcons name="delete-outline" size={20} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ))
            }
          </View>

          {error ? <Text style={{ color: '#ef4444', fontSize: 13 }}>{error}</Text> : null}

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={[styles.cancelBtn, { borderColor: c.border }]} onPress={onClose}>
              <Text style={[styles.cancelText, { color: c.text }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: c.accent }, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
              {saving
                ? <ActivityIndicator size="small" color="#fff" />
                : <><MaterialIcons name="save" size={16} color="#fff" style={{ marginRight: 6 }} /><Text style={styles.saveBtnText}>{existingPlaylist ? 'Save Changes' : 'Create Playlist'}</Text></>
              }
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const colors = {
  light: { bg: '#ffffff', text: '#111827', muted: '#6b7280', label: '#374151', icon: '#374151', accent: '#63479b', border: '#e5e7eb', inputBg: '#ffffff', cardBg: '#f9fafb' },
  dark: { bg: '#111827', text: '#f9fafb', muted: '#9ca3af', label: '#d1d5db', icon: '#d1d5db', accent: '#a78bdf', border: '#374151', inputBg: '#1f2937', cardBg: '#1f2937' },
};

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.8)' },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0, top: '10%',
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  title: { fontSize: 18, fontWeight: '700', fontFamily: 'serif' },
  coverRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  coverPreview: { width: 80, height: 80, borderRadius: 8 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13 },
  textarea: { minHeight: 70, textAlignVertical: 'top' },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 10 },
  platformSection: { borderTopWidth: 1, paddingTop: 16, gap: 8 },
  platformRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  platformDot: { width: 12, height: 12, borderRadius: 6, flexShrink: 0 },
  searchBar: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, gap: 6 },
  searchInput: { flex: 1, fontSize: 13 },
  searchDropdown: { borderWidth: 1, borderRadius: 8, overflow: 'hidden', marginTop: 4 },
  searchResult: { flexDirection: 'row', alignItems: 'center', padding: 10, gap: 10, borderBottomWidth: 1 },
  searchThumb: { width: 38, height: 38, borderRadius: 4 },
  emptyTracks: { borderWidth: 2, borderStyle: 'dashed', borderRadius: 8, padding: 24, alignItems: 'center', marginTop: 8 },
  trackRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 8, borderWidth: 1, marginBottom: 6 },
  trackNum: { width: 20, textAlign: 'center', fontSize: 12 },
  trackThumb: { width: 40, height: 40, borderRadius: 4 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelBtn: { flex: 1, borderWidth: 1, borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  cancelText: { fontWeight: '600', fontSize: 14 },
  saveBtn: { flex: 2, borderRadius: 8, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});

export default PlaylistFormModal;