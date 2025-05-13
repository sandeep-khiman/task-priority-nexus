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
  const [nextCheckedState, setNextCheckedState] = useState<boolean | undefined>(undefined);
  
  const handleToggle = (checked: boolean) => {
    setNextCheckedState(checked);
    setShowConfirmation(true);
  };
  
  const handleConfirm = () => {
    toggleTaskCompletion(task.id);
    setShowConfirmation(false);
  };

  const handleCancel = () => {
    setShowConfirmation(false);
    setNextCheckedState(undefined);
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
            <AlertDialogTitle>
              {nextCheckedState ? 'Mark as completed?' : 'Mark as incomplete?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {nextCheckedState 
                ? 'Are you sure you want to mark this task as completed?' 
                : 'Are you sure you want to mark this task as incomplete?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
