import { Redirect } from 'expo-router';
import { useAuth } from '../../../../hooks/useAuth';

export default function ProfileTab() {
  const { userProfile } = useAuth();

  if (!userProfile) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Redirect
      href={{
        pathname: '/home/[username]',
        params: { username: userProfile.username },
      }}
    />
  );
}