
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { UserRoleManagement } from '@/components/UserRoleManagement';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Header } from '@/components/Header';
import { TeamManagement } from '@/components/TeamManagement';
import { SystemSettings } from '@/components/SystemSettings';

export default function AdminSettings() {
  const { profile } = useAuth();

  // Only allow admins to access this page
  if (!profile || profile.role !== 'admin') {
    return <Navigate to="/" />;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex-1">
        <div className="container py-6 space-y-6">
          <h1 className="text-3xl font-bold">Admin Settings</h1>
          
          <Tabs defaultValue="users">
            <TabsList className="grid w-full md:w-[500px] grid-cols-3 bg-[#7C8EA4]  text-white">
              <TabsTrigger value="users">User Management</TabsTrigger>
              <TabsTrigger value="teams">Team Management</TabsTrigger>
              <TabsTrigger value="system">System Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="users" className="space-y-4 mt-4">
              <UserRoleManagement />
            </TabsContent>

            <TabsContent value="teams" className="space-y-4 mt-4">
              <TeamManagement />
            </TabsContent>
            
            <TabsContent value="system" className="space-y-4 mt-4">
              <SystemSettings />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
