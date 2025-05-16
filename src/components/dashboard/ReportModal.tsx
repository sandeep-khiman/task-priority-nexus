
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Report, ReportingTask, FormTask, Task } from "@/types/report";
import { Pencil, Trash2, Save, Plus, CalendarIcon } from "lucide-react";
import TaskItem from "@/components/report/TaskItem";
import { useNavigate } from "react-router-dom";
import { useReports } from "@/contexts/ReportContext";
import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { getTasksAssignedToUser, CURRENT_USER_ID } from "@/data/mockTasks";
import TaskSelector from "@/components/report/TaskSelector";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface ReportModalProps {
  report: Report | null;
  selectedDate: Date;
  isOpen: boolean;
  onClose: () => void;
}

const ReportModal = ({ report, selectedDate, isOpen, onClose }: ReportModalProps) => {
  const navigate = useNavigate();
  const { addReport, deleteReport } = useReports();
  
  const [date, setDate] = useState<Date>(selectedDate);
  const [isOnLeave, setIsOnLeave] = useState(false);
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [tasks, setTasks] = useState<FormTask[]>([
    {
      id: uuidv4(),
      description: "",
      completionPercentage: 0,
      status: "Pending",
      issuedBy: "",
      project: "",
      taskId: undefined,
    },
  ]);
  
  // Add state for available tasks
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);

  // Fetch available tasks on component mount
  useEffect(() => {
    // In a real app, this would be an API call
    const userTasks = getTasksAssignedToUser(CURRENT_USER_ID);
    setAvailableTasks(userTasks);
  }, []);
  
  // Set initial form values when report or selectedDate changes
  useEffect(() => {
    if (report) {
      setDate(new Date(report.date));
      setIsOnLeave(report.is_on_leave);
      setIsHalfDay(report.is_half_day);
      
      // Convert ReportingTask[] to FormTask[]
      const convertedTasks: FormTask[] = report.tasks.map(task => ({
        id: task.id,
        description: task.description,
        completionPercentage: task.completion_percentage,
        status: task.status,
        issuedBy: "", // This field doesn't exist in ReportingTask
        comment: task.comment,
        project: task.project,
        taskId: task.original_task_id,
      }));
      
      setTasks(convertedTasks);
    } else {
      setDate(selectedDate);
      setIsOnLeave(false);
      setIsHalfDay(false);
      setTasks([
        {
          id: uuidv4(),
          description: "",
          completionPercentage: 0,
          status: "Pending",
          issuedBy: "",
          project: "",
          taskId: undefined,
        },
      ]);
    }
  }, [report, selectedDate]);

  const handleTaskChange = (updatedTask: FormTask) => {
    setTasks(tasks.map((task) => (task.id === updatedTask.id ? updatedTask : task)));
  };

  const addTask = () => {
    setTasks([
      ...tasks,
      {
        id: uuidv4(),
        description: "",
        completionPercentage: 0,
        status: "Pending",
        issuedBy: "",
        project: "",
        taskId: undefined,
      },
    ]);
  };

  const removeTask = (id: string) => {
    if (tasks.length > 1) {
      setTasks(tasks.filter((task) => task.id !== id));
    } else {
      toast.error("At least one task is required");
    }
  };
  
  const handleTaskSelect = (taskId: string, formTaskId: string) => {
    const selectedTask = availableTasks.find(t => t.id === taskId);
    
    if (selectedTask) {
      setTasks(tasks.map((task) => {
        if (task.id === formTaskId) {
          return {
            ...task,
            taskId: selectedTask.id,
            project: selectedTask.title, // Use task title as project name
            completionPercentage: selectedTask.progress, // Initialize with current progress
          };
        }
        return task;
      }));
    }
  };

  const handleSubmit = () => {
    // Validation
    if (!isOnLeave) {
      const hasEmptyRequiredFields = tasks.some(task => !task.description);
      if (hasEmptyRequiredFields) {
        toast.error("Please fill in all required fields");
        return;
      }
    }

    // Convert FormTask[] to ReportingTask[]
    const reportingTasks: ReportingTask[] = tasks.map(task => ({
      id: task.id,
      reporting_id: uuidv4(),
      task_id: task.id,
      description: task.description,
      completion_percentage: task.completionPercentage,
      status: task.status,
      comment: task.comment,
      project: task.project,
      created_at: new Date(),
      original_task_id: task.taskId, // Store the reference to the original task
    }));

    const updatedReport: Report = {
      id: report ? report.id : uuidv4(),
      user_id: report ? report.user_id : CURRENT_USER_ID, // Use current user ID
      date,
      is_on_leave: isOnLeave,
      is_half_day: isHalfDay,
      created_at: report ? report.created_at : new Date(),
      tasks: isOnLeave ? [] : reportingTasks,
    };

    addReport(updatedReport);
    toast.success(report ? "Report updated successfully" : "Report created successfully");
    onClose();
  };

  const handleDelete = () => {
    if (report) {
      deleteReport(report.id);
      toast.success("Report deleted successfully");
    }
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  const isEditMode = !!report;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg md:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Report" : "New Report"}
            {isEditMode && `: ${format(date, "MMMM d, yyyy")}`}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Date Picker (only shown for new reports) */}
          {!isEditMode && (
            <div className="space-y-2">
              <Label htmlFor="date">Report Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(newDate) => newDate && setDate(newDate)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Leave Status */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="leave"
                checked={isOnLeave}
                onCheckedChange={(checked) => {
                  setIsOnLeave(checked === true);
                  if (checked) {
                    setIsHalfDay(false);
                  }
                }}
              />
              <Label htmlFor="leave" className="font-medium">On Leave</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="halfday"
                checked={isHalfDay}
                disabled={isOnLeave}
                onCheckedChange={(checked) => {
                  setIsHalfDay(checked === true);
                }}
              />
              <Label
                htmlFor="halfday"
                className={isOnLeave ? "text-gray-400 font-medium" : "font-medium"}
              >
                Half Day
              </Label>
            </div>
          </div>

          {/* Tasks */}
          {!isOnLeave && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Tasks</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addTask}
                  className="flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" /> Add Task
                </Button>
              </div>

              <div className="space-y-6">
                {tasks.map((task, index) => (
                  <div key={task.id} className="space-y-4 border-b pb-4 last:border-b-0">
                    {/* Task Selector */}
                    <TaskSelector 
                      tasks={availableTasks}
                      selectedTaskId={task.taskId}
                      onSelectTask={(taskId) => handleTaskSelect(taskId, task.id)}
                    />
                    
                    {/* Task Form Fields */}
                    <TaskItem
                      key={task.id}
                      task={task}
                      onChange={handleTaskChange}
                      onDelete={() => removeTask(task.id)}
                      index={index}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {isEditMode ? (
            <>
              <Button
                variant="outline"
                onClick={handleCancel}
                className="flex items-center gap-1"
              >
                Cancel
              </Button>
              <Button
                variant="default"
                onClick={handleSubmit}
                className="flex items-center gap-1"
              >
                <Save className="h-4 w-4" /> Save
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                className="flex items-center gap-1"
              >
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleCancel}
                className="flex items-center gap-1"
              >
                Cancel
              </Button>
              <Button
                variant="default"
                onClick={handleSubmit}
                className="flex items-center gap-1"
              >
                <Save className="h-4 w-4" /> Save
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReportModal;
