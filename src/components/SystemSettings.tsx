
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { SystemSettings } from '@/types/user';
import { supabase } from '@/integrations/supabase/client';

export function SystemSettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<SystemSettings>({
    taskDueDateThresholds: {
      critical: 2, // ≤ 2 days → Critical
      medium: 5,   // 3-5 days → Medium
      low: 5       // > 5 days → Low
    },
    tasksPerPage: 10,
    defaultSortOrder: 'duedate-asc',
    markOverdueDays: 3,
    warningDays: 2
  });
  
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    
    try {
      // In a real app, we would save this to the database
      // For now, we'll just simulate a delay and success
      
      // Example of how we could save settings to Supabase:
      // await supabase
      //  .from('system_settings')
      //  .upsert({ 
      //    id: 'global', 
      //    settings: settings 
      //  });
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast({
        title: "Settings saved",
        description: "Your system settings have been updated successfully."
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleInputChange = (field: string, value: string | number) => {
    if (field.startsWith('taskDueDateThresholds.')) {
      const thresholdKey = field.split('.')[1] as 'critical' | 'medium' | 'low';
      setSettings(prev => ({
        ...prev,
        taskDueDateThresholds: {
          ...prev.taskDueDateThresholds,
          [thresholdKey]: typeof value === 'string' ? parseInt(value) : value
        }
      }));
    } else {
      setSettings(prev => ({
        ...prev,
        [field]: typeof value === 'string' && !isNaN(Number(value)) ? parseInt(value) : value
      }));
    }
  };

  return (
    <>
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
              <Input 
                id="overdue-days" 
                type="number" 
                value={settings.markOverdueDays}
                onChange={(e) => handleInputChange('markOverdueDays', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="warning-days">Show warning for tasks due within (days)</Label>
              <Input 
                id="warning-days" 
                type="number" 
                value={settings.warningDays}
                onChange={(e) => handleInputChange('warningDays', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSaveSettings} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </CardFooter>
      </Card>
      
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Task Prioritization</CardTitle>
          <CardDescription>
            Configure how tasks are prioritized based on due dates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-6 h-6 rounded-full bg-red-500"></div>
              <div className="flex-1">
                <Label htmlFor="critical-threshold" className="flex items-center">
                  Critical Priority (Due within)
                </Label>
                <div className="flex gap-2 items-center mt-1">
                  <Input 
                    id="critical-threshold" 
                    type="number" 
                    value={settings.taskDueDateThresholds.critical}
                    onChange={(e) => handleInputChange('taskDueDateThresholds.critical', e.target.value)}
                    className="w-20"
                  />
                  <span>days or less</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="w-6 h-6 rounded-full bg-yellow-500"></div>
              <div className="flex-1">
                <Label htmlFor="medium-threshold" className="flex items-center">
                  Medium Priority (Due within)
                </Label>
                <div className="flex gap-2 items-center mt-1">
                  <Input 
                    id="medium-threshold" 
                    type="number" 
                    value={settings.taskDueDateThresholds.medium}
                    onChange={(e) => handleInputChange('taskDueDateThresholds.medium', e.target.value)}
                    className="w-20"
                  />
                  <span>days</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="w-6 h-6 rounded-full bg-green-500"></div>
              <div className="flex-1">
                <Label htmlFor="low-threshold">Low Priority</Label>
                <div className="mt-1">
                  <span>Due more than {settings.taskDueDateThresholds.medium} days from now</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSaveSettings} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </CardFooter>
      </Card>
      
      <Card className="mt-4">
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
              <Input 
                id="tasks-per-page" 
                type="number" 
                value={settings.tasksPerPage}
                onChange={(e) => handleInputChange('tasksPerPage', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="default-sort">Default sort order</Label>
              <select 
                id="default-sort" 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                value={settings.defaultSortOrder}
                onChange={(e) => handleInputChange('defaultSortOrder', e.target.value)}
              >
                <option value="duedate-asc">Due Date (earliest first)</option>
                <option value="duedate-desc">Due Date (latest first)</option>
                <option value="priority-desc">Priority (high to low)</option>
                <option value="created-desc">Created Date (newest first)</option>
              </select>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSaveSettings} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </CardFooter>
      </Card>
    </>
  );
}
