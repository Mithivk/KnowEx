import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { userService } from '../lib/userService';
import { Session } from '@supabase/supabase-js';
import { ActivityIndicator, View } from 'react-native';
import '../global.css';

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        
        // Determine initial route based on auth state
        if (!session) {
          setInitialRoute('/(auth)/login');
        } else {
          // Check both auth metadata and database for onboarding status
          const authMetadataOnboarded = session.user?.user_metadata?.onboarded;
          
          if (authMetadataOnboarded === true) {
            // User is onboarded according to auth metadata
            setInitialRoute('/(main)/home');
          } else {
            // Check database for more accurate onboarding status
            try {
              const profile = await userService.getUserProfile(session.user.id);
              
              if (profile?.onboarded) {
                // User is onboarded in database
                setInitialRoute('/(main)');
              } else {
                // User needs onboarding
                setInitialRoute('/(onboarding)/domains');
              }
            } catch (error) {
              console.log('Error fetching user profile, using auth metadata:', error);
              // Fallback to auth metadata if database query fails
              const needsOnboarding = authMetadataOnboarded === false || 
                                    authMetadataOnboarded === undefined;
              setInitialRoute(needsOnboarding ? '/(onboarding)/domains' : '/(main)');
            }
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setInitialRoute('/(auth)/login');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      
      // Handle auth state changes
      if (event === 'SIGNED_IN') {
        // New sign in - check onboarding status
        if (session?.user) {
          try {
            const profile = await userService.getUserProfile(session.user.id);
            const needsOnboarding = !profile?.onboarded;
            
            if (needsOnboarding) {
              router.replace('/(onboarding)/domains');
            } else {
              router.replace('/(main)/home');
            }
          } catch (error) {
            console.log('Error checking onboarding on sign in:', error);
            router.replace('/(onboarding)/domains');
          }
        }
      } else if (event === 'SIGNED_OUT') {
        router.replace('/(auth)/login');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!loading && initialRoute && router) {
      console.log('Navigating to:', initialRoute);
      router.replace(initialRoute);
    }
  }, [loading, initialRoute, router]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
      <Stack.Screen name="(main)" options={{ headerShown: false }} />
    </Stack>
  );
}