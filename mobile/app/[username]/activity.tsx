import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Image,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import {
  collection, query, where, getDocs, limit, orderBy,
  Timestamp, documentId, collectionGroup, startAfter,
} from '@firebase/firestore';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { db } from '../../services/firebase';
import { UserProfile, Review, Like, Follow } from '../../types';

const PAGE = 15;

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
    <View style={[styles.diaryRow, { borderBottomColor: c.border }]}>
      <TouchableOpacity onPress={() => router.push(`/${profile.username}` as any)}>
        <Image source={{ uri: profile.photoURL || `https://ui-avatars.com/api/?name=${profile.displayName}` }} style={styles.profileAvatar} />
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13, color: c.text }}>
          <Text style={{ fontWeight: '700' }}>{profile.displayName}</Text>{' '}{action}
        </Text>
        {date ? <Text style={{ fontSize: 11, color: c.muted, marginTop: 2 }}>{date}</Text> : null}
      </View>
      {coverUrl ? (
        <TouchableOpacity onPress={() => router.push(path as any)}>
          <Image source={{ uri: coverUrl }} style={[styles.coverThumb, { borderRadius: isRound ? 20 : 6 }]} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const UserActivityPage: React.FC = () => {
  const { username } = useLocalSearchParams<{ username: string }>();
  const { currentUser } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const c = isDark ? colors.dark : colors.light;

  const [user, setUser] = useState<UserProfile | null>(null);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastTimestamp, setLastTimestamp] = useState<Timestamp | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = useCallback(async (u: UserProfile, lastTs: Timestamp | null) => {
    if (!currentUser) { setError("You must be logged in to view activity."); return null; }
    const after = lastTs ? [startAfter(lastTs)] : [];

    const [reviewsSnap, likesSnap, followsSnap] = await Promise.all([
      getDocs(query(collectionGroup(db, 'reviews'), where('userId', '==', u.uid), orderBy('createdAt', 'desc'), ...after, limit(PAGE))),
      getDocs(query(collection(db, 'likes'), where('userId', '==', u.uid), orderBy('createdAt', 'desc'), ...after, limit(PAGE))),
      getDocs(query(collection(db, 'follows'), where('followerId', '==', u.uid), orderBy('createdAt', 'desc'), ...after, limit(PAGE))),
    ]);

    const reviewActs: ActivityLog[] = reviewsSnap.docs.map(d => ({ ...(d.data() as Review), _activityType: 'review' as const }));
    const likeActs: ActivityLog[] = likesSnap.docs.map(d => {
      const { id, ...data } = d.data() as Like; // omit id from data
      return { id: d.id, ...data, _activityType: 'like' as const };
    });

    const fIds = followsSnap.docs.map(d => d.data().followingId);
    const followedMap: Record<string, UserProfile> = {};
    if (fIds.length > 0) {
      const chunks: string[][] = [];
      for (let i = 0; i < fIds.length; i += 30) chunks.push(fIds.slice(i, i + 30));
      for (const chunk of chunks) {
        const uSnap = await getDocs(query(collection(db, 'users'), where(documentId(), 'in', chunk)));
        uSnap.docs.forEach(d => { followedMap[d.id] = d.data() as UserProfile; });
      }
    }
    const followActs: ActivityLog[] = followsSnap.docs.map((d): ActivityLog | null => {
      const f = d.data() as Follow;
      const fu = followedMap[f.followingId];
      if (!fu) return null;
      return { id: d.id, userId: u.uid, userDisplayName: u.displayName || u.username, userPhotoURL: u.photoURL, createdAt: f.createdAt, entityId: fu.uid, entityType: 'user', entityTitle: fu.displayName || fu.username, entityUsername: fu.username, entityCoverArtUrl: fu.photoURL, rating: 0, reviewText: '', likes: [], _activityType: 'follow' } as ActivityLog;
    }).filter((x): x is ActivityLog => !!x);

    const merged = [...reviewActs, ...likeActs, ...followActs];
    merged.sort((a, b) => ((b.createdAt as Timestamp)?.toMillis() || 0) - ((a.createdAt as Timestamp)?.toMillis() || 0));
    const page = merged.slice(0, PAGE);
    const newLast = page.length > 0 ? page[page.length - 1].createdAt as Timestamp : null;

    return { page, newLast, hasMore: page.length === PAGE };
  }, [currentUser]);

  useEffect(() => {
    const run = async () => {
      if (!username) return;
      setLoading(true); setError(null);
      try {
        const uSnap = await getDocs(query(collection(db, 'users'), where('username', '==', username), limit(1)));
        if (uSnap.empty) { setError('User not found.'); setLoading(false); return; }
        const userData = uSnap.docs[0].data() as UserProfile;
        setUser(userData);
        const result = await fetchActivities(userData, null);
        if (result) { setActivities(result.page); setLastTimestamp(result.newLast); setHasMore(result.hasMore); }
      } catch { setError("Failed to load activity."); }
      finally { setLoading(false); }
    };
    run();
  }, [username, fetchActivities]);

  const fetchMore = async () => {
    if (!user || !hasMore || loadingMore || !lastTimestamp) return;
    setLoadingMore(true);
    try {
      const result = await fetchActivities(user, lastTimestamp);
      if (result) { setActivities(p => [...p, ...result.page]); setLastTimestamp(result.newLast); setHasMore(result.hasMore); }
    } catch { setError("Failed to load more."); }
    finally { setLoadingMore(false); }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1, marginTop: 64 }} color={c.accent} />;
  if (error) return <Text style={[styles.center, { color: '#ef4444' }]}>{error}</Text>;
  if (!user) return null;

  return (
    <FlatList
      data={activities}
      keyExtractor={a => `${a._activityType}-${a.id}`}
      contentContainerStyle={{ paddingBottom: 48 }}
      ListHeaderComponent={
        <View style={{ padding: 16, paddingBottom: 8 }}>
          <Text style={[styles.heading, { color: c.text }]}>Activity by {user.displayName || username}</Text>
          <Text style={[styles.sub, { color: c.muted }]}>A feed of all their recent activity on Acapella.</Text>
        </View>
      }
      ListEmptyComponent={
        <View style={[styles.emptyBox, { borderColor: c.border, margin: 16 }]}>
          <Text style={{ color: c.muted }}>{user.displayName || username} has no public activity yet.</Text>
        </View>
      }
      renderItem={({ item }) => <DiaryItem activity={item} profile={user} c={c} />}
      ListFooterComponent={
        hasMore ? (
          <View style={{ alignItems: 'center', marginVertical: 20 }}>
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
  diaryRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderBottomWidth: 1 },
  profileAvatar: { width: 40, height: 40, borderRadius: 20 },
  coverThumb: { width: 40, height: 40 },
  emptyBox: { borderWidth: 2, borderStyle: 'dashed', borderRadius: 10, padding: 40, alignItems: 'center' },
  loadMoreBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  loadMoreText: { color: '#fff', fontWeight: '600' },
  center: { textAlign: 'center', marginTop: 40 },
});

export default UserActivityPage;