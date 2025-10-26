import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';

const { width } = Dimensions.get('window');

interface Community {
  community_id: number;
  name: string;
  description: string;
  icon: string;
  color: string;
  member_count: number;
}

export default function CommunitySelection() {
  const [selectedCommunity, setSelectedCommunity] = useState<number | null>(null);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchCommunities();
  }, []);

  const fetchCommunities = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('communities')
        .select('*')
        .eq('is_active', true)
        .order('member_count', { ascending: false });

      if (error) throw error;
      setCommunities(data || []);
    } catch (err: any) {
      console.error('Error fetching communities:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createJoinRequest = async (communityId: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check if there's already a pending request for this user and community
      const { data: existingRequest, error: checkError } = await supabase
        .from('community_join_requests')
        .select('request_id, status')
        .eq('community_id', communityId)
        .eq('user_id', user.id)
        .in('status', ['pending', 'approved'])
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 is "not found" error, which is expected
        throw checkError;
      }

      if (existingRequest) {
        if (existingRequest.status === 'pending') {
          return { success: true, alreadyRequested: true, status: 'pending' };
        } else if (existingRequest.status === 'approved') {
          return { success: true, alreadyRequested: true, status: 'approved' };
        }
      }

      // Create new join request
      const { data, error: insertError } = await supabase
        .from('community_join_requests')
        .insert({
          community_id: communityId,
          user_id: user.id,
          status: 'pending',
          requested_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) throw insertError;

      return { success: true, alreadyRequested: false, request: data };
    } catch (error: any) {
      console.error('Error creating join request:', error);
      throw error;
    }
  };

  const handleContinue = async () => {
    if (selectedCommunity === null) return;

    try {
      setSubmitting(true);
      
      const result = await createJoinRequest(selectedCommunity);
      
      if (result.alreadyRequested) {
        if (result.status === 'pending') {
          Alert.alert(
            'Request Already Sent',
            'You already have a pending request to join this community. Please wait for approval.',
            [{ text: 'OK' }]
          );
        } else if (result.status === 'approved') {
          Alert.alert(
            'Already a Member',
            'You are already a member of this community!',
            [{ text: 'OK' }]
          );
        }
      } else {
        Alert.alert(
          'Request Sent!',
          'Your request to join the community has been sent. You will be notified once approved.',
          [{ text: 'OK' }]
        );
      }

      // Continue to technologies screen regardless
      router.push({
        pathname: '/(onboarding)/technologies',
        params: { communities: JSON.stringify([selectedCommunity]) },
      });

    } catch (err: any) {
      console.error('Error in handleContinue:', err);
      Alert.alert(
        'Error',
        'Failed to send join request. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from('users')
          .update({
            onboarded: true,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);

        if (error) throw error;
      }
      router.replace('/(main)/home');
    } catch (error) {
      console.error('Error skipping onboarding:', error);
      router.replace('/(main)/home');
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#5271FF" />
        <Text className="mt-4 text-gray-500 text-base">Loading communities...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center px-6">
        <Ionicons name="warning-outline" size={48} color="#EF4444" />
        <Text className="mt-4 text-gray-900 text-lg font-semibold text-center">
          Unable to load communities
        </Text>
        <Text className="mt-2 text-gray-500 text-sm text-center">{error}</Text>
        <TouchableOpacity
          onPress={fetchCommunities}
          className="bg-blue-600 rounded-xl py-3 px-6 mt-5"
        >
          <Text className="text-white font-semibold text-base">Try Again</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleSkip}
          className="bg-gray-500 rounded-xl py-3 px-6 mt-3"
        >
          <Text className="text-white font-semibold text-base">Skip Onboarding</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingVertical: 30,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="items-center mb-10">
          <View className="w-16 h-16 bg-blue-100 rounded-2xl items-center justify-center mb-4">
            <Ionicons name="people-outline" size={30} color="#5271FF" />
          </View>
          <Text className="text-2xl font-bold text-gray-900 mb-2 text-center">
            Join a Community
          </Text>
          <Text className="text-base text-gray-500 text-center">
            Pick one to personalize your experience. Your request will need approval.
          </Text>
        </View>

        {/* Community Cards */}
        {communities.map((community) => {
          const isSelected = selectedCommunity === community.community_id;
          const color = community.color || '#5271FF';
          const iconName = Ionicons.glyphMap[community.icon]
            ? community.icon
            : 'people-outline';

          return (
            <TouchableOpacity
              key={community.community_id}
              activeOpacity={0.9}
              onPress={() => setSelectedCommunity(community.community_id)}
              style={{
                backgroundColor: isSelected ? '#EEF4FF' : '#FFFFFF',
                borderColor: isSelected ? color : '#E5E7EB',
                borderWidth: isSelected ? 2 : 1,
                borderRadius: 20,
                padding: 20,
                marginBottom: 16,
                shadowColor: '#000',
                shadowOpacity: 0.08,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 3 },
                elevation: 3,
              }}
            >
              <View className="flex-row items-center">
                <View
                  className="w-12 h-12 rounded-2xl items-center justify-center mr-4"
                  style={{ backgroundColor: isSelected ? color : '#E5E7EB' }}
                >
                  <Ionicons name={iconName as any} size={26} color="white" />
                </View>

                <View className="flex-1">
                  <Text
                    className={`font-semibold text-lg ${
                      isSelected ? 'text-blue-700' : 'text-gray-900'
                    }`}
                  >
                    {community.name}
                  </Text>

                  <Text
                    className="text-sm text-gray-500 mt-1"
                    numberOfLines={2}
                  >
                    {community.description}
                  </Text>

                  <Text
                    className={`text-xs font-medium mt-2 ${
                      isSelected ? 'text-blue-600' : 'text-gray-400'
                    }`}
                  >
                    {community.member_count.toLocaleString()} members
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Buttons */}
        <View className="mt-6">
          <TouchableOpacity
            onPress={handleContinue}
            disabled={selectedCommunity === null || submitting}
            className={`w-full rounded-xl py-4 mb-3 ${
              selectedCommunity === null || submitting
                ? 'bg-gray-300'
                : 'bg-blue-600 shadow-md shadow-blue-300'
            }`}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text className="text-white text-center font-semibold text-base">
                {selectedCommunity === null
                  ? 'Select a Community'
                  : 'Continue'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSkip} className="py-3 items-center">
            <Text className="text-gray-500 text-sm font-medium">Skip for now</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}