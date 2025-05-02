
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { UserRole, User } from '@/types/user';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { userService } from '@/services/userService';
import { supabase } from '@/integrations/supabase/client';

export function UserRoleManagement() {
  const { updateUserRole, profile: currentUserProfile } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUsers();

    // Set up a subscription to profile changes
    const channel = supabase
      .channel('profiles-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'profiles' 
      }, () => {
        // Refresh users when profiles change
        fetchUsers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const fetchedUsers = await userService.getUsers();
      setUsers(fetchedUsers);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch users. Please try again later.',
        variant: 'destructive'
      });
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
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
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update user role.',
        variant: 'destructive'
      });
      console.error('Error updating role:', error);
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
  
  // Check if current user is admin
  const isAdmin = currentUserProfile?.role === 'admin';
  
  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>
            You do not have permission to manage user roles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Only administrators can access this functionality.</p>
        </CardContent>
      </Card>
    );
  }
  
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
              {users.length > 0 ? (
                users.map((user) => (
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
                        disabled={updatingUserId === user.id || user.id === currentUserProfile?.id}
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
                      {user.id === currentUserProfile?.id && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Cannot change your own role
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6">
                    No users found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
