import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, Image,
  StyleSheet, Modal, Pressable, ActivityIndicator,
} from 'react-native';
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion, serverTimestamp, Timestamp } from '@firebase/firestore';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { db } from '../../services/firebase';
import { Playlist, Song } from '../../types';
import PlaylistFormModal from './PlaylistFormModal';

interface Props { song: Song; onClose: () => void; }

const AddToPlaylistModal: React.FC<Props> = ({ song, onClose }) => {
  const { currentUser } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const c = isDark ? colors.dark : colors.light;

  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [addingToId, setAddingToId] = useState<string | null>(null);

  const fetchPlaylists = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'playlists'), where('userId', '==', currentUser.uid)));
      let list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Playlist));
      list.sort((a, b) => {
        const tA = a.updatedAt instanceof Timestamp ? a.updatedAt.toMillis() : (a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : 0);
        const tB = b.updatedAt instanceof Timestamp ? b.updatedAt.toMillis() : (b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : 0);
        return tB - tA;
      });
      setPlaylists(list);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPlaylists(); }, [currentUser]);

  const handleAdd = async (playlist: Playlist) => {
    if (playlist.songIds.includes(song.id) || addingToId) return;
    setAddingToId(playlist.id);
    try {
      await updateDoc(doc(db, 'playlists', playlist.id), { songIds: arrayUnion(song.id), updatedAt: serverTimestamp() });
      setPlaylists(prev => prev.map(p => p.id === playlist.id ? { ...p, songIds: [...p.songIds, song.id] } : p));
    } catch (e) { console.error(e); }
    finally { setAddingToId(null); }
  };

  if (isCreating) {
    return <PlaylistFormModal onClose={() => setIsCreating(false)} onSuccess={() => { setIsCreating(false); fetchPlaylists(); }} />;
  }

  return (
    <Modal visible animationType="fade" transparent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: c.bg }]}>
        <View style={[styles.header, { borderBottomColor: c.border }]}>
          <Text style={[styles.title, { color: c.text }]}>Add to Playlist</Text>
          <TouchableOpacity onPress={onClose}>
            <MaterialIcons name="close" size={24} color={c.icon} />
          </TouchableOpacity>
        </View>

        {/* Create new */}
        <TouchableOpacity
          style={[styles.createRow, { borderColor: c.border }]}
          onPress={() => setIsCreating(true)}
        >
          <View style={[styles.createIcon, { backgroundColor: c.iconBg }]}>
            <MaterialIcons name="add" size={22} color={c.accent} />
          </View>
          <Text style={[styles.createText, { color: c.accent }]}>Create New Playlist</Text>
        </TouchableOpacity>

        {loading
          ? <ActivityIndicator style={{ marginTop: 24 }} color={c.accent} />
          : playlists.length === 0
            ? <Text style={[styles.empty, { color: c.muted }]}>No playlists yet. Create one above!</Text>
            : (
              <FlatList
                data={playlists}
                keyExtractor={p => p.id}
                contentContainerStyle={{ padding: 12, gap: 4 }}
                renderItem={({ item: pl }) => {
                  const added = pl.songIds.includes(song.id);
                  const adding = addingToId === pl.id;
                  return (
                    <TouchableOpacity
                      style={[styles.playlistRow, { opacity: added ? 0.6 : 1 }]}
                      onPress={() => handleAdd(pl)}
                      disabled={added || !!addingToId}
                    >
                      <Image
                        source={{ uri: pl.coverArtUrl || 'https://placehold.co/100x100?text=PL' }}
                        style={styles.playlistThumb}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.playlistName, { color: c.text }]} numberOfLines={1}>{pl.title}</Text>
                        <Text style={[styles.playlistCount, { color: c.muted }]}>{pl.songIds.length} songs</Text>
                      </View>
                      {adding && <ActivityIndicator size="small" color={c.accent} />}
                      {added && !adding && <MaterialIcons name="check" size={20} color={c.accent} />}
                    </TouchableOpacity>
                  );
                }}
              />
            )
        }
      </View>
    </Modal>
  );
};

const colors = {
  light: { bg: '#ffffff', text: '#111827', muted: '#6b7280', icon: '#374151', accent: '#63479b', border: '#e5e7eb', iconBg: '#f3f4f6' },
  dark: { bg: '#1f2937', text: '#f9fafb', muted: '#9ca3af', icon: '#d1d5db', accent: '#a78bdf', border: '#374151', iconBg: '#374151' },
};

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.8)' },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  title: { fontSize: 18, fontWeight: '700', fontFamily: 'serif' },
  createRow: { flexDirection: 'row', alignItems: 'center', gap: 12, margin: 12, padding: 12, borderWidth: 1, borderStyle: 'dashed', borderRadius: 10 },
  createIcon: { width: 44, height: 44, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  createText: { fontWeight: '600', fontSize: 15 },
  empty: { textAlign: 'center', padding: 32, fontSize: 14 },
  playlistRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 8, borderRadius: 8 },
  playlistThumb: { width: 48, height: 48, borderRadius: 6 },
  playlistName: { fontSize: 14, fontWeight: '600' },
  playlistCount: { fontSize: 12, marginTop: 2 },
});

export default AddToPlaylistModal;