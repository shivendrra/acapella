import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Image,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { collection, query, getDocs, orderBy, limit } from '@firebase/firestore';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../../../hooks/useTheme';
import { db } from '../../../../../services/firebase';
import { Artist } from '../../../../../types';

const ArtistCard: React.FC<{ artist: Artist; c: any }> = ({ artist, c }) => {
  const router = useRouter();
  return (
    <TouchableOpacity style={styles.card} onPress={() => router.push(`/artist/${artist.id}` as any)}>
      <Image source={{ uri: artist.imageUrl }} style={styles.avatar} resizeMode="cover" />
      <Text style={[styles.name, { color: c.text }]} numberOfLines={1}>{artist.name}</Text>
      <Text style={[styles.genre, { color: c.muted }]} numberOfLines={1}>{artist.genres[0]}</Text>
    </TouchableOpacity>
  );
};

const ArtistsIndexPage: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const c = isDark ? colors.dark : colors.light;

  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true); setError(null);
      try {
        const snap = await getDocs(query(collection(db, 'artists'), orderBy('name'), limit(12)));
        setArtists(snap.docs.map(d => ({ id: d.id, ...d.data() } as Artist)));
      } catch { setError("Failed to load artists. Please try again."); }
      finally { setLoading(false); }
    };
    run();
  }, []);

  if (loading) return <ActivityIndicator style={{ flex: 1, marginTop: 64 }} color={c.accent} />;
  if (error) return <Text style={[styles.center, { color: '#ef4444' }]}>{error}</Text>;

  return (
    <FlatList
      data={artists}
      keyExtractor={a => a.id}
      numColumns={3}
      contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
      columnWrapperStyle={{ gap: 16, marginBottom: 24 }}
      ListHeaderComponent={
        <View style={{ marginBottom: 16 }}>
          <Text style={[styles.heading, { color: c.text }]}>Artists</Text>
          <Text style={[styles.sectionTitle, { color: c.text, marginTop: 16 }]}>Popular Artists</Text>
        </View>
      }
      renderItem={({ item }) => <ArtistCard artist={item} c={c} />}
    />
  );
};

const colors = {
  light: { bg: '#f9fafb', text: '#111827', muted: '#6b7280', accent: '#63479b' },
  dark: { bg: '#0f0f0f', text: '#f9fafb', muted: '#9ca3af', accent: '#a78bdf' },
};

const styles = StyleSheet.create({
  heading: { fontSize: 28, fontWeight: '700', fontFamily: 'serif' },
  sectionTitle: { fontSize: 20, fontWeight: '700', fontFamily: 'serif' },
  card: { flex: 1, alignItems: 'center' },
  avatar: { width: 88, height: 88, borderRadius: 44 },
  name: { fontSize: 14, fontWeight: '700', marginTop: 8, textAlign: 'center' },
  genre: { fontSize: 12, marginTop: 2, textAlign: 'center' },
  center: { textAlign: 'center', marginTop: 40 },
});

export default ArtistsIndexPage;