import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Image,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { collection, query, where, getDocs, doc, getDoc } from '@firebase/firestore';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../../hooks/useTheme';
import { db } from '../../../services/firebase';
import { Artist, Album } from '../../../types';
import { formatDate } from '../../../utils/formatters';

const AlbumTileCard: React.FC<{ album: Album; c: any }> = ({ album, c }) => {
  const router = useRouter();
  return (
    <TouchableOpacity style={styles.tile} onPress={() => router.push(`/album/${album.id}` as any)}>
      <Image source={{ uri: album.coverArtUrl }} style={styles.tileImg} resizeMode="cover" />
      <Text style={[styles.tileName, { color: c.text }]} numberOfLines={1}>{album.title}</Text>
      <Text style={[styles.tileMeta, { color: c.muted }]}>{formatDate(album.releaseDate)}</Text>
    </TouchableOpacity>
  );
};

const AlbumListItem: React.FC<{ album: Album; c: any }> = ({ album, c }) => {
  const router = useRouter();
  return (
    <TouchableOpacity
      style={[styles.listRow, { borderBottomColor: c.border }]}
      onPress={() => router.push(`/album/${album.id}` as any)}
    >
      <Image source={{ uri: album.coverArtUrl }} style={styles.listThumb} resizeMode="cover" />
      <View style={{ flex: 1 }}>
        <Text style={[styles.listTitle, { color: c.text }]} numberOfLines={1}>{album.title}</Text>
        <Text style={[styles.listMeta, { color: c.muted }]}>{formatDate(album.releaseDate)}</Text>
        <Text style={[styles.listMeta, { color: c.muted }]}>{album.tracklist.length} tracks</Text>
      </View>
    </TouchableOpacity>
  );
};

const ArtistAlbumsPage: React.FC = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const c = isDark ? colors.dark : colors.light;

  const [artist, setArtist] = useState<Artist | null>(null);
  const [albums, setAlbums] = useState<Album[]>([]);
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
        const alSnap = await getDocs(query(collection(db, 'albums'), where('artistIds', 'array-contains', id)));
        const data = alSnap.docs.map(d => ({ id: d.id, ...d.data() } as Album));
        data.sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());
        setAlbums(data);
      } catch { setError('Failed to load artist details.'); }
      finally { setLoading(false); }
    };
    run();
  }, [id]);

  if (loading) return <ActivityIndicator style={{ flex: 1, marginTop: 64 }} color={c.accent} />;
  if (error) return <Text style={[styles.center, { color: '#ef4444' }]}>{error}</Text>;

  const Header = () => (
    <View style={styles.pageHeader}>
      <Text style={[styles.heading, { color: c.text }]}>All Albums by {artist?.name}</Text>
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

  if (albums.length === 0) return (
    <View style={{ padding: 16 }}>
      <Header />
      <Text style={{ color: c.muted, marginTop: 20 }}>No albums found for this artist.</Text>
    </View>
  );

  if (layout === 'grid') {
    return (
      <FlatList
        data={albums}
        keyExtractor={a => a.id}
        numColumns={2}
        contentContainerStyle={{ padding: 12, gap: 12 }}
        columnWrapperStyle={{ gap: 12 }}
        ListHeaderComponent={<View style={{ marginBottom: 8 }}><Header /></View>}
        renderItem={({ item }) => <AlbumTileCard album={item} c={c} />}
      />
    );
  }

  return (
    <FlatList
      data={albums}
      keyExtractor={a => a.id}
      contentContainerStyle={{ paddingBottom: 48 }}
      ListHeaderComponent={<View style={{ padding: 16, paddingBottom: 8 }}><Header /></View>}
      renderItem={({ item }) => <AlbumListItem album={item} c={c} />}
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
  tile: { flex: 1 },
  tileImg: { width: '100%', aspectRatio: 1, borderRadius: 10, backgroundColor: '#e5e7eb' },
  tileName: { fontSize: 13, fontWeight: '600', marginTop: 6 },
  tileMeta: { fontSize: 12, marginTop: 2 },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  listThumb: { width: 80, height: 80, borderRadius: 8 },
  listTitle: { fontSize: 16, fontWeight: '600' },
  listMeta: { fontSize: 12, marginTop: 3 },
  center: { textAlign: 'center', marginTop: 40 },
});

export default ArtistAlbumsPage;