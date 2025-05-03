
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Task } from '@/types/task';
import { format } from 'date-fns';
import { UserRole } from '@/types/user';
import { useAuth } from '@/contexts/AuthContext';
import { getPriorityColor, getPriorityLabel } from '@/services/taskUtils';
import { TaskCompletionToggle } from './TaskCompletionToggle';
import { Button } from './ui/button';
import { useTaskContext } from '@/contexts/TaskContext';
import { Calendar, Trash2 } from 'lucide-react';
import { EditTaskDialog } from './EditTaskDialog';

interface TaskCardProps {
  task: Task;
}

function TaskCard({ task }: TaskCardProps) {
  const { profile } = useAuth();
  const { deleteTask } = useTaskContext();
  
  // Check if user has permission to modify this task
  const canModifyTask = () => {
    if (!profile) return false;
    
    // Admins can modify all tasks
    if (profile.role === 'admin') return true;
    
    // Managers can modify tasks of users who report to them
    if (profile.role === 'manager') {
      // In a real implementation, we'd check if the task's assignedToId user
      // has the current user as their manager
      return true; // Simplified for now
    }
    
    // Team leads can modify tasks of their team members
    if (profile.role === 'team-lead') {
      // In a real implementation, we'd check if the assignedToId is in the team lead's team
      return true; // Simplified for now
    }
    
    // Users can modify their own tasks
    return task.assignedToId === profile.id || task.createdById === profile.id;
  };
  
  const priorityColor = getPriorityColor(task);
  const priorityLabel = getPriorityLabel(task);
  
  return (
    <Card className="w-full cursor-grab relative">
      <div 
        className={`absolute top-0 left-0 right-0 h-1 rounded-t-md ${priorityColor}`}
        title={priorityLabel}
      ></div>
      <CardHeader className="p-3 pb-1">
        <div className="flex justify-between items-start gap-2">
          <div className="flex items-center gap-2">
            <div className="flex-shrink-0">
              <TaskCompletionToggle task={task} />
            </div>
            <h3 className={`font-medium text-sm ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
              {task.title}
            </h3>
          </div>
          <div className="text-xl">{task.icon || '📝'}</div>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-1 pb-1">
        {task.notes && (
          <p className="text-xs text-muted-foreground mt-1 mb-2">{task.notes}</p>
        )}
        <Progress 
          value={task.progress} 
          className="h-2 mt-2" 
        />
      </CardContent>
      <CardFooter className="p-3 pt-1 flex flex-wrap items-center text-xs text-muted-foreground gap-2 justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="bg-gray-100 px-2 py-0.5 rounded-full">
            @{task.assignedToName}
          </span>
          {task.dueDate && (
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              {format(new Date(task.dueDate), 'MMM d')}
            </span>
          )}
        </div>
        {canModifyTask() && (
          <div className="flex items-center">
            <EditTaskDialog task={task} />
            <Button
              variant="ghost" 
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                deleteTask(task.id);
              }}
            >
              <Trash2 size={14} />
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}

export default TaskCard;
