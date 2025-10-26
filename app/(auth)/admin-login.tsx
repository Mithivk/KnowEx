import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import { adminService } from "../../lib/adminService";
import { supabase } from "../../lib/supabase";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    if (params.username) {
      setUsername(params.username as string);
    }
  }, [params.username]);

  const handleAdminLogin = async () => {
    if (!username || !password) {
      return Alert.alert("Error", "Please enter admin username and password");
    }

    setLoading(true);

    try {
      const adminData = await adminService.adminLogin(username, password);
        console.log(adminData);
        
      // Store admin session data
      await supabase.storage.from('sessions').upload(
        `admin_${adminData.admin.admin_id}.json`,
        JSON.stringify({
          ...adminData,
          login_time: new Date().toISOString()
        })
      );

      Alert.alert("Success", `Welcome back, ${adminData.admin.username}!`);

      router.replace("/(admin)/home");
    } catch (error: any) {
      Alert.alert("Admin Login Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
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
          {/* Header */}
          <View className="items-center mb-10">
            <TouchableOpacity
              onPress={handleBack}
              className="self-start mb-6 p-2 -ml-2"
            >
              <Ionicons name="arrow-back" size={28} color="#374151" />
            </TouchableOpacity>

            <View className="w-32 h-32 bg-red-100 rounded-full items-center justify-center mb-4 shadow-lg">
              <Ionicons name="shield-checkmark-outline" size={40} color="#DC2626" />
            </View>
            <Text className="text-3xl font-bold text-gray-900 mb-2">Admin Portal</Text>
            <Text className="text-lg text-gray-600">Secure Administrator Access</Text>
          </View>

          {/* Security Notice */}
          <View className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
            <View className="flex-row items-start">
              <Ionicons name="warning-outline" size={20} color="#D97706" className="mt-0.5 mr-3" />
              <Text className="text-yellow-800 text-sm flex-1">
                This area is restricted to authorized personnel only. Unauthorized access is prohibited.
              </Text>
            </View>
          </View>

          {/* Form Section */}
          <View className="mb-6">
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">Admin Username</Text>
              <TextInput
                placeholder="Enter admin username"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                value={username}
                onChangeText={setUsername}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-gray-900 text-base"
                editable={!loading}
              />
            </View>

            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">Password</Text>
              <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4">
                <TextInput
                  placeholder="Enter admin password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  value={password}
                  onChangeText={setPassword}
                  className="flex-1 py-4 text-gray-900 text-base"
                  editable={!loading}
                />
                <TouchableOpacity 
                  onPress={() => setShowPassword(!showPassword)}
                  className="p-2"
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#6B7280"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Login Button - Updated to match regular login style */}
            <TouchableOpacity
              onPress={handleAdminLogin}
              disabled={loading || !username || !password}
              className={`w-full rounded-xl py-4 mb-4 ${
                loading || !username || !password ? 'bg-blue-400' : 'bg-blue-600'
              } shadow-lg`}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-white text-center font-semibold text-lg">
                  Admin Sign In
                </Text>
              )}
            </TouchableOpacity>

            {/* Back to Regular Login Button */}
            <TouchableOpacity
              onPress={handleBack}
              className="w-full border border-blue-600 rounded-xl py-4 mb-6"
            >
              <Text className="text-blue-600 text-center font-semibold text-lg">
                Back to User Login
              </Text>
            </TouchableOpacity>
          </View>

          {/* Support Contact */}
          <View className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <Text className="text-blue-800 text-sm text-center">
              Need help? Contact system administrator at admin@knowex.com
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}