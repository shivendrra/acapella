import { Tabs } from 'expo-router';
import { View, Image, StyleSheet, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../../hooks/useAuth';
import { useTheme } from '../../../hooks/useTheme';
import { colors } from '../../../constants/theme';

function ProfileTabIcon({ focused, color }: { focused: boolean; color: string }) {
  const { userProfile } = useAuth();
  const uri = userProfile?.photoURL
    || `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile?.displayName || userProfile?.username || 'A')}&background=254D70&color=FAF8F1&size=64`;
  return (
    <View style={[styles.avatarWrapper, { borderColor: focused ? color : 'transparent' }]}>
      <Image source={{ uri }} style={styles.avatar} />
    </View>
  );
}

export default function TabsLayout() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const c = isDark ? colors.dark : colors.light;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: c.tabActive,
        tabBarInactiveTintColor: c.tabInactive,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: c.tabBar,
          borderTopColor: c.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 84 : 70,
          zIndex:20,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 15,
        },
      }}
    >
      <Tabs.Screen name="home" options={{
        tabBarIcon: ({ color }) => <MaterialIcons name="home" size={28} color={color} />
      }} />
      <Tabs.Screen name="search" options={{
        tabBarIcon: ({ color }) => <MaterialIcons name="search" size={28} color={color} />
      }} />
      <Tabs.Screen name="activity" options={{
        tabBarIcon: ({ color }) => <MaterialIcons name="history" size={28} color={color} />
      }} />
      <Tabs.Screen name="profile"
        options={{ tabBarIcon: ({ color, focused }) => <ProfileTabIcon focused={focused} color={color} /> }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  avatarWrapper: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, overflow: 'hidden' },
  avatar: { width: '100%', height: '100%' },
});