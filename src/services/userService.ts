import { supabase } from '@/integrations/supabase/client';
import { User, UserRole, ProfileData } from '@/types/user';

export const userService = {
  // Get all users
  async getUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching users:', error);
      throw error;
    }

    return data.map(profile => ({
      id: profile.id,
      email: profile.email,
      name: profile.name,
      role: profile.role as UserRole,
      managerId: profile.manager_id,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
      avatar_url: profile.avatar_url
    })) || [];
  },

  // Get user by ID
  async getUserById(userId: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      return null;
    }

    if (!data) return null;

    return {
      id: data.id,
      email: data.email,
      name: data.name,
      role: data.role as UserRole,
      managerId: data.manager_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      avatar_url: data.avatar_url
    };
  },

  // Get users by role
  async getUsersByRole(role: UserRole): Promise<User[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', role)
      .order('name');

    if (error) {
      console.error('Error fetching users by role:', error);
      throw error;
    }

    return data.map(profile => ({
      id: profile.id,
      email: profile.email,
      name: profile.name,
      role: profile.role as UserRole,
      managerId: profile.manager_id,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
      avatar_url: profile.avatar_url
    })) || [];
  },

  // Update user role - Using Edge Function to bypass RLS
  async updateUserRole(userId: string, role: UserRole): Promise<void> {
    console.log(`Updating user ${userId} role to ${role}`);
    
    try {
      // Call the edge function to update the user role
      const { error: rpcError } = await supabase.functions.invoke('update-user-role', {
        body: { user_id: userId, new_role: role }
      });
      
      if (rpcError) {
        console.error('Error updating user role via Edge Function:', rpcError);
        throw rpcError;
      }
    } catch (error) {
      console.error('Failed to update user role:', error);
      throw error;
    }
  },
  
  // Update user manager - Using Edge Function to bypass RLS
  async updateUserManager(userId: string, managerId: string | null): Promise<void> {
    console.log(`Updating user ${userId} manager to ${managerId}`);
    
    try {
      // Call the edge function to update the user manager
      const { error: rpcError } = await supabase.functions.invoke('update-user-manager', {
        body: { user_id: userId, manager_id: managerId }
      });
      
      if (rpcError) {
        console.error('Error updating user manager via Edge Function:', rpcError);
        throw rpcError;
      }
    } catch (error) {
      console.error('Failed to update user manager:', error);
      throw error;
    }
  },

  // Get team members for a specific team lead
  async getTeamMembersByLeadId(leadId: string): Promise<User[]> {
    // First get the teams where this user is a lead
    const { data: teamData, error: teamError } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', leadId)
      .eq('is_lead', true);

    if (teamError) {
      console.error('Error fetching team for lead:', teamError);
      throw teamError;
    }

    if (!teamData || teamData.length === 0) {
      return [];
    }

    const teamIds = teamData.map(t => t.team_id);
    
    // Then get all members of those teams who are not the lead
    const { data: memberData, error: memberError } = await supabase
      .from('team_members')
      .select(`
        user_id,
        profiles:user_id (*)
      `)
      .in('team_id', teamIds)
      .neq('user_id', leadId);

    if (memberError) {
      console.error('Error fetching team members:', memberError);
      throw memberError;
    }

    return (memberData || []).map(member => ({
      id: member.profiles.id,
      email: member.profiles.email,
      name: member.profiles.name,
      role: member.profiles.role as UserRole,
      managerId: member.profiles.manager_id,
      createdAt: member.profiles.created_at,
      updatedAt: member.profiles.updated_at,
      avatar_url: member.profiles.avatar_url
    }));
  },

  // Get all teams a user belongs to
  async getUserTeams(userId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching user teams:', error);
      throw error;
    }

    return data.map(item => item.team_id);
  },

  // Update user profile (except role)
  async updateUserProfile(userId: string, profile: Partial<User>): Promise<void> {
    // Make sure we're not updating the role (that should go through updateUserRole)
    const { role, ...updateData } = profile;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          name: updateData.name,
          email: updateData.email,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (error) {
        console.error('Error updating user profile:', error);
        throw error;
      }
    } catch (error) {
      console.error('Failed to update user profile:', error);
      throw error;
    }
  },

  // Check if user is under manager's supervision
  async isUserUnderManager(userId: string, managerId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('profiles')
      .select('manager_id')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error checking manager relationship:', error);
      return false;
    }

    return data?.manager_id === managerId;
  },

  // Update user avatar URL
  async updateUserAvatar(userId: string, avatar_url: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: avatar_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (error) {
        console.error('Error updating user avatar:', error);
        throw error;
      }
    } catch (error) {
      console.error('Failed to update user avatar:', error);
      throw error;
    }
  }
};
