import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Image,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { collection, query, where, getDocs, limit, orderBy, startAfter } from '@firebase/firestore';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../../../hooks/useAuth';
import { useTheme } from '../../../../hooks/useTheme';
import { db } from '../../../../services/firebase';
import { UserProfile, Like } from '../../../../types';

const PAGE = 20;

const UserLikesPage: React.FC = () => {
  const { username } = useLocalSearchParams<{ username: string }>();
  const { currentUser } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const isDark = theme === 'dark';
  const c = isDark ? colors.dark : colors.light;

  const [user, setUser] = useState<UserProfile | null>(null);
  const [likes, setLikes] = useState<Like[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      if (!username) return;
      setLoading(true); setError(null);
      if (!currentUser) { setError("You must be logged in to view liked items."); setLoading(false); return; }
      try {
        const uSnap = await getDocs(query(collection(db, 'users'), where('username', '==', username), limit(1)));
        if (uSnap.empty) { setError('User not found.'); setLoading(false); return; }
        const userData = uSnap.docs[0].data() as UserProfile;
        setUser(userData);

        const lSnap = await getDocs(query(
          collection(db, 'likes'),
          where('userId', '==', userData.uid),
          where('entityType', 'in', ['song', 'album']),
          orderBy('createdAt', 'desc'), limit(PAGE)
        ));
        setLikes(lSnap.docs.map(d => ({ id: d.id, ...d.data() } as Like)));
        setLastDoc(lSnap.docs[lSnap.docs.length - 1]);
        setHasMore(lSnap.docs.length === PAGE);
      } catch { setError("Failed to load liked items."); }
      finally { setLoading(false); }
    };
    run();
  }, [username, currentUser]);

  const fetchMore = async () => {
    if (!user || !hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      const lSnap = await getDocs(query(
        collection(db, 'likes'),
        where('userId', '==', user.uid),
        where('entityType', 'in', ['song', 'album']),
        orderBy('createdAt', 'desc'), startAfter(lastDoc), limit(PAGE)
      ));
      setLikes(p => [...p, ...lSnap.docs.map(d => ({ id: d.id, ...d.data() } as Like))]);
      setLastDoc(lSnap.docs[lSnap.docs.length - 1]);
      setHasMore(lSnap.docs.length === PAGE);
    } catch { setError("Failed to load more items."); }
    finally { setLoadingMore(false); }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1, marginTop: 64 }} color={c.accent} />;
  if (error) return <Text style={[styles.center, { color: '#ef4444' }]}>{error}</Text>;

  return (
    <FlatList
      data={likes}
      keyExtractor={i => i.id}
      numColumns={3}
      contentContainerStyle={{ padding: 12, gap: 8 }}
      columnWrapperStyle={{ gap: 8 }}
      ListHeaderComponent={
        <View style={{ marginBottom: 12 }}>
          <Text style={[styles.heading, { color: c.text }]}>Liked by {user?.displayName || username}</Text>
          <Text style={[styles.sub, { color: c.muted }]}>All songs and albums this user has liked.</Text>
        </View>
      }
      ListEmptyComponent={
        <View style={[styles.emptyBox, { borderColor: c.border }]}>
          <Text style={{ color: c.muted }}>{user?.displayName || username} {"hasn't liked any songs or albums yet."}</Text>
        </View>
      }
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.card} onPress={() => router.push(`/${item.entityType}/${item.entityId}` as any)}>
          <Image source={{ uri: item.entityCoverArtUrl }} style={styles.cardImg} resizeMode="cover" />
          <Text style={[styles.cardTitle, { color: c.text }]} numberOfLines={1}>{item.entityTitle}</Text>
        </TouchableOpacity>
      )}
      ListFooterComponent={
        hasMore ? (
          <View style={{ alignItems: 'center', marginTop: 20, marginBottom: 32 }}>
            <TouchableOpacity
              style={[styles.loadMoreBtn, { backgroundColor: c.accent }, loadingMore && { opacity: 0.6 }]}
              onPress={fetchMore} disabled={loadingMore}
            >
              {loadingMore
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={styles.loadMoreText}>Load More</Text>
              }
            </TouchableOpacity>
          </View>
        ) : null
      }
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
  cardImg: { width: '100%', aspectRatio: 1, borderRadius: 8, backgroundColor: '#e5e7eb' },
  cardTitle: { fontSize: 12, fontWeight: '600', marginTop: 4 },
  emptyBox: { borderWidth: 2, borderStyle: 'dashed', borderRadius: 10, padding: 40, alignItems: 'center', margin: 16 },
  loadMoreBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  loadMoreText: { color: '#fff', fontWeight: '600' },
  center: { textAlign: 'center', marginTop: 40 },
});

export default UserLikesPage;