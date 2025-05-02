
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UserRole, User, Team, CreateTeamPayload } from '@/types/user';
import { useToast } from '@/components/ui/use-toast';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, Users, UserCheck, UserPlus } from 'lucide-react';
import { CreateTeamDialog } from './CreateTeamDialog';

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

  // Mock initial data load
  useEffect(() => {
    // In a real app, this would be an API call
    const mockUsers = [
      {
        id: '1',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'admin' as UserRole,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '2',
        email: 'manager1@example.com',
        name: 'Manager One',
        role: 'manager' as UserRole,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '9',
        email: 'manager2@example.com',
        name: 'Manager Two',
        role: 'manager' as UserRole,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '3',
        email: 'teamlead1@example.com',
        name: 'Team Lead One',
        role: 'team-lead' as UserRole,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        managerId: '2' // Assigned to Manager One
      },
      {
        id: '4',
        email: 'teamlead2@example.com',
        name: 'Team Lead Two',
        role: 'team-lead' as UserRole,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        managerId: '2' // Assigned to Manager One
      },
      {
        id: '10',
        email: 'teamlead3@example.com',
        name: 'Team Lead Three',
        role: 'team-lead' as UserRole,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        managerId: '9' // Assigned to Manager Two
      },
      {
        id: '5',
        email: 'employee1@example.com',
        name: 'Employee One',
        role: 'employee' as UserRole,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '6',
        email: 'employee2@example.com',
        name: 'Employee Two',
        role: 'employee' as UserRole,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '7',
        email: 'employee3@example.com',
        name: 'Employee Three',
        role: 'employee' as UserRole,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '8',
        email: 'employee4@example.com',
        name: 'Employee Four',
        role: 'employee' as UserRole,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    // Mock team assignments
    const initialTeamAssignments: Record<string, string[]> = {
      '3': ['5', '6'], // Team Lead One has Employee One and Two
      '4': ['7', '8']  // Team Lead Two has Employee Three and Four
    };

    // Mock teams
    const initialTeams: Team[] = [
      {
        id: '1',
        name: 'Development Team',
        leadId: '3',
        memberIds: ['5', '6'],
        manager_id: '2' // Manager One
      },
      {
        id: '2',
        name: 'QA Team',
        leadId: '4',
        memberIds: ['7', '8'],
        manager_id: '2' // Manager One
      },
      {
        id: '3',
        name: 'DevOps Team',
        leadId: '10',
        memberIds: [],
        manager_id: '9' // Manager Two
      }
    ];
    
    setUsers(mockUsers);
    setManagers(mockUsers.filter(user => user.role === 'manager'));
    setTeamLeads(mockUsers.filter(user => user.role === 'team-lead'));
    setEmployees(mockUsers.filter(user => user.role === 'employee'));
    setTeams(initialTeams);
    setTeamAssignments(initialTeamAssignments);
    setIsLoading(false);
  }, []);

  // Get filtered team leads based on selected manager
  const filteredTeamLeads = selectedManager === 'all' 
    ? teamLeads 
    : teamLeads.filter(tl => tl.managerId === selectedManager);

  // Function to create a new team
  const handleCreateTeam = (teamData: CreateTeamPayload) => {
    const newTeam: Team = {
      id: `${teams.length + 1}`,
      name: teamData.name,
      leadId: teamData.leadId,
      memberIds: teamData.memberIds,
      manager_id: teamData.managerId
    };
    
    setTeams(prev => [...prev, newTeam]);
    
    // Update team assignments
    setTeamAssignments(prev => ({
      ...prev,
      [teamData.leadId]: teamData.memberIds
    }));

    // Update team lead with manager ID
    setTeamLeads(prev => prev.map(tl => 
      tl.id === teamData.leadId 
        ? { ...tl, managerId: teamData.managerId } 
        : tl
    ));
  };

  // Function to handle adding an employee to a team lead's team
  const handleAddToTeam = (teamLeadId: string, employeeId: string) => {
    setTeamAssignments(prev => {
      const teamLeadAssignments = prev[teamLeadId] || [];
      if (!teamLeadAssignments.includes(employeeId)) {
        return {
          ...prev,
          [teamLeadId]: [...teamLeadAssignments, employeeId]
        };
      }
      return prev;
    });

    // Also update the corresponding team if it exists
    setTeams(prev => prev.map(team => {
      if (team.leadId === teamLeadId && team.memberIds) {
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

  // Function to handle removing an employee from a team lead's team
  const handleRemoveFromTeam = (teamLeadId: string, employeeId: string) => {
    setTeamAssignments(prev => {
      const teamLeadAssignments = prev[teamLeadId] || [];
      return {
        ...prev,
        [teamLeadId]: teamLeadAssignments.filter(id => id !== employeeId)
      };
    });

    // Also update the corresponding team if it exists
    setTeams(prev => prev.map(team => {
      if (team.leadId === teamLeadId && team.memberIds) {
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

  // Check if an employee is assigned to a team lead
  const isEmployeeInTeam = (teamLeadId: string, employeeId: string) => {
    return (teamAssignments[teamLeadId] || []).includes(employeeId);
  };

  // Get the name of a team lead by ID
  const getTeamLeadName = (teamLeadId: string) => {
    const teamLead = users.find(user => user.id === teamLeadId);
    return teamLead ? teamLead.name : 'Unknown';
  };

  // Get the name of a manager by ID
  const getManagerName = (managerId: string) => {
    const manager = users.find(user => user.id === managerId);
    return manager ? manager.name : 'Unknown';
  };

  // Get the name of an employee by ID
  const getEmployeeName = (employeeId: string) => {
    const employee = users.find(user => user.id === employeeId);
    return employee ? employee.name : 'Unknown';
  };

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
                        <TableCell>{getManagerName(team.manager_id || '')}</TableCell>
                        <TableCell>{getTeamLeadName(team.leadId || '')}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {team.memberIds?.map(memberId => (
                              <Badge key={memberId} variant="secondary">
                                {getEmployeeName(memberId)}
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
                        Manager: {getManagerName(teamLead.managerId)}
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
                            {getEmployeeName(employeeId)}
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
