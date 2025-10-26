import { supabase } from './supabase';
import bcrypt from 'bcryptjs';

export const adminService = {
  // Hash password
  hashPassword: async (password: string): Promise<string> => {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  },

  // Verify password
  verifyPassword: async (password: string, hash: string): Promise<boolean> => {
    return await bcrypt.compare(password, hash);
  },

  // Admin login
  adminLogin: async (username: string, password: string) => {
    try {
      // Get admin credentials
      const { data: admin, error } = await supabase
        .from('admin_credentials')
        .select(`
          *,
          user_id,
          admin_user_roles (
            admin_roles (role_name, permissions)
          )
        `)
        .eq('username', username.toLowerCase())
        .eq('is_active', true)
        .single();

      if (error || !admin) {
        throw new Error('Invalid admin credentials');
      }

      // Verify password
      const isValidPassword = await adminService.verifyPassword(password, admin.password_hash);
      if (!isValidPassword) {
        throw new Error('Invalid admin credentials');
      }

      // Update last login
      await supabase
        .from('admin_credentials')
        .update({ last_login: new Date().toISOString() })
        .eq('admin_id', admin.admin_id);

      // Get user data
      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', admin.user_id)
        .single();

      if (!user) {
        throw new Error('User not found');
      }

      // Combine admin and user data
      const roles = admin.admin_user_roles.map((ur: any) => ({
        role_name: ur.admin_roles.role_name,
        permissions: ur.admin_roles.permissions
      }));

      return {
        admin: {
          admin_id: admin.admin_id,
          username: admin.username,
          roles,
          permissions: roles.reduce((acc: any, role: any) => {
            Object.keys(role.permissions).forEach(key => {
              if (!acc[key]) acc[key] = [];
              acc[key] = [...new Set([...acc[key], ...role.permissions[key]])];
            });
            return acc;
          }, {})
        },
        user: {
          ...user,
          is_admin: true
        }
      };
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  // Create new admin user
  createAdmin: async (user_id: string, username: string, password: string, roleNames: string[] = ['moderator']) => {
    try {
      // Check if username already exists
      const { data: existingAdmin } = await supabase
        .from('admin_credentials')
        .select('admin_id')
        .eq('username', username.toLowerCase())
        .single();

      if (existingAdmin) {
        throw new Error('Admin username already exists');
      }

      // Hash password
      const passwordHash = await adminService.hashPassword(password);

      // Create admin credentials
      const { data: admin, error: adminError } = await supabase
        .from('admin_credentials')
        .insert({
          username: username.toLowerCase(),
          password_hash: passwordHash,
          user_id: user_id
        })
        .select()
        .single();

      if (adminError) throw adminError;

      // Get role IDs
      const { data: roles } = await supabase
        .from('admin_roles')
        .select('role_id, role_name')
        .in('role_name', roleNames);

      if (!roles || roles.length === 0) {
        throw new Error('Invalid roles specified');
      }

      // Assign roles
      const roleAssignments = roles.map(role => ({
        admin_id: admin.admin_id,
        role_id: role.role_id
      }));

      const { error: roleError } = await supabase
        .from('admin_user_roles')
        .insert(roleAssignments);

      if (roleError) throw roleError;

      // Update user as admin
      await supabase
        .from('users')
        .update({ is_admin: true })
        .eq('user_id', user_id);

      return admin;
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  // Check if user is admin
  isUserAdmin: async (user_id: string): Promise<boolean> => {
    const { data } = await supabase
      .from('admin_credentials')
      .select('admin_id')
      .eq('user_id', user_id)
      .eq('is_active', true)
      .single();

    return !!data;
  },

  // Get admin permissions
  getAdminPermissions: async (admin_id: number) => {
    const { data } = await supabase
      .from('admin_user_roles')
      .select(`
        admin_roles (role_name, permissions)
      `)
      .eq('admin_id', admin_id);

    if (!data) return null;

    return data.reduce((acc: any, item: any) => {
      const role = item.admin_roles;
      Object.keys(role.permissions).forEach(key => {
        if (!acc[key]) acc[key] = [];
        acc[key] = [...new Set([...acc[key], ...role.permissions[key]])];
      });
      return acc;
    }, {});
  }
};