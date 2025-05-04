
export type UserRole = 'admin' | 'manager' | 'team-lead' | 'employee';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
  managerId?: string;
  managerName?: string;
  teamIds?: string[];
  teamNames?: string[];
  avatarUrl?: string;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  teamLeadId?: string;
  teamLeadName?: string;
  managerId?: string;
  managerName?: string;
  memberIds: string[];
  memberNames?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SystemSettings {
  taskDueDateThresholds: {
    critical: number;
    medium: number;
    low: number;
  };
  tasksPerPage: number;
  defaultSortOrder: 'duedate-asc' | 'duedate-desc' | 'priority-asc' | 'priority-desc';
  markOverdueDays: number;
  warningDays: number;
}
