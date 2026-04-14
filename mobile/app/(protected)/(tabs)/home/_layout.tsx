import { Stack } from 'expo-router';
export default function SearchStack() {
  return <Stack screenOptions={{ headerShown: false }}><Stack.Screen name="index" /></Stack>;
}