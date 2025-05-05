
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
import { Calendar, Trash2, UserCheck } from 'lucide-react';
import { EditTaskDialog } from './EditTaskDialog';
import { useState, useRef } from 'react';
import { Badge } from './ui/badge';

interface TaskCardProps {
  task: Task;
}

function TaskCard({ task }: TaskCardProps) {
  const { profile } = useAuth();
  const { deleteTask } = useTaskContext();
  const [isDragging, setIsDragging] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Check if user has permission to modify this task
  const canModifyTask = () => {
    if (!profile) return false;
    
    if (profile.role === 'admin') return true;
    if (profile.role === 'manager') {
      return true; 
    }
    if (profile.role === 'team-lead') {
      return true; 
    }
    return task.assignedToId === profile.id || task.createdById === profile.id;
  };
  
  const priorityColor = getPriorityColor(task);
  const priorityLabel = getPriorityLabel(task);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('taskId', task.id);
    e.dataTransfer.effectAllowed = 'move';
    setIsDragging(true);
    
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const dragGhost = document.createElement('div');
      dragGhost.style.position = 'absolute';
      dragGhost.style.top = '-1000px';
      dragGhost.style.opacity = '0';
      document.body.appendChild(dragGhost);
      
      e.dataTransfer.setDragImage(dragGhost, 0, 0);
      
      setTimeout(() => {
        document.body.removeChild(dragGhost);
      }, 0);
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };
  
  return (
    <Card 
      ref={cardRef}
      className={`w-full cursor-grab relative ${isDragging ? 'opacity-50' : ''} text-sm`}
      draggable={true}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div 
        className={`absolute top-0 left-0 right-0 h-1 rounded-t-md ${priorityColor}`}
        title={priorityLabel}
      ></div>
      <CardHeader className="p-2 pb-1">
        <div className="flex justify-between items-start gap-2">
          <div className="flex items-center gap-1">
            <div className="flex-shrink-0">
              <TaskCompletionToggle task={task} />
            </div>
            <h3 className={`font-medium text-xs ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
              {task.title}
            </h3>
          </div>
          <div className="text-base">{task.icon || '📝'}</div>
        </div>
      </CardHeader>
      <CardContent className="p-2 pt-0 pb-1">
        {task.assignedToName && (
          <Badge variant="outline" className="mb-1 text-xs flex items-center gap-1">
            <UserCheck size={10} />
            {task.assignedToName}
          </Badge>
        )}
        
        {task.notes && (
          <p className="text-xs text-muted-foreground mt-1 mb-1 line-clamp-2">{task.notes}</p>
        )}
        <Progress 
          value={task.progress} 
          className="h-1 mt-1" 
        />
      </CardContent>
      <CardFooter className="p-2 pt-1 flex items-center text-xs text-muted-foreground gap-1 justify-between">
        <div className="flex items-center gap-1">
          {task.dueDate && (
            <span className="flex items-center gap-1">
              <Calendar size={10} />
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
              <Trash2 size={12} />
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}

export default TaskCard;
