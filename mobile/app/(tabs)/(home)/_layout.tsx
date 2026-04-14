import { Stack } from 'expo-router';

export default function HomeStack() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="album/[id]" />
      <Stack.Screen name="song/[id]" />
      <Stack.Screen name="artist/[id]" />
      <Stack.Screen name="artist/[id]/songs" />
      <Stack.Screen name="artist/[id]/albums" />
      <Stack.Screen name="playlist/[id]" />
      <Stack.Screen name="review/[id]" />
      <Stack.Screen name="[username]/index" />
      <Stack.Screen name="[username]/likes" />
      <Stack.Screen name="[username]/ratings" />
      <Stack.Screen name="[username]/reviews" />
      <Stack.Screen name="[username]/activity" />
      <Stack.Screen name="[username]/playlists" />
      <Stack.Screen name="curators" />
      <Stack.Screen name="about" />
      <Stack.Screen name="help" />
      <Stack.Screen name="legal/terms" />
      <Stack.Screen name="legal/privacy" />
      <Stack.Screen name="legal/refunds" />
      <Stack.Screen name="legal/shipping" />
      <Stack.Screen name="legal/contact" />
      <Stack.Screen name="settings" />
    </Stack>
  );
}