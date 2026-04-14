import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Image,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  collection, query, where, getDocs, limit, orderBy,
  Timestamp, documentId, collectionGroup, startAfter,
} from '@firebase/firestore';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../../../../hooks/useAuth';
import { useTheme } from '../../../../../hooks/useTheme';
import { db } from '../../../../../services/firebase';
import { colors, C } from '../../../../../constants/theme';
import { UserProfile, Review, Like, Follow } from '../../../../../types';

const PAGE = 20;

type ActivityLog =
  | (Review & { _activityType: 'review' })
  | (Like & { _activityType: 'like' })
  | (Review & { _activityType: 'follow' });

const DiaryItem: React.FC<{ activity: ActivityLog; profile: UserProfile; c: any }> = ({ activity, profile, c }) => {
  const router = useRouter();
  const date = activity.createdAt instanceof Timestamp
    ? activity.createdAt.toDate().toLocaleDateString()
    : null;

  let action = '', path = '', coverUrl = '', isRound = false;

  if (activity._activityType === 'review') {
    const r = activity as Review;
    action = r.reviewText ? `reviewed ${r.entityTitle}` : `rated ${r.entityTitle}`;
    path = `/${r.entityType}/${r.entityId}`;
    coverUrl = r.entityCoverArtUrl || '';
  } else if (activity._activityType === 'like') {
    const l = activity as Like;
    if (l.entityType === 'review') {
      action = `liked a review for ${l.reviewOnEntityTitle}`;
      path = `/review/${l.entityId}`;
    } else {
      action = `liked ${l.entityTitle}`;
      path = `/${l.entityType}/${l.entityId}`;
    }
    coverUrl = l.entityCoverArtUrl || '';
  } else {
    const f = activity as Review;
    action = `started following ${f.entityTitle}`;
    path = `/${f.entityUsername}`;
    coverUrl = f.entityCoverArtUrl || '';
    isRound = true;
  }

  return (
    <View style={[styles.row, { borderBottomColor: c.border }]}>
      <TouchableOpacity onPress={() => router.push(`/${profile.username}` as any)}>
        <Image
          source={{ uri: profile.photoURL || `https://ui-avatars.com/api/?name=${profile.displayName}` }}
          style={styles.avatar}
        />
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13, color: c.text }}>
          <Text style={{ fontFamily: 'Inter_700Bold' }}>{profile.displayName}</Text>
          {' '}{action}
        </Text>
        {date ? <Text style={{ fontSize: 11, color: c.muted, marginTop: 2 }}>{date}</Text> : null}
      </View>
      {coverUrl ? (
        <TouchableOpacity onPress={() => router.push(path as any)}>
          <Image
            source={{ uri: coverUrl }}
            style={[styles.cover, { borderRadius: isRound ? 20 : 6 }]}
          />
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

export default function ActivityTab() {
  const { currentUser, userProfile } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const c = isDark ? colors.dark : colors.light;

  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastTimestamp, setLastTimestamp] = useState<Timestamp | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = useCallback(async (lastTs: Timestamp | null) => {
    if (!userProfile) return null;
    const after = lastTs ? [startAfter(lastTs)] : [];

    const [reviewsSnap, likesSnap, followsSnap] = await Promise.all([
      getDocs(query(collectionGroup(db, 'reviews'), where('userId', '==', userProfile.uid), orderBy('createdAt', 'desc'), ...after, limit(PAGE))),
      getDocs(query(collection(db, 'likes'), where('userId', '==', userProfile.uid), orderBy('createdAt', 'desc'), ...after, limit(PAGE))),
      getDocs(query(collection(db, 'follows'), where('followerId', '==', userProfile.uid), orderBy('createdAt', 'desc'), ...after, limit(PAGE))),
    ]);

    const reviewActs: ActivityLog[] = reviewsSnap.docs.map(d => ({ ...(d.data() as Review), _activityType: 'review' as const }));
    const likeActs: ActivityLog[] = likesSnap.docs.map(d => ({ ...(d.data() as Like), id: d.id, _activityType: 'like' as const }));

    const fIds = followsSnap.docs.map(d => d.data().followingId);
    const followedMap: Record<string, UserProfile> = {};
    if (fIds.length > 0) {
      const chunks: string[][] = [];
      for (let i = 0; i < fIds.length; i += 30) chunks.push(fIds.slice(i, i + 30));
      for (const chunk of chunks) {
        const us = await getDocs(query(collection(db, 'users'), where(documentId(), 'in', chunk)));
        us.docs.forEach(d => { followedMap[d.id] = d.data() as UserProfile; });
      }
    }
    const followActs: ActivityLog[] = followsSnap.docs.map((d): ActivityLog | null => {
      const f = d.data() as Follow;
      const fu = followedMap[f.followingId];
      if (!fu) return null;
      return { id: d.id, userId: userProfile.uid, userDisplayName: userProfile.displayName || userProfile.username, userPhotoURL: userProfile.photoURL, createdAt: f.createdAt, entityId: fu.uid, entityType: 'user', entityTitle: fu.displayName || fu.username, entityUsername: fu.username, entityCoverArtUrl: fu.photoURL, rating: 0, reviewText: '', likes: [], _activityType: 'follow' } as ActivityLog;
    }).filter((x): x is ActivityLog => !!x);

    const merged = [...reviewActs, ...likeActs, ...followActs];
    merged.sort((a, b) => ((b.createdAt as Timestamp)?.toMillis() || 0) - ((a.createdAt as Timestamp)?.toMillis() || 0));
    const page = merged.slice(0, PAGE);
    const newLast = page.length > 0 ? page[page.length - 1].createdAt as Timestamp : null;
    return { page, newLast, hasMore: page.length === PAGE };
  }, [userProfile]);

  useEffect(() => {
    if (!currentUser || !userProfile) { setLoading(false); return; }
    const run = async () => {
      setLoading(true); setError(null);
      try {
        const result = await fetchActivities(null);
        if (result) { setActivities(result.page); setLastTimestamp(result.newLast); setHasMore(result.hasMore); }
      } catch { setError('Failed to load activity.'); }
      finally { setLoading(false); }
    };
    run();
  }, [fetchActivities, currentUser, userProfile]);

  const fetchMore = async () => {
    if (!hasMore || loadingMore || !lastTimestamp) return;
    setLoadingMore(true);
    try {
      const result = await fetchActivities(lastTimestamp);
      if (result) { setActivities(p => [...p, ...result.page]); setLastTimestamp(result.newLast); setHasMore(result.hasMore); }
    } catch { /* ignore */ }
    finally { setLoadingMore(false); }
  };

  if (!currentUser) {
    return (
      <View style={[styles.center, { backgroundColor: c.bg }]}>
        <MaterialIcons name="lock" size={48} color={c.muted} />
        <Text style={[styles.centerTitle, { color: c.text }]}>Private Activity</Text>
        <Text style={[styles.centerSub, { color: c.muted }]}>Log in to see your personal activity feed.</Text>
      </View>
    );
  }

  if (loading) return <ActivityIndicator style={{ flex: 1, backgroundColor: c.bg }} color={C.secondary} />;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <FlatList
        data={activities}
        keyExtractor={a => `${a._activityType}-${a.id}`}
        style={{ backgroundColor: c.bg }}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListHeaderComponent={
          <View style={[styles.header, { borderBottomColor: c.border }]}>
            <Text style={[styles.heading, { color: c.text }]}>My Activity</Text>
            <Text style={[styles.sub, { color: c.muted }]}>Your personal diary on Acapella.</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={[styles.emptyBox, { borderColor: c.border }]}>
            <MaterialIcons name="history" size={32} color={c.muted} />
            <Text style={{ color: c.muted, marginTop: 10, fontSize: 14 }}>No activity yet. Start reviewing and liking music!</Text>
          </View>
        }
        renderItem={({ item }) => (
          userProfile ? <DiaryItem activity={item} profile={userProfile} c={c} /> : null
        )}
        ListFooterComponent={
          hasMore ? (
            <View style={{ alignItems: 'center', marginTop: 16 }}>
              <TouchableOpacity
                style={[styles.loadMoreBtn, { backgroundColor: C.secondary }]}
                onPress={fetchMore} disabled={loadingMore}
              >
                {loadingMore
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={{ color: '#fff', fontWeight: '600' }}>Load More</Text>
                }
              </TouchableOpacity>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { padding: 16, paddingTop: 24, borderBottomWidth: 1, marginBottom: 8 },
  heading: { fontSize: 26, fontFamily: 'InstrumentSerif_400Regular', fontWeight: '700' },
  sub: { fontSize: 13, marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderBottomWidth: 1 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  cover: { width: 42, height: 42 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  centerTitle: { fontSize: 20, fontFamily: 'InstrumentSerif_400Regular', fontWeight: '700' },
  centerSub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  emptyBox: { borderWidth: 2, borderStyle: 'dashed', borderRadius: 10, padding: 40, margin: 16, alignItems: 'center' },
  loadMoreBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
});