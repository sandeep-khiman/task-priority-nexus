
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { ProfilePictureUpload } from '@/components/ProfilePictureUpload';
import { userService } from '@/services/userService';
import { User } from '@/types/user';
import { Badge } from '@/components/ui/badge';
import { getUserPermissions } from '@/utils/permissionUtils';
import { useAuth } from '@/contexts/AuthContext';

interface UserProfileFormProps {
  user: User;
  currentUserId: string;
  onProfileUpdated?: (user: User) => void;
}

export function UserProfileForm({ user, currentUserId, onProfileUpdated }: UserProfileFormProps) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [isLoading, setIsLoading] = useState(false);
  const [avatar_url, setavatar_url] = useState(user.avatar_url);
  const { toast } = useToast();
  const { updateUserProfile } = useAuth();

  const isOwnProfile = user.id === currentUserId;
  const permissions = getUserPermissions(
    user.role, 
    user.id, 
    currentUserId, 
    user.managerId === currentUserId
  );

  // Update local state when user prop changes
  useEffect(() => {
    setName(user.name);
    setEmail(user.email);
    setavatar_url(user.avatar_url);
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!permissions.canUpdateOwnProfile && !isOwnProfile) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to update this profile.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Use the new AuthContext method for updating profiles
      const success = await updateUserProfile(user.id, { name, email });
      
      if (success && onProfileUpdated) {
        onProfileUpdated({
          ...user,
          name,
          email,
          avatar_url,
        });
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarUploadSuccess = async (url: string) => {
    setavatar_url(url);
    
    try {
      // Update the avatar URL through our AuthContext
      await updateUserProfile(user.id, { avatar_url: url });
      
      if (onProfileUpdated) {
        onProfileUpdated({
          ...user,
          avatar_url: url,
        });
      }
    } catch (error) {
      console.error('Failed to update avatar:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Profile</CardTitle>
        <CardDescription>
          View and update your profile information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6">
          <div className="flex flex-col items-center">
            <ProfilePictureUpload 
              user={{...user, avatar_url}} 
              onUploadSuccess={handleAvatarUploadSuccess} 
            />
            
            <div className="mt-4">
              <Badge className="mt-2">{user.role.replace('-', ' ').charAt(0).toUpperCase() + user.role.replace('-', ' ').slice(1)}</Badge>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={!permissions.canUpdateOwnProfile || isLoading}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={!permissions.canUpdateOwnProfile || isLoading}
              />
            </div>
            
            {permissions.canUpdateOwnProfile && (
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            )}
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
