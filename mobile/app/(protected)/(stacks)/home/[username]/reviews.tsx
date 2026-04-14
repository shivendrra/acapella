import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Image,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { collection, query, where, getDocs, limit, orderBy, startAfter, collectionGroup } from '@firebase/firestore';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../../../../hooks/useAuth';
import { useTheme } from '../../../../../hooks/useTheme';
import { db } from '../../../../../services/firebase';
import { UserProfile, Review } from '../../../../../types';
import { formatDate } from '../../../../../utils/formatters';

const PAGE = 20;

const ReviewItemCard: React.FC<{ item: Review; c: any }> = ({ item, c }) => {
  const router = useRouter();
  return (
    <View style={[styles.card, { borderBottomColor: c.border }]}>
      <TouchableOpacity onPress={() => router.push(`/${item.entityType}/${item.entityId}` as any)}>
        <Image source={{ uri: item.entityCoverArtUrl }} style={styles.cardImg} resizeMode="cover" />
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <TouchableOpacity onPress={() => router.push(`/${item.entityType}/${item.entityId}` as any)}>
          <Text style={[styles.cardTitle, { color: c.text }]} numberOfLines={2}>{item.entityTitle}</Text>
        </TouchableOpacity>
        <View style={styles.starsRow}>
          {[...Array(5)].map((_, i) => (
            <MaterialIcons key={i} name="star" size={14} color={i < item.rating ? '#facc15' : c.starEmpty} />
          ))}
        </View>
        <TouchableOpacity onPress={() => router.push(`/review/${item.id}` as any)}>
          <Text style={[styles.dateText, { color: c.muted }]}>
            {'Reviewed on '}{formatDate(item.createdAt) || 'a while ago'}
          </Text>
        </TouchableOpacity>
        {item.reviewText?.trim() ? (
          <Text style={[styles.snippet, { color: c.bodyText }]} numberOfLines={3}>{item.reviewText}</Text>
        ) : null}
      </View>
    </View>
  );
};

const UserReviewsPage: React.FC = () => {
  const { username } = useLocalSearchParams<{ username: string }>();
  const { currentUser } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const c = isDark ? colors.dark : colors.light;

  const [user, setUser] = useState<UserProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      if (!username) return;
      setLoading(true); setError(null); setReviews([]);
      if (!currentUser) { setError("You must be logged in to view reviews."); setLoading(false); return; }
      try {
        const uSnap = await getDocs(query(collection(db, 'users'), where('username', '==', username), limit(1)));
        if (uSnap.empty) { setError('User not found.'); setLoading(false); return; }
        const userData = uSnap.docs[0].data() as UserProfile;
        setUser(userData);

        const rSnap = await getDocs(query(
          collectionGroup(db, 'reviews'),
          where('userId', '==', userData.uid),
          orderBy('createdAt', 'desc'), limit(PAGE)
        ));
        const all = rSnap.docs.map(d => d.data() as Review);
        setReviews(all.filter(r => r.reviewText?.trim()));
        setLastDoc(rSnap.docs[rSnap.docs.length - 1]);
        setHasMore(rSnap.docs.length === PAGE);
      } catch { setError("Failed to load reviews."); }
      finally { setLoading(false); }
    };
    run();
  }, [username, currentUser]);

  const fetchMore = async () => {
    if (!user || !hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      const rSnap = await getDocs(query(
        collectionGroup(db, 'reviews'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'), startAfter(lastDoc), limit(PAGE)
      ));
      const all = rSnap.docs.map(d => d.data() as Review);
      setReviews(p => [...p, ...all.filter(r => r.reviewText?.trim())]);
      setLastDoc(rSnap.docs[rSnap.docs.length - 1]);
      setHasMore(rSnap.docs.length === PAGE);
    } catch { setError("Failed to load more."); }
    finally { setLoadingMore(false); }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1, marginTop: 64 }} color={c.accent} />;
  if (error) return <Text style={[styles.center, { color: '#ef4444' }]}>{error}</Text>;

  return (
    <FlatList
      data={reviews}
      keyExtractor={r => r.id}
      contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
      ListHeaderComponent={
        <View style={{ marginBottom: 16 }}>
          <Text style={[styles.heading, { color: c.text }]}>Reviews by {user?.displayName || username}</Text>
          <Text style={[styles.sub, { color: c.muted }]}>All written reviews from this user.</Text>
        </View>
      }
      ListEmptyComponent={
        <View style={[styles.emptyBox, { borderColor: c.border }]}>
          <Text style={{ color: c.muted }}>{user?.displayName || username} {"hasn't written any reviews yet."}</Text>
        </View>
      }
      ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: c.border }} />}
      renderItem={({ item }) => <ReviewItemCard item={item} c={c} />}
      ListFooterComponent={
        hasMore ? (
          <View style={{ alignItems: 'center', marginTop: 20 }}>
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
  light: { bg: '#f9fafb', text: '#111827', bodyText: '#374151', muted: '#6b7280', accent: '#63479b', border: '#e5e7eb', starEmpty: '#d1d5db' },
  dark: { bg: '#0f0f0f', text: '#f9fafb', bodyText: '#d1d5db', muted: '#9ca3af', accent: '#a78bdf', border: '#374151', starEmpty: '#4b5563' },
};

const styles = StyleSheet.create({
  heading: { fontSize: 24, fontWeight: '700', fontFamily: 'serif' },
  sub: { fontSize: 13, marginTop: 4 },
  card: { flexDirection: 'row', gap: 14, paddingVertical: 14, borderBottomWidth: 1 },
  cardImg: { width: 88, height: 88, borderRadius: 8, backgroundColor: '#e5e7eb', flexShrink: 0 },
  cardTitle: { fontSize: 16, fontWeight: '700', fontFamily: 'serif' },
  starsRow: { flexDirection: 'row', marginVertical: 4 },
  dateText: { fontSize: 12 },
  snippet: { fontSize: 13, marginTop: 6, lineHeight: 18 },
  emptyBox: { borderWidth: 2, borderStyle: 'dashed', borderRadius: 10, padding: 40, alignItems: 'center' },
  loadMoreBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  loadMoreText: { color: '#fff', fontWeight: '600' },
  center: { textAlign: 'center', marginTop: 40 },
});

export default UserReviewsPage;