import { Stack } from 'expo-router';
import { TouchableOpacity, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';

export default function MainLayout() {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/(auth)/login');
  };

  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'KnowEx Home',
          headerRight: () => (
            <TouchableOpacity onPress={handleLogout}>
              <Text className="text-blue-600 font-medium">Logout</Text>
            </TouchableOpacity>
          )
        }} 
      />
    </Stack>
  );
}