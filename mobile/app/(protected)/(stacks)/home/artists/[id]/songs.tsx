import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Image,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { collection, query, where, getDocs, doc, getDoc } from '@firebase/firestore';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../../../../../hooks/useTheme';
import { db } from '../../../../../../services/firebase';
import { Artist, Song } from '../../../../../../types';
import { formatDate } from '../../../../../../utils/formatters';

const formatDur = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

const SongTileCard: React.FC<{ song: Song; c: any }> = ({ song, c }) => {
  const router = useRouter();
  const uri = song.coverArtUrl || `https://placehold.co/400x400/131010/FAF8F1?text=${encodeURIComponent(song.title.charAt(0))}`;
  return (
    <TouchableOpacity style={styles.tile} onPress={() => router.push(`/song/${song.id}` as any)}>
      <Image source={{ uri }} style={styles.tileImg} resizeMode="cover" />
      <View style={styles.tileOverlay} />
      <View style={styles.tileInfo}>
        <Text style={styles.tileName} numberOfLines={1}>{song.title}</Text>
        <Text style={styles.tileGenre}>{song.genre}</Text>
      </View>
    </TouchableOpacity>
  );
};

const SongListItem: React.FC<{ song: Song; c: any }> = ({ song, c }) => {
  const router = useRouter();
  return (
    <TouchableOpacity
      style={[styles.listRow, { borderBottomColor: c.border }]}
      onPress={() => router.push(`/song/${song.id}` as any)}
    >
      <Image
        source={{ uri: song.coverArtUrl || `https://placehold.co/100x100/131010/FAF8F1?text=${song.title.charAt(0)}` }}
        style={styles.listThumb}
        resizeMode="cover"
      />
      <View style={{ flex: 1 }}>
        <Text style={[styles.listTitle, { color: c.text }]} numberOfLines={1}>{song.title}</Text>
        <Text style={[styles.listMeta, { color: c.muted }]}>{formatDate(song.releaseDate)}</Text>
      </View>
      <Text style={[styles.listDur, { color: c.muted }]}>{formatDur(song.duration)}</Text>
    </TouchableOpacity>
  );
};

const ArtistSongsPage: React.FC = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const c = isDark ? colors.dark : colors.light;

  const [artist, setArtist] = useState<Artist | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    if (!id) { setError('Artist ID is missing.'); setLoading(false); return; }
    const run = async () => {
      setLoading(true);
      try {
        const aSnap = await getDoc(doc(db, 'artists', id));
        if (!aSnap.exists()) { setError('Artist not found.'); return; }
        setArtist(aSnap.data() as Artist);
        const sSnap = await getDocs(query(collection(db, 'songs'), where('artistIds', 'array-contains', id)));
        const data = sSnap.docs.map(d => ({ id: d.id, ...d.data() } as Song));
        data.sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());
        setSongs(data);
      } catch { setError('Failed to load artist details.'); }
      finally { setLoading(false); }
    };
    run();
  }, [id]);

  if (loading) return <ActivityIndicator style={{ flex: 1, marginTop: 64 }} color={c.accent} />;
  if (error) return <Text style={[styles.center, { color: '#ef4444' }]}>{error}</Text>;

  const Header = () => (
    <View style={styles.pageHeader}>
      <Text style={[styles.heading, { color: c.text }]}>All Songs by {artist?.name}</Text>
      <View style={[styles.layoutToggle, { backgroundColor: c.toggleBg }]}>
        {(['grid', 'list'] as const).map(l => (
          <TouchableOpacity
            key={l}
            style={[styles.layoutBtn, layout === l && [styles.layoutBtnActive, { backgroundColor: c.toggleActive }]]}
            onPress={() => setLayout(l)}
          >
            <MaterialIcons name={l === 'grid' ? 'grid-view' : 'list'} size={20} color={layout === l ? c.text : c.muted} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  if (songs.length === 0) return (
    <View style={{ padding: 16 }}>
      <Header />
      <Text style={{ color: c.muted, marginTop: 20 }}>No songs found for this artist.</Text>
    </View>
  );

  if (layout === 'grid') {
    return (
      <FlatList
        data={songs}
        keyExtractor={s => s.id}
        numColumns={2}
        contentContainerStyle={{ padding: 12, gap: 12 }}
        columnWrapperStyle={{ gap: 12 }}
        ListHeaderComponent={<View style={{ marginBottom: 8 }}><Header /></View>}
        renderItem={({ item }) => <SongTileCard song={item} c={c} />}
      />
    );
  }

  return (
    <FlatList
      data={songs}
      keyExtractor={s => s.id}
      contentContainerStyle={{ paddingBottom: 48 }}
      ListHeaderComponent={<View style={{ padding: 16, paddingBottom: 8 }}><Header /></View>}
      renderItem={({ item }) => <SongListItem song={item} c={c} />}
    />
  );
};

const colors = {
  light: { bg: '#f9fafb', text: '#111827', muted: '#6b7280', accent: '#63479b', border: '#e5e7eb', toggleBg: '#f3f4f6', toggleActive: '#ffffff' },
  dark: { bg: '#0f0f0f', text: '#f9fafb', muted: '#9ca3af', accent: '#a78bdf', border: '#374151', toggleBg: '#1f2937', toggleActive: '#374151' },
};

const styles = StyleSheet.create({
  pageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 8 },
  heading: { flex: 1, fontSize: 22, fontWeight: '700', fontFamily: 'serif' },
  layoutToggle: { flexDirection: 'row', borderRadius: 8, padding: 4, gap: 2 },
  layoutBtn: { padding: 6, borderRadius: 6 },
  layoutBtnActive: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  tile: { flex: 1, aspectRatio: 1, borderRadius: 10, overflow: 'hidden', backgroundColor: '#e5e7eb' },
  tileImg: { ...StyleSheet.absoluteFillObject, width: undefined, height: undefined },
  tileOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  tileInfo: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 10 },
  tileName: { color: '#fff', fontWeight: '700', fontSize: 13 },
  tileGenre: { color: '#d1d5db', fontSize: 11, marginTop: 2 },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  listThumb: { width: 56, height: 56, borderRadius: 6, flexShrink: 0 },
  listTitle: { fontSize: 15, fontWeight: '600' },
  listMeta: { fontSize: 12, marginTop: 3 },
  listDur: { fontSize: 13, fontFamily: 'monospace' },
  center: { textAlign: 'center', marginTop: 40 },
});

export default ArtistSongsPage;