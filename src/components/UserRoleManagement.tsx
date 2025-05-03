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
import { 
  Dialog,
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { CreateUserDialog } from './CreateUserDialog';

export function UserRoleManagement() {
  const { updateUserRole, profile: currentUserProfile } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [managers, setManagers] = useState<User[]>([]);
  const [showManagerDialog, setShowManagerDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [pendingRole, setPendingRole] = useState<UserRole | null>(null);
  const [selectedManagerId, setSelectedManagerId] = useState<string>('');

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
      
      // Extract managers for the dropdown
      const managersList = fetchedUsers.filter(user => user.role === 'manager');
      setManagers(managersList);
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
  
  const handleRoleChange = async (userId: string, role: UserRole) => {
    // Get the user we're updating
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    // Logic for role changes
    if (role === 'admin' || role === 'manager') {
      // Admin and Manager roles don't need a manager
      processRoleChange(userId, role);
    } else if ((role === 'team-lead' || role === 'employee') && 
              (user.role === 'admin' || user.role === 'manager')) {
      // If changing from admin/manager to team-lead/employee, need to assign a manager
      setSelectedUser(user);
      setPendingRole(role);
      setShowManagerDialog(true);
    } else {
      // Keep existing manager for lateral role changes (team-lead to employee or vice versa)
      processRoleChange(userId, role);
    }
  };
  
  const processRoleChange = async (userId: string, role: UserRole, managerId?: string) => {
    setUpdatingUserId(userId);
    
    try {
      // Update the user's role
      await updateUserRole(userId, role);
      
      // Update the manager if provided
      if (managerId && (role === 'team-lead' || role === 'employee')) {
        await userService.updateUserManager(userId, managerId);
      } else if (role === 'admin' || role === 'manager') {
        // Clear manager for admin and manager roles
        await userService.updateUserManager(userId, null);
      }
      
      // Reset state
      setSelectedUser(null);
      setPendingRole(null);
      setSelectedManagerId('');
      setShowManagerDialog(false);
      
      toast({
        title: 'Role updated',
        description: `User role has been updated successfully`,
      });
      
      // Refresh users list
      fetchUsers();
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
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>User Role Management</CardTitle>
            <CardDescription>
              Manage user roles and permissions across your organization
            </CardDescription>
          </div>
          <CreateUserDialog />
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
                  <TableHead>Manager</TableHead>
                  <TableHead className="text-right">Change Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length > 0 ? (
                  users.map((user) => {
                    const managerName = user.managerId 
                      ? users.find(u => u.id === user.managerId)?.name || 'Unknown'
                      : 'None';
                      
                    return (
                      <TableRow key={user.id}>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge className={`${getRoleBadgeColor(user.role)}`}>
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1).replace('-', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.role === 'admin' || user.role === 'manager' ? 
                            'N/A' : 
                            managerName
                          }
                        </TableCell>
                        <TableCell className="text-right">
                          <Select 
                            defaultValue={user.role} 
                            onValueChange={(value) => handleRoleChange(user.id, value as UserRole)}
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
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6">
                      No users found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {/* Manager Selection Dialog */}
      <Dialog open={showManagerDialog} onOpenChange={setShowManagerDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Manager</DialogTitle>
            <DialogDescription>
              {pendingRole === 'team-lead' ? 
                'A Team Lead needs to be assigned to a Manager.' :
                'An Employee needs to be assigned to a Manager.'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6">
            <label className="block text-sm font-medium mb-2">
              Select a Manager for {selectedUser?.name}
            </label>
            <Select
              value={selectedManagerId}
              onValueChange={setSelectedManagerId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a manager" />
              </SelectTrigger>
              <SelectContent>
                {managers.map(manager => (
                  <SelectItem key={manager.id} value={manager.id}>
                    {manager.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowManagerDialog(false);
              setSelectedUser(null);
              setPendingRole(null);
            }}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (selectedUser && pendingRole && selectedManagerId) {
                  processRoleChange(selectedUser.id, pendingRole, selectedManagerId);
                }
              }}
              disabled={!selectedManagerId}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
