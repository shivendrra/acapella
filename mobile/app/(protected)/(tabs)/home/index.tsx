import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, FlatList, TouchableOpacity,
  Image, StyleSheet, ActivityIndicator, Modal, Pressable,
} from 'react-native';
import {
  collection, query, where, getDocs, orderBy, limit,
  Timestamp, collectionGroup, documentId,
} from '@firebase/firestore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { useAuth } from '../../../../hooks/useAuth';
import { useTheme } from '../../../../hooks/useTheme';
import { db, auth } from '../../../../services/firebase';
import { Review, Album, Song, Artist } from '../../../../types';

type ActivityItem = Review & { _type: 'review' };
type ArtistsMap = Record<string, Artist>;
type SidebarProps = { visible: boolean; onClose: () => void };

const routes = {
  album: (id: string) => ({ pathname: '/(protected)/(stacks)/home/album/[id]' as const, params: { id } }),
  song: (id: string) => ({ pathname: '/(protected)/(stacks)/home/song/[id]' as const, params: { id } }),
  artist: (id: string) => ({ pathname: '/(protected)/(stacks)/home/artist/[id]' as const, params: { id } }),
  review: (id: string) => ({ pathname: '/(protected)/(stacks)/home/review/[id]' as const, params: { id } }),
  user: (username: string) => ({ pathname: '/(protected)/(stacks)/home/[username]' as const, params: { username } }),
};

const Header: React.FC<{ c: any; onMenuPress: () => void }> = ({ c, onMenuPress }) => {
  const { toggleTheme, theme } = useTheme();
  return (
    <View style={[styles.header, { backgroundColor: c.bg, borderBottomColor: c.border }]}>
      <TouchableOpacity onPress={onMenuPress} style={styles.themeBtn}>
        <MaterialIcons name="menu" size={22} color={c.text} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: c.text }]}>Acapella</Text>
      <View style={styles.headerSide}>
        <TouchableOpacity onPress={toggleTheme} style={styles.themeBtn}>
          <MaterialIcons name={theme === 'dark' ? 'light-mode' : 'dark-mode'} size={22} color={c.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

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
    <TouchableOpacity onPress={() => router.push(routes.album(album.id))}>
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
    <TouchableOpacity onPress={() => router.push(routes.song(song.id))}>
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
    <TouchableOpacity style={{ alignItems: 'center' }} onPress={() => router.push(routes.artist(artist.id))}>
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
        <TouchableOpacity onPress={() => activity.entityUsername && router.push(routes.user(activity.entityUsername))}>
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
      <TouchableOpacity onPress={() => router.push(routes.review(activity.id))}>
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

      {featuredAlbums.length > 0 && (
        <View style={[styles.section, { backgroundColor: c.sectionAlt }]}>
          <Text style={[styles.sectionTitle, { color: c.text, textAlign: 'center' }]}>What People Are Reviewing</Text>
          <Text style={[styles.sectionSub, { color: c.muted, textAlign: 'center' }]}>{"Join the conversation on today's most talked-about albums."}</Text>
          <View style={styles.albumGrid}>
            {featuredAlbums.map(album => (
              <TouchableOpacity key={album.id} style={{ width: '30%' }} onPress={() => router.push(routes.album(album.id))}>
                <View style={[styles.cardImg, { borderRadius: 8 }]}>
                  <Image source={{ uri: album.coverArtUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

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
  if (error) return <Text style={{ color: '#ef4444', textAlign: 'center', margin: 32 }}>{error}</Text>;

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

const Sidebar: React.FC<SidebarProps> = ({ visible, onClose }) => {
  const router = useRouter();
  const { currentUser, userProfile } = useAuth();
  const { theme } = useTheme();

  const c = theme === 'dark' ? colors.dark : colors.light;

  const navigate = (path: string) => {
    onClose();
    router.push(path as any);
  };

  const handleLogout = async () => {
    await signOut(auth);
    onClose();
    router.replace('/login');
  };

  return (
    <Modal visible={visible} transparent animationType="none">
      <Pressable style={styles.overlay} onPress={onClose} />

      <View style={[styles.container, { backgroundColor: c.bg }]}>
        <View style={[styles.sidebarHeader, { borderBottomColor: c.border }]}>
          <Image source={require('../../../../assets/images/HeaderLogo.png')} style={{ width: 54, height: 54 }} resizeMode="contain" />
          <TouchableOpacity onPress={onClose}>
            <MaterialIcons name="close" size={28} color={c.text} />
          </TouchableOpacity>
        </View>

        <View style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ paddingBottom: 8 }}>
            <View style={styles.sidebarSection}>
              {navItems.map(item => (
                <TouchableOpacity key={item.label} style={styles.link} onPress={() => navigate(item.route)}>
                  <MaterialIcons name={item.icon as any} size={28} color={c.text} />
                  <Text style={[styles.linkText, { color: c.text }]}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={[styles.sidebarBottom, { borderTopColor: c.border }]}>
            {currentUser ? (
              <TouchableOpacity onPress={handleLogout} style={styles.link}>
                <MaterialIcons name="logout" size={20} color="#ef4444" />
                <Text style={[styles.linkText, { color: '#ef4444' }]}>Logout</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[styles.loginBtn, { backgroundColor: c.accent }]} onPress={() => navigate('/login')}>
                <Text style={styles.loginText}>Log In</Text>
              </TouchableOpacity>
            )}
            <View style={styles.footerLinks}>
              {footerLinks.map(link => (
                <TouchableOpacity key={link.label} onPress={() => navigate(link.route)}>
                  <Text style={[styles.footerText, { color: c.muted }]}>{link.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const HomePage: React.FC = () => {
  const { currentUser, loading } = useAuth();
  const { theme } = useTheme();
  const c = theme === 'dark' ? colors.dark : colors.light;
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) return <ActivityIndicator style={{ flex: 1, marginTop: 64 }} color={c.accent} />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <Header c={c} onMenuPress={() => setSidebarOpen(true)} />
      {currentUser ? <AuthenticatedHomePage c={c} /> : <GuestLandingPage c={c} />}
      <Sidebar visible={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </SafeAreaView>
  );
};

const colors = {
  light: {
    bg: '#f9fafb', text: '#111827', muted: '#6b7280', accent: '#6A9C89',
    accentFaint: 'rgba(99,71,155,0.1)', border: '#e5e7eb', cardBg: '#ffffff',
    heroBg: '#254D70', heroText: '#ffffff', heroMuted: 'rgba(255,255,255,0.8)',
    sectionAlt: '#ffffff',
  },
  dark: {
    bg: '#0f0f0f', text: '#f9fafb', muted: '#9ca3af', accent: '#6A9C89',
    accentFaint: 'rgba(167,139,223,0.1)', border: '#374151', cardBg: 'rgba(31,41,55,0.5)',
    heroBg: '#254D70', heroText: '#ffffff', heroMuted: 'rgba(255,255,255,0.7)',
    sectionAlt: 'rgba(0,0,0,0.5)',
  },
};

const navItems = [
  { label: 'Songs', route: '/songs', icon: 'music-note' },
  { label: 'Albums', route: '/albums', icon: 'album' },
  { label: 'Artists', route: '/artists', icon: 'person' },
  { label: 'Curators', route: '/curators', icon: 'group' },
];

const footerLinks = [
  { label: 'About', route: '/about' },
  { label: 'Help', route: '/help' },
  { label: 'Contact', route: '/contact' },
  { label: 'Privacy', route: '/privacy' },
  { label: 'Terms', route: '/terms' },
];

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
  },
  headerSide: { width: 40, alignItems: 'flex-end' },
  headerTitle: { fontSize: 36, fontFamily: 'InstrumentSerif_400Regular' },
  themeBtn: { padding: 4 },

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

  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  container: { position: 'absolute', left: 0, top: 0, bottom: 0, width: '80%', paddingTop: 48 },
  sidebarHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 15, paddingVertical: 10, borderBottomWidth: 1, marginTop: -30,
  },
  sidebarSection: { paddingHorizontal: 10, paddingTop: 20 },
  link: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 16 },
  linkText: { fontSize: 18 },
  loginBtn: { margin: 16, padding: 14, borderRadius: 10, alignItems: 'center' },
  loginText: { color: '#fff', fontWeight: '600' },
  sidebarBottom: { borderTopWidth: 1, paddingTop: 8, paddingBottom: 24 },
  footerLinks: { flexDirection: 'column', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, paddingTop: 8 },
  footerText: { fontSize: 13 },
});

export default HomePage;