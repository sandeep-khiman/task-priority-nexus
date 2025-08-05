import { differenceInDays } from 'date-fns';
import { Task, Quadrant } from '@/types/task';
import { SystemSettings } from '@/types/user';

// Default settings if none are provided
const defaultSettings: SystemSettings = {
  taskDueDateThresholds: {
    critical: 2, // ≤ 2 days → Critical (Quadrant 1)
    medium: 4,   // 2-4 days → Medium (Quadrant 2)
    low: 6       // > =6 days → Low (Quadrant 3 or 4 based on importance)
  },
  tasksPerPage: 10,
  defaultSortOrder: 'duedate-asc',
  markOverdueDays: 3,
  warningDays: 2
};

/**
 * Determine task quadrant based on due date and settings
 */
export const determineTaskQuadrant = (
  task: Task, 
  settings: SystemSettings | null = defaultSettings
): Quadrant => {
  if (!task.dueDate) return 4;

  const dueDate = new Date(task.dueDate);
  if (isNaN(dueDate.getTime())) return 4;

  const today = new Date();
  const daysUntilDue = differenceInDays(dueDate, today);

  if (task.completed) return task.quadrant;

  if (daysUntilDue < 0) return 1;

  const thresholds = settings?.taskDueDateThresholds ?? defaultSettings.taskDueDateThresholds;
  const { critical, medium, low } = thresholds;

  if (daysUntilDue <= critical) return 1;
  if (daysUntilDue <= medium) return 2;
  if (daysUntilDue <= low) return 3;
  return 4;
};

/**
 * Update task progress based on completion status 
 */
export const calculateTaskProgress = (task: Task, completed: boolean): number => {
  if (completed) {
    return 100;
  }
  
  // If uncompleting a task, set progress back to 0
  // In a real app, we might have subtasks that contribute to progress
  return 0;
};

/**
 * Get the priority color based on due date
 */
export const getPriorityColor = (
  task: Task, 
  settings: SystemSettings = defaultSettings
): string => {
  if (task.completed) {
    return 'bg-green-500'; // Completed tasks are green
  }
  
  if (!task.dueDate) {
    return 'bg-gray-400'; // No due date
  }
  
  const dueDate = new Date(task.dueDate);
  const today = new Date();
  const daysUntilDue = differenceInDays(dueDate, today);
  
  // Past due tasks are red
  if (daysUntilDue < 0) {
    return 'bg-red-600';
  }
  
  const { critical, medium,low } = settings.taskDueDateThresholds;
  
  if (daysUntilDue < critical) {
    return 'bg-red-500'; // Critical
  } else if (daysUntilDue < medium) {
    return 'bg-yellow-500'; // Medium
  }else if (daysUntilDue < low) {
    return 'bg-blue-500'; // Medium
  } else {
    return 'bg-green-500'; // Low
  }
};

/**
 * Get the priority label based on due date
 */
export const getPriorityLabel = (
  task: Task, 
  settings: SystemSettings = defaultSettings
): string => {
  if (task.completed) {
    return 'Completed';
  }
  
  if (!task.dueDate) {
    return 'No due date';
  }
  
  const dueDate = new Date(task.dueDate);
  const today = new Date();
  const daysUntilDue = differenceInDays(dueDate, today);
  
  // Past due tasks
  if (daysUntilDue < 0) {
    return `Overdue by ${Math.abs(daysUntilDue)} days`;
  }
  
  const { critical, medium ,low} = settings.taskDueDateThresholds;
  
  if (daysUntilDue < critical) {
    return daysUntilDue === 0 ? 'Due today!' : `Due in ${daysUntilDue} days`;
  } else if (daysUntilDue <medium) {
    return `Due in ${daysUntilDue} days`;
  } else if (daysUntilDue < low) {
    return `Due in ${daysUntilDue} days`;
  } else {
    return `Due in ${daysUntilDue} days`;
  }
};
