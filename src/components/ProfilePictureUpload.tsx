
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User } from '@/types/user';
import { UploadCloud, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ProfilePictureUploadProps {
  user: User;
  onUploadSuccess: (avatarUrl: string) => void;
}

export function ProfilePictureUpload({ user, onUploadSuccess }: ProfilePictureUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Function to get user initials for the avatar fallback
  const getUserInitials = (name: string): string => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Function to ensure the avatars bucket exists
  const ensureAvatarsBucketExists = async () => {
    try {
      // First check if the bucket exists
      const { data: buckets, error: getBucketsError } = await supabase.storage.listBuckets();
      
      if (getBucketsError) {
        console.error("Error listing buckets:", getBucketsError);
        return false;
      }
      
      // Check if avatars bucket exists in the bucket list
      const avatarsBucketExists = buckets?.some(bucket => bucket.name === 'avatars');
      
      if (!avatarsBucketExists) {
        console.log('Avatars bucket not found, creating it');
        
        // Create bucket with public access
        const { error: createBucketError } = await supabase.storage.createBucket('avatars', {
          public: true
        });
        
        if (createBucketError) {
          console.error('Failed to create avatars bucket:', createBucketError);
          
          // Additional logging for debugging
          if (createBucketError.message.includes('new row violates row-level security policy')) {
            console.error('Permission error: The current user lacks permissions to create storage buckets');
            throw new Error('Insufficient permissions to create storage bucket. Please contact your administrator.');
          }
          
          throw createBucketError;
        }
        
        console.log('Avatars bucket created successfully');
      } else {
        console.log('Avatars bucket already exists');
      }
      
      return true;
    } catch (error: any) {
      console.error('Error ensuring avatars bucket exists:', error);
      setError(error.message || 'Failed to create or verify the avatars bucket');
      return false;
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }
    
    setError(null);
    setUploading(true);
    const file = files[0];
    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}-${Date.now()}.${fileExt}`;
    
    try {
      // First ensure the bucket exists
      const bucketExists = await ensureAvatarsBucketExists();
      
      if (!bucketExists) {
        throw new Error('Failed to create or verify the avatars bucket');
      }
      
      // Upload the file
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);
        
      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }
      
      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
        
      if (!urlData.publicUrl) {
        throw new Error('Failed to get public URL for the uploaded image');
      }
      
      console.log('File uploaded successfully, public URL:', urlData.publicUrl);
      
      // Update user profile with the avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: urlData.publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
        
      if (updateError) {
        console.error('Profile update error:', updateError);
        throw updateError;
      }
      
      console.log('Profile updated with new avatar URL');
      onUploadSuccess(urlData.publicUrl);
      
      toast({
        title: 'Profile picture updated',
        description: 'Your profile picture has been updated successfully',
      });
    } catch (error: any) {
      console.error('Error uploading image:', error);
      setError(error.message || 'Failed to upload profile picture');
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload profile picture',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <Avatar className="h-24 w-24">
        {user.avatarUrl ? (
          <AvatarImage src={user.avatarUrl} alt={user.name} />
        ) : (
          <AvatarFallback className="text-lg bg-primary text-primary-foreground">
            {getUserInitials(user.name)}
          </AvatarFallback>
        )}
      </Avatar>
      
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="flex items-center">
        <Button 
          variant="outline" 
          className="relative overflow-hidden"
          disabled={uploading}
        >
          <input
            type="file"
            className="absolute inset-0 opacity-0 cursor-pointer"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={uploading}
          />
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <UploadCloud className="h-4 w-4 mr-2" />
              Change Picture
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
