import { useState } from 'react';
import { Task, Quadrant } from '@/types/task';
import TaskCard from './TaskCard';
import TaskCardSkeleton from './TaskCardSkeleton';
import { useTaskContext } from '@/contexts/TaskContext';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  Target,
  Clock,
  HelpCircle,
  RotateCcw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Button } from './ui/button';

const quadrantLabels: Record<Quadrant, string> = {
  1: 'Urgent & Important',
  2: 'Important, Not Urgent',
  3: 'Urgent, Not Important',
  4: 'Neither Urgent nor Important',
  5: 'Routine Tasks'
};

const quadrantIcons: Record<Quadrant, React.ReactNode> = {
  1: <AlertTriangle className="w-4 h-4 text-red-500" />,
  2: <Target className="w-4 h-4 text-blue-500" />,
  3: <Clock className="w-4 h-4 text-amber-500" />,
  4: <HelpCircle className="w-4 h-4 text-gray-500" />,
  5: <RotateCcw className="w-4 h-4 text-green-500" />
};

interface QuadrantProps {
  quadrant: Quadrant;
  tasks: Task[];
}

function QuadrantColumn({ quadrant, tasks }: QuadrantProps) {
  const { moveTask, isLoading } = useTaskContext();
  const [isDragOver, setIsDragOver] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      moveTask(taskId, quadrant);
    }
    setIsDragOver(false);
  };

  const displayTasks = isExpanded ? tasks : tasks.slice(0, 5);
  const hasMoreTasks = tasks.length > 5;

  return (
   <div className="flex flex-col h-full bg-[#7dc6e8] p-2 rounded-lg border shadow-sm">

       <h2 className="font-medium mb-2 flex items-center justify-between text-m text-white">
  <span className="flex items-center">
    <span className="mr-1">{quadrantIcons[quadrant]}</span>
    {quadrantLabels[quadrant]}
  </span>
  <span>Count: ({tasks.length})</span>
</h2>
      <div
        className={cn(
          'quadrant flex-1 overflow-y-auto rounded-md p-1 bg-gray-50',
          { 'bg-blue-50 border-2 border-dashed border-blue-300': isDragOver },
          { 'max-h-[400px]': isExpanded, 'max-h-[300px]': !isExpanded }
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="space-y-2">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, idx) => (
              <TaskCardSkeleton key={idx} />
            ))
          ) : displayTasks.length === 0 ? (
            <div className="text-center text-muted-foreground py-2 text-xs">
              No tasks in this quadrant
            </div>
          ) : (
            displayTasks.map(task => (
              <TaskCard key={task.id} task={task} />
            ))
          )}
        </div>
      </div>
      {hasMoreTasks && (
        <Button
          variant="ghost"
          size="sm"
          className="mt-1 text-xs flex items-center justify-center py-0 h-6 text-white"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-3 w-3 mr-1 text-white" />
              Show Less
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3 mr-1 text-white" />
              Show All ({tasks.length})
            </>
          )}
        </Button>
      )}
    </div>
  );
}

export default function QuadrantBoard() {
  const { filteredTasks } = useTaskContext();

  const quadrant1Tasks = filteredTasks.filter(task => task.quadrant === 1);
  const quadrant2Tasks = filteredTasks.filter(task => task.quadrant === 2);
  const quadrant3Tasks = filteredTasks.filter(task => task.quadrant === 3);
  const quadrant4Tasks = filteredTasks.filter(task => task.quadrant === 4);
  const routineTasks = filteredTasks.filter(task => task.quadrant === 5);

  return (
    <div className="space-y-4">
      {/* Eisenhower Matrix - 2x2 Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <QuadrantColumn quadrant={1} tasks={quadrant1Tasks} />
        <QuadrantColumn quadrant={2} tasks={quadrant2Tasks} />
        <QuadrantColumn quadrant={3} tasks={quadrant3Tasks} />
        <QuadrantColumn quadrant={4} tasks={quadrant4Tasks} />
      </div>

      {/* Routine Tasks Section */}
      <div className="mt-3">
        <QuadrantColumn quadrant={5} tasks={routineTasks} />
      </div>
    </div>
  );
}
