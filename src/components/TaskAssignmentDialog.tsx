
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { CalendarIcon, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types/user';

interface TaskAssignmentDialogProps {
  managerId: string;
  teamMembers: User[];
}

export function TaskAssignmentDialog({ managerId, teamMembers }: TaskAssignmentDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [assignedUserId, setAssignedUserId] = useState<string>('');
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [isCreating, setIsCreating] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setTitle('');
      setNotes('');
      setAssignedUserId('');
      setDueDate(undefined);
    }
  }, [open]);

  const handleCreateTask = async () => {
    if (!title || !assignedUserId) {
      toast({
        title: "Missing information",
        description: "Please provide a task title and assign it to a team member",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);

    try {
      // Create the task in the database
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .insert({
          title,
          notes,
          created_by_id: managerId,
          assigned_to_id: assignedUserId,
          due_date: dueDate ? dueDate.toISOString() : null,
          quadrant: 1, // Default quadrant
        })
        .select('*')
        .single();
        
      if (taskError) {
        throw taskError;
      }
      
      // Reset form and close dialog
      setTitle('');
      setNotes('');
      setAssignedUserId('');
      setDueDate(undefined);
      setOpen(false);
      
      toast({
        title: "Task created",
        description: `Task "${title}" has been assigned to ${teamMembers.find(m => m.id === assignedUserId)?.name}`
      });
    } catch (error: any) {
      console.error('Error creating task:', error);
      toast({
        title: "Task creation failed",
        description: error.message || "An error occurred while creating the task",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="gap-1">
          <ClipboardList className="h-4 w-4 mr-1" /> Assign Task
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <ClipboardList className="mr-2 h-5 w-5" />
            Assign New Task
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="task-title">Task Title</Label>
            <Input 
              id="task-title" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="Enter task title..."
              required
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="task-notes">Task Description</Label>
            <Textarea
              id="task-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter task details..."
              className="min-h-[100px]"
            />
          </div>
          
          <div className="grid gap-2">
            <Label>Assign To</Label>
            <Select 
              value={assignedUserId} 
              onValueChange={setAssignedUserId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select team member" />
              </SelectTrigger>
              <SelectContent>
                {teamMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <Label>Due Date (Optional)</Label>
            <Popover open={dateOpen} onOpenChange={setDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dueDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, "PPP") : "Select a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={(date) => {
                    setDueDate(date);
                    setDateOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isCreating}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreateTask} 
            disabled={!title || !assignedUserId || isCreating}
          >
            {isCreating ? "Creating..." : "Assign Task"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
