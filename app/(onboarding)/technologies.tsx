import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator, Dimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { userService } from '../../lib/userService';

interface Technology {
  tech_id: number;
  name: string;
  category: string;
  community_id: number;
  is_active: boolean;
  created_at: string;
}

interface Community {
  community_id: number;
  name: string;
}

export default function TechnologySelection() {
  const { communities } = useLocalSearchParams();
  const [selectedTechnologies, setSelectedTechnologies] = useState<number[]>([]);
  const [technologies, setTechnologies] = useState<Technology[]>([]);
  const [communityData, setCommunityData] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const selectedCommunityIds = communities ? JSON.parse(communities as string) : [];
  const selectedCommunityId = selectedCommunityIds[0];

  useEffect(() => {
    if (selectedCommunityId) fetchCommunityAndTechnologies();
  }, [selectedCommunityId]);

  const fetchCommunityAndTechnologies = async () => {
    try {
      setLoading(true);
      const { data: community, error: communityError } = await supabase
        .from('communities')
        .select('community_id, name')
        .eq('community_id', selectedCommunityId)
        .single();
      if (communityError) throw communityError;
      setCommunityData(community);

      const { data: techData, error: techError } = await supabase
        .from('technologies')
        .select('*')
        .eq('community_id', selectedCommunityId)
        .eq('is_active', true)
        .order('name');
      if (techError) throw techError;
      setTechnologies(techData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTechnology = (techId: number) => {
    setSelectedTechnologies(prev =>
      prev.includes(techId)
        ? prev.filter(id => id !== techId)
        : [...prev, techId]
    );
  };

const handleComplete = async () => {
  if (selectedTechnologies.length === 0) {
    alert('Please select at least one technology');
    return;
  }

  setSubmitting(true);
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('❌ Auth error:', authError);
      throw new Error('Authentication failed');
    }
    
    if (!user) {
      throw new Error('No user found - please sign in again');
    }

    console.log('🎯 Starting onboarding process...');
    console.log('👤 User:', user.id);
    console.log('🏘️ Community IDs:', selectedCommunityIds);
    console.log('💻 Selected Tech IDs:', selectedTechnologies);
    console.log('🔢 Technology Count:', selectedTechnologies.length);

    // This will insert into user_technologies table
    await userService.completeOnboarding(
      user.id,
      selectedCommunityIds,
      selectedTechnologies
    );

    console.log('✅ Onboarding successful! Navigating to main app...');
    
    // Add a small delay to ensure everything is saved
    setTimeout(() => {
      router.replace('/(main)');
    }, 500);
    
  } catch (error: any) {
    console.error('❌ Error completing onboarding:', error);
    
    // More specific error messages
    if (error.message?.includes('duplicate key')) {
      alert('Some technologies are already selected. Please try different ones.');
    } else if (error.message?.includes('auth')) {
      alert('Authentication error. Please sign in again.');
    } else {
      alert('There was an error completing your setup. Please try again.');
    }
  } finally {
    setSubmitting(false);
  }
};

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#5271FF" />
        <Text className="mt-4 text-gray-500 text-base">Loading technologies...</Text>
      </SafeAreaView>
    );
  }

  // Screen width for pill sizing
  const screenWidth = Dimensions.get('window').width;
  const pillWidth = (screenWidth - 64) / 4; // 4 per row

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        contentContainerStyle={{ 
          paddingHorizontal: 16, 
          paddingTop: 40, // header pushed down
          paddingBottom: 180, // space for bottom buttons
          alignItems: 'center'
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="items-center mb-8">
          <View className="w-20 h-20 bg-blue-100 rounded-2xl items-center justify-center mb-4">
            <Ionicons name="code-slash-outline" size={36} color="#5271FF" />
          </View>
          <Text className="text-3xl font-bold text-gray-900 mb-2 text-center">
            Choose Your Tech Stack
          </Text>
          <Text className="text-base text-gray-600 text-center">
            Select technologies from the <Text className="text-blue-600 font-semibold">{communityData?.name}</Text> community
          </Text>
        </View>

        {/* Technologies Grid */}
<View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginBottom: 16 }}>
  {technologies.map((tech) => {
    const isSelected = selectedTechnologies.includes(tech.tech_id);
    return (
      <TouchableOpacity
        key={tech.tech_id}
        onPress={() => toggleTechnology(tech.tech_id)}
        style={{
          minWidth: pillWidth, // width for 4 per row
          paddingVertical: 6,
          paddingHorizontal: 10,
          borderRadius: 25, // more rounded for pill look
          borderWidth: 2,
          borderColor: isSelected ? '#5271FF' : '#D1D5DB',
          backgroundColor: isSelected ? '#E0ECFF' : '#F9FAFB',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          margin: 6, // spacing between pills
        }}
      >
        {/* Optional icon inside pill */}
        <Ionicons 
          name="logo-react" // you can change dynamically per tech
          size={14} 
          color={isSelected ? '#1E3A8A' : '#374151'} 
          style={{ marginRight: 6 }} 
        />
        <Text style={{
          color: isSelected ? '#1E3A8A' : '#374151',
          fontWeight: '600',
          fontSize: 12,
          textAlign: 'center',
        }}>
          {tech.name}
        </Text>
      </TouchableOpacity>
    );
  })}
</View>

        {/* Selected Count */}
        {selectedTechnologies.length > 0 && (
          <View className="items-center mb-6">
            <View className="bg-blue-100 rounded-full px-4 py-2">
              <Text className="text-blue-800 font-medium text-sm">
                {selectedTechnologies.length} technology{selectedTechnologies.length !== 1 ? 's' : ''} selected
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom fixed buttons */}
<View className="px-4 pb-6 bg-white absolute w-full border-t border-gray-200" style={{ bottom: 20 }}>
  <TouchableOpacity
    onPress={handleComplete}
    disabled={selectedTechnologies.length === 0 || submitting}
    className={`w-full rounded-xl py-4 mb-2 ${selectedTechnologies.length === 0 || submitting ? 'bg-gray-300' : 'bg-blue-600'}`}
  >
    {submitting ? (
      <ActivityIndicator color="#ffffff" />
    ) : (
      <Text className="text-white text-center font-semibold text-base">
        {selectedTechnologies.length === 0
          ? 'Select Technologies'
          : `Complete Setup (${selectedTechnologies.length} selected)`
        }
      </Text>
    )}
  </TouchableOpacity>

  <TouchableOpacity 
    onPress={() => router.back()}
    className="py-3 items-center"
  >
    <Text className="text-gray-500 text-sm font-medium">
      Back to communities
    </Text>
  </TouchableOpacity>
</View>

    </SafeAreaView>
  );
}
