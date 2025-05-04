import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { SystemSettings as SystemSettingsType, SystemSettingsJson, Json } from '@/types/user';

export function SystemSettings() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<SystemSettingsType>({
    taskDueDateThresholds: {
      critical: 2,
      medium: 5,
      low: 5,
    },
    tasksPerPage: 10,
    defaultSortOrder: 'duedate-asc',
    markOverdueDays: 3,
    warningDays: 2,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('id', 'global')
        .maybeSingle(); // Use maybeSingle instead of single to avoid errors if record doesn't exist

      if (error) throw error;

      if (data) {
        // First cast to unknown then to our type to avoid direct type conversion errors
        const settingsData = data.settings as unknown as SystemSettingsJson;
        setSettings({
          taskDueDateThresholds: {
            critical: settingsData.taskDueDateThresholds?.critical ?? 2,
            medium: settingsData.taskDueDateThresholds?.medium ?? 5,
            low: settingsData.taskDueDateThresholds?.low ?? 5,
          },
          tasksPerPage: settingsData.tasksPerPage ?? 10,
          defaultSortOrder: (settingsData.defaultSortOrder as "duedate-asc" | "duedate-desc" | "priority-asc" | "priority-desc") ?? 'duedate-asc',
          markOverdueDays: settingsData.markOverdueDays ?? 3,
          warningDays: settingsData.warningDays ?? 2,
        });
      } else {
        console.log('No system settings found, will create on save');
      }
    } catch (error) {
      console.error('Error fetching system settings:', error);
      toast({
        title: 'Error',
        description: 'Could not load system settings',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      // Convert our typed settings to a format compatible with Supabase's Json type
      const settingsJson: SystemSettingsJson = {
        taskDueDateThresholds: settings.taskDueDateThresholds,
        tasksPerPage: settings.tasksPerPage,
        defaultSortOrder: settings.defaultSortOrder,
        markOverdueDays: settings.markOverdueDays,
        warningDays: settings.warningDays,
      };

      console.log('Saving settings:', settingsJson);

      // First check if the record exists
      const { data: existingData, error: checkError } = await supabase
        .from('system_settings')
        .select('id')
        .eq('id', 'global')
        .maybeSingle();

      if (checkError) throw checkError;

      let result;
      if (existingData) {
        // Update existing record
        result = await supabase
          .from('system_settings')
          .update({ settings: settingsJson as unknown as Json })
          .eq('id', 'global')
          .select();
      } else {
        // Insert new record
        result = await supabase
          .from('system_settings')
          .insert({ 
            id: 'global', 
            settings: settingsJson as unknown as Json 
          })
          .select();
      }

      if (result.error) throw result.error;

      toast({
        title: 'Settings Saved',
        description: 'System settings have been updated successfully',
      });
    } catch (error) {
      console.error('Error saving system settings:', error);
      toast({
        title: 'Error',
        description: 'Could not save system settings',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (
    section: keyof SystemSettingsType,
    field: string,
    value: number | string
  ) => {
    if (section === 'taskDueDateThresholds') {
      setSettings({
        ...settings,
        taskDueDateThresholds: {
          ...settings.taskDueDateThresholds,
          [field]: typeof value === 'string' ? parseInt(value) || 0 : value,
        },
      });
    } else {
      setSettings({
        ...settings,
        [field as keyof SystemSettingsType]: typeof value === 'string' ? parseInt(value) || 0 : value,
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>System Settings</CardTitle>
          <CardDescription>Loading settings...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Settings</CardTitle>
        <CardDescription>
          Configure global system settings and defaults
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-md font-medium">Task Due Date Thresholds</h3>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="critical-days">Critical (days)</Label>
              <Input
                id="critical-days"
                type="number"
                min="1"
                max="30"
                value={settings.taskDueDateThresholds.critical}
                onChange={(e) =>
                  handleInputChange(
                    'taskDueDateThresholds',
                    'critical',
                    e.target.value
                  )
                }
              />
              <p className="text-xs text-muted-foreground">
                Tasks due within this many days are considered critical
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="medium-days">Medium (days)</Label>
              <Input
                id="medium-days"
                type="number"
                min="1"
                max="30"
                value={settings.taskDueDateThresholds.medium}
                onChange={(e) =>
                  handleInputChange(
                    'taskDueDateThresholds',
                    'medium',
                    e.target.value
                  )
                }
              />
              <p className="text-xs text-muted-foreground">
                Tasks due within this many days are considered medium priority
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="low-days">Low (days)</Label>
              <Input
                id="low-days"
                type="number"
                min="1"
                max="30"
                value={settings.taskDueDateThresholds.low}
                onChange={(e) =>
                  handleInputChange('taskDueDateThresholds', 'low', e.target.value)
                }
              />
              <p className="text-xs text-muted-foreground">
                Tasks due after the medium threshold are considered low priority
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-md font-medium">Display Settings</h3>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tasks-per-page">Tasks Per Page</Label>
              <Input
                id="tasks-per-page"
                type="number"
                min="5"
                max="100"
                step="5"
                value={settings.tasksPerPage}
                onChange={(e) =>
                  handleInputChange('tasksPerPage', 'tasksPerPage', e.target.value)
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mark-overdue-days">Mark Overdue After (days)</Label>
              <Input
                id="mark-overdue-days"
                type="number"
                min="0"
                max="30"
                value={settings.markOverdueDays}
                onChange={(e) =>
                  handleInputChange('markOverdueDays', 'markOverdueDays', e.target.value)
                }
              />
              <p className="text-xs text-muted-foreground">
                Tasks overdue by this many days will be highlighted
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-md font-medium">Notification Settings</h3>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="warning-days">Warning Days</Label>
              <Input
                id="warning-days"
                type="number"
                min="1"
                max="30"
                value={settings.warningDays}
                onChange={(e) =>
                  handleInputChange('warningDays', 'warningDays', e.target.value)
                }
              />
              <p className="text-xs text-muted-foreground">
                Send warnings this many days before due date
              </p>
            </div>
          </div>
        </div>

        <Button
          onClick={saveSettings}
          disabled={isSaving}
          className="w-full md:w-auto"
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>
      </CardContent>
    </Card>
  );
}
