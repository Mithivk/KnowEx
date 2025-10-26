import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, Image } from "react-native";
import { supabase } from "../lib/supabase";
import { useRouter } from "expo-router";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    console.log("Login button pressed");
    if (!email || !password) return Alert.alert("Error", "Please enter email and password");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) Alert.alert("Login Failed", error.message);
    else router.replace("/(auth)/login");
  };

  const handleForgotPassword = () => {
    console.log("Forgot password pressed");
    Alert.alert("Forgot Password", "Password reset feature coming soon!");
  };

  const handleSignUp = () => {
    console.log("Sign up pressed");
    router.push("/signup");
  };

  const handleGoogleLogin = async () => {
    console.log("Google login pressed");
    Alert.alert("Google Login", "Google authentication coming soon!");
  };

  const handleLinkedInLogin = () => {
    console.log("LinkedIn login pressed");
    Alert.alert("LinkedIn Login", "LinkedIn authentication coming soon!");
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          className="px-6 justify-center"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo Section */}
          <View className="items-center mb-10">
            <View className="w-32 h-32 bg-blue-100 rounded-full items-center justify-center mb-4 shadow-lg">
              <Text className="text-4xl font-bold text-blue-600">KE</Text>
            </View>
            <Text className="text-3xl font-bold text-gray-900 mb-2">KnowEx</Text>
            <Text className="text-lg text-gray-600">Your Knowledge Exchangedfrtf</Text>

            // Add this temporary text to verify changes
<Text className="text-red-500 text-xl font-bold">UPDATED VERSION - {new Date().toLocaleTimeString()}</Text>
          </View>

          {/* Form Section */}
          <View className="mb-6">
            {/* Email Input */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">Email</Text>
              <TextInput
                placeholder="Enter your email"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-gray-900 text-base"
                editable={!loading}
              />
            </View>

            {/* Password Input */}
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

            {/* Forgot Password */}
            <TouchableOpacity 
              onPress={handleForgotPassword}
              className="self-end mb-6"
              disabled={loading}
              activeOpacity={0.7}
            >
              <Text className="text-blue-600 font-medium text-sm">Forgot Password?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              className={`w-full rounded-xl py-4 mb-6 ${
                loading ? 'bg-blue-400' : 'bg-blue-600'
              } shadow-lg`}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-white text-center font-semibold text-lg">Sign In</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Sign Up Link */}
          <View className="flex-row justify-center mb-8">
            <Text className="text-gray-600 text-sm">Don't have an account? </Text>
            <TouchableOpacity 
              onPress={handleSignUp}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Text className="text-blue-600 font-medium text-sm">Sign Up</Text>
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View className="flex-row items-center mb-8">
            <View className="flex-1 h-px bg-gray-200" />
            <Text className="mx-4 text-gray-500 text-sm">Or continue with</Text>
            <View className="flex-1 h-px bg-gray-200" />
          </View>

          {/* Social Login Buttons */}
          <View className="space-y-4 mb-8">
            {/* Google Button */}
            <TouchableOpacity
              onPress={handleGoogleLogin}
              disabled={loading}
              className="flex-row items-center justify-center border border-gray-300 rounded-xl py-4 bg-white shadow-sm"
              activeOpacity={0.7}
            >
              <Image 
                source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCSh_uvRv6KQBXIPnz0mjco2u4CJtzS41r2ALvXFufOvlrXccnN7mXPrdIgPtk3c5CfrfIkCQLWkvaSi9aUH-COo3LDNG72BUiUvRtaIH3ECKP6pc7BStRmxrSckHI18Fx02Fobe-yf1SM_A5xgzyGybEGfMS1aEcOE_5hTt3v2hzJ6TFhp1zm2V4bErI4qu95p4QL599pMjQxpWB6LNx94Hdivayev_vQ7uyRlOK-TjBVJ3U-WuQUR60pk0Z6HEo_MZPgOLNlTePA' }}
                className="w-5 h-5 mr-3"
              />
              <Text className="text-gray-700 font-medium text-base">Continue with Google</Text>
            </TouchableOpacity>

            {/* LinkedIn Button */}
            <TouchableOpacity
              onPress={handleLinkedInLogin}
              disabled={loading}
              className="flex-row items-center justify-center border border-gray-300 rounded-xl py-4 bg-white shadow-sm"
              activeOpacity={0.7}
            >
              <Image 
                source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDughGEacDYxGwXqJEcvVXEXjczOUfa4vVOsaWpdJ9blmVyqSQJp85JuDYD4P90TyDRmAFGncFp6lR9oPrKFp0d07NiUSKHTPXMoa-FVqQ4MySxm0NbFNYzxEybJYDSbEi2g7-JPFynU5mAb6uLB6I1PS_kklkIAXQpLnQFWsz2Fwx7g8ks-tnrUK7atGA8Pr5HOuk7EpjXR3ZkiR4GQz5qhDh5h2vlARAxFUqkhrWLzlg6GXOuK-HDjiiwQbR7nHLo-Y_y2VbkjkA' }}
                className="w-5 h-5 mr-3"
              />
              <Text className="text-gray-700 font-medium text-base">Continue with LinkedIn</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}