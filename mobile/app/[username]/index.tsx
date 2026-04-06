import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  StyleSheet, ActivityIndicator, Modal, Pressable,
  FlatList, Linking,
} from 'react-native';
import {
  collection, query, where, getDocs, limit, doc, getDoc,
  serverTimestamp, orderBy, Timestamp, documentId,
  collectionGroup, deleteDoc, setDoc,
} from '@firebase/firestore';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { db } from '../../services/firebase';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { UserProfile, Review, Like, Song, Album, Follow, Playlist } from '../../types';
import { formatDate } from '../../utils/formatters';
import UserBadges from '../../components/common/UserBadges';
import EditProfileModal from '../../components/profile/EditProfileModal';
import PlaylistFormModal from '../../components/playlist/PlaylistFormModal';

const RESERVED = new Set(['login', 'logout', 'signup', 'admin', 'settings', 'search', 'discover',
  'curators', 'about', 'help', 'contact', 'terms', 'privacy', 'refunds', 'shipping',
  'songs', 'albums', 'artists', 'playlist', 'review', 'legal', 'api']);

type ActivityLog =
  | (Review & { _activityType: 'review' })
  | (Like & { _activityType: 'like' })
  | (Review & { _activityType: 'follow' });

const SocialLinks: React.FC<{ socials?: { twitter?: string; instagram?: string } }> = ({ socials }) => {
  if (!socials?.twitter && !socials?.instagram) return null;
  return (
    <View style={styles.socialRow}>
      {socials.twitter && (
        <TouchableOpacity onPress={() => Linking.openURL(socials.twitter!)}>
          <MaterialIcons name="alternate-email" size={22} color="#6b7280" />
        </TouchableOpacity>
      )}
      {socials.instagram && (
        <TouchableOpacity onPress={() => Linking.openURL(socials.instagram!)}>
          <MaterialIcons name="photo-camera" size={22} color="#6b7280" />
        </TouchableOpacity>
      )}
    </View>
  );
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
      } catch { /* ignore permission errors */ }
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
                      <TouchableOpacity style={styles.followUser} onPress={() => { router.push(`/${u.username}` as any); onClose(); }}>
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

const CoverGrid: React.FC<{ items: any[]; getUrl: (i: any) => string | null; getPath: (i: any) => string; c: any }> = ({ items, getUrl, getPath, c }) => {
  const router = useRouter();
  return (
    <View style={styles.grid}>
      {items.slice(0, 4).map((item, i) => {
        const url = getUrl(item);
        return (
          <TouchableOpacity key={i} style={styles.gridItem} onPress={() => router.push(getPath(item) as any)}>
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

const DiaryItem: React.FC<{ activity: ActivityLog; profile: UserProfile; c: any }> = ({ activity, profile, c }) => {
  const router = useRouter();
  const date = activity.createdAt instanceof Timestamp ? formatDate(activity.createdAt) : '';
  let action = '', path = '', coverUrl = '';

  if (activity._activityType === 'review') {
    const r = activity as Review;
    action = r.reviewText ? `reviewed ${r.entityTitle}` : `rated ${r.entityTitle}`;
    path = `/${r.entityType}/${r.entityId}`;
    coverUrl = r.entityCoverArtUrl || '';
  } else if (activity._activityType === 'like') {
    const l = activity as Like;
    action = `liked ${l.entityTitle}`;
    path = `/${l.entityType}/${l.entityId}`;
    coverUrl = l.entityCoverArtUrl || '';
  } else {
    const f = activity as Review;
    action = `started following ${f.entityTitle}`;
    path = `/${f.entityUsername}`;
    coverUrl = f.entityCoverArtUrl || '';
  }

  return (
    <View style={[styles.diaryRow, { borderBottomColor: c.border }]}>
      <TouchableOpacity onPress={() => router.push(`/${profile.username}` as any)}>
        <Image source={{ uri: profile.photoURL || `https://ui-avatars.com/api/?name=${profile.displayName}` }} style={styles.diaryAvatar} />
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13, color: c.text }}>
          <Text style={{ fontWeight: '700' }}>{profile.displayName}</Text>{' '}{action}
        </Text>
        <Text style={{ fontSize: 11, color: c.muted, marginTop: 2 }}>{date}</Text>
      </View>
      {coverUrl ? (
        <TouchableOpacity onPress={() => router.push(path as any)}>
          <Image source={{ uri: coverUrl }} style={[styles.diaryThumb, { borderRadius: activity._activityType === 'follow' ? 20 : 6 }]} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const ProfilePage: React.FC = () => {
  const { username } = useLocalSearchParams<{ username: string }>();
  const router = useRouter();
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
  const [activities, setActivities] = useState<ActivityLog[]>([]);
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
        } catch { /* index may not exist */ }

        try {
          const ps = await getDocs(query(collection(db, 'playlists'), where('userId', '==', p.uid)));
          let all = ps.docs.map(d => ({ id: d.id, ...d.data() } as Playlist));
          all.sort((a, b) => {
            const tA = a.updatedAt instanceof Timestamp ? a.updatedAt.toMillis() : (a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : 0);
            const tB = b.updatedAt instanceof Timestamp ? b.updatedAt.toMillis() : (b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : 0);
            return tB - tA;
          });
          setPlaylists(all.slice(0, 4));
        } catch { /* ignore */ }

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
        setActivities(all.slice(0, 10));
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

  if (loading) return <ActivityIndicator style={{ flex: 1, marginTop: 64 }} color="#63479b" />;
  if (error) return <Text style={[styles.center, { color: '#ef4444' }]}>{error}</Text>;
  if (!profile) return null;

  const isOwn = me?.uid === profile.uid;

  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
      {/* Header */}
      <View style={styles.profileHeader}>
        <Image source={{ uri: profile.photoURL || `https://ui-avatars.com/api/?name=${profile.displayName || profile.email}&background=random&size=128` }} style={styles.profileAvatar} />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
            <Text style={[styles.profileName, { color: c.text }]}>{profile.displayName || profile.username}</Text>
            <UserBadges user={profile} />
          </View>
          <Text style={{ color: c.muted, fontSize: 14, marginTop: 2 }}>@{profile.username}</Text>
          <View style={styles.statsRow}>
            <TouchableOpacity onPress={() => me && setFollowModal('followers')}>
              <Text style={{ color: c.text }}><Text style={{ fontWeight: '700' }}>{followersCount}</Text> <Text style={{ color: c.muted }}>Followers</Text></Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => me && setFollowModal('following')}>
              <Text style={{ color: c.text }}><Text style={{ fontWeight: '700' }}>{followingCount}</Text> <Text style={{ color: c.muted }}>Following</Text></Text>
            </TouchableOpacity>
          </View>
          <SocialLinks socials={profile.socials} />
        </View>
        <View>
          {isOwn
            ? <TouchableOpacity style={[styles.editBtn, { borderColor: c.border }]} onPress={() => setEditOpen(true)}>
              <Text style={[{ fontSize: 13, fontWeight: '500' }, { color: c.text }]}>Edit Profile</Text>
            </TouchableOpacity>
            : me && (
              <TouchableOpacity
                style={[styles.followBtnLarge, isFollowing ? { borderWidth: 1, borderColor: '#ef4444' } : { backgroundColor: c.accent }]}
                onPress={toggleFollow} disabled={followLoading}
              >
                {followLoading
                  ? <ActivityIndicator size="small" color={isFollowing ? '#ef4444' : '#fff'} />
                  : <>
                    <MaterialIcons name={isFollowing ? 'how-to-reg' : 'person-add'} size={14} color={isFollowing ? '#ef4444' : '#fff'} />
                    <Text style={{ color: isFollowing ? '#ef4444' : '#fff', fontSize: 13, fontWeight: '600', marginLeft: 4 }}>{isFollowing ? 'Following' : 'Follow'}</Text>
                  </>
                }
              </TouchableOpacity>
            )
          }
        </View>
      </View>

      {profile.bio ? <Text style={[styles.bio, { color: c.bodyText }]}>{profile.bio}</Text> : null}

      {/* Favorites */}
      {(favSongs.length > 0 || favAlbums.length > 0) && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>Favorites</Text>
          {favSongs.length > 0 && (
            <CoverGrid items={favSongs} getUrl={s => s.coverArtUrl} getPath={s => `/song/${s.id}`} c={c} />
          )}
          {favAlbums.length > 0 && (
            <CoverGrid items={favAlbums} getUrl={a => a.coverArtUrl} getPath={a => `/album/${a.id}`} c={c} />
          )}
        </View>
      )}

      {/* Playlists */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={[styles.sectionTitle, { color: c.text }]}>Playlists</Text>
            {isOwn && (
              <TouchableOpacity onPress={() => setCreatePlaylistOpen(true)}>
                <MaterialIcons name="add-circle-outline" size={20} color={c.accent} />
              </TouchableOpacity>
            )}
          </View>
          {playlists.length > 0 && (
            <TouchableOpacity onPress={() => router.push(`/${username}/playlists` as any)}>
              <Text style={[styles.viewAll, { color: c.accent }]}>View all</Text>
            </TouchableOpacity>
          )}
        </View>
        {playlists.length > 0
          ? <CoverGrid items={playlists} getUrl={p => p.coverArtUrl || null} getPath={p => `/playlist/${p.id}`} c={c} />
          : <View style={[styles.emptyBox, { borderColor: c.border }]}><Text style={{ color: c.muted, fontSize: 13 }}>No items yet.</Text></View>
        }
      </View>

      {/* Liked / Reviews 2-col */}
      <View style={styles.twoCol}>
        {[
          { title: 'Liked Items', items: likedItems, link: `/${username}/likes`, getUrl: (i: any) => i.entityCoverArtUrl, getPath: (i: any) => `/${i.entityType}/${i.entityId}` },
          { title: 'Reviews', items: ratedItems, link: `/${username}/ratings`, getUrl: (i: any) => i.entityCoverArtUrl, getPath: (i: any) => `/review/${i.id}` },
        ].map(sec => (
          <View key={sec.title} style={{ flex: 1 }}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: c.text, fontSize: 18 }]}>{sec.title}</Text>
              {sec.items.length > 0 && (
                <TouchableOpacity onPress={() => router.push(sec.link as any)}>
                  <Text style={[styles.viewAll, { color: c.accent }]}>View all</Text>
                </TouchableOpacity>
              )}
            </View>
            {sec.items.length > 0
              ? <CoverGrid items={sec.items} getUrl={sec.getUrl} getPath={sec.getPath} c={c} />
              : <View style={[styles.emptyBox, { borderColor: c.border }]}><Text style={{ color: c.muted, fontSize: 12 }}>No items yet.</Text></View>
            }
          </View>
        ))}
      </View>

      {/* Diary */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>Diary</Text>
          {activities.length > 0 && (
            <TouchableOpacity onPress={() => router.push(`/${username}/activity` as any)}>
              <Text style={[styles.viewAll, { color: c.accent }]}>View all</Text>
            </TouchableOpacity>
          )}
        </View>
        {activities.length > 0
          ? <View style={[styles.diaryList, { borderColor: c.border }]}>
            {activities.map(a => <DiaryItem key={`${a._activityType}-${a.id}`} activity={a} profile={profile} c={c} />)}
          </View>
          : <View style={[styles.emptyBox, { borderColor: c.border }]}>
            <MaterialIcons name="history" size={24} color={c.muted} />
            <Text style={{ color: c.muted, marginTop: 6, fontSize: 13 }}>{"This user's activity will appear here."}</Text>
          </View>
        }
      </View>

      {isOwn && editOpen && <EditProfileModal userProfile={profile} onClose={() => setEditOpen(false)} onSave={handleProfileUpdate} />}
      {isOwn && createPlaylistOpen && <PlaylistFormModal onClose={() => setCreatePlaylistOpen(false)} onSuccess={() => setCreatePlaylistOpen(false)} />}
      {followModal && <FollowListModal title={followModal.charAt(0).toUpperCase() + followModal.slice(1)} onClose={() => setFollowModal(null)} targetUserId={profile.uid} fetchType={followModal} />}
    </ScrollView>
  );
};

const colors = {
  light: { bg: '#f9fafb', text: '#111827', bodyText: '#374151', muted: '#6b7280', accent: '#63479b', border: '#e5e7eb', pill: '#f3f4f6', icon: '#374151' },
  dark: { bg: '#0f0f0f', text: '#f9fafb', bodyText: '#d1d5db', muted: '#9ca3af', accent: '#a78bdf', border: '#374151', pill: '#1f2937', icon: '#d1d5db' },
};

const styles = StyleSheet.create({
  profileHeader: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginBottom: 16 },
  profileAvatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: '#a78bdf' },
  profileName: { fontSize: 22, fontWeight: '700', fontFamily: 'serif' },
  statsRow: { flexDirection: 'row', gap: 16, marginTop: 6 },
  socialRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  bio: { fontSize: 14, lineHeight: 20, marginBottom: 16 },
  editBtn: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  followBtnLarge: { flexDirection: 'row', alignItems: 'center', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  section: { marginTop: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 20, fontWeight: '700', fontFamily: 'serif' },
  viewAll: { fontSize: 13, fontWeight: '600' },
  twoCol: { flexDirection: 'row', gap: 16, marginTop: 24 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  gridItem: { width: '22%' },
  gridImg: { width: '100%', aspectRatio: 1, borderRadius: 8 },
  emptyBox: { borderWidth: 2, borderStyle: 'dashed', borderRadius: 8, padding: 20, alignItems: 'center' },
  diaryList: { borderWidth: 1, borderRadius: 10, overflow: 'hidden' },
  diaryRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderBottomWidth: 1 },
  diaryAvatar: { width: 40, height: 40, borderRadius: 20 },
  diaryThumb: { width: 40, height: 40 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.75)' },
  followSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, top: '20%', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  modalTitle: { fontSize: 18, fontWeight: '700', fontFamily: 'serif' },
  followRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderBottomWidth: 1 },
  followUser: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  followAvatar: { width: 44, height: 44, borderRadius: 22 },
  followBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  followBtnText: { fontSize: 12, fontWeight: '600' },
  emptyText: { textAlign: 'center', padding: 32 },
  center: { textAlign: 'center', marginTop: 40 },
});

export default ProfilePage;