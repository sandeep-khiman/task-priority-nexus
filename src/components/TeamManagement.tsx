
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UserRole, User, Team, CreateTeamPayload } from '@/types/user';
import { useToast } from '@/components/ui/use-toast';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle } from 'lucide-react';
import { CreateTeamDialog } from './CreateTeamDialog';

export function TeamManagement() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [teamLeads, setTeamLeads] = useState<User[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamAssignments, setTeamAssignments] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(true);

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
        email: 'manager@example.com',
        name: 'Manager User',
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
        updatedAt: new Date().toISOString()
      },
      {
        id: '4',
        email: 'teamlead2@example.com',
        name: 'Team Lead Two',
        role: 'team-lead' as UserRole,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
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
        memberIds: ['5', '6']
      },
      {
        id: '2',
        name: 'QA Team',
        leadId: '4',
        memberIds: ['7', '8']
      }
    ];
    
    setUsers(mockUsers);
    setTeamLeads(mockUsers.filter(user => user.role === 'team-lead'));
    setEmployees(mockUsers.filter(user => user.role === 'employee'));
    setTeams(initialTeams);
    setTeamAssignments(initialTeamAssignments);
    setIsLoading(false);
  }, []);

  // Function to create a new team
  const handleCreateTeam = (teamData: CreateTeamPayload) => {
    const newTeam: Team = {
      id: `${teams.length + 1}`,
      name: teamData.name,
      leadId: teamData.leadId,
      memberIds: teamData.memberIds
    };
    
    setTeams(prev => [...prev, newTeam]);
    
    // Update team assignments
    setTeamAssignments(prev => ({
      ...prev,
      [teamData.leadId]: teamData.memberIds
    }));
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
      if (team.leadId === teamLeadId) {
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
      if (team.leadId === teamLeadId) {
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
        <CreateTeamDialog 
          users={users} 
          teamLeads={teamLeads} 
          onCreateTeam={handleCreateTeam} 
        />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-10 text-center">Loading team data...</div>
        ) : (
          <div className="space-y-6">
            <div className="mb-4">
              <h3 className="text-lg font-medium mb-2">Current Teams</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Team Name</TableHead>
                    <TableHead>Team Lead</TableHead>
                    <TableHead>Members</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teams.length > 0 ? (
                    teams.map(team => (
                      <TableRow key={team.id}>
                        <TableCell className="font-medium">{team.name}</TableCell>
                        <TableCell>{getTeamLeadName(team.leadId)}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {team.memberIds.map(memberId => (
                              <Badge key={memberId} variant="secondary">
                                {getEmployeeName(memberId)}
                              </Badge>
                            ))}
                            {team.memberIds.length === 0 && (
                              <span className="text-muted-foreground">No members</span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-4">
                        No teams created yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            
            {teamLeads.length > 0 ? (
              teamLeads.map(teamLead => (
                <div key={teamLead.id} className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium mb-2">
                    Team Lead: {teamLead.name} 
                    <Badge className="ml-2 bg-green-500">
                      {(teamAssignments[teamLead.id]?.length || 0)} Team Members
                    </Badge>
                  </h3>
                  
                  <div className="mt-4">
                    <Label className="mb-2 block">Assign Employees to this Team Lead:</Label>
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
                No team leads found. Please assign at least one user as a team lead first.
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
