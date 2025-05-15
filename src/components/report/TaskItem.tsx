
import { Task } from "@/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskItemProps {
  task: Task;
  onChange: (task: Task) => void;
  onDelete: () => void;
  disabled?: boolean;
  index: number;
}

const TaskItem = ({ task, onChange, onDelete, disabled = false, index }: TaskItemProps) => {
  const handleChange = (key: keyof Task, value: string | number) => {
    onChange({ ...task, [key]: value });
  };

  return (
    <Card className={cn("mb-4", "animate-slide-in", "border-l-4", 
      task.status === "Completed" ? "border-l-green-500" : 
      task.status === "In Progress" ? "border-l-blue-500" : "border-l-orange-300")}>
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Task #{index + 1}</h3>
          <Button
            variant="ghost" 
            size="icon"
            onClick={onDelete}
            disabled={disabled}
            className="text-gray-500 hover:text-red-500"
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`description-${task.id}`}>Task Description *</Label>
              <Input
                id={`description-${task.id}`}
                value={task.description}
                onChange={(e) => handleChange("description", e.target.value)}
                disabled={disabled}
                placeholder="Describe your task"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor={`issuedBy-${task.id}`}>Issued By *</Label>
              <Input
                id={`issuedBy-${task.id}`}
                value={task.issuedBy}
                onChange={(e) => handleChange("issuedBy", e.target.value)}
                disabled={disabled}
                placeholder="Manager/Client Name"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`status-${task.id}`}>Status *</Label>
              <Select
                value={task.status}
                onValueChange={(value) => handleChange("status", value)}
                disabled={disabled}
              >
                <SelectTrigger id={`status-${task.id}`}>
                  <SelectValue placeholder="Select a status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor={`project-${task.id}`}>Project</Label>
              <Input
                id={`project-${task.id}`}
                value={task.project || ""}
                onChange={(e) => handleChange("project", e.target.value)}
                disabled={disabled}
                placeholder="Project Name (Optional)"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor={`completion-${task.id}`}>Completion Percentage: {task.completionPercentage}%</Label>
            </div>
            <Slider
              id={`completion-${task.id}`}
              value={[task.completionPercentage]}
              min={0}
              max={100}
              step={5}
              disabled={disabled}
              onValueChange={(value) => handleChange("completionPercentage", value[0])}
              className="py-4"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`comment-${task.id}`}>Comments</Label>
            <Textarea
              id={`comment-${task.id}`}
              value={task.comment || ""}
              onChange={(e) => handleChange("comment", e.target.value)}
              disabled={disabled}
              placeholder="Additional comments (Optional)"
              className="h-20"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskItem;
