
export type Quadrant = 1 | 2 | 3 | 4 | 5;

export interface Task {
  id: string;
  title: string;
  notes: string;
  icon: string;
  progress: number;
  createdById: string;
  createdByName: string;
  assignedToId: string;
  assignedToName: string;
  dueDate: string | null;
  completed: boolean;
  quadrant: Quadrant;
  createdAt: string;
  updatedAt: string;
}

export interface FormTask {
  id: string;
  description: string;
  completionPercentage: number;
  status: "Pending" | "In Progress" | "Completed";
  comment?: string;
  issuedBy: string;
  project?: string;
  taskId?: string; // Reference to the original task
}

export interface ReportingTask {
  id: string;
  reporting_id: string;
  task_id: string;
  description: string;
  completion_percentage: number;
  status: "Pending" | "In Progress" | "Completed";
  comment?: string;
  project?: string;
  created_at: Date;
  original_task_id?: string; // Reference to the task from the database
}

export interface Report {
  id: string;
  user_id: string;
  date: Date;
  is_on_leave: boolean;
  is_half_day: boolean;
  created_at: Date;
  tasks: ReportingTask[];
}

export type ReportStatus = "on-leave" | "half-day" | "completed" | "none";
