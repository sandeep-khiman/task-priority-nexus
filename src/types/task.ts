
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
