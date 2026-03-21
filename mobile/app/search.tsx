import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, Modal, Pressable, Image, ActivityIndicator,
} from 'react-native';
import { collection, query, where, getDocs, limit, orderBy } from '@firebase/firestore';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../services/firebase';
import { useTheme } from '../hooks/useTheme';
import { UserProfile, Artist, Album, Song } from '../types';

const HISTORY_KEY = 'acapella_search_history';

const debounce = <F extends (...args: any[]) => any>(fn: F, wait: number) => {
  let t: ReturnType<typeof setTimeout>;
  return (...args: Parameters<F>) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
};

const getHistory = async (): Promise<string[]> => {
  try { const h = await AsyncStorage.getItem(HISTORY_KEY); return h ? JSON.parse(h) : []; }
  catch { return []; }
};
const addHistory = async (term: string) => {
  const h = await getHistory();
  const next = [term, ...h.filter(i => i.toLowerCase() !== term.toLowerCase())].slice(0, 10);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next));
};
const clearHistory = async () => AsyncStorage.removeItem(HISTORY_KEY);

interface Results { users: UserProfile[]; artists: Artist[]; albums: Album[]; songs: Song[]; }

const SearchPage: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const c = isDark ? colors.dark : colors.light;
  const router = useRouter();

  const [input, setInput] = useState('');
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Results>({ users: [], artists: [], albums: [], songs: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => { getHistory().then(setHistory); }, []);

  const debouncedSetQ = useCallback(debounce((v: string) => setQ(v), 300), []);

  const handleInput = (v: string) => { setInput(v); debouncedSetQ(v); };

  const handleSubmit = async () => {
    const t = input.trim();
    if (t) { await addHistory(t); setHistory(await getHistory()); }
    setQ(t);
  };

  const handleHistoryClick = (term: string) => { setInput(term); setQ(term); };

  const handleClearHistory = async () => {
    await clearHistory(); setHistory([]); setShowClearConfirm(false);
  };

  useEffect(() => {
    if (!q) { setResults({ users: [], artists: [], albums: [], songs: [] }); return; }
    const run = async () => {
      setLoading(true); setError(null);
      try {
        const s = q.toLowerCase();
        const [uSnap, arSnap, alSnap, soSnap] = await Promise.all([
          getDocs(query(collection(db, 'users'), where('username', '>=', s), where('username', '<=', s + '\uf8ff'), limit(5))),
          getDocs(query(collection(db, 'artists'), where('name_lowercase', '>=', s), where('name_lowercase', '<=', s + '\uf8ff'), orderBy('name_lowercase'), limit(5))),
          getDocs(query(collection(db, 'albums'), where('title_lowercase', '>=', s), where('title_lowercase', '<=', s + '\uf8ff'), orderBy('title_lowercase'), limit(5))),
          getDocs(query(collection(db, 'songs'), where('title_lowercase', '>=', s), where('title_lowercase', '<=', s + '\uf8ff'), orderBy('title_lowercase'), limit(5))),
        ]);
        setResults({
          users: uSnap.docs.map(d => d.data() as UserProfile),
          artists: arSnap.docs.map(d => ({ id: d.id, ...d.data() } as Artist)),
          albums: alSnap.docs.map(d => ({ id: d.id, ...d.data() } as Album)),
          songs: soSnap.docs.map(d => ({ id: d.id, ...d.data() } as Song)),
        });
      } catch { setError('An error occurred during search.'); }
      finally { setLoading(false); }
    };
    run();
  }, [q]);

  const total = results.users.length + results.artists.length + results.albums.length + results.songs.length;

  const sections = [
    {
      title: 'Users', data: results.users, key: 'users', render: (u: UserProfile) => (
        <TouchableOpacity key={u.uid} style={[styles.row, { backgroundColor: c.rowBg }]} onPress={() => router.push(`/${u.username}` as any)}>
          <Image source={{ uri: u.photoURL || `https://ui-avatars.com/api/?name=${u.displayName || u.username}` }} style={styles.avatar} />
          <View>
            <Text style={[styles.rowTitle, { color: c.text }]}>{u.displayName}</Text>
            <Text style={[styles.rowSub, { color: c.muted }]}>@{u.username}</Text>
          </View>
        </TouchableOpacity>
      )
    },
    {
      title: 'Artists', data: results.artists, key: 'artists', render: (a: Artist) => (
        <TouchableOpacity key={a.id} style={[styles.row, { backgroundColor: c.rowBg }]} onPress={() => router.push(`/artist/${a.id}` as any)}>
          <Image source={{ uri: a.imageUrl || `https://ui-avatars.com/api/?name=${a.name}&background=random` }} style={[styles.avatar, { borderRadius: 8 }]} />
          <Text style={[styles.rowTitle, { color: c.text }]}>{a.name}</Text>
        </TouchableOpacity>
      )
    },
    {
      title: 'Albums', data: results.albums, key: 'albums', render: (a: Album) => (
        <TouchableOpacity key={a.id} style={[styles.row, { backgroundColor: c.rowBg }]} onPress={() => router.push(`/album/${a.id}` as any)}>
          <Image source={{ uri: a.coverArtUrl || `https://picsum.photos/seed/${a.id}/100/100` }} style={[styles.avatar, { borderRadius: 8 }]} />
          <Text style={[styles.rowTitle, { color: c.text }]}>{a.title}</Text>
        </TouchableOpacity>
      )
    },
    {
      title: 'Songs', data: results.songs, key: 'songs', render: (s: Song) => (
        <TouchableOpacity key={s.id} style={[styles.row, { backgroundColor: c.rowBg }]} onPress={() => router.push(`/song/${s.id}` as any)}>
          <Text style={[styles.rowTitle, { color: c.text }]}>{s.title}</Text>
        </TouchableOpacity>
      )
    },
  ].filter(s => s.data.length > 0);

  const renderContent = () => {
    if (loading && q) return <ActivityIndicator style={{ marginTop: 32 }} color={c.accent} />;
    if (error) return <Text style={[styles.centerText, { color: '#ef4444' }]}>{error}</Text>;
    if (!q) {
      if (history.length === 0) return <Text style={[styles.centerText, { color: c.muted }]}>Start typing to search for music, artists, and friends.</Text>;
      return (
        <View style={{ marginTop: 24 }}>
          <View style={styles.historyHeader}>
            <Text style={[styles.sectionTitle, { color: c.text }]}>Recent Searches</Text>
            <TouchableOpacity onPress={() => setShowClearConfirm(true)}>
              <Text style={{ color: '#ef4444', fontSize: 13 }}>Clear</Text>
            </TouchableOpacity>
          </View>
          {history.map((term, i) => (
            <TouchableOpacity key={i} style={[styles.row, { backgroundColor: c.rowBg }]} onPress={() => handleHistoryClick(term)}>
              <MaterialIcons name="history" size={20} color={c.muted} style={{ marginRight: 12 }} />
              <Text style={{ color: c.text }}>{term}</Text>
            </TouchableOpacity>
          ))}
        </View>
      );
    }
    if (total === 0) return (
      <View style={{ alignItems: 'center', marginTop: 40 }}>
        <Text style={[styles.centerText, { color: c.muted }]}>No results found for "{q}".</Text>
        <Text style={{ color: c.muted, fontSize: 13, marginTop: 4 }}>Try searching for something else.</Text>
      </View>
    );
    return (
      <View style={{ marginTop: 24 }}>
        {sections.map(sec => (
          <View key={sec.key} style={{ marginBottom: 24 }}>
            <Text style={[styles.sectionTitle, { color: c.text, borderBottomColor: c.border }]}>{sec.title}</Text>
            {sec.data.map((item: any) => sec.render(item))}
          </View>
        ))}
      </View>
    );
  };

  return (
    <FlatList
      data={[]}
      renderItem={null}
      ListHeaderComponent={
        <View style={[styles.root, { backgroundColor: c.bg }]}>
          <Text style={[styles.pageTitle, { color: c.text }]}>Search</Text>
          <View style={[styles.searchBar, { borderColor: c.border, backgroundColor: c.inputBg }]}>
            <MaterialIcons name="search" size={20} color={c.muted} style={{ marginRight: 8 }} />
            <TextInput
              style={[styles.searchInput, { color: c.text }]}
              placeholder="Search artists, albums, songs, users..."
              placeholderTextColor={c.muted}
              value={input}
              onChangeText={handleInput}
              onSubmitEditing={handleSubmit}
              returnKeyType="search"
            />
            {input ? (
              <TouchableOpacity onPress={() => { setInput(''); setQ(''); }}>
                <MaterialIcons name="close" size={20} color={c.muted} />
              </TouchableOpacity>
            ) : null}
          </View>
          {renderContent()}
        </View>
      }
    />
  );
};

// Clear history confirm modal rendered outside FlatList
const SearchPageWrapper: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const c = isDark ? colors.dark : colors.light;
  const [showClear, setShowClear] = useState(false);

  return (
    <>
      <SearchPage />
      <Modal visible={showClear} transparent animationType="fade" onRequestClose={() => setShowClear(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowClear(false)} />
        <View style={[styles.confirmBox, { backgroundColor: c.bg }]}>
          <MaterialIcons name="warning" size={48} color="#ef4444" style={{ alignSelf: 'center', marginBottom: 12 }} />
          <Text style={[styles.confirmTitle, { color: c.text }]}>Clear Search History?</Text>
          <Text style={[styles.confirmSub, { color: c.muted }]}>This will permanently remove your recent searches.</Text>
          <View style={styles.confirmBtns}>
            <TouchableOpacity style={[styles.confirmBtn, { borderColor: c.border, borderWidth: 1 }]} onPress={() => setShowClear(false)}>
              <Text style={{ color: c.text }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: '#ef4444' }]} onPress={async () => { await clearHistory(); setShowClear(false); }}>
              <Text style={{ color: '#fff' }}>Clear</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const colors = {
  light: { bg: '#f9fafb', text: '#111827', muted: '#6b7280', accent: '#63479b', border: '#e5e7eb', inputBg: '#fff', rowBg: 'transparent' },
  dark: { bg: '#0f0f0f', text: '#f9fafb', muted: '#9ca3af', accent: '#a78bdf', border: '#374151', inputBg: '#1f2937', rowBg: 'transparent' },
};

const styles = StyleSheet.create({
  root: { flex: 1, padding: 16, paddingTop: 24 },
  pageTitle: { fontSize: 28, fontWeight: '700', fontFamily: 'serif', marginBottom: 16 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 2, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 15 },
  sectionTitle: {
    fontSize: 20, fontWeight: '700', fontFamily: 'serif',
    borderBottomWidth: 1, paddingBottom: 8, marginBottom: 12,
  },
  row: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, marginBottom: 4 },
  avatar: { width: 48, height: 48, borderRadius: 24, marginRight: 12 },
  rowTitle: { fontSize: 15, fontWeight: '600' },
  rowSub: { fontSize: 13, marginTop: 2 },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  centerText: { textAlign: 'center', marginTop: 40, fontSize: 15 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.75)' },
  confirmBox: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24,
  },
  confirmTitle: { fontSize: 18, fontWeight: '600', textAlign: 'center', marginBottom: 8 },
  confirmSub: { fontSize: 13, textAlign: 'center', marginBottom: 24 },
  confirmBtns: { flexDirection: 'row', gap: 12 },
  confirmBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
});

export default SearchPageWrapper;