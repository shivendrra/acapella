import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Image,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { collection, query, where, getDocs, Timestamp } from '@firebase/firestore';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../../../hooks/useTheme';
import { db } from '../../../../services/firebase';
import { UserProfile, Playlist } from '../../../../types';

const UserPlaylistsPage: React.FC = () => {
  const { username } = useLocalSearchParams<{ username: string }>();
  const { theme } = useTheme();
  const router = useRouter();
  const isDark = theme === 'dark';
  const c = isDark ? colors.dark : colors.light;

  const [user, setUser] = useState<UserProfile | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      if (!username) return;
      setLoading(true);
      try {
        const uSnap = await getDocs(query(collection(db, 'users'), where('username', '==', username)));
        if (uSnap.empty) { setError('User not found.'); setLoading(false); return; }
        const userData = uSnap.docs[0].data() as UserProfile;
        setUser(userData);

        const pSnap = await getDocs(query(collection(db, 'playlists'), where('userId', '==', userData.uid)));
        let all = pSnap.docs.map(d => ({ id: d.id, ...d.data() } as Playlist));
        all.sort((a, b) => {
          const tA = a.updatedAt instanceof Timestamp ? a.updatedAt.toMillis() : (a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : 0);
          const tB = b.updatedAt instanceof Timestamp ? b.updatedAt.toMillis() : (b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : 0);
          return tB - tA;
        });
        setPlaylists(all);
      } catch { /* show empty on permission errors */ }
      finally { setLoading(false); }
    };
    run();
  }, [username]);

  if (loading) return <ActivityIndicator style={{ flex: 1, marginTop: 64 }} color={c.accent} />;
  if (error) return <Text style={[styles.center, { color: '#ef4444' }]}>{error}</Text>;

  return (
    <FlatList
      data={playlists}
      keyExtractor={p => p.id}
      numColumns={2}
      contentContainerStyle={{ padding: 12, gap: 12 }}
      columnWrapperStyle={{ gap: 12 }}
      ListHeaderComponent={
        <View style={{ marginBottom: 12 }}>
          <Text style={[styles.heading, { color: c.text }]}>Playlists by {user?.displayName}</Text>
          <Text style={[styles.sub, { color: c.muted }]}>Curated collections and mixes.</Text>
        </View>
      }
      ListEmptyComponent={
        <View style={[styles.emptyBox, { borderColor: c.border }]}>
          <Text style={{ color: c.muted }}>No playlists found.</Text>
        </View>
      }
      renderItem={({ item: pl }) => (
        <TouchableOpacity style={styles.card} onPress={() => router.push(`/playlist/${pl.id}` as any)}>
          <View style={styles.cardImgWrapper}>
            <Image
              source={{ uri: pl.coverArtUrl || 'https://placehold.co/400x400?text=Playlist' }}
              style={styles.cardImg}
              resizeMode="cover"
            />
            <View style={styles.cardImgOverlay} />
          </View>
          <Text style={[styles.cardTitle, { color: c.text }]} numberOfLines={1}>{pl.title}</Text>
          <Text style={[styles.cardCount, { color: c.muted }]}>{pl.songIds.length} songs</Text>
        </TouchableOpacity>
      )}
    />
  );
};

const colors = {
  light: { bg: '#f9fafb', text: '#111827', muted: '#6b7280', accent: '#63479b', border: '#e5e7eb' },
  dark: { bg: '#0f0f0f', text: '#f9fafb', muted: '#9ca3af', accent: '#a78bdf', border: '#374151' },
};

const styles = StyleSheet.create({
  heading: { fontSize: 24, fontWeight: '700', fontFamily: 'serif' },
  sub: { fontSize: 13, marginTop: 4 },
  card: { flex: 1 },
  cardImgWrapper: { width: '100%', aspectRatio: 1, borderRadius: 10, overflow: 'hidden', backgroundColor: '#e5e7eb' },
  cardImg: { ...StyleSheet.absoluteFillObject, width: undefined, height: undefined },
  cardImgOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.15)' },
  cardTitle: { fontSize: 15, fontWeight: '700', marginTop: 6 },
  cardCount: { fontSize: 13, marginTop: 2 },
  emptyBox: { borderWidth: 2, borderStyle: 'dashed', borderRadius: 10, padding: 40, alignItems: 'center', margin: 16 },
  center: { textAlign: 'center', marginTop: 40 },
});

export default UserPlaylistsPage;