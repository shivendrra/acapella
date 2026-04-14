import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  StyleSheet, ActivityIndicator, Modal, Pressable,
  TextInput, Alert,
} from 'react-native';
import {
  collectionGroup, query, where, getDocs, limit, doc, getDoc,
  updateDoc, serverTimestamp, increment,
  arrayUnion, arrayRemove, collection, documentId,
  writeBatch, DocumentReference,
} from '@firebase/firestore';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { db } from '../../../../../services/firebase';
import { useAuth } from '../../../../../hooks/useAuth';
import { useTheme } from '../../../../../hooks/useTheme';
import { Review, Song, Album, Artist, UserProfile, Like } from '../../../../../types';
import { formatDate } from '../../../../../utils/formatters';

type Entity = (Song | Album) & { artists: Artist[] };

const StarRow: React.FC<{ rating: number; size?: number; c: any }> = ({ rating, size = 20, c }) => (
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

const EditModal: React.FC<{
  review: Review; onClose: () => void;
  onSave: (r: number, t: string) => Promise<void>; c: any;
}> = ({ review, onClose, onSave, c }) => {
  const [rating, setRating] = useState(review.rating);
  const [text, setText] = useState(review.reviewText);
  const [saving, setSaving] = useState(false);

  const handle = async () => {
    setSaving(true);
    await onSave(rating, text);
    setSaving(false);
    onClose();
  };

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} />
      <View style={[styles.modalBox, { backgroundColor: c.bg }]}>
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: c.text }]}>Edit Review</Text>
          <TouchableOpacity onPress={onClose}><MaterialIcons name="close" size={22} color={c.icon} /></TouchableOpacity>
        </View>
        <Text style={[styles.label, { color: c.label }]}>Rating</Text>
        <StarPicker rating={rating} onChange={setRating} c={c} />
        <Text style={[styles.label, { color: c.label, marginTop: 16 }]}>Review</Text>
        <TextInput
          style={[styles.textarea, { borderColor: c.border, backgroundColor: c.inputBg, color: c.text }]}
          value={text} onChangeText={setText}
          multiline numberOfLines={5}
          placeholder="Update your thoughts..."
          placeholderTextColor={c.muted}
        />
        <View style={styles.modalBtns}>
          <TouchableOpacity style={[styles.modalBtn, { borderColor: c.border, borderWidth: 1 }]} onPress={onClose}>
            <Text style={{ color: c.text, fontWeight: '600' }}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.modalBtn, { backgroundColor: c.accent }, saving && { opacity: 0.6 }]} onPress={handle} disabled={saving}>
            {saving
              ? <ActivityIndicator size="small" color="#fff" />
              : <><MaterialIcons name="save" size={14} color="#fff" style={{ marginRight: 4 }} /><Text style={{ color: '#fff', fontWeight: '600' }}>Save Changes</Text></>
            }
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const ReviewPage: React.FC = () => {
  const { id: reviewId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { currentUser, userProfile } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const c = isDark ? colors.dark : colors.light;

  const [review, setReview] = useState<Review | null>(null);
  const [reviewRef, setReviewRef] = useState<DocumentReference | null>(null);
  const [reviewer, setReviewer] = useState<UserProfile | null>(null);
  const [entity, setEntity] = useState<Entity | null>(null);
  const [likers, setLikers] = useState<UserProfile[]>([]);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!reviewId) { setError('Review not found.'); return; }
    setLoading(true); setError(null);
    try {
      const rSnap = await getDocs(query(collectionGroup(db, 'reviews'), where('id', '==', reviewId), limit(1)));
      if (rSnap.empty) { setError('Review not found.'); setLoading(false); return; }
      const rDoc = rSnap.docs[0];
      const rData = rDoc.data() as Review;
      setReview(rData); setReviewRef(rDoc.ref);
      setLikesCount(rData.likesCount ?? rData.likes.length);
      if (currentUser) setLiked(rData.likes.includes(currentUser.uid));

      const [revSnap, entitySnap] = await Promise.all([
        getDoc(doc(db, 'users', rData.userId)),
        getDoc(doc(db, rData.entityType === 'song' ? 'songs' : 'albums', rData.entityId)),
      ]);
      if (revSnap.exists()) setReviewer(revSnap.data() as UserProfile);
      if (!entitySnap.exists()) { setError('Associated music not found.'); setLoading(false); return; }
      const eData = entitySnap.data() as Song | Album;

      let artists: Artist[] = [];
      if (eData.artistIds?.length) {
        const aSnap = await getDocs(query(collection(db, 'artists'), where(documentId(), 'in', eData.artistIds)));
        artists = aSnap.docs.map(d => ({ id: d.id, ...d.data() } as Artist));
      }
      setEntity({ ...eData, id: entitySnap.id, artists });

      if (rData.likes?.length) {
        const lSnap = await getDocs(query(collection(db, 'users'), where(documentId(), 'in', rData.likes.slice(0, 5))));
        setLikers(lSnap.docs.map(d => d.data() as UserProfile));
      }
    } catch { setError('Failed to load review.'); }
    finally { setLoading(false); }
  }, [reviewId, currentUser]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleLike = async () => {
    if (!currentUser || !reviewRef || !review || !entity) return;
    const next = !liked;
    setLiked(next); setLikesCount(p => next ? p + 1 : p - 1);
    if (next && userProfile) setLikers(p => [userProfile, ...p.filter(l => l.uid !== userProfile.uid)].slice(0, 5));
    else setLikers(p => p.filter(l => l.uid !== currentUser.uid));
    try {
      const batch = writeBatch(db);
      const likeRef = doc(db, 'likes', `${currentUser.uid}_${review.id}`);
      batch.update(reviewRef, {
        likes: next ? arrayUnion(currentUser.uid) : arrayRemove(currentUser.uid),
        likesCount: increment(next ? 1 : -1),
      });
      if (next) {
        const likeDoc: Like = { id: likeRef.id, userId: currentUser.uid, entityId: review.id, entityType: 'review', createdAt: serverTimestamp(), entityTitle: `Review for "${entity.title}"`, entityCoverArtUrl: entity.coverArtUrl, reviewOnEntityType: review.entityType as 'song' | 'album', reviewOnEntityId: review.entityId, reviewOnEntityTitle: entity.title };
        batch.set(likeRef, likeDoc);
      } else { batch.delete(likeRef); }
      await batch.commit();
    } catch { fetchData(); }
  };

  const handleUpdate = async (newRating: number, newText: string) => {
    if (!reviewRef) return;
    try {
      await updateDoc(reviewRef, { rating: newRating, reviewText: newText });
      setReview(p => p ? { ...p, rating: newRating, reviewText: newText } : null);
    } catch { Alert.alert('Error', 'Failed to update review.'); }
  };

  const handleDelete = () => {
    if (!review || !currentUser || currentUser.uid !== review.userId || !reviewRef || !entity) return;
    Alert.alert('Delete Review', 'Are you sure? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            const batch = writeBatch(db);
            batch.delete(reviewRef);
            batch.update(doc(db, review.entityType === 'song' ? 'songs' : 'albums', review.entityId), { reviewCount: increment(-1) });
            const likesSnap = await getDocs(query(collection(db, 'likes'), where('entityId', '==', review.id), where('entityType', '==', 'review')));
            likesSnap.forEach(d => batch.delete(d.ref));
            await batch.commit();
            router.replace(`/${review.entityType}/${review.entityId}` as any);
          } catch { setError('Failed to delete review.'); }
        },
      },
    ]);
  };

  if (loading) return <ActivityIndicator style={{ flex: 1, marginTop: 64 }} color={c.accent} />;
  if (error) return <Text style={[styles.center, { color: '#ef4444' }]}>{error}</Text>;
  if (!review || !reviewer || !entity) return null;

  const isAuthor = currentUser?.uid === review.userId;

  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 48, alignItems: 'center' }}>
      {/* Entity header */}
      <TouchableOpacity
        style={styles.coverWrapper}
        onPress={() => router.push(`/${review.entityType}/${review.entityId}` as any)}
      >
        <Image source={{ uri: entity.coverArtUrl }} style={styles.cover} resizeMode="cover" />
      </TouchableOpacity>
      <Text style={[styles.entityTitle, { color: c.text }]}>{entity.title}</Text>
      <Text style={{ color: c.muted, fontSize: 14, marginTop: 4 }}>
        {'by '}
        {entity.artists.map((a, i) => (
          <Text key={a.id}>
            <Text style={{ color: c.accent, fontWeight: '600' }} onPress={() => router.push(`/artist/${a.id}` as any)}>{a.name}</Text>
            {i < entity.artists.length - 1 ? ', ' : ''}
          </Text>
        ))}
      </Text>
      <Text style={[styles.entityDate, { color: c.muted }]}>{formatDate((entity as any).releaseDate)}</Text>

      {/* Review card */}
      <View style={[styles.card, { backgroundColor: c.cardBg, borderColor: c.border }]}>
        {/* Reviewer */}
        <View style={styles.reviewerRow}>
          <TouchableOpacity onPress={() => router.push(`/${reviewer.username}` as any)}>
            <Image source={{ uri: reviewer.photoURL || `https://ui-avatars.com/api/?name=${reviewer.displayName}` }} style={styles.reviewerAvatar} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <TouchableOpacity onPress={() => router.push(`/${reviewer.username}` as any)}>
              <Text style={[styles.reviewerName, { color: c.text }]}>{reviewer.displayName}</Text>
            </TouchableOpacity>
            <Text style={[{ fontSize: 12 }, { color: c.muted }]}>{'Reviewed on '}{formatDate(review.createdAt)}</Text>
          </View>
        </View>

        {/* Rating pill */}
        <View style={[styles.ratingPill, { backgroundColor: c.pillBg }]}>
          <StarRow rating={review.rating} size={20} c={c} />
          <Text style={[styles.ratingNum, { color: c.text }]}>{review.rating}/5</Text>
        </View>

        {/* Review text */}
        <Text style={[styles.reviewText, { color: c.bodyText }]}>
          {review.reviewText || <Text style={{ color: c.muted, fontStyle: 'italic' }}>No text review.</Text>}
        </Text>

        {/* Footer */}
        <View style={[styles.footer, { borderTopColor: c.border }]}>
          <View style={styles.likeRow}>
            <TouchableOpacity onPress={currentUser ? toggleLike : undefined} style={styles.likeBtn} disabled={!currentUser}>
              <MaterialIcons name="favorite" size={20} color={liked ? '#ef4444' : c.muted} />
              <Text style={[{ fontSize: 14, fontWeight: '600', marginLeft: 6 }, { color: liked ? '#ef4444' : c.muted }]}>{likesCount} Likes</Text>
            </TouchableOpacity>
            {likers.length > 0 && (
              <View style={styles.likerAvatars}>
                {likers.map(l => (
                  <Image key={l.uid} source={{ uri: l.photoURL || '' }} style={styles.likerAvatar} />
                ))}
              </View>
            )}
          </View>
          {isAuthor && (
            <View style={styles.authorBtns}>
              <TouchableOpacity style={styles.authorBtn} onPress={() => setEditOpen(true)}>
                <MaterialIcons name="edit" size={15} color={c.muted} />
                <Text style={[{ fontSize: 13, marginLeft: 4 }, { color: c.muted }]}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.authorBtn} onPress={handleDelete}>
                <MaterialIcons name="delete-outline" size={15} color="#ef4444" />
                <Text style={[{ fontSize: 13, marginLeft: 4 }, { color: '#ef4444' }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {editOpen && review && <EditModal review={review} onClose={() => setEditOpen(false)} onSave={handleUpdate} c={c} />}
    </ScrollView>
  );
};

const colors = {
  light: { bg: '#f9fafb', text: '#111827', bodyText: '#374151', muted: '#6b7280', label: '#374151', accent: '#63479b', border: '#e5e7eb', cardBg: '#ffffff', inputBg: '#ffffff', pillBg: '#f3f4f6', starEmpty: '#d1d5db', icon: '#374151' },
  dark: { bg: '#0f0f0f', text: '#f9fafb', bodyText: '#d1d5db', muted: '#9ca3af', label: '#d1d5db', accent: '#a78bdf', border: '#374151', cardBg: '#1f2937', inputBg: '#374151', pillBg: 'rgba(31,41,55,0.5)', starEmpty: '#4b5563', icon: '#d1d5db' },
};

const styles = StyleSheet.create({
  coverWrapper: { borderRadius: 10, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 10, marginBottom: 16 },
  cover: { width: 192, height: 192 },
  entityTitle: { fontSize: 26, fontWeight: '700', fontFamily: 'serif', textAlign: 'center' },
  entityDate: { fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', marginTop: 6, marginBottom: 24 },
  card: { width: '100%', borderRadius: 14, borderWidth: 1, padding: 20, gap: 16 },
  reviewerRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  reviewerAvatar: { width: 48, height: 48, borderRadius: 24 },
  reviewerName: { fontSize: 16, fontWeight: '700' },
  ratingPill: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, alignSelf: 'flex-start' },
  ratingNum: { fontSize: 18, fontWeight: '700' },
  reviewText: { fontSize: 17, fontFamily: 'serif', lineHeight: 26 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1 },
  likeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  likeBtn: { flexDirection: 'row', alignItems: 'center' },
  likerAvatars: { flexDirection: 'row' },
  likerAvatar: { width: 24, height: 24, borderRadius: 12, marginLeft: -6, borderWidth: 2, borderColor: '#fff' },
  authorBtns: { flexDirection: 'row', gap: 16 },
  authorBtn: { flexDirection: 'row', alignItems: 'center' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.8)' },
  modalBox: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, gap: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '700', fontFamily: 'serif' },
  label: { fontSize: 13, fontWeight: '500' },
  textarea: { borderWidth: 1, borderRadius: 8, padding: 10, fontSize: 14, minHeight: 100, textAlignVertical: 'top' },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 8 },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  center: { textAlign: 'center', marginTop: 40 },
});

export default ReviewPage;