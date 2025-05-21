
export type Quadrant = 1 | 2 | 3 | 4 | 5; // 5 is for routine tasks

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

export interface due_date_change{
  id:string;
  created_at :string;
  task_id:string;
  last_due_date:string;
  reason_to_change:string;
  updated_due_date:string;
}
