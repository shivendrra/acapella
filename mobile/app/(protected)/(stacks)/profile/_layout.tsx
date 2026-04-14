import { Stack } from 'expo-router';
export default function ProfileStack() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="settings/index" />
      <Stack.Screen name="settings/profile" />
      <Stack.Screen name="settings/account" />
      <Stack.Screen name="settings/security" />
      <Stack.Screen name="settings/connections" />
      <Stack.Screen name="settings/notifications" />
      <Stack.Screen name="settings/privacy" />
      <Stack.Screen name="curator-program" />
      <Stack.Screen name="profile-setup" />
    </Stack>
  );
}