
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Team, CreateTeamPayload } from '@/types/user';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Plus, Users, UserCheck, UserPlus, Pencil, 
  CheckCircle, XCircle
} from 'lucide-react';
import { CreateTeamDialog } from './CreateTeamDialog';
import { EditTeamDialog } from './EditTeamDialog';

export function ManagerTeamManagement() {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [teamLeads, setTeamLeads] = useState<User[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Mock initial data load
  useEffect(() => {
    // In a real app, this would be an API call filtered by the manager's ID
    const mockUsers = [
      {
        id: '1',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'admin' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '2',
        email: 'manager1@example.com',
        name: 'Manager One',
        role: 'manager' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '3',
        email: 'teamlead1@example.com',
        name: 'Team Lead One',
        role: 'team-lead' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        managerId: '2' // Assigned to Manager One
      },
      {
        id: '4',
        email: 'teamlead2@example.com',
        name: 'Team Lead Two',
        role: 'team-lead' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        managerId: '2' // Assigned to Manager One
      },
      {
        id: '5',
        email: 'employee1@example.com',
        name: 'Employee One',
        role: 'employee' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '6',
        email: 'employee2@example.com',
        name: 'Employee Two',
        role: 'employee' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '7',
        email: 'employee3@example.com',
        name: 'Employee Three',
        role: 'employee' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '8',
        email: 'employee4@example.com',
        name: 'Employee Four',
        role: 'employee' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    // Filter users relevant to this manager (in a real app, this would come from the API)
    const filteredUsers = currentUser?.role === 'manager' 
      ? mockUsers.filter(u => u.managerId === currentUser.id || u.role === 'team-lead' || u.role === 'employee')
      : mockUsers;

    // Mock teams
    const mockTeams: Team[] = [
      {
        id: '1',
        name: 'Development Team',
        leadId: '3',
        memberIds: ['5', '6'],
        managerId: '2' // Manager One
      },
      {
        id: '2',
        name: 'QA Team',
        leadId: '4',
        memberIds: ['7', '8'],
        managerId: '2' // Manager One
      }
    ];
    
    // Filter teams managed by the current manager
    const filteredTeams = currentUser?.role === 'manager'
      ? mockTeams.filter(team => team.managerId === currentUser.id)
      : mockTeams;
    
    setUsers(filteredUsers);
    setTeamLeads(filteredUsers.filter(user => user.role === 'team-lead'));
    setEmployees(filteredUsers.filter(user => user.role === 'employee'));
    setTeams(filteredTeams);
    setIsLoading(false);
  }, [currentUser]);

  // Function to create a new team
  const handleCreateTeam = (teamData: CreateTeamPayload) => {
    const newTeam: Team = {
      id: `${teams.length + 1}`,
      name: teamData.name,
      leadId: teamData.leadId,
      memberIds: teamData.memberIds,
      managerId: teamData.managerId || (currentUser?.id || '')
    };
    
    setTeams(prev => [...prev, newTeam]);

    // Update team lead with manager ID
    setTeamLeads(prev => prev.map(tl => 
      tl.id === teamData.leadId 
        ? { ...tl, managerId: teamData.managerId || currentUser?.id } 
        : tl
    ));
    
    toast({
      title: 'Team Created',
      description: `Team "${teamData.name}" has been successfully created.`
    });
  };

  // Function to edit an existing team
  const handleEditTeam = (updatedTeam: Team) => {
    setTeams(prev => prev.map(team => 
      team.id === updatedTeam.id ? updatedTeam : team
    ));

    // Update team lead with manager ID if changed
    setTeamLeads(prev => prev.map(tl => 
      tl.id === updatedTeam.leadId 
        ? { ...tl, managerId: updatedTeam.managerId } 
        : tl
    ));
    
    toast({
      title: 'Team Updated',
      description: `Team "${updatedTeam.name}" has been successfully updated.`
    });
    
    setIsEditDialogOpen(false);
    setSelectedTeam(null);
  };

  // Function to handle adding an employee to a team
  const handleAddToTeam = (teamId: string, employeeId: string) => {
    setTeams(prev => prev.map(team => {
      if (team.id === teamId && !team.memberIds.includes(employeeId)) {
        return {
          ...team,
          memberIds: [...team.memberIds, employeeId]
        };
      }
      return team;
    }));

    toast({
      title: 'Team Updated',
      description: 'Employee has been added to the team successfully.',
    });
  };

  // Function to handle removing an employee from a team
  const handleRemoveFromTeam = (teamId: string, employeeId: string) => {
    setTeams(prev => prev.map(team => {
      if (team.id === teamId) {
        return {
          ...team,
          memberIds: team.memberIds.filter(id => id !== employeeId)
        };
      }
      return team;
    }));

    toast({
      title: 'Team Updated',
      description: 'Employee has been removed from the team.',
    });
  };

  // Check if an employee is in a specific team
  const isEmployeeInTeam = (teamId: string, employeeId: string) => {
    const team = teams.find(t => t.id === teamId);
    return team ? team.memberIds.includes(employeeId) : false;
  };

  // Get user name by ID
  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : 'Unknown';
  };

  // Open edit dialog for a team
  const openEditDialog = (team: Team) => {
    setSelectedTeam(team);
    setIsEditDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>My Teams</CardTitle>
          <CardDescription>
            Create and manage teams under your supervision
          </CardDescription>
        </div>
        <CreateTeamDialog 
          users={users} 
          teamLeads={teamLeads}
          managers={[currentUser!].filter(u => !!u)}
          onCreateTeam={handleCreateTeam} 
        />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-10 text-center">Loading team data...</div>
        ) : (
          <div className="space-y-6">
            <div className="mb-4">
              <div className="flex items-center mb-3">
                <Users className="mr-2 h-5 w-5" />
                <h3 className="text-lg font-medium">Your Teams</h3>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Team Name</TableHead>
                    <TableHead>Team Lead</TableHead>
                    <TableHead>Team Members</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teams.length > 0 ? (
                    teams.map(team => (
                      <TableRow key={team.id}>
                        <TableCell className="font-medium">{team.name}</TableCell>
                        <TableCell>{getUserName(team.leadId)}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {team.memberIds.length > 0 ? (
                              team.memberIds.map(memberId => (
                                <Badge key={memberId} variant="secondary">
                                  {getUserName(memberId)}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-muted-foreground">No members</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex items-center"
                            onClick={() => openEditDialog(team)}
                          >
                            <Pencil className="h-4 w-4 mr-1" /> Edit Team
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4">
                        No teams created yet. Click "Create Team" to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            
            {teams.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center">
                  <UserPlus className="mr-2 h-5 w-5" />
                  Team Member Assignment
                </h3>
                
                {teams.map(team => (
                  <div key={team.id} className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-md font-medium mb-3 flex items-center">
                      <UserCheck className="mr-2 h-5 w-5 text-blue-600" />
                      {team.name} - Led by {getUserName(team.leadId)}
                      <Badge className="ml-2 bg-blue-500">
                        {team.memberIds.length} Members
                      </Badge>
                    </h4>
                    
                    <div className="mt-4">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Employee</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead className="text-right">Membership</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {employees.map(employee => (
                            <TableRow key={`${team.id}-${employee.id}`}>
                              <TableCell>{employee.name}</TableCell>
                              <TableCell>{employee.email}</TableCell>
                              <TableCell className="text-right">
                                {isEmployeeInTeam(team.id, employee.id) ? (
                                  <Button 
                                    variant="destructive" 
                                    size="sm"
                                    onClick={() => handleRemoveFromTeam(team.id, employee.id)}
                                    className="flex items-center"
                                  >
                                    <XCircle className="h-4 w-4 mr-1" /> Remove from Team
                                  </Button>
                                ) : (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleAddToTeam(team.id, employee.id)}
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
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>

      {selectedTeam && (
        <EditTeamDialog 
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          team={selectedTeam}
          users={users}
          teamLeads={teamLeads}
          employees={employees}
          onSave={handleEditTeam}
        />
      )}
    </Card>
  );
}
