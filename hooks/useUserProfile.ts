import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { userService } from '../lib/userService';
import UserProfile from '../hooks/useUserProfile'


export const useUserProfile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const userProfile = await userService.getUserProfile(user.id);
          setProfile(userProfile);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const userProfile = await userService.getUserProfile(session.user.id);
          setProfile(userProfile);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const refreshProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const userProfile = await userService.getUserProfile(user.id);
      setProfile(userProfile);
    }
  };

  return { profile, loading, error, refreshProfile };
};