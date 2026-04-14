import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  StyleSheet, ActivityIndicator, Linking,
} from 'react-native';
import { doc, getDoc, collection, query, where, getDocs } from '@firebase/firestore';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { db } from '../../../../../services/firebase';
import { useTheme } from '../../../../../hooks/useTheme';
import { Artist, Album, Song } from '../../../../../types';
import { formatDate } from '../../../../../utils/formatters';
import { instagram, twitter, appleMusic, spotify, youtube, facebook, youtubeMusic } from '../../../../../constants/icons';
import { SvgXml } from 'react-native-svg'

const TOP_ALBUMS = 3, TOP_SONGS = 10;

const AlbumCard: React.FC<{ album: Album; c: any }> = ({ album, c }) => {
  const router = useRouter();
  return (
    <TouchableOpacity style={styles.albumCard} onPress={() => router.push(`/album/${album.id}` as any)}>
      <View style={styles.albumImg}>
        <Image source={{ uri: album.coverArtUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      </View>
      <Text style={[styles.albumTitle, { color: c.text }]} numberOfLines={1}>{album.title}</Text>
      <Text style={[styles.albumDate, { color: c.muted }]}>{formatDate(album.releaseDate)}</Text>
    </TouchableOpacity>
  );
};

const PLATFORM_ICONS: Record<string, string> = {
  twitter: twitter, instagram: instagram, facebook: facebook,
  spotify: spotify, youtubemusic: youtube, applemusic: appleMusic,
};

const SocialLinks: React.FC<{ artist: Artist; c: any }> = ({ artist, c }) => {
  const links = [
    ...(artist.platformLinks ? Object.entries(artist.platformLinks) : []),
    ...(artist.socials ? Object.entries(artist.socials) : []),
  ].filter(([, url]) => url);

  if (!links.length) return null;
  return (
    <View style={styles.socialRow}>
      {links.map(([platform, url]) => {
        const key = platform.toLowerCase().replace(/\s/g, '');
        const icon = PLATFORM_ICONS[key] || PLATFORM_ICONS.default;
        return (
          <TouchableOpacity key={platform} onPress={() => Linking.openURL(url as string)} style={styles.socialBtn}>
            <SvgXml xml={icon} width={24} height={24} color={c.muted} />
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const ArtistPage: React.FC = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTheme();
  const router = useRouter();
  const isDark = theme === 'dark';
  const c = isDark ? colors.dark : colors.light;

  const [artist, setArtist] = useState<Artist | null>(null);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bioExpanded, setBioExpanded] = useState(false);

  useEffect(() => {
    if (!id) { setError('Artist ID is missing.'); setLoading(false); return; }
    const run = async () => {
      try {
        setLoading(true);
        const snap = await getDoc(doc(db, 'artists', id));
        if (!snap.exists()) { setError('Artist not found.'); return; }
        const data = { id: snap.id, ...snap.data() } as Artist;
        setArtist(data);

        const [albSnap, soSnap] = await Promise.all([
          getDocs(query(collection(db, 'albums'), where('artistIds', 'array-contains', id))),
          getDocs(query(collection(db, 'songs'), where('artistIds', 'array-contains', id))),
        ]);
        const albs = albSnap.docs.map(d => ({ id: d.id, ...d.data() } as Album))
          .sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());
        const sos = soSnap.docs.map(d => ({ id: d.id, ...d.data() } as Song))
          .sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());
        setAlbums(albs); setSongs(sos);
      } catch { setError('Failed to load artist details.'); }
      finally { setLoading(false); }
    };
    run();
  }, [id]);

  if (loading) return <ActivityIndicator style={{ flex: 1, marginTop: 64 }} color={c.accent} />;
  if (error) return <Text style={[styles.center, { color: '#ef4444' }]}>{error}</Text>;
  if (!artist) return null;

  return (
    <ScrollView style={{ backgroundColor: c.bg }} showsVerticalScrollIndicator={false}>
      {/* Cover */}
      <Image
        source={{ uri: artist.coverImageUrl || 'https://placehold.co/800x400/131010/FAF8F1?text=+' }}
        style={styles.cover}
        resizeMode="cover"
      />

      {/* Profile header */}
      <View style={styles.profileSection}>
        <Image
          source={{ uri: artist.imageUrl || `https://ui-avatars.com/api/?name=${artist.name}&background=random&size=128` }}
          style={[styles.avatar, { borderColor: c.bg }]}
        />
        <Text style={[styles.artistName, { color: c.text }]}>{artist.name}</Text>
        <View style={styles.genreRow}>
          {artist.genres.map(g => (
            <View key={g} style={[styles.genrePill, { backgroundColor: c.pill }]}>
              <Text style={[styles.genreText, { color: c.pillText }]}>{g}</Text>
            </View>
          ))}
        </View>
        <SocialLinks artist={artist} c={c} />
      </View>

      <View style={{ paddingHorizontal: 16, paddingBottom: 48 }}>
        {/* Bio */}
        {artist.bio && (
          <View style={{ marginBottom: 32 }}>
            <Text style={[styles.bioText, { color: c.bodyText }]} numberOfLines={bioExpanded ? undefined : 3}>
              {artist.bio}
            </Text>
            <TouchableOpacity onPress={() => setBioExpanded(v => !v)}>
              <Text style={[styles.readMore, { color: c.accent }]}>{bioExpanded ? 'Read less' : 'Read more'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Discography */}
        <Text style={[styles.sectionTitle, { color: c.text, borderBottomColor: c.border }]}>Discography</Text>

        {/* Albums */}
        <View style={{ marginTop: 20, marginBottom: 32 }}>
          <View style={styles.rowBetween}>
            <Text style={[styles.subTitle, { color: c.text }]}>Albums</Text>
            {albums.length > TOP_ALBUMS && (
              <TouchableOpacity onPress={() => router.push(`/artist/${id}/albums` as any)}>
                <Text style={[styles.seeAll, { color: c.accent }]}>See all</Text>
              </TouchableOpacity>
            )}
          </View>
          {albums.length === 0
            ? <Text style={{ color: c.muted }}>No albums found for this artist.</Text>
            : (
              <View style={styles.albumGrid}>
                {albums.slice(0, TOP_ALBUMS).map(a => <AlbumCard key={a.id} album={a} c={c} />)}
              </View>
            )}
        </View>

        {/* Songs */}
        <View>
          <View style={styles.rowBetween}>
            <Text style={[styles.subTitle, { color: c.text }]}>Songs</Text>
            {songs.length > TOP_SONGS && (
              <TouchableOpacity onPress={() => router.push(`/artist/${id}/songs` as any)}>
                <Text style={[styles.seeAll, { color: c.accent }]}>See all</Text>
              </TouchableOpacity>
            )}
          </View>
          {songs.length === 0
            ? <Text style={{ color: c.muted, marginTop: 8 }}>No individual songs found for this artist.</Text>
            : (
              <View style={[styles.songList, { borderColor: c.border }]}>
                {songs.slice(0, TOP_SONGS).map((song, i) => (
                  <TouchableOpacity
                    key={song.id}
                    style={[styles.songRow, { backgroundColor: i % 2 === 0 ? 'transparent' : c.altRow, borderBottomColor: c.border }]}
                    onPress={() => router.push(`/song/${song.id}` as any)}
                  >
                    <Image
                      source={{ uri: song.coverArtUrl || `https://placehold.co/100x100/131010/FAF8F1?text=${song.title.charAt(0)}` }}
                      style={styles.songThumb}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.songTitle, { color: c.text }]} numberOfLines={1}>{song.title}</Text>
                      <Text style={[styles.songDate, { color: c.muted }]}>{formatDate(song.releaseDate)}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
        </View>
      </View>
    </ScrollView>
  );
};

const colors = {
  light: {
    bg: '#f9fafb', text: '#111827', bodyText: '#374151', muted: '#6b7280',
    accent: '#63479b', border: '#e5e7eb', pill: '#f3f4f6', pillText: '#374151',
    altRow: 'rgba(0,0,0,0.02)',
  },
  dark: {
    bg: '#0f0f0f', text: '#f9fafb', bodyText: '#d1d5db', muted: '#9ca3af',
    accent: '#a78bdf', border: '#374151', pill: '#1f2937', pillText: '#d1d5db',
    altRow: 'rgba(255,255,255,0.02)',
  },
};

const styles = StyleSheet.create({
  cover: { width: '100%', height: 220 },
  profileSection: { alignItems: 'center', marginTop: -56, paddingBottom: 24 },
  avatar: { width: 112, height: 112, borderRadius: 56, borderWidth: 4 },
  artistName: { fontSize: 32, fontWeight: '700', fontFamily: 'serif', marginTop: 12, textAlign: 'center' },
  genreRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 10 },
  genrePill: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999 },
  genreText: { fontSize: 13, fontWeight: '500' },
  socialRow: { flexDirection: 'row', gap: 16, marginTop: 12 },
  socialBtn: { padding: 6 },
  bioText: { fontSize: 14, lineHeight: 22, textAlign: 'center' },
  readMore: { fontSize: 13, fontWeight: '600', textAlign: 'center', marginTop: 6 },
  sectionTitle: { fontSize: 26, fontWeight: '700', fontFamily: 'serif', borderBottomWidth: 1, paddingBottom: 8 },
  subTitle: { fontSize: 20, fontWeight: '600', fontFamily: 'serif' },
  seeAll: { fontSize: 13, fontWeight: '600' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 },
  albumGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  albumCard: { width: '30%' },
  albumImg: { width: '100%', aspectRatio: 1, borderRadius: 8, overflow: 'hidden', backgroundColor: '#e5e7eb' },
  albumTitle: { fontSize: 13, fontWeight: '600', marginTop: 6 },
  albumDate: { fontSize: 12, marginTop: 2 },
  songList: { borderWidth: 1, borderRadius: 10, overflow: 'hidden' },
  songRow: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12, borderBottomWidth: 1 },
  songThumb: { width: 44, height: 44, borderRadius: 6 },
  songTitle: { fontSize: 14, fontWeight: '600' },
  songDate: { fontSize: 12, marginTop: 2 },
  center: { textAlign: 'center', marginTop: 40 },
});

export default ArtistPage;