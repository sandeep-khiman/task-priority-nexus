
export interface Task {
  id: string;
  description: string;
  completionPercentage: number;
  status: "Pending" | "In Progress" | "Completed";
  comment?: string;
  issuedBy: string;
  project?: string;
}

export interface Report {
  id: string;
  date: Date;
  isOnLeave: boolean;
  isHalfDay: boolean;
  tasks: Task[];
}

export type ReportStatus = "on-leave" | "half-day" | "completed" | "none";
