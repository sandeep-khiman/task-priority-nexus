
import { useState } from 'react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { Task } from '@/types/task';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { useTaskContext } from '@/contexts/TaskContext';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
  draggable?: boolean;
}

export function TaskCard({ task, draggable = true }: TaskCardProps) {
  const { toggleTaskCompletion } = useTaskContext();
  const [showDetails, setShowDetails] = useState(false);

  const today = new Date();
  const isDueToday = task.dueDate && 
    format(parseISO(task.dueDate), 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
  
  const isOverdue = task.dueDate && 
    differenceInDays(parseISO(task.dueDate), today) < 0;
  
  const isWarning = task.dueDate && 
    differenceInDays(parseISO(task.dueDate), today) <= 2 && 
    differenceInDays(parseISO(task.dueDate), today) >= 0;

  const cardClassName = cn(
    'task-card animate-fade-in',
    {
      'overdue': isOverdue,
      'warning': isWarning && !isOverdue,
      'opacity-75': task.completed
    }
  );

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    if (draggable) {
      e.dataTransfer.setData('taskId', task.id);
      e.dataTransfer.effectAllowed = 'move';
    }
  };

  return (
    <div 
      className={cardClassName}
      draggable={draggable && !task.completed} 
      onDragStart={handleDragStart}
      onClick={() => setShowDetails(!showDetails)}
    >
      <div className="flex items-start gap-2">
        <div className="text-2xl">{task.icon || '📋'}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="font-medium truncate text-sm">{task.title}</h3>
            <Checkbox 
              checked={task.completed} 
              onCheckedChange={() => {
                toggleTaskCompletion(task.id);
              }}
              onClick={(e) => e.stopPropagation()}
              className="ml-2 h-4 w-4"
            />
          </div>
          
          <div className="flex flex-wrap text-xs text-muted-foreground gap-x-2 mt-1">
            <span className="flex items-center">
              <span className="font-medium">By:</span> {task.createdByName}
            </span>
            <span className="flex items-center">
              <span className="font-medium">For:</span> {task.assignedToName}
            </span>
          </div>
          
          {task.dueDate && (
            <div className={cn(
              "text-xs mt-1",
              {
                "text-danger font-medium": isOverdue,
                "text-warning font-medium": isWarning && !isOverdue,
                "text-accent font-medium": isDueToday && !isOverdue
              }
            )}>
              {isOverdue ? "Overdue: " : "Due: "}
              {format(parseISO(task.dueDate), 'MMM d, yyyy')}
            </div>
          )}
          
          <Progress value={task.progress} className="h-1 mt-2" />
        </div>
      </div>
      
      {showDetails && (
        <div className="mt-3 pt-2 border-t text-sm animate-scale-in">
          <p className="text-muted-foreground">{task.notes}</p>
        </div>
      )}
    </div>
  );
}
