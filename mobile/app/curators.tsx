import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Image,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { collection, query, where, getDocs } from '@firebase/firestore';
import { useRouter } from 'expo-router';
import { db } from '../services/firebase';
import { useTheme } from '../hooks/useTheme';
import { UserProfile } from '../types';

const CuratorCard: React.FC<{ user: UserProfile; c: any }> = ({ user, c }) => {
  const router = useRouter();
  return (
    <TouchableOpacity
      style={[styles.card, { borderColor: c.border }]}
      onPress={() => router.push(`/${user.username}` as any)}
    >
      <Image
        source={{ uri: user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || user.username}&background=random` }}
        style={styles.avatar}
      />
      <Text style={[styles.name, { color: c.text }]} numberOfLines={1}>{user.displayName}</Text>
      <Text style={[styles.username, { color: c.muted }]} numberOfLines={1}>@{user.username}</Text>
    </TouchableOpacity>
  );
};

const CuratorsPage: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const c = isDark ? colors.dark : colors.light;

  const [curators, setCurators] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true); setError(null);
      try {
        const snap = await getDocs(query(collection(db, 'users'), where('isCurator', '==', true)));
        const data = snap.docs.map(d => d.data() as UserProfile);
        data.sort((a, b) => (a.displayName || a.username || '').localeCompare(b.displayName || b.username || ''));
        setCurators(data);
      } catch (err: any) {
        setError(err.message?.includes('index')
          ? 'Failed to load curators. A database index may be required.'
          : 'Failed to load curators. Please try again later.');
      } finally { setLoading(false); }
    };
    run();
  }, []);

  if (loading) return <ActivityIndicator style={{ flex: 1, marginTop: 64 }} color={c.accent} />;
  if (error) return <Text style={[styles.center, { color: '#ef4444' }]}>{error}</Text>;

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <View style={styles.headingBlock}>
        <Text style={[styles.heading, { color: c.text }]}>Meet the Curators</Text>
        <Text style={[styles.subheading, { color: c.muted }]}>
          A special thanks to our Curators for supporting Acapella and helping build our community.
        </Text>
      </View>

      {curators.length > 0 ? (
        <FlatList
          data={curators}
          keyExtractor={u => u.uid}
          numColumns={2}
          contentContainerStyle={{ padding: 12, gap: 12 }}
          columnWrapperStyle={{ gap: 12 }}
          renderItem={({ item }) => <CuratorCard user={item} c={c} />}
        />
      ) : (
        <View style={[styles.emptyBox, { borderColor: c.border }]}>
          <Text style={{ color: c.muted }}>No curators yet. Be the first to support us!</Text>
        </View>
      )}
    </View>
  );
};

const colors = {
  light: { bg: '#f9fafb', text: '#111827', muted: '#6b7280', accent: '#63479b', border: '#e5e7eb' },
  dark: { bg: '#0f0f0f', text: '#f9fafb', muted: '#9ca3af', accent: '#a78bdf', border: '#374151' },
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  headingBlock: { padding: 16, paddingBottom: 8, alignItems: 'center' },
  heading: { fontSize: 28, fontWeight: '700', fontFamily: 'serif', textAlign: 'center' },
  subheading: { fontSize: 14, textAlign: 'center', marginTop: 6, maxWidth: 320, lineHeight: 20 },
  card: {
    flex: 1, alignItems: 'center', padding: 16,
    borderWidth: 1, borderRadius: 12,
  },
  avatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: '#eab308', marginBottom: 10 },
  name: { fontSize: 15, fontWeight: '700', textAlign: 'center' },
  username: { fontSize: 13, marginTop: 2 },
  emptyBox: { margin: 24, borderWidth: 2, borderStyle: 'dashed', borderRadius: 10, padding: 48, alignItems: 'center' },
  center: { textAlign: 'center', marginTop: 40 },
});

export default CuratorsPage;