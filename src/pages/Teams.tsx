
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { TeamManagement } from '@/components/TeamManagement';
import { useToast } from '@/components/ui/use-toast';

export default function Teams() {
  const { isAuthenticated, profile } = useAuth();
  const { toast } = useToast();
  
  // useEffect(() => {
  //   if (profile) {
  //     toast({
  //       title: `Welcome to Team Management`,
  //       description: 'Here you can view and manage teams.',
  //     });
  //   }
  // }, [profile, toast]);

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex-1">
        <div className="container py-6 space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Teams</h1>
            <p className="text-muted-foreground mt-1">
              View and manage teams
            </p>
          </div>
          
          <div className="pb-10">
            <TeamManagement />
          </div>
        </div>
      </div>
    </div>
  );
}
