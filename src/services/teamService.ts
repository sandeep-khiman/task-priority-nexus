import { supabase } from '@/integrations/supabase/client';
import { Team, CreateTeamPayload, EditTeamPayload, User } from '@/types/user';

export const teamService = {
  // Fetch all teams the current user has access to
  async getTeams(): Promise<Team[]> {
    const { data, error } = await supabase
      .from('teams')
      .select(`
        id,
        name,
        manager_id,
        created_at,
        updated_at
      `)
      .order('name');

    if (error) {
      console.error('Error fetching teams:', error);
      throw error;
    }

    // Process the teams to match the expected Team structure
    const teams: Team[] = [];
    for (const teamData of data || []) {
      // For each team, find its lead and members
      const { data: memberData, error: memberError } = await supabase
        .from('team_members')
        .select(`
          user_id,
          is_lead
        `)
        .eq('team_id', teamData.id);

      if (memberError) {
        console.error('Error fetching team members:', memberError);
        continue;
      }

      const leadId = memberData?.find(m => m.is_lead)?.user_id;
      const memberIds = memberData?.filter(m => !m.is_lead).map(m => m.user_id) || [];

      teams.push({
        id: teamData.id,
        name: teamData.name,
        manager_id: teamData.manager_id,
        leadId,
        memberIds,
        created_at: teamData.created_at,
        updated_at: teamData.updated_at
      });
    }

    return teams;
  },

  // Create a new team
  async createTeam(team: CreateTeamPayload): Promise<Team> {
    console.log('Creating team with data:', team);
    // First create the team
    const { data: teamData, error: teamError } = await supabase
      .from('teams')
      .insert({
        name: team.name,
        manager_id: team.managerId
      })
      .select()
      .single();

    if (teamError) {
      console.error('Error creating team:', teamError);
      throw teamError;
    }

    const newTeamId = teamData.id;
    const memberRecords = [];

    // Add the team lead if provided
    if (team.leadId) {
      const { error: leadError } = await supabase
        .from('team_members')
        .insert({
          team_id: newTeamId,
          user_id: team.leadId,
          is_lead: true
        });

      if (leadError) {
        console.error('Error adding team lead:', leadError);
        throw leadError;
      }
    }

    // Then add all team members
    if (team.memberIds && team.memberIds.length > 0) {
      const memberRecords = team.memberIds.map(userId => ({
        team_id: newTeamId,
        user_id: userId,
        is_lead: false
      }));

      const { error: membersError } = await supabase
        .from('team_members')
        .insert(memberRecords);

      if (membersError) {
        console.error('Error adding team members:', membersError);
        throw membersError;
      }
    }

    return {
      id: newTeamId,
      name: team.name,
      leadId: team.leadId,
      memberIds: team.memberIds || [],
      manager_id: team.managerId
    };
  },

  // Update an existing team
  async updateTeam(team: EditTeamPayload): Promise<Team> {
    console.log('Updating team with data:', team);
    // Update the team name and manager
    const { error: teamError } = await supabase
      .from('teams')
      .update({
        name: team.name,
        manager_id: team.managerId || team.manager_id
      })
      .eq('id', team.id);

    if (teamError) {
      console.error('Error updating team:', teamError);
      throw teamError;
    }

    // First, remove all existing team members and the lead
    const { error: deleteError } = await supabase
      .from('team_members')
      .delete()
      .eq('team_id', team.id);

    if (deleteError) {
      console.error('Error removing existing team members:', deleteError);
      throw deleteError;
    }

    // Add the team lead if provided
    if (team.leadId) {
      const { error: leadError } = await supabase
        .from('team_members')
        .insert({
          team_id: team.id,
          user_id: team.leadId,
          is_lead: true
        });

      if (leadError) {
        console.error('Error adding team lead:', leadError);
        throw leadError;
      }
    }

    // Then add all team members
    if (team.memberIds && team.memberIds.length > 0) {
      const memberRecords = team.memberIds.map(userId => ({
        team_id: team.id,
        user_id: userId,
        is_lead: false
      }));

      const { error: membersError } = await supabase
        .from('team_members')
        .insert(memberRecords);

      if (membersError) {
        console.error('Error adding team members:', membersError);
        throw membersError;
      }
    }

    return {
      id: team.id,
      name: team.name,
      leadId: team.leadId,
      memberIds: team.memberIds || [],
      manager_id: team.managerId || team.manager_id
    };
  },

  // Delete a team
  async deleteTeam(teamId: string): Promise<void> {
    // Team members will be deleted automatically due to CASCADE
    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('id', teamId);

    if (error) {
      console.error('Error deleting team:', error);
      throw error;
    }
  },

  // Get all teams for a manager
  async getTeamsByManagerId(managerId: string): Promise<Team[]> {
    const { data, error } = await supabase
      .from('teams')
      .select(`
        id,
        name,
        manager_id,
        created_at,
        updated_at
      `)
      .eq('manager_id', managerId);

    if (error) {
      console.error('Error fetching manager teams:', error);
      throw error;
    }

    // Process the teams to match the expected Team structure
    const teams: Team[] = [];
    for (const teamData of data || []) {
      // For each team, find its lead and members
      const { data: memberData, error: memberError } = await supabase
        .from('team_members')
        .select(`
          user_id,
          is_lead
        `)
        .eq('team_id', teamData.id);

      if (memberError) {
        console.error('Error fetching team members:', memberError);
        continue;
      }

      const leadId = memberData?.find(m => m.is_lead)?.user_id;
      const memberIds = memberData?.filter(m => !m.is_lead).map(m => m.user_id) || [];

      teams.push({
        id: teamData.id,
        name: teamData.name,
        manager_id: teamData.manager_id,
        leadId,
        memberIds,
        created_at: teamData.created_at,
        updated_at: teamData.updated_at
      });
    }

    return teams;
  }
};
