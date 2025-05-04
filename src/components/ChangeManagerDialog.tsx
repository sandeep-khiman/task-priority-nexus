
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
import { User, UserRole } from '@/types/user';
import { useToast } from '@/components/ui/use-toast';
import { userService } from '@/services/userService';
import { UserCircle2 } from 'lucide-react';

interface ChangeManagerDialogProps {
  user: User;
  onManagerChanged: () => void;
}

export function ChangeManagerDialog({ user, onManagerChanged }: ChangeManagerDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [managers, setManagers] = useState<User[]>([]);
  const [selectedManagerId, setSelectedManagerId] = useState<string>('');
  const { toast } = useToast();
  
  // Fetch available managers when dialog opens
  useEffect(() => {
    const fetchManagers = async () => {
      if (open) {
        try {
          setIsLoading(true);
          const users = await userService.getUsers();
          const availableManagers = users.filter(u => u.role === 'manager' && u.id !== user.id);
          setManagers(availableManagers);
          
          // Set the current manager as selected if it exists
          if (user.managerId) {
            setSelectedManagerId(user.managerId);
          } else {
            setSelectedManagerId('');
          }
        } catch (error) {
          console.error('Error fetching managers:', error);
          toast({
            title: 'Error',
            description: 'Failed to load managers',
            variant: 'destructive'
          });
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    fetchManagers();
  }, [open, user.id, user.managerId, toast]);
  
  const handleChangeManager = async () => {
    try {
      setIsLoading(true);
      
      // Check if the user needs a manager based on their role
      if ((user.role === 'employee' || user.role === 'team-lead') && !selectedManagerId) {
        toast({
          title: 'Manager Required',
          description: 'Please select a manager for this user.',
          variant: 'destructive'
        });
        return;
      }
      
      // Update the user's manager
      await userService.updateUserManager(user.id, selectedManagerId || null);
      
      toast({
        title: 'Manager Updated',
        description: 'User\'s manager has been updated successfully.'
      });
      
      // Close dialog and refresh the user list
      setOpen(false);
      onManagerChanged();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update manager',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="px-2 text-muted-foreground"
          disabled={user.role === 'admin' || user.role === 'manager'}
          title={user.role === 'admin' || user.role === 'manager' ? 
            'Admins and Managers don\'t have managers' : 
            'Change manager'}
        >
          <UserCircle2 className="h-4 w-4 mr-1" />
          Change Manager
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Manager for {user.name}</DialogTitle>
          <DialogDescription>
            Select a new manager for this {user.role.replace('-', ' ')}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-6">
          <Select
            value={selectedManagerId}
            onValueChange={setSelectedManagerId}
            disabled={isLoading}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a manager" />
            </SelectTrigger>
            <SelectContent>
              {managers.length === 0 ? (
                <SelectItem value="no-managers-available">No available managers</SelectItem>
              ) : (
                managers.map(manager => (
                  <SelectItem key={manager.id} value={manager.id}>
                    {manager.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleChangeManager} 
            disabled={isLoading || managers.length === 0}
          >
            {isLoading ? "Updating..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
