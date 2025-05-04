
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { User } from '@/types/user';
import { useToast } from '@/components/ui/use-toast';
import { userService } from '@/services/userService';
import { useAuth } from '@/contexts/AuthContext';
import { getUserPermissions } from '@/utils/permissionUtils';

interface ChangeManagerDialogProps {
  user: User;
  onManagerChanged: () => void;
}

export function ChangeManagerDialog({ user, onManagerChanged }: ChangeManagerDialogProps) {
  const [open, setOpen] = useState(false);
  const [managers, setManagers] = useState<User[]>([]);
  const [selectedManagerId, setSelectedManagerId] = useState<string>(user.managerId || '');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { profile } = useAuth();
  
  // Get permissions based on current user role
  const currentUserRole = profile?.role || 'employee';
  const isUserUnderManager = profile?.id === user.managerId;
  const permissions = getUserPermissions(currentUserRole, user.id, profile?.id, isUserUnderManager);
  
  // Fetch managers when dialog opens
  useEffect(() => {
    if (open) {
      fetchManagers();
    }
  }, [open]);
  
  const fetchManagers = async () => {
    try {
      setIsLoading(true);
      const fetchedManagers = await userService.getUsersByRole('manager');
      setManagers(fetchedManagers);
      
      // Pre-select current manager if exists
      if (user.managerId) {
        setSelectedManagerId(user.managerId);
      } else if (fetchedManagers.length > 0) {
        setSelectedManagerId(fetchedManagers[0].id);
      }
    } catch (error) {
      console.error('Error fetching managers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load managers. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleUpdateManager = async () => {
    if (!selectedManagerId) {
      toast({
        title: 'Error',
        description: 'Please select a manager.',
        variant: 'destructive'
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      await userService.updateUserManager(user.id, selectedManagerId);
      
      toast({
        title: 'Manager updated',
        description: `Manager has been updated successfully for ${user.name}.`
      });
      
      setOpen(false);
      onManagerChanged();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update manager.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Check if current user has permission to change managers
  if (!permissions.canAssignTeamLeads && currentUserRole !== 'admin') {
    return null;
  }
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Change Manager</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Change Manager</DialogTitle>
          <DialogDescription>
            Select a new manager for {user.name}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Select
              value={selectedManagerId}
              onValueChange={setSelectedManagerId}
              disabled={isLoading}
            >
              <SelectTrigger className="col-span-4">
                <SelectValue placeholder="Select a manager" />
              </SelectTrigger>
              <SelectContent>
                {managers.length === 0 ? (
                  <SelectItem value="no-managers" disabled>No managers available</SelectItem>
                ) : (
                  managers.map(manager => (
                    <SelectItem 
                      key={manager.id} 
                      value={manager.id}
                      // Disable selecting the same manager
                      disabled={user.managerId === manager.id}
                    >
                      {manager.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            type="button"
            onClick={handleUpdateManager}
            disabled={isLoading || managers.length === 0 || user.managerId === selectedManagerId}
          >
            {isLoading ? "Updating..." : "Update Manager"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
