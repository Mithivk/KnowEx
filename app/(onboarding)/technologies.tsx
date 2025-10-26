import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { userService } from '../../lib/userService';

interface Technology {
  tech_id: number;
  name: string;
  category: string;
}

export default function TechnologySelection() {
  const { communities } = useLocalSearchParams();
  const [selectedTechnologies, setSelectedTechnologies] = useState<number[]>([]);
  const [technologies, setTechnologies] = useState<Technology[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const selectedCommunityIds = communities ? JSON.parse(communities as string) : [];

  useEffect(() => {
    fetchTechnologies();
  }, []);

  const fetchTechnologies = async () => {
    try {
      setLoading(true);
      const techData = await userService.getTechnologies();
      setTechnologies(techData);
    } catch (error) {
      console.error('Error fetching technologies:', error);
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
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('No user found');

      // Complete onboarding with selected communities and technologies
      await userService.completeOnboarding(
        user.id,
        selectedCommunityIds,
        selectedTechnologies
      );

      // Navigate to main app
      router.replace('/(main)');
      
    } catch (error: any) {
      console.error('Error completing onboarding:', error);
      alert('There was an error completing your setup. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Group technologies by category
  const technologiesByCategory = technologies.reduce((acc, tech) => {
    const category = tech.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(tech);
    return acc;
  }, {} as Record<string, Technology[]>);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#5271FF" />
        <Text className="mt-4 text-gray-500 text-base">Loading technologies...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 24,
          paddingVertical: 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress indicator */}
        <View className="flex-row justify-center mb-6">
          <View className="w-3 h-3 rounded-full bg-blue-500 mx-1" />
          <View className="w-3 h-3 rounded-full bg-blue-500 mx-1" />
        </View>

        {/* Header */}
        <View className="items-center mb-8">
          <Text className="text-2xl font-bold text-gray-900 mb-2 text-center">
            Select Your Technologies
          </Text>
          <Text className="text-base text-gray-600 text-center">
            Choose the technologies you work with or want to learn
          </Text>
        </View>

        {/* Technologies by Category */}
        <View className="flex-1 mb-8">
          {Object.entries(technologiesByCategory).map(([category, categoryTechs]) => (
            <View key={category} className="mb-6">
              <Text className="text-lg font-semibold text-gray-900 mb-3">
                {category}
              </Text>
              <View className="flex-row flex-wrap">
                {categoryTechs.map((tech) => {
                  const isSelected = selectedTechnologies.includes(tech.tech_id);
                  return (
                    <TouchableOpacity
                      key={tech.tech_id}
                      onPress={() => toggleTechnology(tech.tech_id)}
                      className={`mr-2 mb-2 px-4 py-2 rounded-full border ${
                        isSelected 
                          ? 'bg-blue-500 border-blue-500' 
                          : 'bg-gray-100 border-gray-200'
                      }`}
                    >
                      <Text className={`text-sm font-medium ${
                        isSelected ? 'text-white' : 'text-gray-700'
                      }`}>
                        {tech.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
        </View>

        {/* Complete Button */}
        <View className="mt-auto">
          <TouchableOpacity
            onPress={handleComplete}
            disabled={selectedTechnologies.length === 0 || submitting}
            className={`w-full rounded-xl py-4 mb-4 ${
              selectedTechnologies.length === 0 || submitting 
                ? 'bg-gray-300' 
                : 'bg-blue-600 shadow-lg'
            }`}
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
      </ScrollView>
    </SafeAreaView>
  );
}