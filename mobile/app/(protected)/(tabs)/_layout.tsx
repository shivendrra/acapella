import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="home" options={{
        tabBarIcon: ({ color }) => <MaterialIcons name="home" size={24} color={color} />
      }} />
      <Tabs.Screen name="search" options={{
        tabBarIcon: ({ color }) => <MaterialIcons name="search" size={24} color={color} />
      }} />
      <Tabs.Screen name="activity" options={{
        tabBarIcon: ({ color }) => <MaterialIcons name="history" size={24} color={color} />
      }} />
      <Tabs.Screen name="profile" options={{
        tabBarIcon: ({ color }) => <MaterialIcons name="person" size={24} color={color} />
      }} />
    </Tabs>
  );
}