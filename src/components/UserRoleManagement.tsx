
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { UserRole, User } from '@/types/user';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';

export function UserRoleManagement() {
  const { updateUserRole } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Mock users for demo
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
        email: 'teamlead@example.com',
        name: 'Team Lead',
        role: 'team-lead' as UserRole,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '4',
        email: 'employee1@example.com',
        name: 'Employee One',
        role: 'employee' as UserRole,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '5',
        email: 'employee2@example.com',
        name: 'Employee Two',
        role: 'employee' as UserRole,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    
    setUsers(mockUsers);
    setIsLoading(false);
  }, []);
  
  const handleRoleChange = async (userId: string, role: string) => {
    setUpdatingUserId(userId);
    
    try {
      await updateUserRole(userId, role as UserRole);
      
      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? { ...user, role: role as UserRole } : user
        )
      );
      
      toast({
        title: 'Role updated',
        description: 'User role has been updated successfully.'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update user role.',
        variant: 'destructive'
      });
    } finally {
      setUpdatingUserId(null);
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-red-500 hover:bg-red-600';
      case 'manager':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'team-lead':
        return 'bg-green-500 hover:bg-green-600';
      case 'employee':
        return 'bg-gray-500 hover:bg-gray-600';
      default:
        return '';
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>User Role Management</CardTitle>
        <CardDescription>
          Manage user roles and permissions across your organization
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-10 text-center">Loading users...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Current Role</TableHead>
                <TableHead className="text-right">Change Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge className={`${getRoleBadgeColor(user.role)}`}>
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1).replace('-', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Select 
                      defaultValue={user.role} 
                      onValueChange={(value) => handleRoleChange(user.id, value)}
                      disabled={updatingUserId === user.id}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="team-lead">Team Lead</SelectItem>
                        <SelectItem value="employee">Employee</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
