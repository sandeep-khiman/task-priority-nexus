
import { useState } from 'react';
import { Task, Quadrant } from '@/types/task';
import { TaskCard } from './TaskCard';
import { useTaskContext } from '@/contexts/TaskContext';
import { cn } from '@/lib/utils';

const quadrantLabels: Record<Quadrant, string> = {
  1: 'Urgent & Important',
  2: 'Important, Not Urgent',
  3: 'Urgent, Not Important',
  4: 'Neither Urgent nor Important',
  5: 'Routine Tasks'
};

const quadrantEmojis: Record<Quadrant, string> = {
  1: '🔥',
  2: '🎯',
  3: '⏰',
  4: '🤔',
  5: '🔄'
};

interface QuadrantProps {
  quadrant: Quadrant;
  tasks: Task[];
}

function QuadrantColumn({ quadrant, tasks }: QuadrantProps) {
  const { moveTask } = useTaskContext();
  const [isDragOver, setIsDragOver] = useState(false);
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    moveTask(taskId, quadrant);
    setIsDragOver(false);
  };

  return (
    <div className="flex flex-col h-full bg-white p-4 rounded-lg border shadow-sm">
      <h2 className="font-medium mb-3 flex items-center">
        <span className="mr-2 text-xl">{quadrantEmojis[quadrant]}</span>
        {quadrantLabels[quadrant]}
      </h2>
      <div 
        className={cn(
          'quadrant flex-1 min-h-[400px] max-h-[600px] overflow-y-auto rounded-md p-2 bg-gray-50',
          { 'bg-blue-50 border-2 border-dashed border-blue-300': isDragOver }
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="space-y-3">
          {tasks.length === 0 ? (
            <div className="text-center text-muted-foreground py-4">
              No tasks in this quadrant
            </div>
          ) : (
            tasks.map(task => (
              <TaskCard key={task.id} task={task} />
            ))
          )}
        </div>
      </div>
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
    <div className="space-y-6">
      {/* Eisenhower Matrix - 2x2 Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <QuadrantColumn quadrant={1} tasks={quadrant1Tasks} />
        <QuadrantColumn quadrant={2} tasks={quadrant2Tasks} />
        <QuadrantColumn quadrant={3} tasks={quadrant3Tasks} />
        <QuadrantColumn quadrant={4} tasks={quadrant4Tasks} />
      </div>
      
      {/* Routine Tasks Section */}
      <div className="mt-6">
        <QuadrantColumn quadrant={5} tasks={routineTasks} />
      </div>
    </div>
  );
}
