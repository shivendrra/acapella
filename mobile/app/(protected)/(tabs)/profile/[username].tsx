import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  StyleSheet, ActivityIndicator, Modal, Pressable,
  FlatList, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  collection, query, where, getDocs, limit, doc, getDoc,
  serverTimestamp, orderBy, Timestamp, documentId,
  collectionGroup, deleteDoc, setDoc,
} from '@firebase/firestore';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { instagram, twitter } from '../../../../constants/icons';
import { SvgXml } from 'react-native-svg'
import { MaterialIcons } from '@expo/vector-icons';
import { db } from '../../../../services/firebase';
import { useAuth } from '../../../../hooks/useAuth';
import { useTheme } from '../../../../hooks/useTheme';
import { UserProfile, Review, Like, Song, Album, Playlist, Follow } from '../../../../types'
import UserBadges from '../../../../components/common/UserBadges';
import EditProfileModal from '../../../../components/profile/EditProfileModal';
import PlaylistFormModal from '../../../../components/playlist/PlaylistFormModal';

const RESERVED = new Set(['login', 'logout', 'signup', 'admin', 'settings', 'search', 'discover',
  'curators', 'about', 'help', 'contact', 'terms', 'privacy', 'refunds', 'shipping',
  'songs', 'albums', 'artists', 'playlist', 'review', 'legal', 'api']);

type ActivityLog =
  | (Review & { _activityType: 'review' })
  | (Like & { _activityType: 'like' })
  | (Review & { _activityType: 'follow' });

const routes = {
  album: (id: string) => ({
    pathname: '/(protected)/(stacks)/home/album/[id]' as const,
    params: { id },
  }),
  song: (id: string) => ({
    pathname: '/(protected)/(stacks)/home/song/[id]' as const,
    params: { id },
  }),
  playlist: (id: string) => ({
    pathname: '/(protected)/(stacks)/home/playlist/[id]' as const,
    params: { id },
  }),
  review: (id: string) => ({
    pathname: '/(protected)/(stacks)/home/review/[id]' as const,
    params: { id },
  }),
  user: (username: string) => ({
    pathname: '/(protected)/(stacks)/home/[username]' as const,
    params: { username },
  }),
};

const FollowListModal: React.FC<{ title: string; onClose: () => void; targetUserId: string; fetchType: 'followers' | 'following' }> = ({ title, onClose, targetUserId, fetchType }) => {
  const { userProfile: me } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const c = theme === 'dark' ? colors.dark : colors.light;
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const run = async () => {
      try {
        const field = fetchType === 'followers' ? 'followingId' : 'followerId';
        const extract = fetchType === 'followers' ? 'followerId' : 'followingId';
        const snap = await getDocs(query(collection(db, 'follows'), where(field, '==', targetUserId)));
        const ids = snap.docs.map(d => d.data()[extract]);
        if (ids.length > 0) {
          const chunks: string[][] = [];
          for (let i = 0; i < ids.length; i += 30) chunks.push(ids.slice(i, i + 30));
          const fetched: UserProfile[] = [];
          for (const chunk of chunks) {
            const s = await getDocs(query(collection(db, 'users'), where(documentId(), 'in', chunk)));
            fetched.push(...s.docs.map(d => d.data() as UserProfile));
          }
          setUsers(fetched);
        }
        if (me) {
          const fs = await getDocs(query(collection(db, 'follows'), where('followerId', '==', me.uid)));
          setFollowingIds(new Set(fs.docs.map(d => d.data().followingId)));
        }
      } catch { }
      finally { setLoading(false); }
    };
    run();
  }, [targetUserId, fetchType, me]);

  const toggleFollow = async (uid: string, isFollowing: boolean) => {
    if (!me) return;
    const ref = doc(db, 'follows', `${me.uid}_${uid}`);
    const next = new Set(followingIds);
    if (isFollowing) { next.delete(uid); } else { next.add(uid); }
    setFollowingIds(next);
    try {
      if (isFollowing) { await deleteDoc(ref); } else { await setDoc(ref, { followerId: me.uid, followingId: uid, createdAt: serverTimestamp() }); }
    } catch { setFollowingIds(followingIds); }
  };

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} />
      <View style={[styles.followSheet, { backgroundColor: c.bg }]}>
        <View style={[styles.modalHeader, { borderBottomColor: c.border }]}>
          <Text style={[styles.modalTitle, { color: c.text }]}>{title}</Text>
          <TouchableOpacity onPress={onClose}><MaterialIcons name="close" size={24} color={c.icon} /></TouchableOpacity>
        </View>
        {loading
          ? <ActivityIndicator style={{ marginTop: 32 }} color={c.accent} />
          : users.length === 0
            ? <Text style={[styles.emptyText, { color: c.muted }]}>No users to display.</Text>
            : (
              <FlatList
                data={users}
                keyExtractor={u => u.uid}
                renderItem={({ item: u }) => {
                  const following = followingIds.has(u.uid);
                  return (
                    <View style={[styles.followRow, { borderBottomColor: c.border }]}>
                      <TouchableOpacity style={styles.followUser} onPress={() => {
                        router.push(routes.user(u.username)); onClose();
                      }}>
                        <Image source={{ uri: u.photoURL || `https://ui-avatars.com/api/?name=${u.displayName}` }} style={styles.followAvatar} />
                        <View>
                          <Text style={[{ fontWeight: '600' }, { color: c.text }]}>{u.displayName}</Text>
                          <Text style={{ fontSize: 12, color: c.muted }}>@{u.username}</Text>
                        </View>
                      </TouchableOpacity>
                      {me && me.uid !== u.uid && (
                        <TouchableOpacity
                          style={[styles.followBtn, following ? { borderWidth: 1, borderColor: '#ef4444' } : { backgroundColor: c.accent }]}
                          onPress={() => toggleFollow(u.uid, following)}
                        >
                          <Text style={[styles.followBtnText, { color: following ? '#ef4444' : '#fff' }]}>{following ? 'Unfollow' : 'Follow'}</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                }}
              />
            )
        }
      </View>
    </Modal>
  );
};

const CoverGrid: React.FC<{ items: any[]; getUrl: (i: any) => string | null; getPath: (i: any) => any; c: any }> = ({ items, getUrl, getPath, c }) => {
  const router = useRouter();
  return (
    <View style={styles.grid}>
      {items.slice(0, 4).map((item, i) => {
        const url = getUrl(item);
        return (
          <TouchableOpacity key={i} style={styles.gridItem} onPress={() => router.push(getPath(item))}>
            {url
              ? <Image source={{ uri: url }} style={styles.gridImg} />
              : <View style={[styles.gridImg, { backgroundColor: c.pill, alignItems: 'center', justifyContent: 'center' }]}>
                <MaterialIcons name="music-note" size={24} color={c.muted} />
              </View>
            }
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const ProfilePage: React.FC = () => {
  const { username } = useLocalSearchParams<{ username: string }>();
  const { userProfile: me } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const c = isDark ? colors.dark : colors.light;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(true);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [likedItems, setLikedItems] = useState<Like[]>([]);
  const [ratedItems, setRatedItems] = useState<Review[]>([]);
  const [favSongs, setFavSongs] = useState<Song[]>([]);
  const [favAlbums, setFavAlbums] = useState<Album[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [createPlaylistOpen, setCreatePlaylistOpen] = useState(false);
  const [followModal, setFollowModal] = useState<'followers' | 'following' | null>(null);

  useEffect(() => {
    if (!username || RESERVED.has(username.toLowerCase())) { setError('User not found.'); setLoading(false); return; }
    const run = async () => {
      setLoading(true); setError(null); setProfile(null);
      try {
        const snap = await getDocs(query(collection(db, 'users'), where('username', '==', username.toLowerCase()), limit(1)));
        if (snap.empty) { setError('User not found.'); setLoading(false); return; }
        const p = snap.docs[0].data() as UserProfile;
        setProfile(p);

        if (p.favoriteSongIds?.length) {
          const s = await getDocs(query(collection(db, 'songs'), where(documentId(), 'in', p.favoriteSongIds)));
          const d = s.docs.map(d => ({ id: d.id, ...d.data() } as Song));
          setFavSongs(p.favoriteSongIds.map(id => d.find(x => x.id === id)).filter(Boolean) as Song[]);
        }
        if (p.favoriteAlbumIds?.length) {
          const s = await getDocs(query(collection(db, 'albums'), where(documentId(), 'in', p.favoriteAlbumIds)));
          const d = s.docs.map(d => ({ id: d.id, ...d.data() } as Album));
          setFavAlbums(p.favoriteAlbumIds.map(id => d.find(x => x.id === id)).filter(Boolean) as Album[]);
        }

        let reviewsData: Review[] = [];
        try {
          const rs = await getDocs(query(collectionGroup(db, 'reviews'), where('userId', '==', p.uid), orderBy('createdAt', 'desc'), limit(5)));
          reviewsData = rs.docs.map(d => ({ id: d.id, ...d.data() } as Review));
          setRatedItems(reviewsData.filter(r => r.rating > 0));
        } catch { }

        try {
          const ps = await getDocs(query(collection(db, 'playlists'), where('userId', '==', p.uid)));
          let all = ps.docs.map(d => ({ id: d.id, ...d.data() } as Playlist));
          all.sort((a, b) => {
            const tA = a.updatedAt instanceof Timestamp ? a.updatedAt.toMillis() : (a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : 0);
            const tB = b.updatedAt instanceof Timestamp ? b.updatedAt.toMillis() : (b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : 0);
            return tB - tA;
          });
          setPlaylists(all.slice(0, 4));
        } catch { }

        let all: ActivityLog[] = reviewsData.map(r => ({ ...r, _activityType: 'review' as const }));

        if (me) {
          const [followersSnap, followingSnap, likesSnap, followsByUserSnap] = await Promise.all([
            getDocs(query(collection(db, 'follows'), where('followingId', '==', p.uid))),
            getDocs(query(collection(db, 'follows'), where('followerId', '==', p.uid))),
            getDocs(query(collection(db, 'likes'), where('userId', '==', p.uid), where('entityType', 'in', ['song', 'album']), orderBy('createdAt', 'desc'), limit(5))),
            getDocs(query(collection(db, 'follows'), where('followerId', '==', p.uid), orderBy('createdAt', 'desc'), limit(5))),
          ]);
          setFollowersCount(followersSnap.size);
          setFollowingCount(followingSnap.size);
          const likes = likesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Like));
          setLikedItems(likes.slice(0, 4));
          all.push(...likes.map(l => ({ ...l, _activityType: 'like' as const })));

          const fIds = followsByUserSnap.docs.map(d => d.data().followingId);
          if (fIds.length > 0) {
            const us = await getDocs(query(collection(db, 'users'), where(documentId(), 'in', fIds)));
            const uMap: Record<string, UserProfile> = {};
            us.docs.forEach(d => { uMap[d.id] = d.data() as UserProfile; });
            followsByUserSnap.docs.forEach(d => {
              const f = d.data() as Follow;
              const u = uMap[f.followingId];
              if (!u) return;
              all.push({ id: d.id, userId: p.uid, userDisplayName: p.displayName || p.username, userPhotoURL: p.photoURL, createdAt: f.createdAt, entityId: u.uid, entityType: 'user', entityTitle: u.displayName || u.username, entityUsername: u.username, entityCoverArtUrl: u.photoURL, rating: 0, reviewText: '', likes: [], _activityType: 'follow' } as ActivityLog);
            });
          }
        } else {
          setFollowersCount(p.followersCount || 0);
          setFollowingCount(p.followingCount || 0);
        }

        all.sort((a, b) => ((b.createdAt as Timestamp)?.toMillis() || 0) - ((a.createdAt as Timestamp)?.toMillis() || 0));
      } catch { setError('An error occurred while fetching the profile.'); }
      finally { setLoading(false); }
    };
    run();
  }, [username, me]);

  useEffect(() => {
    if (!me || !profile || me.uid === profile.uid) { setFollowLoading(false); return; }
    getDoc(doc(db, 'follows', `${me.uid}_${profile.uid}`)).then(s => { setIsFollowing(s.exists()); setFollowLoading(false); });
  }, [me, profile]);

  const toggleFollow = async () => {
    if (!me || !profile || followLoading) return;
    setFollowLoading(true);
    const ref = doc(db, 'follows', `${me.uid}_${profile.uid}`);
    const wasFollowing = isFollowing;
    setIsFollowing(!wasFollowing);
    setFollowersCount(p => wasFollowing ? p - 1 : p + 1);
    try {
      if (wasFollowing) { await deleteDoc(ref); } else { await setDoc(ref, { followerId: me.uid, followingId: profile.uid, createdAt: serverTimestamp() }); }
    } catch { setIsFollowing(wasFollowing); setFollowersCount(p => wasFollowing ? p + 1 : p - 1); }
    finally { setFollowLoading(false); }
  };

  const handleProfileUpdate = async (updated: Partial<UserProfile>) => {
    if (!profile) return;
    const next = { ...profile, ...updated };
    setProfile(next);
    if (next.favoriteSongIds?.length) {
      const s = await getDocs(query(collection(db, 'songs'), where(documentId(), 'in', next.favoriteSongIds)));
      const d = s.docs.map(d => ({ id: d.id, ...d.data() } as Song));
      setFavSongs(next.favoriteSongIds.map(id => d.find(x => x.id === id)).filter(Boolean) as Song[]);
    } else setFavSongs([]);
    if (next.favoriteAlbumIds?.length) {
      const s = await getDocs(query(collection(db, 'albums'), where(documentId(), 'in', next.favoriteAlbumIds)));
      const d = s.docs.map(d => ({ id: d.id, ...d.data() } as Album));
      setFavAlbums(next.favoriteAlbumIds.map(id => d.find(x => x.id === id)).filter(Boolean) as Album[]);
    } else setFavAlbums([]);
  };

  const SectionWrapper: React.FC<{ children: React.ReactNode; showTop?: boolean; showBottom?: boolean; c: any }> = ({ children, showTop, showBottom, c }) => (
    <View style={{ borderTopWidth: showTop ? 1 : 0, borderBottomWidth: showBottom ? 1 : 0, borderColor: c.border, paddingVertical: 20 }}>
      {children}
    </View>
  );

  if (loading) return <ActivityIndicator style={{ flex: 1, marginTop: 64 }} color="#6A9C89" />;
  if (error) return <Text style={[styles.center, { color: '#ef4444' }]}>{error}</Text>;
  if (!profile) return null;

  const isOwn = me?.uid === profile.uid;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>

        <View style={styles.headerCenter}>
          <Image
            source={{ uri: profile.photoURL || `https://ui-avatars.com/api/?name=${profile.displayName}` }}
            style={styles.avatarLarge}
          />
          <Text style={[styles.nameSerif, { color: c.text }]}>{profile.displayName || profile.username}</Text>
          <View style={styles.usernameRow}>
            <Text style={[styles.username, { color: c.muted }]}>@{profile.username}</Text>
            <UserBadges user={profile} />
          </View>
          <View style={styles.statsRowCenter}>
            <TouchableOpacity onPress={() => me && setFollowModal('followers')}>
              <Text style={{ color: c.text }}><Text style={styles.statNumber}>{followersCount}</Text> Followers</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => me && setFollowModal('following')}>
              <Text style={{ color: c.text }}><Text style={styles.statNumber}>{followingCount}</Text> Following</Text>
            </TouchableOpacity>
          </View>
          {profile.bio && <Text style={[styles.bioCenter, { color: c.bodyText }]}>{profile.bio}</Text>}
          <View style={styles.socialRowModern}>
            {profile.socials?.instagram && (
              <TouchableOpacity onPress={() => Linking.openURL(profile.socials?.instagram || '')}>
                <SvgXml xml={instagram} width={24} height={24} />
              </TouchableOpacity>
            )}
            {profile.socials?.twitter && (
              <TouchableOpacity onPress={() => Linking.openURL(profile.socials?.twitter || '')}>
                <SvgXml xml={twitter} width={24} height={24} />
              </TouchableOpacity>
            )}
          </View>
          {isOwn ? (
            <TouchableOpacity style={[styles.editBtnModern, { borderColor: c.border }]} onPress={() => setEditOpen(true)}>
              <Text style={[styles.buttonText, { color: c.text }]}>Edit Profile</Text>
            </TouchableOpacity>
          ) : me && (
            <TouchableOpacity
              style={[styles.followBtnModern, isFollowing ? { borderWidth: 1, borderColor: '#ef4444' } : { backgroundColor: c.accent }]}
              onPress={toggleFollow}
            >
              <Text style={styles.buttonText}>{isFollowing ? 'Following' : 'Follow'}</Text>
            </TouchableOpacity>
          )}
        </View>

        <SectionWrapper showBottom c={c}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>Favorites</Text>
          <CoverGrid items={favSongs} getUrl={s => s.coverArtUrl} getPath={s => routes.song(s.id)} c={c} />
          <CoverGrid items={favAlbums} getUrl={a => a.coverArtUrl} getPath={a => routes.album(a.id)} c={c} />
        </SectionWrapper>

        <SectionWrapper showTop showBottom c={c}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>Playlists</Text>
          {playlists.length > 0
            ? <CoverGrid items={playlists} getUrl={p => p.coverArtUrl} getPath={p => routes.playlist(p.id)} c={c} />
            : <Text style={{ color: c.muted }}>No items yet.</Text>}
        </SectionWrapper>

        <SectionWrapper showTop showBottom c={c}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>Liked Items</Text>
          {likedItems.length > 0
            ? <CoverGrid
                items={likedItems}
                getUrl={i => i.entityCoverArtUrl}
                getPath={i => i.entityType === 'song' ? routes.song(i.entityId) : routes.album(i.entityId)}
                c={c}
              />
            : <Text style={{ color: c.muted }}>No items yet.</Text>}
        </SectionWrapper>

        <SectionWrapper showTop c={c}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>Reviews</Text>
          {ratedItems.length > 0
            ? <CoverGrid items={ratedItems} getUrl={i => i.entityCoverArtUrl} getPath={i => routes.review(i.id)} c={c} />
            : <Text style={{ color: c.muted }}>No items yet.</Text>}
        </SectionWrapper>

        {isOwn && editOpen && <EditProfileModal userProfile={profile} onClose={() => setEditOpen(false)} onSave={handleProfileUpdate} />}
        {isOwn && createPlaylistOpen && <PlaylistFormModal onClose={() => setCreatePlaylistOpen(false)} onSuccess={() => setCreatePlaylistOpen(false)} />}
        {followModal && <FollowListModal title={followModal} onClose={() => setFollowModal(null)} targetUserId={profile.uid} fetchType={followModal} />}

      </ScrollView>
    </SafeAreaView>
  );
};

const colors = {
  light: { bg: '#f9fafb', text: '#111827', bodyText: '#374151', muted: '#6b7280', accent: '#6A9C89', border: '#e5e7eb', pill: '#f3f4f6', icon: '#374151' },
  dark: { bg: '#0f0f0f', text: '#f9fafb', bodyText: '#d1d5db', muted: '#9ca3af', accent: '#6A9C89', border: '#374151', pill: '#1f2937', icon: '#d1d5db' },
};

const styles = StyleSheet.create({
  headerCenter: { alignItems: 'center', marginBottom: 28 },
  avatarLarge: { width: 120, height: 120, borderRadius: 100, marginBottom: 14 },
  nameSerif: { fontSize: 26, fontFamily: 'InstrumentSerif_400Regular' },
  usernameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  username: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  statsRowCenter: { flexDirection: 'row', gap: 24, marginTop: 12 },
  statNumber: { fontWeight: '700', fontFamily: 'Inter_700Bold' },
  bioCenter: { textAlign: 'center', marginTop: 12, paddingHorizontal: 24, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  socialRowModern: { flexDirection: 'row', gap: 18, marginTop: 14 },
  iconWrap: { padding: 8, borderRadius: 20, backgroundColor: '#f3f4f6' },
  iconBox: { width: 18, height: 18, borderWidth: 2, borderRadius: 5, justifyContent: 'center', alignItems: 'center' },
  iconInner: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#000' },
  editBtnModern: { marginTop: 16, borderWidth: 1, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 },
  followBtnModern: { marginTop: 16, borderRadius: 10, paddingHorizontal: 18, paddingVertical: 10 },
  buttonText: { fontFamily: 'Inter_500Medium', fontSize: 14, color: '#fff' },
  section: { marginTop: 28 },
  sectionTitle: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridItem: { width: '23%', marginBottom: 12 },
  gridImg: { width: '100%', aspectRatio: 1, borderRadius: 12 },
  socialRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.75)' },
  followSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, top: '20%', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  emptyText: { textAlign: 'center', padding: 32 },
  followRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderBottomWidth: 1 },
  followUser: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  followAvatar: { width: 44, height: 44, borderRadius: 22 },
  followBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  followBtnText: { fontSize: 12, fontWeight: '600' },
  center: { textAlign: 'center', marginTop: 40 },
  editBtn: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginTop: 12 },
  followBtnLarge: { borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10, marginTop: 12 },
});

export default ProfilePage;