import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Image,
  StyleSheet, ActivityIndicator, ScrollView,
} from 'react-native';
import {
  collection, query, where, getDocs, orderBy, limit,
  Timestamp, collectionGroup,
} from '@firebase/firestore';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../../../hooks/useAuth';
import { useTheme } from '../../../../hooks/useTheme';
import { db } from '../../../../services/firebase';
import { Album, Review } from '../../../../types';

const TrendingAlbumCard: React.FC<{ album: Album; c: any }> = ({ album, c }) => {
  const router = useRouter();
  return (
    <TouchableOpacity style={styles.albumCard} onPress={() => router.push(`/album/${album.id}` as any)}>
      <Image source={{ uri: album.coverArtUrl }} style={styles.albumImg} resizeMode="cover" />
      <Text style={[styles.albumTitle, { color: c.text }]} numberOfLines={1}>{album.title}</Text>
      <View style={styles.albumMeta}>
        <MaterialIcons name="star" size={13} color="#eab308" />
        <Text style={[styles.albumMetaText, { color: c.muted }]}>{album.reviewCount || 0} Reviews</Text>
      </View>
    </TouchableOpacity>
  );
};

const FollowingReviewCard: React.FC<{ review: Review; c: any }> = ({ review, c }) => {
  const router = useRouter();
  return (
    <View style={[styles.reviewCard, { borderColor: c.border }]}>
      <TouchableOpacity onPress={() => router.push(`/album/${review.entityId}` as any)}>
        <Image source={{ uri: review.entityCoverArtUrl }} style={styles.reviewCover} resizeMode="cover" />
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <View style={styles.reviewUser}>
          <Image source={{ uri: review.userPhotoURL || '' }} style={styles.reviewAvatar} />
          <Text style={[{ fontWeight: '600', fontSize: 13 }, { color: c.text }]}>{review.userDisplayName}</Text>
        </View>
        <View style={{ flexDirection: 'row', marginVertical: 4 }}>
          {[...Array(5)].map((_, i) => (
            <MaterialIcons key={i} name="star" size={13} color={i < review.rating ? '#facc15' : c.starEmpty} />
          ))}
        </View>
        <Text style={[styles.reviewSnippet, { color: c.muted }]} numberOfLines={2}>{review.reviewText}</Text>
      </View>
    </View>
  );
};

const AlbumsIndexPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const c = isDark ? colors.dark : colors.light;

  const [trending, setTrending] = useState<Album[]>([]);
  const [networkReviews, setNetworkReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true); setError(null);
      try {
        const tSnap = await getDocs(query(collection(db, 'albums'), orderBy('reviewCount', 'desc'), limit(12)));
        setTrending(tSnap.docs.map(d => ({ id: d.id, ...d.data() } as Album)));

        if (currentUser) {
          const fSnap = await getDocs(query(collection(db, 'follows'), where('followerId', '==', currentUser.uid)));
          const fIds = fSnap.docs.map(d => d.data().followingId);
          if (fIds.length > 0) {
            const snaps = await Promise.all(fIds.map(uid =>
              getDocs(query(collectionGroup(db, 'reviews'), where('userId', '==', uid), where('entityType', '==', 'album'), orderBy('createdAt', 'desc'), limit(5)))
            ));
            const all = snaps.flatMap(s => s.docs.map(d => ({ id: d.id, ...d.data() } as Review)))
              .filter(r => r.reviewText.trim());
            all.sort((a, b) => ((b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : 0) - (a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : 0)));
            setNetworkReviews(all.slice(0, 5));
          }
        }
      } catch { setError("Failed to load albums. A Firestore index may be required."); }
      finally { setLoading(false); }
    };
    run();
  }, [currentUser]);

  if (loading) return <ActivityIndicator style={{ flex: 1, marginTop: 64 }} color={c.accent} />;
  if (error) return <Text style={[styles.center, { color: '#ef4444' }]}>{error}</Text>;

  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 48, gap: 32 }}>
      <Text style={[styles.heading, { color: c.text }]}>Albums</Text>

      {currentUser && networkReviews.length > 0 && (
        <View>
          <Text style={[styles.sectionTitle, { color: c.text }]}>Reviews from Your Network</Text>
          <View style={{ gap: 10 }}>
            {networkReviews.map(r => <FollowingReviewCard key={r.id} review={r} c={c} />)}
          </View>
        </View>
      )}

      <View>
        <Text style={[styles.sectionTitle, { color: c.text }]}>Trending Albums</Text>
        <FlatList
          data={trending}
          numColumns={3}
          keyExtractor={a => a.id}
          scrollEnabled={false}
          contentContainerStyle={{ gap: 10 }}
          columnWrapperStyle={{ gap: 10 }}
          renderItem={({ item }) => <TrendingAlbumCard album={item} c={c} />}
        />
      </View>
    </ScrollView>
  );
};

const colors = {
  light: { bg: '#f9fafb', text: '#111827', muted: '#6b7280', accent: '#63479b', border: '#e5e7eb', starEmpty: '#d1d5db' },
  dark: { bg: '#0f0f0f', text: '#f9fafb', muted: '#9ca3af', accent: '#a78bdf', border: '#374151', starEmpty: '#4b5563' },
};

const styles = StyleSheet.create({
  heading: { fontSize: 28, fontWeight: '700', fontFamily: 'serif' },
  sectionTitle: { fontSize: 20, fontWeight: '700', fontFamily: 'serif', marginBottom: 12 },
  albumCard: { flex: 1 },
  albumImg: { width: '100%', aspectRatio: 1, borderRadius: 8, backgroundColor: '#e5e7eb' },
  albumTitle: { fontSize: 13, fontWeight: '600', marginTop: 6 },
  albumMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  albumMetaText: { fontSize: 12 },
  reviewCard: { flexDirection: 'row', gap: 12, borderWidth: 1, borderRadius: 10, padding: 12 },
  reviewCover: { width: 80, height: 80, borderRadius: 8 },
  reviewUser: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  reviewAvatar: { width: 22, height: 22, borderRadius: 11 },
  reviewSnippet: { fontSize: 12, lineHeight: 17, marginTop: 4 },
  center: { textAlign: 'center', marginTop: 40 },
});

export default AlbumsIndexPage;