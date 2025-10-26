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
// In userService.ts - update the completeOnboarding function
async completeOnboarding(
  userId: string, 
  communityIds: number[], 
  technologyIds: number[]
): Promise<void> {
  try {
    console.log('🚀 Starting onboarding completion...');
    console.log('📋 User ID:', userId);
    console.log('🏘️ Communities:', communityIds);
    console.log('💻 Technologies:', technologyIds);

    // Add user to selected communities
    if (communityIds.length > 0) {
      console.log('📝 Creating community memberships...');
      const communityMemberships = communityIds.map(communityId => ({
        user_id: userId,
        community_id: communityId,
        status: 'approved'
      }));

      const { error: communitiesError, data: communitiesData } = await supabase
        .from('community_members')
        .insert(communityMemberships)
        .select();

      if (communitiesError) {
        console.error('❌ Community members error:', communitiesError);
        throw communitiesError;
      }
      console.log('✅ Community memberships created:', communitiesData);
    }

    // Add user technologies
    if (technologyIds.length > 0) {
      console.log('💾 Inserting into user_technologies...');
      const userTechnologies = technologyIds.map(techId => ({
        user_id: userId,
        tech_id: techId
      }));

      console.log('📦 User technologies to insert:', userTechnologies);

      const { error: techError, data: techData } = await supabase
        .from('user_technologies')
        .insert(userTechnologies)
        .select();

      if (techError) {
        console.error('❌ User technologies error:', techError);
        throw techError;
      }
      console.log('✅ User technologies inserted:', techData);
    } else {
      console.log('⚠️ No technologies selected for insertion');
    }

    // Mark user as onboarded
    console.log('🎯 Marking user as onboarded...');
    const { error: updateError, data: updateData } = await supabase
      .from('users')
      .update({
        onboarded: true,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select();

    if (updateError) {
      console.error('❌ User update error:', updateError);
      throw updateError;
    }
    console.log('✅ User marked as onboarded:', updateData);

    console.log('🎉 Onboarding completed successfully!');

  } catch (error) {
    console.error('❌ Error in completeOnboarding:', error);
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