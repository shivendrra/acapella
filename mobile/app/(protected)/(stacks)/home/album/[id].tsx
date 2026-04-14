import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image, TextInput,
  StyleSheet, ActivityIndicator, Linking,
} from 'react-native';
import {
  doc, getDoc, collection, query, where, getDocs, orderBy,
  serverTimestamp, Timestamp, setDoc, updateDoc, arrayUnion,
  arrayRemove, increment, writeBatch,
} from '@firebase/firestore';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { db } from '../../../../../services/firebase';
import { useAuth } from '../../../../../hooks/useAuth';
import { useTheme } from '../../../../../hooks/useTheme';
import { Album, Artist, Song, Review as ReviewType, Like } from '../../../../../types';
import { formatDate } from '../../../../../utils/formatters';

const formatDuration = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

const StarRow: React.FC<{ rating: number; size?: number; c: any }> = ({ rating, size = 14, c }) => (
  <View style={{ flexDirection: 'row' }}>
    {[...Array(5)].map((_, i) => (
      <MaterialIcons key={i} name="star" size={size} color={i < rating ? '#facc15' : c.starEmpty} />
    ))}
  </View>
);

const StarPicker: React.FC<{ rating: number; onChange: (r: number) => void; c: any }> = ({ rating, onChange, c }) => (
  <View style={{ flexDirection: 'row', gap: 4 }}>
    {[1, 2, 3, 4, 5].map(v => (
      <TouchableOpacity key={v} onPress={() => onChange(v)}>
        <MaterialIcons name="star" size={32} color={v <= rating ? '#facc15' : c.starEmpty} />
      </TouchableOpacity>
    ))}
  </View>
);

const ReviewCard: React.FC<{ review: ReviewType; albumId: string; c: any }> = ({ review, albumId, c }) => {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [liked, setLiked] = useState(currentUser ? review.likes?.includes(currentUser.uid) : false);
  const [count, setCount] = useState(review.likesCount ?? review.likes?.length ?? 0);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    if (!currentUser || loading) return;
    setLoading(true);
    const reviewRef = doc(db, 'albums', albumId, 'reviews', review.id);
    const likeRef = doc(db, 'likes', `${currentUser.uid}_${review.id}`);
    const batch = writeBatch(db);
    const next = !liked;
    setLiked(next); setCount(p => next ? p + 1 : p - 1);
    try {
      batch.update(reviewRef, { likes: next ? arrayUnion(currentUser.uid) : arrayRemove(currentUser.uid), likesCount: increment(next ? 1 : -1) });
      if (next) {
        const likeDoc: Like = { id: likeRef.id, userId: currentUser.uid, entityId: review.id, entityType: 'review', createdAt: serverTimestamp(), entityTitle: `Review for "${review.entityTitle}"`, entityCoverArtUrl: review.entityCoverArtUrl, reviewOnEntityType: review.entityType as 'song' | 'album', reviewOnEntityId: review.entityId, reviewOnEntityTitle: review.entityTitle };
        batch.set(likeRef, likeDoc);
      } else { batch.delete(likeRef); }
      await batch.commit();
    } catch { setLiked(!next); setCount(p => next ? p - 1 : p + 1); }
    finally { setLoading(false); }
  };

  return (
    <View style={[styles.reviewCard, { borderBottomColor: c.border }]}>
      <View style={styles.reviewHeader}>
        <Image source={{ uri: review.userPhotoURL || `https://ui-avatars.com/api/?name=${review.userDisplayName}&background=random` }} style={styles.reviewAvatar} />
        <View style={{ flex: 1 }}>
          <View style={styles.reviewMeta}>
            <Text style={[styles.reviewUser, { color: c.text }]}>{review.userDisplayName}</Text>
            <TouchableOpacity onPress={() => router.push(`/review/${review.id}` as any)}>
              <Text style={[styles.reviewDate, { color: c.muted }]}>
                {review.createdAt instanceof Timestamp ? formatDate(review.createdAt) : 'Just now'}
              </Text>
            </TouchableOpacity>
          </View>
          <StarRow rating={review.rating} c={c} />
        </View>
      </View>
      {review.reviewText ? <Text style={[styles.reviewText, { color: c.bodyText }]}>{review.reviewText}</Text> : null}
      <TouchableOpacity style={styles.likeBtn} onPress={toggle} disabled={!currentUser || loading}>
        <MaterialIcons name="favorite" size={16} color={liked ? '#ef4444' : c.muted} />
        <Text style={[styles.likeCount, { color: c.muted }]}>{count}</Text>
      </TouchableOpacity>
    </View>
  );
};

const ReviewForm: React.FC<{ album: Album; onSubmit: () => void; c: any }> = ({ album, onSubmit, c }) => {
  const { currentUser, userProfile } = useAuth();
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!currentUser || !userProfile) { setError('You must be logged in.'); return; }
    if (rating === 0) { setError('Please select a rating.'); return; }
    setSubmitting(true); setError('');
    try {
      const ref = doc(collection(db, 'albums', album.id, 'reviews'));
      await setDoc(ref, { id: ref.id, userId: currentUser.uid, userDisplayName: userProfile.displayName, userPhotoURL: userProfile.photoURL, userRole: userProfile.role, userIsCurator: !!userProfile.isCurator, rating, reviewText: text, createdAt: serverTimestamp(), likes: [], likesCount: 0, entityId: album.id, entityType: 'album', entityTitle: album.title, entityCoverArtUrl: album.coverArtUrl });
      try {
        const ad = await getDoc(doc(db, 'albums', album.id));
        await updateDoc(doc(db, 'albums', album.id), { reviewCount: (ad.data()?.reviewCount || 0) + 1 });
      } catch { /* permission ok */ }
      setRating(0); setText(''); onSubmit();
    } catch { setError('Failed to submit review.'); }
    finally { setSubmitting(false); }
  };

  return (
    <View style={[styles.reviewForm, { borderColor: c.border }]}>
      <Text style={[styles.formTitle, { color: c.text }]}>Leave a Review</Text>
      <StarPicker rating={rating} onChange={setRating} c={c} />
      <TextInput
        style={[styles.textarea, { borderColor: c.border, backgroundColor: c.inputBg, color: c.text }]}
        placeholder="Share your thoughts... (optional)"
        placeholderTextColor={c.muted}
        multiline numberOfLines={4}
        value={text} onChangeText={setText}
      />
      {error ? <Text style={{ color: '#ef4444', fontSize: 13 }}>{error}</Text> : null}
      <TouchableOpacity style={[styles.submitBtn, { backgroundColor: c.accent }, submitting && styles.btnDisabled]} onPress={handleSubmit} disabled={submitting}>
        <MaterialIcons name="send" size={16} color="#fff" style={{ marginRight: 6 }} />
        <Text style={styles.submitBtnText}>{submitting ? 'Posting...' : 'Post Review'}</Text>
      </TouchableOpacity>
    </View>
  );
};

const AlbumPage: React.FC = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { currentUser } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const isDark = theme === 'dark';
  const c = isDark ? colors.dark : colors.light;

  const [album, setAlbum] = useState<Album | null>(null);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [tracklist, setTracklist] = useState<Song[]>([]);
  const [reviews, setReviews] = useState<ReviewType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(true);
  const [likesCount, setLikesCount] = useState(0);

  const fetchData = useCallback(async () => {
    if (!id) { setError('Album ID is missing.'); setLoading(false); return; }
    setLoading(true);
    try {
      const snap = await getDoc(doc(db, 'albums', id));
      if (!snap.exists()) { setError('Album not found.'); setLoading(false); return; }
      const data = { id: snap.id, ...snap.data() } as Album;
      setAlbum(data); setLikesCount(data.likesCount || 0);

      const [arSnap, soSnap, revSnap] = await Promise.all([
        data.artistIds?.length ? getDocs(query(collection(db, 'artists'), where('__name__', 'in', data.artistIds))) : Promise.resolve(null),
        data.tracklist?.length ? getDocs(query(collection(db, 'songs'), where('__name__', 'in', data.tracklist))) : Promise.resolve(null),
        getDocs(query(collection(db, 'albums', id, 'reviews'), orderBy('createdAt', 'desc'))),
      ]);
      if (arSnap) setArtists(arSnap.docs.map(d => ({ id: d.id, ...d.data() } as Artist)));
      if (soSnap) {
        const songs = soSnap.docs.map(d => ({ id: d.id, ...d.data() } as Song));
        setTracklist(data.tracklist.map(sid => songs.find(s => s.id === sid)).filter((s): s is Song => !!s));
      }
      setReviews(revSnap.docs.map(d => ({ id: d.id, ...d.data() } as ReviewType)));
    } catch { setError('Failed to load album details.'); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!currentUser || !album) { setLikeLoading(false); return; }
    getDoc(doc(db, 'likes', `${currentUser.uid}_${album.id}`)).then(s => { setLiked(s.exists()); setLikeLoading(false); });
  }, [currentUser, album]);

  const toggleLike = async () => {
    if (!currentUser || !album || likeLoading) return;
    setLikeLoading(true);
    const likeRef = doc(db, 'likes', `${currentUser.uid}_${album.id}`);
    const albumRef = doc(db, 'albums', album.id);
    const batch = writeBatch(db);
    const next = !liked;
    setLiked(next); setLikesCount(p => next ? p + 1 : p - 1);
    try {
      if (next) { batch.set(likeRef, { userId: currentUser.uid, entityId: album.id, entityType: 'album', createdAt: serverTimestamp(), entityTitle: album.title, entityCoverArtUrl: album.coverArtUrl }); batch.update(albumRef, { likesCount: increment(1) }); }
      else { batch.delete(likeRef); batch.update(albumRef, { likesCount: increment(-1) }); }
      await batch.commit();
    } catch { setLiked(!next); setLikesCount(p => next ? p - 1 : p + 1); }
    finally { setLikeLoading(false); }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1, marginTop: 64 }} color="#63479b" />;
  if (error) return <Text style={[styles.center, { color: '#ef4444' }]}>{error}</Text>;
  if (!album) return null;

  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 48, gap: 40 }}>
      {/* Hero */}
      <View style={styles.hero}>
        <Image source={{ uri: album.coverArtUrl || 'https://picsum.photos/seed/album/400/400' }} style={styles.cover} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: c.text }]}>{album.title}</Text>
          <Text style={{ color: c.muted, fontSize: 14, marginTop: 4 }}>
            by {artists.map((a, i) => (
              <Text key={a.id}>
                <Text style={{ color: c.accent, fontWeight: '600' }} onPress={() => router.push(`/artist/${a.id}` as any)}>{a.name}</Text>
                {i < artists.length - 1 ? ', ' : ''}
              </Text>
            ))}
          </Text>
          <Text style={{ color: c.muted, fontSize: 13, marginTop: 4 }}>{formatDate(album.releaseDate)}</Text>
          <View style={styles.likeRow}>
            <TouchableOpacity onPress={toggleLike} disabled={!currentUser || likeLoading}>
              <MaterialIcons name="favorite" size={24} color={liked ? '#ef4444' : c.muted} />
            </TouchableOpacity>
            <Text style={[{ fontSize: 16, fontWeight: '600' }, { color: c.text }]}>{likesCount}</Text>
          </View>
        </View>
      </View>

      {/* Listen On */}
      {(album.platformLinks?.spotify || album.platformLinks?.appleMusic || album.platformLinks?.youtubeMusic) && (
        <View>
          <Text style={[styles.sectionTitle, { color: c.text }]}>Listen On</Text>
          <View style={styles.platformRow}>
            {album.platformLinks.spotify && <TouchableOpacity style={[styles.platformBtn, { backgroundColor: '#1DB954' }]} onPress={() => Linking.openURL(album.platformLinks!.spotify!)}><Text style={styles.platformText}>Spotify</Text></TouchableOpacity>}
            {album.platformLinks.appleMusic && <TouchableOpacity style={[styles.platformBtn, { backgroundColor: '#000' }]} onPress={() => Linking.openURL(album.platformLinks!.appleMusic!)}><Text style={styles.platformText}>Apple Music</Text></TouchableOpacity>}
            {album.platformLinks.youtubeMusic && <TouchableOpacity style={[styles.platformBtn, { backgroundColor: '#FF0000' }]} onPress={() => Linking.openURL(album.platformLinks!.youtubeMusic!)}><Text style={styles.platformText}>YouTube Music</Text></TouchableOpacity>}
          </View>
        </View>
      )}

      {/* Tracklist */}
      <View>
        <Text style={[styles.sectionTitle, { color: c.text }]}>Tracklist</Text>
        {tracklist.length === 0
          ? <View style={[styles.emptyBox, { borderColor: c.border }]}>
              <MaterialIcons name="music-note" size={28} color={c.muted} />
              <Text style={{ color: c.muted, marginTop: 8 }}>Tracklist is not available yet.</Text>
            </View>
          : <View style={[styles.trackList, { borderColor: c.border }]}>
              {tracklist.map((song, i) => (
                <TouchableOpacity
                  key={song.id}
                  style={[styles.trackRow, { backgroundColor: i % 2 === 0 ? 'transparent' : c.altRow, borderBottomColor: c.border }]}
                  onPress={() => router.push(`/song/${song.id}` as any)}
                >
                  <Text style={[styles.trackNum, { color: c.muted }]}>{i + 1}</Text>
                  <Text style={[styles.trackTitle, { color: c.text }]} numberOfLines={1}>{song.title}</Text>
                  <Text style={[styles.trackDuration, { color: c.muted }]}>{formatDuration(song.duration)}</Text>
                </TouchableOpacity>
              ))}
            </View>
        }
      </View>

      {/* Reviews */}
      <View>
        <Text style={[styles.sectionTitle, { color: c.text }]}>Reviews</Text>
        {currentUser && <ReviewForm album={album} onSubmit={fetchData} c={c} />}
        {reviews.length > 0
          ? <View style={[styles.reviewList, { borderColor: c.border }]}>
              {reviews.map(r => <ReviewCard key={r.id} review={r} albumId={album.id} c={c} />)}
            </View>
          : <View style={[styles.emptyBox, { borderColor: c.border }]}>
              <MaterialIcons name="edit" size={28} color={c.muted} />
              <Text style={{ color: c.muted, marginTop: 8 }}>Be the first to review this album.</Text>
            </View>
        }
      </View>
    </ScrollView>
  );
};

const colors = {
  light: { bg: '#f9fafb', text: '#111827', bodyText: '#374151', muted: '#6b7280', accent: '#63479b', border: '#e5e7eb', inputBg: '#ffffff', altRow: 'rgba(0,0,0,0.02)', starEmpty: '#d1d5db' },
  dark: { bg: '#0f0f0f', text: '#f9fafb', bodyText: '#d1d5db', muted: '#9ca3af', accent: '#a78bdf', border: '#374151', inputBg: '#1f2937', altRow: 'rgba(255,255,255,0.02)', starEmpty: '#4b5563' },
};

const styles = StyleSheet.create({
  hero: { flexDirection: 'row', gap: 16 },
  cover: { width: 140, height: 140, borderRadius: 10 },
  title: { fontSize: 24, fontWeight: '700', fontFamily: 'serif' },
  likeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  sectionTitle: { fontSize: 22, fontWeight: '700', fontFamily: 'serif', marginBottom: 12 },
  platformRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  platformBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  platformText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  trackList: { borderWidth: 1, borderRadius: 10, overflow: 'hidden' },
  trackRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12, gap: 10, borderBottomWidth: 1 },
  trackNum: { width: 24, textAlign: 'center', fontSize: 14 },
  trackTitle: { flex: 1, fontSize: 14, fontWeight: '600' },
  trackDuration: { fontSize: 13 },
  reviewList: { borderWidth: 1, borderRadius: 10, overflow: 'hidden', marginTop: 12 },
  reviewCard: { padding: 14, borderBottomWidth: 1 },
  reviewHeader: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  reviewAvatar: { width: 40, height: 40, borderRadius: 20 },
  reviewMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  reviewUser: { fontWeight: '600', fontSize: 14 },
  reviewDate: { fontSize: 12 },
  reviewText: { fontSize: 14, lineHeight: 20, marginTop: 6 },
  likeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10 },
  likeCount: { fontSize: 13, fontWeight: '500' },
  reviewForm: { borderWidth: 2, borderStyle: 'dashed', borderRadius: 10, padding: 14, gap: 12, marginBottom: 12 },
  formTitle: { fontSize: 18, fontWeight: '700', fontFamily: 'serif' },
  textarea: { borderWidth: 1, borderRadius: 8, padding: 10, fontSize: 14, minHeight: 90, textAlignVertical: 'top' },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  btnDisabled: { opacity: 0.5 },
  submitBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  emptyBox: { borderWidth: 2, borderStyle: 'dashed', borderRadius: 10, padding: 32, alignItems: 'center', marginTop: 8 },
  center: { textAlign: 'center', marginTop: 40 },
});

export default AlbumPage;