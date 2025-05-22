
export enum Quadrant {
  Important_Urgent = 1,
  Important_NotUrgent = 2,
  NotImportant_Urgent = 3,
  NotImportant_NotUrgent = 4,
  Routine_Tasks = 5
}

export interface Task {
  id: string;
  title: string;
  notes?: string;
  icon?: string;
  progress: number;
  createdById: string;
  createdByName: string;
  assignedToId: string;
  assignedToName: string;
  dueDate?: string | null;
  completed: boolean;
  quadrant: Quadrant;
  createdAt: string;
  updatedAt: string;
}

export interface DueDateChange {
  id: string;
  task_id: string;
  last_due_date: string;
  updated_due_date: string;
  reason_to_change: string;
  created_at: string;
}

export interface TaskProgressUpdate {
  id: string;
  created_at: string;
  task_id: string;
  current_progress: number;
  previous_progress: number;
  updates: string;
}
