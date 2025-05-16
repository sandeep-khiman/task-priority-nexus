
import React from "react";
import { Label } from "@/components/ui/label";
import { Task } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

interface TaskSelectorProps {
  tasks: Task[];
  selectedTaskId: string | undefined;
  onSelectTask: (taskId: string) => void;
}

const TaskSelector: React.FC<TaskSelectorProps> = ({
  tasks,
  selectedTaskId,
  onSelectTask,
}) => {
  // Find the currently selected task to display its details
  const selectedTask = tasks.find(task => task.id === selectedTaskId);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="task">Select Task</Label>
        <Select
          value={selectedTaskId}
          onValueChange={onSelectTask}
        >
          <SelectTrigger id="task">
            <SelectValue placeholder="Select a task..." />
          </SelectTrigger>
          <SelectContent>
            {tasks.map((task) => (
              <SelectItem key={task.id} value={task.id}>
                {task.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Display selected task details */}
      {selectedTask && (
        <Card className="bg-muted/50">
          <CardContent className="pt-4 space-y-2 text-sm">
            <div><span className="font-medium">Due:</span> {selectedTask.dueDate ? new Date(selectedTask.dueDate).toLocaleDateString() : 'No due date'}</div>
            <div><span className="font-medium">Current Progress:</span> {selectedTask.progress}%</div>
            <div><span className="font-medium">Notes:</span> {selectedTask.notes}</div>
            <div><span className="font-medium">Priority:</span> Quadrant {selectedTask.quadrant}</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TaskSelector;
