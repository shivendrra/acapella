import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  StyleSheet, ActivityIndicator, Alert, Linking,
} from 'react-native';
import {
  doc, getDoc, collection, query, where, getDocs,
  documentId, updateDoc, arrayRemove, deleteDoc, serverTimestamp,
} from '@firebase/firestore';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { db } from '../../../../services/firebase';
import { useAuth } from '../../../../hooks/useAuth';
import { useTheme } from '../../../../hooks/useTheme';
import { Playlist, Song } from '../../../../types';
import PlaylistFormModal from '../../../../components/playlist/PlaylistFormModal';

const formatDur = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const formatTotal = (s: number) => {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h} hr ${m} min` : `${m} min`;
};

const PlaylistPage: React.FC = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { currentUser } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const c = isDark ? colors.dark : colors.light;

  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const snap = await getDoc(doc(db, 'playlists', id));
      if (!snap.exists()) { setError('Playlist not found.'); setLoading(false); return; }
      const data = { id: snap.id, ...snap.data() } as Playlist;
      setPlaylist(data);
      if (data.songIds?.length) {
        const chunks: string[][] = [];
        for (let i = 0; i < data.songIds.length; i += 10) chunks.push(data.songIds.slice(i, i + 10));
        const snaps = await Promise.all(chunks.map(c => getDocs(query(collection(db, 'songs'), where(documentId(), 'in', c)))));
        const all = snaps.flatMap(s => s.docs.map(d => ({ id: d.id, ...d.data() } as Song)));
        setSongs(data.songIds.map(sid => all.find(s => s.id === sid)).filter(Boolean) as Song[]);
      } else { setSongs([]); }
    } catch { setError('Failed to load playlist.'); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRemoveSong = (songId: string) => {
    if (!playlist || currentUser?.uid !== playlist.userId) return;
    Alert.alert('Remove Song', 'Remove this song from the playlist?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive', onPress: async () => {
          setRemovingId(songId);
          try {
            await updateDoc(doc(db, 'playlists', playlist.id), { songIds: arrayRemove(songId), updatedAt: serverTimestamp() });
            setSongs(p => p.filter(s => s.id !== songId));
            setPlaylist(p => p ? { ...p, songIds: p.songIds.filter(i => i !== songId) } : null);
          } catch { Alert.alert('Error', 'Failed to remove song.'); }
          finally { setRemovingId(null); }
        },
      },
    ]);
  };

  const handleDelete = () => {
    if (!playlist || currentUser?.uid !== playlist.userId) return;
    Alert.alert('Delete Playlist', 'Are you sure? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await deleteDoc(doc(db, 'playlists', playlist.id));
            router.back();
          } catch { Alert.alert('Error', 'Failed to delete playlist.'); }
        },
      },
    ]);
  };

  if (loading) return <ActivityIndicator style={{ flex: 1, marginTop: 64 }} color={c.accent} />;
  if (error) return <Text style={[styles.center, { color: '#ef4444' }]}>{error}</Text>;
  if (!playlist) return null;

  const isOwner = currentUser?.uid === playlist.userId;
  const totalDur = songs.reduce((a, s) => a + (s.duration || 0), 0);

  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 48, gap: 24 }}>
      {/* Header */}
      <View style={styles.hero}>
        <Image
          source={{ uri: playlist.coverArtUrl || 'https://placehold.co/400x400?text=Playlist' }}
          style={styles.cover}
          resizeMode="cover"
        />
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: c.text }]}>{playlist.title}</Text>
          {playlist.description ? <Text style={[styles.desc, { color: c.muted }]}>{playlist.description}</Text> : null}
          <Text style={[styles.meta, { color: c.muted }]}>
            {'by '}
            <Text style={{ color: c.accent, fontWeight: '600' }} onPress={() => router.push(`/${playlist.userDisplayName}` as any)}>
              {playlist.userDisplayName}
            </Text>
            {`  •  ${songs.length} songs  •  ${formatTotal(totalDur)}`}
          </Text>

          {/* Platform links */}
          <View style={styles.platformRow}>
            {playlist.platformLinks?.spotify && (
              <TouchableOpacity style={[styles.platformBtn, { backgroundColor: '#1DB954' }]} onPress={() => Linking.openURL(playlist.platformLinks!.spotify!)}>
                <Text style={styles.platformText}>Spotify</Text>
              </TouchableOpacity>
            )}
            {playlist.platformLinks?.appleMusic && (
              <TouchableOpacity style={[styles.platformBtn, { backgroundColor: '#000' }]} onPress={() => Linking.openURL(playlist.platformLinks!.appleMusic!)}>
                <Text style={styles.platformText}>Apple Music</Text>
              </TouchableOpacity>
            )}
            {playlist.platformLinks?.youtubeMusic && (
              <TouchableOpacity style={[styles.platformBtn, { backgroundColor: '#FF0000' }]} onPress={() => Linking.openURL(playlist.platformLinks!.youtubeMusic!)}>
                <Text style={styles.platformText}>YouTube Music</Text>
              </TouchableOpacity>
            )}
          </View>

          {isOwner && (
            <View style={styles.ownerBtns}>
              <TouchableOpacity style={styles.iconBtn} onPress={() => setEditOpen(true)}>
                <MaterialIcons name="edit" size={20} color={c.muted} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={handleDelete}>
                <MaterialIcons name="delete-outline" size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Tracklist */}
      {songs.length > 0 ? (
        <View style={[styles.trackList, { borderColor: c.border }]}>
          {/* Header row */}
          <View style={[styles.trackHeader, { backgroundColor: c.headerBg, borderBottomColor: c.border }]}>
            <Text style={[styles.trackHeaderText, { width: 28 }]}>#</Text>
            <Text style={[styles.trackHeaderText, { flex: 1 }]}>TITLE</Text>
            <Text style={[styles.trackHeaderText, { width: 48, textAlign: 'right' }]}>TIME</Text>
            {isOwner && <View style={{ width: 32 }} />}
          </View>
          {songs.map((song, i) => (
            <TouchableOpacity
              key={song.id}
              style={[styles.trackRow, { backgroundColor: i % 2 === 0 ? 'transparent' : c.altRow, borderBottomColor: c.border }]}
              onPress={() => router.push(`/song/${song.id}` as any)}
            >
              <Text style={[styles.trackNum, { color: c.muted }]}>{i + 1}</Text>
              <Image source={{ uri: song.coverArtUrl }} style={styles.trackThumb} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.trackTitle, { color: c.text }]} numberOfLines={1}>{song.title}</Text>
                <Text style={[styles.trackGenre, { color: c.muted }]}>{song.genre}</Text>
              </View>
              <Text style={[styles.trackDur, { color: c.muted }]}>{formatDur(song.duration)}</Text>
              {isOwner && (
                <TouchableOpacity onPress={() => handleRemoveSong(song.id)} disabled={removingId === song.id}>
                  {removingId === song.id
                    ? <ActivityIndicator size="small" color="#ef4444" />
                    : <MaterialIcons name="remove-circle-outline" size={18} color="#ef4444" />
                  }
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={[styles.emptyBox, { borderColor: c.border }]}>
          <MaterialIcons name="music-note" size={28} color={c.muted} />
          <Text style={{ color: c.muted, marginTop: 8 }}>No songs in this playlist yet.</Text>
          {isOwner && (
            <TouchableOpacity onPress={() => setEditOpen(true)}>
              <Text style={{ color: c.accent, fontWeight: '600', marginTop: 6, fontSize: 13 }}>Add some songs</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {editOpen && playlist && (
        <PlaylistFormModal onClose={() => setEditOpen(false)} existingPlaylist={playlist} onSuccess={fetchData} />
      )}
    </ScrollView>
  );
};

const colors = {
  light: { bg: '#f9fafb', text: '#111827', muted: '#6b7280', accent: '#63479b', border: '#e5e7eb', altRow: 'rgba(0,0,0,0.02)', headerBg: '#f3f4f6' },
  dark: { bg: '#0f0f0f', text: '#f9fafb', muted: '#9ca3af', accent: '#a78bdf', border: '#374151', altRow: 'rgba(255,255,255,0.02)', headerBg: 'rgba(31,41,55,0.5)' },
};

const styles = StyleSheet.create({
  hero: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  cover: { width: 130, height: 130, borderRadius: 12 },
  title: { fontSize: 22, fontWeight: '700', fontFamily: 'serif', marginBottom: 4 },
  desc: { fontSize: 13, marginBottom: 6, lineHeight: 18 },
  meta: { fontSize: 12, marginBottom: 10 },
  platformRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  platformBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  platformText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  ownerBtns: { flexDirection: 'row', gap: 4 },
  iconBtn: { padding: 6, borderRadius: 999 },
  trackList: { borderWidth: 1, borderRadius: 10, overflow: 'hidden' },
  trackHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 8, borderBottomWidth: 1, gap: 8 },
  trackHeaderText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8, color: '#6b7280' },
  trackRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 10, gap: 8, borderBottomWidth: 1 },
  trackNum: { width: 20, textAlign: 'center', fontSize: 13 },
  trackThumb: { width: 40, height: 40, borderRadius: 6 },
  trackTitle: { fontSize: 13, fontWeight: '600' },
  trackGenre: { fontSize: 11, marginTop: 2 },
  trackDur: { fontSize: 12, fontFamily: 'monospace', width: 40, textAlign: 'right' },
  emptyBox: { borderWidth: 2, borderStyle: 'dashed', borderRadius: 10, padding: 40, alignItems: 'center' },
  center: { textAlign: 'center', marginTop: 40 },
});

export default PlaylistPage;