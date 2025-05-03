
import { User as SupabaseUser } from '@supabase/supabase-js';

export type UserRole = 'admin' | 'manager' | 'team-lead' | 'employee';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  managerId?: string; // ID of the manager this user reports to
  manager_id?: string; // Match DB schema for Supabase
  createdAt: string;
  updatedAt: string;
  teamId?: string; // ID of the team the user belongs to (for employees)
  teamMembers?: string[]; // IDs of team members (for team leads)
}

export interface AuthState {
  isAuthenticated: boolean;
  user: SupabaseUser | null;
  profile: User | null;
  isLoading: boolean;
  error: string | null;
}

export interface Team {
  id: string;
  name: string;
  manager_id?: string; // Match DB schema
  managerId?: string;  // For easier component access
  leadId?: string;
  memberIds?: string[];
  created_at?: string; // Match DB schema
  updated_at?: string; // Match DB schema
}

export interface CreateTeamPayload {
  name: string;
  leadId: string;
  memberIds: string[];
  managerId: string;
  manager_id?: string; // Match DB schema
}

export interface EditTeamPayload {
  id: string;
  name: string;
  leadId?: string; // Making this optional to match usage
  memberIds: string[];
  managerId: string;
  manager_id?: string; // Match DB schema
}

export interface SystemSettings {
  taskDueDateThresholds: {
    critical: number; // days until due date for critical priority
    medium: number; // days until due date for medium priority
    low: number; // days after medium threshold
  };
  tasksPerPage: number;
  defaultSortOrder: string;
  markOverdueDays: number;
  warningDays: number;
}

// Add this interface to help with type conversions between Supabase Json and our app types
export interface SystemSettingsJson {
  taskDueDateThresholds: {
    critical: number;
    medium: number;
    low: number;
  };
  tasksPerPage: number;
  defaultSortOrder: string;
  markOverdueDays: number;
  warningDays: number;
}
