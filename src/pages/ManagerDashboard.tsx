
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { ManagerTeamManagement } from '@/components/ManagerTeamManagement';
import { useToast } from '@/components/ui/use-toast';

export default function ManagerDashboard() {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  
  useEffect(() => {
    // Welcome message
    if (user?.role === 'manager') {
      toast({
        title: `Welcome, ${user.name}`,
        description: 'Here you can manage your teams and team members.',
      });
    }
  }, [user, toast]);

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  // Ensure only managers can access this page
  if (user?.role !== 'manager') {
    return <Navigate to="/" />;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex-1">
        <div className="container py-6 space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Team Management Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Manage your teams and assign team members
            </p>
          </div>
          
          <div className="pb-10">
            <ManagerTeamManagement />
          </div>
        </div>
      </div>
    </div>
  );
}
