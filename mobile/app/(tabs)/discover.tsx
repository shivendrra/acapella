import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, FlatList, TouchableOpacity,
  Image, StyleSheet, ActivityIndicator,
} from 'react-native';
import { collection, query, orderBy, limit, getDocs, where } from '@firebase/firestore';
import { useRouter } from 'expo-router';
import { db } from '../../services/firebase';
import { useTheme } from '../../hooks/useTheme';
import { Album, Song } from '../../types';

const SectionTitle: React.FC<{ title: string; subtitle: string; c: any }> = ({ title, subtitle, c }) => (
  <View style={{ marginBottom: 16 }}>
    <Text style={[styles.sectionTitle, { color: c.text }]}>{title}</Text>
    <Text style={[styles.sectionSub, { color: c.muted }]}>{subtitle}</Text>
  </View>
);

const Carousel: React.FC<{ items: any[]; renderItem: (item: any, index: number) => React.ReactNode }> = ({ items, renderItem }) => {
  if (!items.length) return null;
  return (
    <FlatList
      data={items}
      horizontal
      showsHorizontalScrollIndicator={false}
      keyExtractor={item => item.id}
      contentContainerStyle={{ paddingBottom: 8, gap: 16 }}
      renderItem={({ item, index }) => (
        <View style={{ width: 160 }}>{renderItem(item, index)}</View>
      )}
    />
  );
};

const ChartItem: React.FC<{ item: Album | Song; rank: number; c: any }> = ({ item, rank, c }) => {
  const router = useRouter();
  const isAlbum = 'tracklist' in item;
  return (
    <TouchableOpacity onPress={() => router.push(`/${isAlbum ? 'album' : 'song'}/${item.id}` as any)}>
      <View style={styles.cardImg}>
        <Image source={{ uri: item.coverArtUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        <View style={styles.rankBadge}>
          <Text style={styles.rankText}>{rank}</Text>
        </View>
      </View>
      <Text style={[styles.cardTitle, { color: c.text }]} numberOfLines={1}>{item.title}</Text>
    </TouchableOpacity>
  );
};

const AlbumCard: React.FC<{ album: Album; c: any }> = ({ album, c }) => {
  const router = useRouter();
  return (
    <TouchableOpacity onPress={() => router.push(`/album/${album.id}` as any)}>
      <View style={styles.cardImg}>
        <Image source={{ uri: album.coverArtUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      </View>
      <Text style={[styles.cardTitle, { color: c.text }]} numberOfLines={1}>{album.title}</Text>
    </TouchableOpacity>
  );
};

const GENRES = ['Pop', 'Hip-Hop/Rap', 'Rock', 'Indie'];

const DiscoverPage: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const c = isDark ? colors.dark : colors.light;

  const [topAlbums, setTopAlbums] = useState<Album[]>([]);
  const [topSongs, setTopSongs] = useState<Song[]>([]);
  const [newReleases, setNewReleases] = useState<Record<string, Album[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true); setError(null);
      try {
        const genrePromises = GENRES.map(g =>
          getDocs(query(collection(db, 'albums'), where('genre', '==', g), orderBy('releaseDate', 'desc'), limit(10)))
        );
        const [topAlbSnap, topSoSnap, ...genreSnaps] = await Promise.all([
          getDocs(query(collection(db, 'albums'), orderBy('likesCount', 'desc'), limit(10))),
          getDocs(query(collection(db, 'songs'), orderBy('likesCount', 'desc'), limit(10))),
          ...genrePromises,
        ]);
        setTopAlbums(topAlbSnap.docs.map(d => ({ id: d.id, ...d.data() } as Album)));
        setTopSongs(topSoSnap.docs.map(d => ({ id: d.id, ...d.data() } as Song)));
        const releases: Record<string, Album[]> = {};
        GENRES.forEach((g, i) => { releases[g] = genreSnaps[i].docs.map(d => ({ id: d.id, ...d.data() } as Album)); });
        setNewReleases(releases);
      } catch (e) {
        setError('Could not load discover page. Please try again later.');
      } finally { setLoading(false); }
    };
    run();
  }, []);

  if (loading) return <ActivityIndicator style={{ flex: 1, marginTop: 64 }} color={c.accent} />;
  if (error) return <Text style={[styles.centerText, { color: '#ef4444' }]}>{error}</Text>;

  return (
    <ScrollView style={[styles.root, { backgroundColor: c.bg }]} contentContainerStyle={{ padding: 16, paddingBottom: 48, gap: 48 }}>
      <View>
        <SectionTitle title="Top Charts" subtitle="What's popular right now on Acapella" c={c} />
        <Text style={[styles.subheading, { color: c.text }]}>Top 10 Albums</Text>
        <Carousel items={topAlbums} renderItem={(item, i) => <ChartItem item={item} rank={i + 1} c={c} />} />
        <Text style={[styles.subheading, { color: c.text, marginTop: 24 }]}>Top 10 Songs</Text>
        <Carousel items={topSongs} renderItem={(item, i) => <ChartItem item={item} rank={i + 1} c={c} />} />
      </View>

      <View>
        <SectionTitle title="New Releases by Genre" subtitle="The latest albums in your favorite genres" c={c} />
        {GENRES.map(genre => (
          Array.isArray(newReleases[genre]) && newReleases[genre].length > 0 && (
            <View key={genre} style={{ marginBottom: 24 }}>
              <Text style={[styles.subheading, { color: c.text }]}>{genre}</Text>
              <Carousel items={newReleases[genre]} renderItem={(item) => <AlbumCard album={item} c={c} />} />
            </View>
          )
        ))}
      </View>

      <View>
        <SectionTitle title="Recommended for You" subtitle="Albums we think you'll love" c={c} />
        <View style={[styles.comingSoon, { borderColor: c.border }]}>
          <Text style={{ color: c.muted }}>Personalized recommendations are coming soon!</Text>
          <Text style={{ color: c.muted, fontSize: 12, marginTop: 4 }}>Start liking and reviewing music to help us learn your taste.</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const colors = {
  light: { bg: '#f9fafb', text: '#111827', muted: '#6b7280', accent: '#63479b', border: '#e5e7eb' },
  dark: { bg: '#0f0f0f', text: '#f9fafb', muted: '#9ca3af', accent: '#a78bdf', border: '#374151' },
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  sectionTitle: { fontSize: 28, fontWeight: '700', fontFamily: 'serif' },
  sectionSub: { fontSize: 14, marginTop: 2 },
  subheading: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  cardImg: { width: '100%', aspectRatio: 1, borderRadius: 10, overflow: 'hidden', backgroundColor: '#e5e7eb' },
  cardTitle: { marginTop: 8, fontSize: 14, fontWeight: '600' },
  rankBadge: {
    position: 'absolute', bottom: 0, left: 0,
    backgroundColor: 'rgba(0,0,0,0.7)', width: 36, height: 36,
    borderTopRightRadius: 8, borderBottomLeftRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  rankText: { color: '#fff', fontWeight: '700', fontSize: 18 },
  centerText: { textAlign: 'center', marginTop: 40 },
  comingSoon: {
    borderWidth: 2, borderStyle: 'dashed', borderRadius: 10,
    padding: 32, alignItems: 'center',
  },
});

export default DiscoverPage;