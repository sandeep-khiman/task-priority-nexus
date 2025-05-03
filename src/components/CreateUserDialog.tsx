
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserRole, User } from '@/types/user';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { UserPlus } from 'lucide-react';

export function CreateUserDialog() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'employee' as UserRole,
    managerId: ''
  });
  const [managers, setManagers] = useState<User[]>([]);
  const [showManagerField, setShowManagerField] = useState(true);
  
  // Fetch managers when the dialog opens
  const handleOpenChange = async (isOpen: boolean) => {
    setOpen(isOpen);
    
    if (isOpen) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'manager');
          
        if (error) throw error;
        
        setManagers(data.map(profile => ({
          id: profile.id,
          email: profile.email,
          name: profile.name,
          role: profile.role as UserRole,
          managerId: profile.manager_id,
          createdAt: profile.created_at,
          updatedAt: profile.updated_at
        })));
      } catch (error) {
        console.error('Error fetching managers:', error);
        toast({
          title: 'Error',
          description: 'Failed to load managers',
          variant: 'destructive'
        });
      }
    } else {
      // Reset form when closing
      setFormData({
        email: '',
        password: '',
        name: '',
        role: 'employee',
        managerId: ''
      });
    }
  };
  
  // Update form data
  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Toggle manager field visibility based on role
    if (field === 'role') {
      const newRole = value as UserRole;
      setShowManagerField(newRole === 'employee' || newRole === 'team-lead');
      
      // Clear manager ID if role is admin or manager
      if (newRole === 'admin' || newRole === 'manager') {
        setFormData(prev => ({
          ...prev,
          managerId: ''
        }));
      }
    }
  };
  
  // Create new user
  const handleCreateUser = async () => {
    setIsLoading(true);
    
    try {
      // Validate form data
      if (!formData.email || !formData.password || !formData.name) {
        toast({
          title: 'Missing information',
          description: 'Please fill in all required fields',
          variant: 'destructive'
        });
        return;
      }
      
      if ((formData.role === 'employee' || formData.role === 'team-lead') && !formData.managerId) {
        toast({
          title: 'Manager required',
          description: `Please select a manager for this ${formData.role}`,
          variant: 'destructive'
        });
        return;
      }
      
      // Create user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: formData.email,
        password: formData.password,
        email_confirm: true,
        user_metadata: {
          name: formData.name,
          role: formData.role
        }
      });
      
      if (authError) throw authError;
      
      if (!authData.user) {
        throw new Error('Failed to create user');
      }
      
      // Update profile with additional information if needed
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          manager_id: formData.managerId || null
        })
        .eq('id', authData.user.id);
        
      if (profileError) throw profileError;
      
      toast({
        title: 'User created',
        description: `New ${formData.role} account has been created successfully`
      });
      
      // Close the dialog
      setOpen(false);
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create user',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-1">
          <UserPlus className="h-4 w-4" /> Create User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Full Name</Label>
            <Input 
              id="name" 
              value={formData.name} 
              onChange={(e) => handleChange('name', e.target.value)} 
              placeholder="Enter user's full name"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="email">Email Address</Label>
            <Input 
              id="email" 
              type="email"
              value={formData.email} 
              onChange={(e) => handleChange('email', e.target.value)} 
              placeholder="Enter email address"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input 
              id="password" 
              type="password"
              value={formData.password} 
              onChange={(e) => handleChange('password', e.target.value)} 
              placeholder="Create a password"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="role">Role</Label>
            <Select 
              value={formData.role} 
              onValueChange={(value) => handleChange('role', value)}
            >
              <SelectTrigger>
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
          
          {showManagerField && (
            <div className="grid gap-2">
              <Label htmlFor="manager">Assigned Manager</Label>
              <Select 
                value={formData.managerId} 
                onValueChange={(value) => handleChange('managerId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select manager" />
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
        
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreateUser} 
            disabled={isLoading}
          >
            {isLoading ? "Creating..." : "Create User"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
