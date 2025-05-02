
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { UserRoleManagement } from '@/components/UserRoleManagement';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Header } from '@/components/Header';
import { TeamManagement } from '@/components/TeamManagement';
import { useToast } from '@/components/ui/use-toast';

export default function AdminSettings() {
  const { profile } = useAuth();
  const { toast } = useToast();

  // Only allow admins to access this page
  if (!profile || profile.role !== 'admin') {
    return <Navigate to="/" />;
  }

  const handleSaveSettings = () => {
    toast({
      title: "Settings saved",
      description: "Your changes have been saved successfully."
    });
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex-1">
        <div className="container py-6 space-y-6">
          <h1 className="text-3xl font-bold">Admin Settings</h1>
          
          <Tabs defaultValue="users">
            <TabsList className="grid w-full md:w-[500px] grid-cols-3">
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
              <Card>
                <CardHeader>
                  <CardTitle>Task Rules</CardTitle>
                  <CardDescription>
                    Configure the behavior of tasks based on dates and other factors
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="overdue-days">Mark tasks as overdue after (days)</Label>
                      <Input id="overdue-days" type="number" defaultValue="3" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="warning-days">Show warning for tasks due within (days)</Label>
                      <Input id="warning-days" type="number" defaultValue="2" />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleSaveSettings}>Save Changes</Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Display Settings</CardTitle>
                  <CardDescription>
                    Configure how tasks are displayed in the app
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tasks-per-page">Tasks per page</Label>
                      <Input id="tasks-per-page" type="number" defaultValue="10" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="default-sort">Default sort order</Label>
                      <select id="default-sort" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2">
                        <option value="duedate-asc">Due Date (earliest first)</option>
                        <option value="duedate-desc">Due Date (latest first)</option>
                        <option value="priority-desc">Priority (high to low)</option>
                        <option value="created-desc">Created Date (newest first)</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleSaveSettings}>Save Changes</Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
