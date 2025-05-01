
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/types/user';
import { useToast } from '@/components/ui/use-toast';

// Mock users for demo
const mockUsers = [
  {
    id: '1',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'admin',
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    email: 'manager@example.com',
    name: 'Manager User',
    role: 'manager',
    createdAt: new Date().toISOString()
  },
  {
    id: '3',
    email: 'teamlead@example.com',
    name: 'Team Lead',
    role: 'team-lead',
    createdAt: new Date().toISOString()
  },
  {
    id: '4',
    email: 'employee@example.com',
    name: 'Employee',
    role: 'employee',
    createdAt: new Date().toISOString()
  }
];

export function UserRoleManagement() {
  const { updateUserRole } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState(mockUsers);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  
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
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>User Role Management</CardTitle>
        <CardDescription>
          Manage user roles and permissions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell className="text-right">
                  <Select 
                    defaultValue={user.role} 
                    onValueChange={(value) => handleRoleChange(user.id, value)}
                  >
                    <SelectTrigger className="w-32">
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
      </CardContent>
    </Card>
  );
}
