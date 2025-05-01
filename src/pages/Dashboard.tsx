
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import QuadrantBoard from '@/components/QuadrantBoard';
import { TaskFilter } from '@/components/TaskFilter';
import { CreateTaskDialog } from '@/components/CreateTaskDialog';
import { useToast } from '@/components/ui/use-toast';

export default function Dashboard() {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  
  useEffect(() => {
    // Welcome message showing role-specific info
    if (user) {
      let message = '';
      switch (user.role) {
        case 'admin':
          message = 'You have full access to all tasks and users.';
          break;
        case 'manager':
          message = 'You can view and manage tasks for your team leads and employees.';
          break;
        case 'team-lead':
          message = 'You can view and manage tasks for your team members.';
          break;
        case 'employee':
          message = 'You can view and manage your personal tasks.';
          break;
      }
      
      toast({
        title: `Welcome, ${user.name}`,
        description: message,
      });
    }
  }, [user]);

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex-1">
        <div className="container py-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Task Management</h1>
              <p className="text-muted-foreground mt-1">
                Organize your tasks using the Eisenhower Matrix
              </p>
            </div>
            <div className="flex gap-2">
              <CreateTaskDialog />
            </div>
          </div>
          
          <TaskFilter />
          
          <div className="pb-10">
            <QuadrantBoard />
          </div>
        </div>
      </div>
    </div>
  );
}
