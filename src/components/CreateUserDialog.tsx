
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle } from 'lucide-react';
import { UserRole, User } from '@/types/user';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

export function CreateUserDialog() {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [needsManager, setNeedsManager] = useState(false);
  const [managers, setManagers] = useState<User[]>([]);
  const navigate = useNavigate();
  
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'employee' as UserRole,
    managerId: ''
  });
  
  const handleOpenChange = async (isOpen: boolean) => {
    if (isOpen) {
      // Fetch managers when opening the dialog
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'manager');
          
        if (error) throw error;
        
        setManagers(data.map(manager => ({
          id: manager.id,
          email: manager.email,
          name: manager.name,
          role: manager.role as UserRole,
          managerId: manager.manager_id,
          manager_id: manager.manager_id,
          createdAt: manager.created_at,
          updatedAt: manager.updated_at
        })));
        
        // Initialize needsManager based on the default role
        setNeedsManager(formData.role === 'employee' || formData.role === 'team-lead');
      } catch (error) {
        console.error('Error fetching managers:', error);
      }
    } else {
      // Reset form when closing
      setFormData({
        email: '',
        password: '',
        name: '',
        role: 'employee' as UserRole,
        managerId: ''
      });
      setNeedsManager(false);
    }
    
    setOpen(isOpen);
  };
  
  const handleRoleChange = (role: UserRole) => {
    setFormData({ ...formData, role });
    
    // Check if the role needs a manager assignment
    setNeedsManager(role === 'employee' || role === 'team-lead');
    
    // Clear manager ID if not needed
    if (role === 'admin' || role === 'manager') {
      setFormData(prev => ({...prev, managerId: ''}));
    }
  };
  
  const handleCreateUser = async () => {
    if (!formData.email || !formData.password || !formData.name) {
      toast({
        title: "Missing Information",
        description: "Please fill out all required fields.",
        variant: "destructive"
      });
      return;
    }
    
    if ((formData.role === 'employee' || formData.role === 'team-lead') && !formData.managerId) {
      toast({
        title: "Manager Required",
        description: "Please select a manager for this user.",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            role: formData.role
          }
        }
      });
      
      if (authError) throw authError;
      
      if (!authData.user) {
        throw new Error("Failed to create user");
      }
      
      // Update the profile with role and manager
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          role: formData.role,
          manager_id: (formData.role === 'employee' || formData.role === 'team-lead') ? formData.managerId : null
        })
        .eq('id', authData.user.id);
        
      if (profileError) throw profileError;
      
      toast({
        title: "User Created",
        description: `${formData.name} has been added successfully.`
      });
      
      // Close the dialog
      setOpen(false);
      
      // Reset form
      setFormData({
        email: '',
        password: '',
        name: '',
        role: 'employee' as UserRole,
        managerId: ''
      });
      
      // Don't navigate - just stay on the admin page
      
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create user. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <PlusCircle className="h-4 w-4" />
          Add User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
          <DialogDescription>
            Add a new user to the system and assign their role.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              placeholder="Full Name"
              className="col-span-3"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="email@example.com"
              className="col-span-3"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="password" className="text-right">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Create a password"
              className="col-span-3"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role" className="text-right">
              Role
            </Label>
            <Select
              value={formData.role}
              onValueChange={(value) => handleRoleChange(value as UserRole)}
            >
              <SelectTrigger id="role" className="col-span-3">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="team-lead">Team Lead</SelectItem>
                <SelectItem value="employee">Employee</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Show manager selection only for Employee or Team Lead */}
          {needsManager && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="manager" className="text-right">
                Manager
              </Label>
              <Select
                value={formData.managerId}
                onValueChange={(value) => setFormData({ ...formData, managerId: value })}
              >
                <SelectTrigger id="manager" className="col-span-3">
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
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreateUser} disabled={isLoading}>
            {isLoading ? "Creating..." : "Create User"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
