
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { ManagerTeamManagement } from '@/components/ManagerTeamManagement';
import { useToast } from '@/components/ui/use-toast';
import { TaskAssignmentDialog } from '@/components/TaskAssignmentDialog';
import { User } from '@/types/user';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function ManagerDashboard() {
  const { isAuthenticated, profile } = useAuth();
  const { toast } = useToast();
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Welcome message
    if (profile?.role === 'manager') {
      toast({
        title: `Welcome, ${profile.name}`,
        description: 'Here you can manage your teams and team members.',
      });
    }
    
    // Fetch team members under this manager
    const fetchTeamMembers = async () => {
      if (!profile) return;
      
      try {
        setIsLoading(true);
        
        // Get teams managed by this user
        const { data: teamsData, error: teamsError } = await supabase
          .from('teams')
          .select('id')
          .eq('manager_id', profile.id);
          
        if (teamsError) throw teamsError;
        
        if (teamsData && teamsData.length > 0) {
          const teamIds = teamsData.map(team => team.id);
          
          // Get team members for these teams
          const { data: membersData, error: membersError } = await supabase
            .from('team_members')
            .select(`
              user_id,
              profiles:user_id (
                id, name, email, role, avatar_url
              )
            `)
            .in('team_id', teamIds);
            
          if (membersError) throw membersError;
          
          if (membersData) {
            // Extract unique members
            const uniqueMembers = Array.from(
              new Map(
                membersData
                  .filter(m => m.profiles) // Only include members with profile data
                  .map(m => [
                    m.profiles.id,
                    {
                      id: m.profiles.id,
                      name: m.profiles.name,
                      email: m.profiles.email,
                      role: m.profiles.role,
                      avatarUrl: m.profiles.avatar_url,
                      createdAt: "", // These fields aren't needed for the task assignment
                      updatedAt: ""
                    } as User
                  ])
              ).values()
            );
            
            setTeamMembers(uniqueMembers);
          }
        }
      } catch (error) {
        console.error('Error fetching team members:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (isAuthenticated && profile?.role === 'manager') {
      fetchTeamMembers();
    }
  }, [profile, toast, isAuthenticated]);

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  // Ensure only managers can access this page
  if (profile?.role !== 'manager') {
    return <Navigate to="/" />;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex-1">
        <div className="container py-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Team Management Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                Manage your teams and assign team members
              </p>
            </div>
            
            {profile && teamMembers.length > 0 && (
              <TaskAssignmentDialog 
                managerId={profile.id} 
                teamMembers={teamMembers}
              />
            )}
          </div>
          
          <div className="pb-10">
            <ManagerTeamManagement />
          </div>
        </div>
      </div>
    </div>
  );
}
