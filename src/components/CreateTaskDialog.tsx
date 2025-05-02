
// Just fixing specific parts of the component
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useTaskContext } from '@/contexts/TaskContext';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { CalendarIcon, Plus } from 'lucide-react';
import { Quadrant } from '@/types/task';
import { User } from '@/types/user';
import { userService } from '@/services/userService';

const initialTaskState = {
  title: '',
  notes: '',
  icon: '📋',
  progress: 0,
  createdById: '',
  createdByName: '',
  assignedToId: '',
  assignedToName: '',
  dueDate: null as string | null,
  completed: false,
  quadrant: 1 as Quadrant
};

const emojis = ['📋', '📝', '📊', '📈', '🔍', '⚙️', '🧩', '🔧', '📱', '💻', '🔔', '🎯', '⏰', '🔥'];

export function CreateTaskDialog() {
  const { user, profile } = useAuth();
  const { createTask, getVisibleUsers } = useTaskContext();
  const [open, setOpen] = useState(false);
  const [taskData, setTaskData] = useState(initialTaskState);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [assignableUsers, setAssignableUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Fetch users that can be assigned tasks
  useEffect(() => {
    if (open && user) {
      const users = getVisibleUsers();
      setAssignableUsers(users);
      
      // Default to assigning to self if no assignee is selected
      if (!taskData.assignedToId && profile) {
        setTaskData(prev => ({
          ...prev,
          assignedToId: profile.id,
          assignedToName: profile.name
        }));
      }
    }
  }, [open, user, profile]);
  
  const handleCreateTask = async () => {
    if (!user || !taskData.title || !taskData.assignedToId) return;
    
    setIsLoading(true);
    
    try {
      // Find assigned user name
      const assignedUser = assignableUsers.find(u => u.id === taskData.assignedToId);
      
      await createTask({
        ...taskData,
        createdById: user.id,
        createdByName: user?.profile?.name || '',
        assignedToName: assignedUser?.name || ''
      });
      
      // Reset form
      setTaskData(initialTaskState);
      setDate(undefined);
      setOpen(false);
    } catch (error) {
      console.error('Error creating task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-1">
          <Plus className="h-4 w-4" /> New Task
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="task-title">Title</Label>
            <Input 
              id="task-title" 
              value={taskData.title} 
              onChange={(e) => setTaskData({...taskData, title: e.target.value})} 
              placeholder="Task title..."
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="task-notes">Notes</Label>
            <Textarea 
              id="task-notes" 
              value={taskData.notes} 
              onChange={(e) => setTaskData({...taskData, notes: e.target.value})}
              placeholder="Task details..."
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Icon</Label>
              <Select 
                value={taskData.icon} 
                onValueChange={(value) => setTaskData({...taskData, icon: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select icon" />
                </SelectTrigger>
                <SelectContent>
                  {emojis.map((emoji) => (
                    <SelectItem key={emoji} value={emoji}>
                      <div className="flex items-center">
                        <span className="mr-2 text-lg">{emoji}</span>
                        <span>Icon</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label>Priority Quadrant</Label>
              <Select 
                value={taskData.quadrant.toString()} 
                onValueChange={(value) => setTaskData({
                  ...taskData, 
                  quadrant: parseInt(value) as Quadrant
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select quadrant" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Urgent & Important</SelectItem>
                  <SelectItem value="2">Important, Not Urgent</SelectItem>
                  <SelectItem value="3">Urgent, Not Important</SelectItem>
                  <SelectItem value="4">Neither</SelectItem>
                  <SelectItem value="5">Routine</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(newDate) => {
                      setDate(newDate);
                      setTaskData({
                        ...taskData,
                        dueDate: newDate ? newDate.toISOString() : null
                      });
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="grid gap-2">
              <Label>Assign To</Label>
              <Select 
                value={taskData.assignedToId || ''} 
                onValueChange={(value) => setTaskData({...taskData, assignedToId: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  {assignableUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} {user.id === profile?.id ? '(You)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end">
          <Button 
            onClick={handleCreateTask} 
            disabled={!taskData.title || !taskData.assignedToId || isLoading}
          >
            {isLoading ? 'Creating...' : 'Create Task'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
