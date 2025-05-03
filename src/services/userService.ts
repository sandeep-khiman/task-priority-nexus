
import { supabase } from '@/integrations/supabase/client';
import { User, UserRole } from '@/types/user';

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
      manager_id: profile.manager_id, // Include both formats
      createdAt: profile.created_at,
      updatedAt: profile.updated_at
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
      manager_id: data.manager_id, // Include both formats
      createdAt: data.created_at,
      updatedAt: data.updated_at
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
      manager_id: profile.manager_id, // Include both formats
      createdAt: profile.created_at,
      updatedAt: profile.updated_at
    })) || [];
  },

  // Update user role
  async updateUserRole(userId: string, role: UserRole): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId);

    if (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  },
  
  // Update user manager
  async updateUserManager(userId: string, managerId: string | null): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ manager_id: managerId })
      .eq('id', userId);

    if (error) {
      console.error('Error updating user manager:', error);
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
      manager_id: member.profiles.manager_id, // Include both formats
      createdAt: member.profiles.created_at,
      updatedAt: member.profiles.updated_at
    }));
  }
};
