import { supabase } from './supabase';

export interface User {
  user_id: string;
  username: string;
  email: string;
  profile_image_url?: string;
  is_active: boolean;
  onboarded: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  user_id: string;
  full_name?: string;
}

export const userService = {
  // ==================== AUTH & ONBOARDING ====================
  
  /**
   * Create user profile after signup
   */
  async createUserProfile(
    userId: string, 
    email: string, 
    fullName: string, 
    username?: string, 
    profileImageUrl?: string
  ): Promise<User> {
    try {
      // Generate username from email if not provided
      const generatedUsername = username || this.generateUsername(email);
      
      // Create user in users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert({
          user_id: userId,
          email: email.toLowerCase().trim(),
          username: generatedUsername,
          profile_image_url: profileImageUrl,
          onboarded: false,
          is_active: true
        })
        .select()
        .single();

      if (userError) {
        if (userError.code === '23505') { // Unique violation
          // Retry with different username
          return this.createUserProfile(
            userId, 
            email, 
            fullName, 
            this.generateUsername(email),
            profileImageUrl
          );
        }
        throw userError;
      }

      // Create user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: userId,
          full_name: fullName
        });

      if (profileError) throw profileError;

      return userData;
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  },

  /**
   * Complete user onboarding with communities and technologies
   */
  async completeOnboarding(
    userId: string, 
    communityIds: number[], 
    technologyIds: number[]
  ): Promise<void> {
    try {
      // Add user to selected communities
      if (communityIds.length > 0) {
        const communityMemberships = communityIds.map(communityId => ({
          user_id: userId,
          community_id: communityId,
          status: 'approved'
        }));

        const { error: communitiesError } = await supabase
          .from('community_members')
          .insert(communityMemberships);

        if (communitiesError) throw communitiesError;
      }

      // Add user technologies
      if (technologyIds.length > 0) {
        const userTechnologies = technologyIds.map(techId => ({
          user_id: userId,
          tech_id: techId
        }));

        const { error: techError } = await supabase
          .from('user_technologies')
          .insert(userTechnologies);

        if (techError) throw techError;
      }

      // Mark user as onboarded
      const { error: updateError } = await supabase
        .from('users')
        .update({
          onboarded: true,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (updateError) throw updateError;

    } catch (error) {
      console.error('Error completing onboarding:', error);
      throw error;
    }
  },

  /**
   * Get user profile for main app
   */
  async getUserProfile(userId: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  },

  // ==================== UTILITY METHODS ====================

  /**
   * Check if username is available
   */
  async checkUsernameAvailability(username: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('username')
        .eq('username', username)
        .single();

      return !data; // Returns true if username is available (no user found)
    } catch (error: any) {
      if (error.code === 'PGRST116') { // No rows returned
        return true;
      }
      console.error('Error checking username availability:', error);
      throw error;
    }
  },

  /**
   * Get all available technologies
   */
  async getTechnologies(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('technologies')
        .select('*')
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching technologies:', error);
      throw error;
    }
  },

};