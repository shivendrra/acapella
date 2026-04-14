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
import { Song, Review } from '../../../../types';

const TrendingSongCard: React.FC<{ song: Song; c: any }> = ({ song, c }) => {
  const router = useRouter();
  const uri = song.coverArtUrl || `https://placehold.co/400x400/131010/FAF8F1?text=${encodeURIComponent(song.title.charAt(0))}`;
  return (
    <TouchableOpacity style={styles.songCard} onPress={() => router.push(`/song/${song.id}` as any)}>
      <Image source={{ uri }} style={styles.songCardImg} resizeMode="cover" />
      <View style={styles.songCardGradient} />
      <View style={styles.songCardInfo}>
        <Text style={styles.songCardTitle} numberOfLines={1}>{song.title}</Text>
        <Text style={styles.songCardGenre}>{song.genre}</Text>
        <View style={styles.songCardMeta}>
          <MaterialIcons name="star" size={14} color="#facc15" />
          <Text style={styles.songCardMetaText}>{song.reviewCount || 0} Reviews</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const FollowingReviewCard: React.FC<{ review: Review; c: any }> = ({ review, c }) => {
  const router = useRouter();
  return (
    <View style={[styles.reviewCard, { borderColor: c.border, backgroundColor: c.cardBg }]}>
      <View style={styles.reviewCardHeader}>
        <Image source={{ uri: review.userPhotoURL || '' }} style={styles.reviewAvatar} />
        <View>
          <Text style={[{ fontWeight: '600', fontSize: 14 }, { color: c.text }]}>{review.userDisplayName}</Text>
          <View style={{ flexDirection: 'row' }}>
            {[...Array(5)].map((_, i) => (
              <MaterialIcons key={i} name="star" size={13} color={i < review.rating ? '#facc15' : c.starEmpty} />
            ))}
          </View>
        </View>
      </View>
      <Text style={[styles.reviewSnippet, { color: c.muted }]} numberOfLines={3}>{review.reviewText}</Text>
      <TouchableOpacity onPress={() => router.push(`/song/${review.entityId}` as any)}>
        <Text style={[styles.reviewLink, { color: c.accent }]}>Read more on {review.entityTitle}</Text>
      </TouchableOpacity>
    </View>
  );
};

const SongsIndexPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const c = isDark ? colors.dark : colors.light;

  const [trending, setTrending] = useState<Song[]>([]);
  const [networkReviews, setNetworkReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true); setError(null);
      try {
        const tSnap = await getDocs(query(collection(db, 'songs'), orderBy('reviewCount', 'desc'), limit(12)));
        setTrending(tSnap.docs.map(d => ({ id: d.id, ...d.data() } as Song)));

        if (currentUser) {
          const fSnap = await getDocs(query(collection(db, 'follows'), where('followerId', '==', currentUser.uid)));
          const fIds = fSnap.docs.map(d => d.data().followingId);
          if (fIds.length > 0) {
            const snaps = await Promise.all(fIds.map(uid =>
              getDocs(query(collectionGroup(db, 'reviews'), where('userId', '==', uid), where('entityType', '==', 'song'), orderBy('createdAt', 'desc'), limit(5)))
            ));
            const all = snaps.flatMap(s => s.docs.map(d => ({ id: d.id, ...d.data() } as Review)))
              .filter(r => r.reviewText.trim());
            all.sort((a, b) => ((b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : 0) - (a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : 0)));
            setNetworkReviews(all.slice(0, 10));
          }
        }
      } catch { setError("Failed to load songs. A Firestore index may be required."); }
      finally { setLoading(false); }
    };
    run();
  }, [currentUser]);

  if (loading) return <ActivityIndicator style={{ flex: 1, marginTop: 64 }} color={c.accent} />;
  if (error) return <Text style={[styles.center, { color: '#ef4444' }]}>{error}</Text>;

  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 48, gap: 32 }}>
      <Text style={[styles.heading, { color: c.text }]}>Songs</Text>

      {currentUser && networkReviews.length > 0 && (
        <View>
          <Text style={[styles.sectionTitle, { color: c.text }]}>Reviews from Your Network</Text>
          <FlatList
            data={networkReviews}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={r => r.id}
            contentContainerStyle={{ gap: 12, paddingBottom: 4 }}
            renderItem={({ item }) => (
              <View style={{ width: 260 }}><FollowingReviewCard review={item} c={c} /></View>
            )}
          />
        </View>
      )}

      <View>
        <Text style={[styles.sectionTitle, { color: c.text }]}>Trending Songs</Text>
        <FlatList
          data={trending}
          numColumns={2}
          keyExtractor={s => s.id}
          scrollEnabled={false}
          contentContainerStyle={{ gap: 12 }}
          columnWrapperStyle={{ gap: 12 }}
          renderItem={({ item }) => <TrendingSongCard song={item} c={c} />}
        />
      </View>
    </ScrollView>
  );
};

const colors = {
  light: { bg: '#f9fafb', text: '#111827', muted: '#6b7280', accent: '#63479b', border: '#e5e7eb', cardBg: '#ffffff', starEmpty: '#d1d5db' },
  dark: { bg: '#0f0f0f', text: '#f9fafb', muted: '#9ca3af', accent: '#a78bdf', border: '#374151', cardBg: '#1f2937', starEmpty: '#4b5563' },
};

const styles = StyleSheet.create({
  heading: { fontSize: 28, fontWeight: '700', fontFamily: 'serif' },
  sectionTitle: { fontSize: 20, fontWeight: '700', fontFamily: 'serif', marginBottom: 12 },
  songCard: { flex: 1, aspectRatio: 1, borderRadius: 10, overflow: 'hidden', backgroundColor: '#e5e7eb' },
  songCardImg: { ...StyleSheet.absoluteFillObject, width: undefined, height: undefined },
  songCardGradient: { ...StyleSheet.absoluteFillObject, backgroundColor: 'transparent',
    // Simulate gradient with a semi-transparent bottom overlay
  },
  songCardInfo: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 10, backgroundColor: 'rgba(0,0,0,0.55)' },
  songCardTitle: { color: '#fff', fontWeight: '700', fontSize: 14 },
  songCardGenre: { color: '#d1d5db', fontSize: 12, marginTop: 2 },
  songCardMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
  songCardMetaText: { color: '#facc15', fontSize: 12, fontWeight: '600' },
  reviewCard: { borderWidth: 1, borderRadius: 10, padding: 12, gap: 8 },
  reviewCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  reviewAvatar: { width: 36, height: 36, borderRadius: 18 },
  reviewSnippet: { fontSize: 13, lineHeight: 18 },
  reviewLink: { fontSize: 13, fontWeight: '600' },
  center: { textAlign: 'center', marginTop: 40 },
});

export default SongsIndexPage;