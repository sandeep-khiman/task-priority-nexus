import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useParams } from 'react-router-dom';
import { Header } from '@/components/Header';
import { UserProfileForm } from '@/components/UserProfileForm';
import { User } from '@/types/user';
import { userService } from '@/services/userService';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';

export default function UserProfile() {
  const { isAuthenticated, profile } = useAuth();
  const { userId } = useParams<{ userId: string }>();
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  // Viewing own profile if no userId provided, or if userId matches current user
  const isOwnProfile = !userId || (profile && userId === profile.id);
  
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setIsLoading(true);
        
        let userData: User | null;
        
        if (isOwnProfile && profile) {
          userData = profile;
        } else if (userId) {
          userData = await userService.getUserById(userId);
        } else {
          userData = null;
        }
        
        setUserProfile(userData);
        
        if (!userData) {
          toast({
            title: "User Not Found",
            description: "The requested user profile could not be found.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        toast({
          title: "Error",
          description: "Failed to load user profile. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (isAuthenticated) {
      fetchUserProfile();
    }
  }, [isAuthenticated, profile, userId, isOwnProfile, toast]);

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  const handleProfileUpdated = (updatedUser: User) => {
    setUserProfile(updatedUser);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex-1">
        <div className="container py-6 space-y-6">
          <h1 className="text-3xl font-bold">
            {isOwnProfile ? "My Profile" : "User Profile"}
          </h1>
          
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-[300px]" />
              <Skeleton className="h-[200px] w-full" />
            </div>
          ) : userProfile ? (
            <div className="grid gap-6">
              <Tabs defaultValue="profile" className="w-full">
                <TabsList className="grid w-full md:w-[400px] grid-cols-2">
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                  <TabsTrigger value="teams">Teams</TabsTrigger>
                </TabsList>
                
                <TabsContent value="profile" className="mt-6">
                  <UserProfileForm
                    user={userProfile}
                    currentUserId={profile?.id || ''}
                    onProfileUpdated={handleProfileUpdated}
                  />
                </TabsContent>
                
                <TabsContent value="teams" className="mt-6">
                  <UserTeams userId={userProfile.id} />
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">User not found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function UserTeams({ userId }: { userId: string }) {
  const [teams, setTeams] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUserTeams = async () => {
      try {
        setIsLoading(true);
        
        // Get all team IDs the user belongs to
        const teamIds = await userService.getUserTeams(userId);
        
        if (teamIds.length === 0) {
          setTeams([]);
          return;
        }
        
        // Get team details
        const { data, error } = await supabase
          .from('teams')
          .select('id, name')
          .in('id', teamIds);
          
        if (error) {
          throw error;
        }
        
        setTeams(data as Array<{ id: string; name: string }>);
      } catch (error) {
        console.error("Error fetching user teams:", error);
        toast({
          title: "Error",
          description: "Failed to load teams. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserTeams();
  }, [userId, toast]);

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">Teams</h3>
      
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : teams.length > 0 ? (
        <div className="space-y-2">
          {teams.map(team => (
            <div 
              key={team.id} 
              className="flex items-center p-4 border rounded-md bg-card"
            >
              <span className="font-medium">{team.name}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">Not a member of any teams</p>
      )}
    </div>
  );
}
