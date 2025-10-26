import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.EXPO_PUBLIC_SUPABASE_KEY!; // Use service role key for admin operations
console.log(supabaseUrl,supabaseServiceKey);

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAdminUser() {
  try {
    console.log('🚀 Creating admin user...');

    // Step 1: Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'admin@knowex.com',
      password: 'admin123',
      email_confirm: true,
      user_metadata: {
        full_name: 'System Administrator'
      }
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log('ℹ️ User already exists, fetching user...');
        const { data: { users } } = await supabase.auth.admin.listUsers();
        const existingUser = users.find(user => user.email === 'admin@knowex.com');
        if (existingUser) {
          await createAdminProfile(existingUser.id);
          return;
        }
      }
      throw authError;
    }

    if (authData.user) {
      await createAdminProfile(authData.user.id);
    }

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@knowex.com');
    console.log('🔑 Password: admin123');

  } catch (error: any) {
    console.error('❌ Error creating admin user:', error.message);
  }
}

async function createAdminProfile(userId: string) {
  try {
    // Step 2: Create user profile
    const { error: profileError } = await supabase
      .from('users')
      .upsert({
        user_id: userId,
        email: 'admin@knowex.com',
        full_name: 'System Administrator',
        username: 'superadmin',
        is_admin: true,
        onboarded: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (profileError) throw profileError;

    // Step 3: Create admin credentials
    const passwordHash = await bcrypt.hash('admin123', 12);
    
    const { error: adminError } = await supabase
      .from('admin_credentials')
      .upsert({
        username: 'superadmin',
        password_hash: passwordHash,
        user_id: userId,
        is_active: true,
        created_at: new Date().toISOString()
      });

    if (adminError) throw adminError;

    // Step 4: Get super_admin role and assign it
    const { data: role, error: roleError } = await supabase
      .from('admin_roles')
      .select('role_id')
      .eq('role_name', 'super_admin')
      .single();

    if (roleError) throw roleError;

    const { error: assignError } = await supabase
      .from('admin_user_roles')
      .upsert({
        admin_id: (await supabase
          .from('admin_credentials')
          .select('admin_id')
          .eq('user_id', userId)
          .single()).data?.admin_id,
        role_id: role.role_id
      });

    if (assignError) throw assignError;

    console.log('✅ Admin profile and credentials created!');

  } catch (error: any) {
    console.error('❌ Error creating admin profile:', error.message);
  }
}

// Run the script
createAdminUser();