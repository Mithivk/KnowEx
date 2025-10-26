import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { supabase } from "../../lib/supabase";
import { useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      return Alert.alert("Error", "Please enter email and password");
    }

    setLoading(true);

    try {
      if (isAdminLogin) {
        // Redirect to admin login page
        router.push({
          pathname: "/(auth)/admin-login",
          params: { username: email }
        });
      } else {
        // Regular user login
        const { error } = await supabase.auth.signInWithPassword({ 
          email: email.trim().toLowerCase(), 
          password 
        });
        
        if (error) {
          Alert.alert("Login Failed", error.message);
        } else {
          // Success - app will redirect based on authentication state
        }
      }
    } catch (error: any) {
      Alert.alert("Login Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    Alert.alert("Forgot Password", "Password reset feature coming soon!");
  };

  const handleSignUp = () => {
    router.push("/(auth)/signup");
  };

  const handleAdminLogin = () => {
    router.push("/(auth)/admin-login");
  };

  const handleGoogleLogin = async () => {
    Alert.alert("Google Login", "Google authentication coming soon!");
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{ 
            flexGrow: 1, 
            justifyContent: 'center',
            paddingHorizontal: 24 
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo Section */}
          <View className="items-center mb-10">
            <View className="w-32 h-32 bg-blue-100 rounded-full items-center justify-center mb-4 shadow-lg">
              <Text className="text-4xl font-bold text-blue-600">KE</Text>
            </View>
            <Text className="text-3xl font-bold text-gray-900 mb-2">KnowEx</Text>
            <Text className="text-lg text-gray-600">Your Knowledge Exchange</Text>
          </View>

          {/* Form Section */}
          <View className="mb-6">
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                {isAdminLogin ? 'Admin Username' : 'Email'}
              </Text>
              <TextInput
                placeholder={isAdminLogin ? "Enter admin username" : "Enter your email"}
                placeholderTextColor="#9CA3AF"
                keyboardType={isAdminLogin ? "default" : "email-address"}
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-gray-900 text-base"
                editable={!loading}
              />
            </View>

            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">Password</Text>
              <TextInput
                placeholder="Enter your password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
                autoCapitalize="none"
                value={password}
                onChangeText={setPassword}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-gray-900 text-base"
                editable={!loading}
              />
            </View>

            <TouchableOpacity 
              onPress={handleForgotPassword}
              className="self-end mb-6"
              disabled={loading}
            >
              <Text className="text-blue-600 font-medium text-sm">Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              className={`w-full rounded-xl py-4 mb-4 ${
                loading ? 'bg-blue-400' : 'bg-blue-600'
              } shadow-lg`}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-white text-center font-semibold text-lg">
                  {isAdminLogin ? 'Admin Sign In' : 'Sign In'}
                </Text>
              )}
            </TouchableOpacity>

            {/* Direct Admin Login Button */}
            {!isAdminLogin && (
              <TouchableOpacity
                onPress={handleAdminLogin}
                className="w-full border border-blue-600 rounded-xl py-4 mb-6"
              >
                <Text className="text-blue-600 text-center font-semibold text-lg">
                  Admin Portal
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View className="flex-row justify-center mb-8">
            <Text className="text-gray-600 text-sm">Don't have an account? </Text>
            <TouchableOpacity onPress={handleSignUp}>
              <Text className="text-blue-600 font-medium text-sm">Sign Up</Text>
            </TouchableOpacity>
          </View>

          {/* Social Login Buttons */}
          <View className="space-y-4">
            <TouchableOpacity
              onPress={handleGoogleLogin}
              className="flex-row items-center justify-center border border-gray-300 rounded-xl py-4 bg-white shadow-sm"
            >
              <Text className="text-gray-700 font-medium text-base">Continue with Google</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}