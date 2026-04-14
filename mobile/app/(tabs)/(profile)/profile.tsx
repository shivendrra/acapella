import { Redirect } from 'expo-router';
import { useAuth } from '../../../hooks/useAuth';

export default function ProfileTab() {
  const { userProfile } = useAuth();
  if (!userProfile) return <Redirect href="/login" />;
  return <Redirect href={`/${userProfile.username}` as any} />;
}