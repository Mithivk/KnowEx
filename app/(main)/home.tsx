import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useUserProfile } from '@/hooks/useUserProfile';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function Home() {
  const { profile, loading } = useUserProfile();
  const router = useRouter();

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              await supabase.auth.signOut();
              // Navigation will be handled by the root layout automatically
            } catch (error) {
              console.error('Error logging out:', error);
              Alert.alert("Error", "Failed to logout. Please try again.");
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Text className="text-gray-500 text-base">Loading your profile...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      {/* Header with Logout Button */}
      <View className="flex-row justify-between items-center px-6 pt-12 pb-4 border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900">KnowEx</Text>
        <TouchableOpacity 
          onPress={handleLogout}
          className="flex-row items-center bg-gray-100 px-4 py-2 rounded-lg"
        >
          <Ionicons name="log-out-outline" size={18} color="#6B7280" />
          <Text className="text-gray-600 font-medium ml-2">Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View className="flex-1 justify-center items-center p-6">
        <Text className="text-3xl font-bold text-gray-900 mb-4 text-center">
          Welcome to KnowEx! 🎉
        </Text>
        <Text className="text-lg text-gray-600 text-center mb-8">
          Your knowledge exchange platform
        </Text>
        
        {profile && (
          <View className="w-full max-w-md p-6 bg-blue-50 rounded-xl border border-blue-200">
            <Text className="text-xl font-semibold text-gray-800 mb-4 text-center">
              Your Profile
            </Text>
            
            <View className="space-y-3">
              <View className="flex-row justify-between py-2 border-b border-blue-100">
                <Text className="text-gray-600 font-medium">Name:</Text>
                <Text className="text-gray-800 font-semibold">{profile.full_name}</Text>
              </View>
              
              <View className="flex-row justify-between py-2 border-b border-blue-100">
                <Text className="text-gray-600 font-medium">Email:</Text>
                <Text className="text-gray-800 font-semibold">{profile.email}</Text>
              </View>
              
              {profile.domain && (
                <View className="flex-row justify-between py-2 border-b border-blue-100">
                  <Text className="text-gray-600 font-medium">Community:</Text>
                  <Text className="text-gray-800 font-semibold">{profile.domain}</Text>
                </View>
              )}
              
              {profile.technologies && profile.technologies.length > 0 && (
                <View className="py-2">
                  <Text className="text-gray-600 font-medium mb-2">Interests:</Text>
                  <View className="flex-row flex-wrap">
                    {profile.technologies.map((tech, index) => (
                      <View 
                        key={tech} 
                        className="bg-blue-100 px-3 py-1 rounded-full mr-2 mb-2"
                      >
                        <Text className="text-blue-700 text-sm font-medium">{tech}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View className="w-full max-w-md mt-8">
          <Text className="text-lg font-semibold text-gray-800 mb-4 text-center">
            Quick Actions
          </Text>
          <View className="flex-row justify-between">
            <TouchableOpacity className="bg-blue-500 px-6 py-3 rounded-lg flex-1 mr-2">
              <Text className="text-white font-semibold text-center">Browse</Text>
            </TouchableOpacity>
            <TouchableOpacity className="bg-green-500 px-6 py-3 rounded-lg flex-1 ml-2">
              <Text className="text-white font-semibold text-center">Post</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}