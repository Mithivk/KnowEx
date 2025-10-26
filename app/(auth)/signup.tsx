import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, Image } from "react-native";
import * as ImagePicker from 'expo-image-picker';
import { supabase } from "../../lib/supabase";
import { useRouter } from "expo-router";
import { userService } from "../../lib/userService";
import { Ionicons } from '@expo/vector-icons';

export default function Signup() {
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameChecking, setUsernameChecking] = useState(false);
  const router = useRouter();

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'We need camera roll permissions to upload profile images.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const uploadImage = async (userId: string): Promise<string | null> => {
    if (!profileImage) return null;
    try {
      setUploading(true);
      const fileExt = profileImage.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${userId}/avatar.${fileExt}`;
      const formData = new FormData();
      formData.append('file', {
        uri: profileImage,
        name: fileName,
        type: `image/${fileExt}`,
      } as any);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No authentication session');
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/avatars/${fileName}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'multipart/form-data',
          },
          body: formData,
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Upload failed: ${response.status}`);
      }
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Upload Error', 'Failed to upload profile image. Your account will be created without a profile picture.');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSignup = async () => {
    const { fullName, username, email, password, confirmPassword } = formData;
    if (!fullName || !username || !email || !password || !confirmPassword) {
      return Alert.alert("Error", "Please fill in all fields");
    }
    if (password !== confirmPassword) return Alert.alert("Error", "Passwords do not match");
    if (password.length < 6) return Alert.alert("Error", "Password must be at least 6 characters");
    if (username.length < 3) return Alert.alert("Error", "Username must be at least 3 characters");

    const isAvailable = await userService.checkUsernameAvailability(username);
    if (!isAvailable) return Alert.alert("Error", "Username is already taken. Please choose another one.");

    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: { data: { full_name: fullName } }
      });
      if (authError) throw authError;
      if (authData.user) {
        let profileImageUrl = null;
        if (profileImage) profileImageUrl = await uploadImage(authData.user.id);
        await userService.createUserProfile(
          authData.user.id,
          email.trim().toLowerCase(),
          fullName,
          username,
          profileImageUrl
        );
        router.replace('/(onboarding)/domains');
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      Alert.alert("Signup Failed", error.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const checkUsername = async (username: string) => {
    if (username.length < 3) { setUsernameAvailable(null); return; }
    setUsernameChecking(true);
    try {
      const isAvailable = await userService.checkUsernameAvailability(username);
      setUsernameAvailable(isAvailable);
    } catch (error) { console.error('Error checking username:', error); }
    finally { setUsernameChecking(false); }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'username') checkUsername(value);
  };

  const getUsernameStatusColor = () => {
    if (usernameChecking) return 'text-blue-500';
    if (usernameAvailable === null) return 'text-gray-500';
    return usernameAvailable ? 'text-green-600' : 'text-red-600';
  };

  const getUsernameStatusText = () => {
    if (usernameChecking) return 'Checking availability...';
    if (usernameAvailable === null) return 'Enter a username (min 3 chars)';
    return usernameAvailable ? 'Username is available' : 'Username is taken';
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 30 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="w-full">
            {/* Header */}
            <View className="items-center mb-8">
              <TouchableOpacity onPress={pickImage} disabled={uploading || loading} className="relative mb-4">
                <View className="w-24 h-24 bg-blue-100 rounded-full items-center justify-center border-2 border-blue-200 overflow-hidden">
                  {profileImage ? (
                    <Image source={{ uri: profileImage }} className="w-full h-full rounded-full" />
                  ) : (
                    <Ionicons name="person-outline" size={40} color="#3B82F6" />
                  )}
                  <View className="absolute bottom-0 right-0 bg-blue-500 w-8 h-8 rounded-full items-center justify-center border-2 border-white">
                    <Ionicons name={uploading ? "cloud-upload-outline" : "camera-outline"} size={16} color="white" />
                  </View>
                </View>
              </TouchableOpacity>
              <Text className="text-2xl font-bold text-gray-900 mb-2 text-center">Join KnowEx</Text>
              <Text className="text-base text-gray-600 text-center">Create your account and start exchanging knowledge</Text>
              <Text className="text-xs text-gray-500 mt-1">{profileImage ? 'Tap to change photo' : 'Tap to add profile photo (optional)'}</Text>
            </View>

            {/* Form Section */}
            <View className="space-y-4 mb-6">
              {['fullName', 'username', 'email', 'password', 'confirmPassword'].map((field) => {
                const labels: Record<string, string> = {
                  fullName: "Full Name", username: "Username", email: "Email",
                  password: "Password", confirmPassword: "Confirm Password"
                };
                const placeholders: Record<string, string> = {
                  fullName: "Enter your full name", username: "Choose a username", email: "Enter your email",
                  password: "Create a password", confirmPassword: "Confirm your password"
                };
                const secure = field.includes('password');
                return (
                  <View key={field}>
                    <Text className="text-sm font-medium text-gray-700 mb-2">{labels[field]}</Text>
                    <TextInput
                      placeholder={placeholders[field]}
                      placeholderTextColor="#9CA3AF"
                      value={formData[field as keyof typeof formData]}
                      onChangeText={(value) => updateFormData(field, value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-base"
                      editable={!loading}
                      secureTextEntry={secure}
                      autoCapitalize={field === 'username' || field.includes('email') ? 'none' : 'sentences'}
                      keyboardType={field === 'email' ? 'email-address' : 'default'}
                    />
                    {field === 'username' && (
                      <Text className={`text-xs mt-1 ${getUsernameStatusColor()}`}>{getUsernameStatusText()}</Text>
                    )}
                    {field === 'password' && <Text className="text-xs text-gray-500 mt-1">Must be at least 6 characters</Text>}
                  </View>
                )
              })}
            </View>

            {/* Terms */}
            <View className="mb-6">
              <Text className="text-xs text-gray-600 text-center leading-4">
                By creating an account, you agree to our{" "}
                <Text className="text-blue-600">Terms of Service</Text> and{" "}
                <Text className="text-blue-600">Privacy Policy</Text>
              </Text>
            </View>

            {/* Sign Up Button */}
            <TouchableOpacity
              onPress={handleSignup}
              disabled={loading || uploading || usernameChecking || usernameAvailable === false}
              className={`w-full rounded-xl py-4 mb-6 ${loading || uploading || usernameChecking || usernameAvailable === false ? 'bg-blue-400' : 'bg-blue-600'} shadow-lg`}
            >
              {loading || uploading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-white text-center font-semibold text-lg">Create Account</Text>
              )}
            </TouchableOpacity>

            {/* Login Redirect */}
            <View className="flex-row justify-center">
              <Text className="text-gray-600 text-sm">Already have an account? </Text>
              <TouchableOpacity onPress={() => router.replace("/(auth)/login")} disabled={loading}>
                <Text className="text-blue-600 font-medium text-sm">Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
