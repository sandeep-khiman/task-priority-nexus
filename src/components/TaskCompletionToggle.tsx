
import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Task } from '@/types/task';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { useTaskContext } from '@/contexts/TaskContext';

interface TaskCompletionToggleProps {
  task: Task;
}

export function TaskCompletionToggle({ task }: TaskCompletionToggleProps) {
  const { toggleTaskCompletion } = useTaskContext();
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  const handleToggle = (checked: boolean) => {
    if (task.completed && !checked) {
      // If we're unchecking a completed task, show confirmation
      setShowConfirmation(true);
    } else {
      // If we're checking an uncompleted task, just toggle it
      toggleTaskCompletion(task.id);
    }
  };
  
  const handleConfirmUncheck = () => {
    toggleTaskCompletion(task.id);
    setShowConfirmation(false);
  };
  
  return (
    <>
      <Checkbox 
        checked={task.completed}
        onCheckedChange={handleToggle}
        className="data-[state=checked]:bg-green-500"
      />
      
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Undo completion?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark this task as incomplete? 
              This will reset the task's completion status.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmUncheck}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
