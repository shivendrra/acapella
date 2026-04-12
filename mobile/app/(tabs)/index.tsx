import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, FlatList, TouchableOpacity,
  Image, StyleSheet, ActivityIndicator,
} from 'react-native';
import {
  collection, query, where, getDocs, orderBy, limit,
  Timestamp, collectionGroup, documentId,
} from '@firebase/firestore';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { db } from '../../services/firebase';
import { Review, Album, Song, Artist } from '../../types';

type ActivityItem = Review & { _type: 'review' };
type ArtistsMap = Record<string, Artist>;

const Carousel: React.FC<{ items: any[]; renderItem: (item: any) => React.ReactNode }> = ({ items, renderItem }) => {
  if (!items?.length) return null;
  return (
    <FlatList
      data={items}
      horizontal
      showsHorizontalScrollIndicator={false}
      keyExtractor={item => item.id}
      contentContainerStyle={{ gap: 16, paddingBottom: 8 }}
      renderItem={({ item }) => <View style={{ width: 160 }}>{renderItem(item)}</View>}
    />
  );
};

const AlbumCard: React.FC<{ album: Album; artist?: Artist; c: any }> = ({ album, artist, c }) => {
  const router = useRouter();
  return (
    <TouchableOpacity onPress={() => router.push(`/album/${album.id}` as any)}>
      <View style={styles.cardImg}>
        <Image source={{ uri: album.coverArtUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      </View>
      <Text style={[styles.cardTitle, { color: c.text }]} numberOfLines={1}>{album.title}</Text>
      {artist && <Text style={[styles.cardSub, { color: c.muted }]} numberOfLines={1}>{artist.name}</Text>}
    </TouchableOpacity>
  );
};

const SongCard: React.FC<{ song: Song; artist?: Artist; c: any }> = ({ song, artist, c }) => {
  const router = useRouter();
  const uri = song.coverArtUrl || `https://placehold.co/100x100/131010/FAF8F1?text=${encodeURIComponent(song.title.charAt(0))}`;
  return (
    <TouchableOpacity onPress={() => router.push(`/song/${song.id}` as any)}>
      <View style={styles.cardImg}>
        <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      </View>
      <Text style={[styles.cardTitle, { color: c.text }]} numberOfLines={1}>{song.title}</Text>
      {artist && <Text style={[styles.cardSub, { color: c.muted }]} numberOfLines={1}>{artist.name}</Text>}
    </TouchableOpacity>
  );
};

const ArtistCard: React.FC<{ artist: Artist; c: any }> = ({ artist, c }) => {
  const router = useRouter();
  return (
    <TouchableOpacity style={{ alignItems: 'center' }} onPress={() => router.push(`/artist/${artist.id}` as any)}>
      <Image source={{ uri: artist.imageUrl }} style={styles.artistImg} />
      <Text style={[styles.cardTitle, { color: c.text, textAlign: 'center' }]} numberOfLines={1}>{artist.name}</Text>
    </TouchableOpacity>
  );
};

const ActivityFeedItem: React.FC<{ activity: ActivityItem; c: any }> = ({ activity, c }) => {
  const router = useRouter();
  return (
    <View style={[styles.feedCard, { backgroundColor: c.cardBg, borderColor: c.border }]}>
      <View style={styles.feedHeader}>
        <TouchableOpacity onPress={() => router.push(`/${activity.entityUsername}` as any)}>
          <Image
            source={{ uri: activity.userPhotoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(activity.userDisplayName)}&background=random` }}
            style={styles.feedAvatar}
          />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, color: c.text }}>
            <Text style={{ fontWeight: '700' }}>{activity.userDisplayName}</Text>
            {' reviewed '}
            <Text style={{ fontWeight: '700' }}>{activity.entityTitle}</Text>
          </Text>
          <View style={{ flexDirection: 'row', marginTop: 2 }}>
            {[...Array(5)].map((_, i) => (
              <MaterialIcons key={i} name="star" size={13} color={i < activity.rating ? '#facc15' : '#d1d5db'} />
            ))}
          </View>
        </View>
      </View>
      <Text style={[styles.feedQuote, { color: c.muted }]} numberOfLines={4}>{activity.reviewText}</Text>
      <TouchableOpacity onPress={() => router.push(`/review/${activity.id}` as any)}>
        <Text style={[styles.feedLink, { color: c.muted }]}>View full review</Text>
      </TouchableOpacity>
    </View>
  );
};

const GuestLandingPage: React.FC<{ c: any }> = ({ c }) => {
  const router = useRouter();
  const [featuredAlbums, setFeaturedAlbums] = useState<Album[]>([]);

  useEffect(() => {
    getDocs(query(collection(db, 'albums'), orderBy('reviewCount', 'desc'), limit(6)))
      .then(snap => setFeaturedAlbums(snap.docs.map(d => ({ id: d.id, ...d.data() } as Album))))
      .catch(console.error);
  }, []);

  const features = [
    { icon: 'headphones', title: 'Listen & Log', desc: 'Track your listening history and build a rich library.' },
    { icon: 'rate-review', title: 'Rate & Review', desc: 'Give star ratings and write detailed reviews to share your opinions.' },
    { icon: 'group', title: 'Share & Discover', desc: 'Follow friends and curators to find your next favorite artist.' },
  ];

  return (
    <ScrollView style={{ backgroundColor: c.heroBg }} showsVerticalScrollIndicator={false}>
      {/* Hero */}
      <View style={[styles.hero, { backgroundColor: c.heroBg }]}>
        <View style={styles.heroBgGrid}>
          {featuredAlbums.concat(featuredAlbums).slice(0, 12).map((album, i) => (
            <View key={i} style={styles.heroBgTile}>
              {album?.coverArtUrl && <Image source={{ uri: album.coverArtUrl }} style={[StyleSheet.absoluteFill, { opacity: 0.15 }]} resizeMode="cover" />}
            </View>
          ))}
        </View>
        <View style={{ alignItems: 'center', paddingHorizontal: 24, paddingTop: 48 }}>
          <Text style={[styles.heroTitle, { color: c.heroText }]}>Your Personal{'\n'}Music Diary.</Text>
          <Text style={[styles.heroSub, { color: c.heroMuted }]}>
            Track your listening habits. Rate and review albums. Share your taste and discover your next favorite artist.
          </Text>
          <TouchableOpacity style={[styles.heroBtn, { backgroundColor: c.accent }]} onPress={() => router.push('/login')}>
            <Text style={styles.heroBtnText}>Start Listening for Free</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Featured Albums */}
      {featuredAlbums.length > 0 && (
        <View style={[styles.section, { backgroundColor: c.sectionAlt }]}>
          <Text style={[styles.sectionTitle, { color: c.text, textAlign: 'center' }]}>What People Are Reviewing</Text>
          <Text style={[styles.sectionSub, { color: c.muted, textAlign: 'center' }]}>{"Join the conversation on today's most talked-about albums."}</Text>
          <View style={styles.albumGrid}>
            {featuredAlbums.map(album => (
              <TouchableOpacity key={album.id} style={{ width: '30%' }} onPress={() => router.push(`/album/${album.id}` as any)}>
                <View style={[styles.cardImg, { borderRadius: 8 }]}>
                  <Image source={{ uri: album.coverArtUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* How It Works */}
      <View style={[styles.section, { backgroundColor: c.bg }]}>
        <Text style={[styles.sectionTitle, { color: c.text, textAlign: 'center' }]}>A Home for Your Music Life</Text>
        <Text style={[styles.sectionSub, { color: c.muted, textAlign: 'center' }]}>Keep track of every tune and story.</Text>
        {features.map(f => (
          <View key={f.title} style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: c.accentFaint }]}>
              <MaterialIcons name={f.icon as any} size={28} color={c.accent} />
            </View>
            <Text style={[styles.featureTitle, { color: c.text }]}>{f.title}</Text>
            <Text style={[styles.featureDesc, { color: c.muted }]}>{f.desc}</Text>
          </View>
        ))}
      </View>

      {/* CTA */}
      <View style={[styles.ctaSection, { backgroundColor: c.accent }]}>
        <Text style={styles.ctaTitle}>Join a Community of Music Nerds</Text>
        <Text style={styles.ctaSub}>Sign up today to start logging, reviewing, and connecting with fellow music fans from around the world.</Text>
        <TouchableOpacity style={styles.ctaBtn} onPress={() => router.push('/login')}>
          <Text style={[styles.ctaBtnText, { color: c.accent }]}>Create Your Free Account</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const AuthenticatedHomePage: React.FC<{ c: any }> = ({ c }) => {
  const { userProfile } = useAuth();
  const router = useRouter();
  const [activityFeed, setActivityFeed] = useState<ActivityItem[]>([]);
  const [newReleases, setNewReleases] = useState<Album[]>([]);
  const [trendingSongs, setTrendingSongs] = useState<Song[]>([]);
  const [popularArtists, setPopularArtists] = useState<Artist[]>([]);
  const [artistsMap, setArtistsMap] = useState<ArtistsMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userProfile) return;
    const run = async () => {
      setLoading(true);
      try {
        const oneWeekAgo = Timestamp.fromDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
        const [followSnap, relSnap, soSnap, arSnap] = await Promise.all([
          getDocs(query(collection(db, 'follows'), where('followerId', '==', userProfile.uid))),
          getDocs(query(collection(db, 'albums'), orderBy('releaseDate', 'desc'), limit(10))),
          getDocs(query(collection(db, 'songs'), orderBy('reviewCount', 'desc'), limit(10))),
          getDocs(query(collection(db, 'artists'), orderBy('name'), limit(10))),
        ]);

        const relData = relSnap.docs.map(d => ({ id: d.id, ...d.data() } as Album));
        const soData = soSnap.docs.map(d => ({ id: d.id, ...d.data() } as Song));
        setNewReleases(relData);
        setTrendingSongs(soData);
        setPopularArtists(arSnap.docs.map(d => ({ id: d.id, ...d.data() } as Artist)));

        const followingIds = followSnap.docs.map(d => d.data().followingId);
        if (followingIds.length > 0) {
          const revSnap = await getDocs(query(
            collectionGroup(db, 'reviews'),
            where('userId', 'in', followingIds),
            where('createdAt', '>=', oneWeekAgo),
            orderBy('createdAt', 'desc'),
          ));
          setActivityFeed(revSnap.docs
            .map(d => ({ ...(d.data() as Review), id: d.id, _type: 'review' } as ActivityItem))
            .filter(i => i.reviewText?.trim()));
        }

        const artistIds = new Set<string>();
        relData.forEach(a => a.artistIds.forEach(id => artistIds.add(id)));
        soData.forEach(s => s.artistIds.forEach(id => artistIds.add(id)));
        if (artistIds.size > 0) {
          const aSnap = await getDocs(query(collection(db, 'artists'), where(documentId(), 'in', Array.from(artistIds))));
          const map: ArtistsMap = {};
          aSnap.forEach(d => { map[d.id] = { id: d.id, ...d.data() } as Artist; });
          setArtistsMap(map);
        }
                } catch {
        setError('Could not load your feed. Check your network or database indexes.');
      } finally { setLoading(false); }
    };
    run();
  }, [userProfile]);

  if (loading) return <ActivityIndicator style={{ flex: 1, marginTop: 64 }} color={c.accent} />;
  if (error) return <Text style={[{ color: '#ef4444', textAlign: 'center', margin: 32 }]}>{error}</Text>;

  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 48, gap: 40 }}>
      <View>
        <Text style={[styles.sectionTitle, { color: c.text }]}>From Your Network</Text>
        {activityFeed.length > 0 ? (
          <FlatList
            data={activityFeed}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={i => i.id}
            contentContainerStyle={{ gap: 12, paddingBottom: 8 }}
            renderItem={({ item }) => (
              <View style={{ width: 280 }}><ActivityFeedItem activity={item} c={c} /></View>
            )}
          />
        ) : (
          <View style={[styles.emptyBox, { borderColor: c.border }]}>
            <MaterialIcons name="group" size={28} color={c.muted} />
            <Text style={{ color: c.muted, marginTop: 8 }}>Follow users to see their reviews here.</Text>
            <TouchableOpacity onPress={() => router.push('/curators')}>
              <Text style={{ color: c.accent, fontWeight: '600', marginTop: 4, fontSize: 13 }}>Find Curators to follow</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View>
        <Text style={[styles.sectionTitle, { color: c.text }]}>New Releases</Text>
        <Carousel items={newReleases} renderItem={a => <AlbumCard album={a} artist={artistsMap[a.artistIds[0]]} c={c} />} />
      </View>

      <View>
        <Text style={[styles.sectionTitle, { color: c.text }]}>Trending Songs</Text>
        <Carousel items={trendingSongs} renderItem={s => <SongCard song={s} artist={artistsMap[s.artistIds[0]]} c={c} />} />
      </View>

      <View>
        <Text style={[styles.sectionTitle, { color: c.text }]}>Popular Artists</Text>
        <Carousel items={popularArtists} renderItem={a => <ArtistCard artist={a} c={c} />} />
      </View>
    </ScrollView>
  );
};

const HomePage: React.FC = () => {
  const { currentUser, loading } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const c = isDark ? colors.dark : colors.light;

  if (loading) return <ActivityIndicator style={{ flex: 1, marginTop: 64 }} color={c.accent} />;
  return currentUser ? <AuthenticatedHomePage c={c} /> : <GuestLandingPage c={c} />;
};

const colors = {
  light: {
    bg: '#f9fafb', text: '#111827', muted: '#6b7280', accent: '#63479b',
    accentFaint: 'rgba(99,71,155,0.1)', border: '#e5e7eb', cardBg: '#ffffff',
    heroBg: '#2d0b4c', heroText: '#ffffff', heroMuted: 'rgba(255,255,255,0.8)',
    sectionAlt: '#ffffff',
  },
  dark: {
    bg: '#0f0f0f', text: '#f9fafb', muted: '#9ca3af', accent: '#a78bdf',
    accentFaint: 'rgba(167,139,223,0.1)', border: '#374151', cardBg: 'rgba(31,41,55,0.5)',
    heroBg: '#1a0630', heroText: '#ffffff', heroMuted: 'rgba(255,255,255,0.7)',
    sectionAlt: 'rgba(0,0,0,0.5)',
  },
};

const styles = StyleSheet.create({
  sectionTitle: { fontSize: 26, fontWeight: '700', fontFamily: 'serif', marginBottom: 12 },
  sectionSub: { fontSize: 14, marginTop: 4, marginBottom: 16 },
  cardImg: { width: '100%', aspectRatio: 1, borderRadius: 10, overflow: 'hidden', backgroundColor: '#e5e7eb' },
  cardTitle: { marginTop: 8, fontSize: 14, fontWeight: '600' },
  cardSub: { fontSize: 12, marginTop: 2 },
  artistImg: { width: 112, height: 112, borderRadius: 56 },

  feedCard: { borderWidth: 1, borderRadius: 10, padding: 14 },
  feedHeader: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  feedAvatar: { width: 40, height: 40, borderRadius: 20 },
  feedQuote: { fontSize: 13, fontStyle: 'italic', marginBottom: 8 },
  feedLink: { fontSize: 12, alignSelf: 'flex-end' },

  hero: { paddingBottom: 48, overflow: 'hidden' },
  heroBgGrid: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, flexDirection: 'row', flexWrap: 'wrap', opacity: 0.1 },
  heroBgTile: { width: '33%', aspectRatio: 1, backgroundColor: '#374151' },
  heroTitle: { fontSize: 40, fontWeight: '700', fontFamily: 'serif', textAlign: 'center', marginBottom: 16 },
  heroSub: { fontSize: 16, textAlign: 'center', marginBottom: 32, lineHeight: 24 },
  heroBtn: { paddingHorizontal: 32, paddingVertical: 16, borderRadius: 10 },
  heroBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  section: { padding: 24, gap: 8 },
  albumGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16, justifyContent: 'center' },
  featureItem: { alignItems: 'center', paddingVertical: 16 },
  featureIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  featureTitle: { fontSize: 18, fontWeight: '700', fontFamily: 'serif', marginBottom: 8 },
  featureDesc: { fontSize: 14, textAlign: 'center', lineHeight: 20 },

  ctaSection: { padding: 40, alignItems: 'center' },
  ctaTitle: { color: '#fff', fontSize: 28, fontWeight: '700', fontFamily: 'serif', textAlign: 'center' },
  ctaSub: { color: 'rgba(255,255,255,0.9)', fontSize: 15, textAlign: 'center', marginTop: 12, lineHeight: 22 },
  ctaBtn: { backgroundColor: '#fff', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 10, marginTop: 24 },
  ctaBtnText: { fontWeight: '700', fontSize: 15 },

  emptyBox: { borderWidth: 2, borderStyle: 'dashed', borderRadius: 10, padding: 32, alignItems: 'center' },
});

export default HomePage;