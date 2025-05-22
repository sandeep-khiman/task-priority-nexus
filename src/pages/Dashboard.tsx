
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import QuadrantBoard from '@/components/QuadrantBoard';
import { TaskFilter } from '@/components/TaskFilter';
import { CreateTaskDialog } from '@/components/CreateTaskDialog';
import { useToast } from '@/components/ui/use-toast';
import { ClipboardList } from 'lucide-react';

export default function Dashboard() {
  const { isAuthenticated, profile } = useAuth();
  const { toast } = useToast();
  
  // useEffect(() => {
  //   // Welcome message showing role-specific info
  //   if (profile) {
  //     let message = '';
  //     switch (profile.role) {
  //       case 'admin':
  //         message = 'You have full access to all tasks and users.';
  //         break;
  //       case 'manager':
  //         message = 'You can view and manage tasks for your team leads and employees.';
  //         break;
  //       case 'team-lead':
  //         message = 'You can view and manage tasks for your team members.';
  //         break;
  //       case 'employee':
  //         message = 'You can view and manage your personal tasks.';
  //         break;
  //     }
      
  //     toast({
  //       title: `Welcome, ${profile.name}`,
  //       description: message,
  //     });
  //   }
  // }, []);

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
              <h1 className="text-3xl font-bold flex items-center">
                <ClipboardList className="mr-3 h-7 w-7" /> 
                Task Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">
                Organize your tasks using the Eisenhower Priority Matrix
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
