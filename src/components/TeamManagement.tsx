
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UserRole, User, Team, CreateTeamPayload, EditTeamPayload } from '@/types/user';
import { useToast } from '@/components/ui/use-toast';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, Users, UserCheck, UserPlus } from 'lucide-react';
import { CreateTeamDialog } from './CreateTeamDialog';
import { userService } from '@/services/userService';
import { teamService } from '@/services/teamService';
import { supabase } from '@/integrations/supabase/client';

interface TeamManagementProps {
  // Optional props can be added here
}

export function TeamManagement({ }: TeamManagementProps) {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [managers, setManagers] = useState<User[]>([]);
  const [teamLeads, setTeamLeads] = useState<User[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamAssignments, setTeamAssignments] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedManager, setSelectedManager] = useState<string>('all');

  // Load real data from Supabase
  useEffect(() => {
    fetchData();
    
    // Set up Supabase realtime subscription
    const usersChannel = supabase
      .channel('profiles-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'profiles' 
      }, () => {
        // Refresh data when profiles change
        fetchData();
      })
      .subscribe();
      
    const teamsChannel = supabase
      .channel('teams-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'teams' 
      }, () => {
        // Refresh data when teams change
        fetchData();
      })
      .subscribe();
      
    const membersChannel = supabase
      .channel('team-members-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'team_members' 
      }, () => {
        // Refresh data when team members change
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(usersChannel);
      supabase.removeChannel(teamsChannel);
      supabase.removeChannel(membersChannel);
    };
  }, []);
  
  const fetchData = async () => {
    setIsLoading(true);
    
    try {
      // Fetch all users with their roles
      const fetchedUsers = await userService.getUsers();
      setUsers(fetchedUsers);
      
      // Set user categories based on roles
      setManagers(fetchedUsers.filter(user => user.role === 'manager'));
      setTeamLeads(fetchedUsers.filter(user => user.role === 'team-lead'));
      setEmployees(fetchedUsers.filter(user => user.role === 'employee'));
      
      // Fetch teams
      const fetchedTeams = await teamService.getTeams();
      setTeams(fetchedTeams);
      
      // Create team assignments mapping
      const assignments: Record<string, string[]> = {};
      
      fetchedTeams.forEach(team => {
        if (team.leadId && team.memberIds) {
          assignments[team.leadId] = team.memberIds;
        }
      });
      
      setTeamAssignments(assignments);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load team data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to create a new team
  const handleCreateTeam = async (teamData: CreateTeamPayload) => {
    try {
      const newTeam = await teamService.createTeam({
        ...teamData,
        manager_id: teamData.managerId  // Ensure the manager_id is set
      });
      
      toast({
        title: "Team created",
        description: `Team "${teamData.name}" has been created successfully`
      });
      
      // Refresh data
      fetchData();
    } catch (error) {
      console.error("Error creating team:", error);
      toast({
        title: "Error",
        description: "Failed to create team. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Function to handle adding an employee to a team lead's team
  const handleAddToTeam = async (teamLeadId: string, employeeId: string) => {
    try {
      // Find the team where this user is a lead
      const team = teams.find(t => t.leadId === teamLeadId);
      
      if (!team) {
        toast({
          title: "Error",
          description: "Team not found. Please refresh and try again.",
          variant: "destructive"
        });
        return;
      }
      
      // Update team with new member
      const updatedTeam: EditTeamPayload = {
        ...team,
        id: team.id,
        name: team.name,
        leadId: team.leadId || '', // Provide a default value if it's undefined
        memberIds: [...(team.memberIds || []), employeeId],
        managerId: team.manager_id || '',  // Use manager_id for compatibility
        manager_id: team.manager_id
      };
      
      await teamService.updateTeam(updatedTeam);
      
      toast({
        title: "Team Updated",
        description: "Employee has been added to the team successfully.",
      });
      
      // Refresh data
      fetchData();
    } catch (error) {
      console.error("Error adding employee to team:", error);
      toast({
        title: "Error",
        description: "Failed to update team. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Function to handle removing an employee from a team lead's team
  const handleRemoveFromTeam = async (teamLeadId: string, employeeId: string) => {
    try {
      // Find the team where this user is a lead
      const team = teams.find(t => t.leadId === teamLeadId);
      
      if (!team) {
        toast({
          title: "Error",
          description: "Team not found. Please refresh and try again.",
          variant: "destructive"
        });
        return;
      }
      
      // Update team with member removed
      const updatedTeam: EditTeamPayload = {
        ...team,
        id: team.id,
        name: team.name,
        leadId: team.leadId || '', // Provide a default value if it's undefined
        memberIds: (team.memberIds || []).filter(id => id !== employeeId),
        managerId: team.manager_id || '',  // Use manager_id for compatibility
        manager_id: team.manager_id
      };
      
      await teamService.updateTeam(updatedTeam);
      
      toast({
        title: "Team Updated",
        description: "Employee has been removed from the team.",
      });
      
      // Refresh data
      fetchData();
    } catch (error) {
      console.error("Error removing employee from team:", error);
      toast({
        title: "Error",
        description: "Failed to update team. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Check if an employee is assigned to a team lead
  const isEmployeeInTeam = (teamLeadId: string, employeeId: string) => {
    return (teamAssignments[teamLeadId] || []).includes(employeeId);
  };

  // Get the name of a user by ID
  const getUserName = (userId: string) => {
    const user = users.find(user => user.id === userId);
    return user ? user.name : 'Unknown';
  };

  // Get filtered team leads based on selected manager
  const filteredTeamLeads = selectedManager === 'all' 
    ? teamLeads 
    : teamLeads.filter(tl => tl.managerId === selectedManager);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Team Management</CardTitle>
          <CardDescription>
            Assign employees to team leads and manage team structures
          </CardDescription>
        </div>
        <div className="flex items-center gap-4">
          <div className="min-w-[200px]">
            <Select 
              value={selectedManager}
              onValueChange={setSelectedManager}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by Manager" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Managers</SelectItem>
                {managers.map(manager => (
                  <SelectItem key={manager.id} value={manager.id}>{manager.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <CreateTeamDialog 
            users={users} 
            teamLeads={teamLeads}
            managers={managers}
            onCreateTeam={handleCreateTeam} 
          />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-10 text-center">Loading team data...</div>
        ) : (
          <div className="space-y-6">
            <div className="mb-4">
              <div className="flex items-center mb-3">
                <Users className="mr-2 h-5 w-5" />
                <h3 className="text-lg font-medium">Current Teams</h3>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Team Name</TableHead>
                    <TableHead>Manager</TableHead>
                    <TableHead>Team Lead</TableHead>
                    <TableHead>Members</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teams.length > 0 ? (
                    teams
                      .filter(team => selectedManager === 'all' || team.manager_id === selectedManager)
                      .map(team => (
                      <TableRow key={team.id}>
                        <TableCell className="font-medium">{team.name}</TableCell>
                        <TableCell>{getUserName(team.manager_id || '')}</TableCell>
                        <TableCell>{getUserName(team.leadId || '')}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {team.memberIds?.map(memberId => (
                              <Badge key={memberId} variant="secondary">
                                {getUserName(memberId)}
                              </Badge>
                            ))}
                            {!team.memberIds || team.memberIds.length === 0 && (
                              <span className="text-muted-foreground">No members</span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4">
                        No teams created yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            
            {filteredTeamLeads.length > 0 ? (
              filteredTeamLeads.map(teamLead => (
                <div key={teamLead.id} className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium mb-2 flex items-center">
                    <UserCheck className="mr-2 h-5 w-5 text-blue-600" />
                    Team Lead: {teamLead.name} 
                    <Badge className="ml-2 bg-blue-500 hover:bg-blue-600">
                      {(teamAssignments[teamLead.id]?.length || 0)} Team Members
                    </Badge>
                    {teamLead.managerId && (
                      <Badge className="ml-2 bg-purple-500 hover:bg-purple-600">
                        Manager: {getUserName(teamLead.managerId)}
                      </Badge>
                    )}
                  </h3>
                  
                  <div className="mt-4">
                    <Label className="mb-2 block flex items-center">
                      <UserPlus className="mr-2 h-4 w-4" />
                      Assign Employees to this Team Lead:
                    </Label>
                    <div className="grid gap-2">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Employee</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead className="text-right">Team Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {employees.map(employee => (
                            <TableRow key={employee.id}>
                              <TableCell>{employee.name}</TableCell>
                              <TableCell>{employee.email}</TableCell>
                              <TableCell className="text-right">
                                {isEmployeeInTeam(teamLead.id, employee.id) ? (
                                  <Button 
                                    variant="destructive" 
                                    size="sm"
                                    onClick={() => handleRemoveFromTeam(teamLead.id, employee.id)}
                                    className="flex items-center"
                                  >
                                    <XCircle className="h-4 w-4 mr-1" /> Remove from Team
                                  </Button>
                                ) : (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleAddToTeam(teamLead.id, employee.id)}
                                    className="flex items-center"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" /> Add to Team
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                  
                  {(teamAssignments[teamLead.id]?.length || 0) > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Current Team Members:</h4>
                      <div className="flex flex-wrap gap-2">
                        {teamAssignments[teamLead.id]?.map(employeeId => (
                          <Badge key={employeeId} variant="secondary" className="px-3 py-1.5">
                            {getUserName(employeeId)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="py-10 text-center">
                {selectedManager === 'all' ? (
                  'No team leads found. Please assign at least one user as a team lead first.'
                ) : (
                  'No team leads found for the selected manager.'
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
