
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
  leadId?: string; 
  teamLeadId?: string;
  teamLeadName?: string;
  managerId?: string;
  manager_id?: string; 
  managerName?: string;
  memberIds: string[];
  memberNames?: string[];
  createdAt?: string;
  updatedAt?: string;
  created_at?: string;
  updated_at?: string;
}

// Add missing types needed by components
export interface CreateTeamPayload {
  name: string;
  leadId?: string;
  memberIds: string[];
  managerId: string;
  manager_id?: string;
}

export interface EditTeamPayload {
  id: string;
  name: string;
  leadId?: string;
  memberIds?: string[];
  managerId?: string;
  manager_id?: string;
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

// Add missing types for SystemSettings component
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

// Helper type for JSON handling
export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

// Database profile type for Supabase interactions
export interface ProfileData {
  id: string;
  email: string;
  name: string;
  role: string;
  created_at: string;
  updated_at: string;
  manager_id?: string;
  avatar_url?: string;
}

// Define AuthState interface here instead of importing it
export interface AuthState {
  isAuthenticated: boolean;
  user: any | null; // Using 'any' for the Supabase user type
  session: any | null; // Using 'any' for the Supabase session type
  profile: User | null;
  isLoading: boolean;
  error: string | null;
}

// Update the AuthContextType interface
export interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, role?: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  updateUserRole: (userId: string, role: UserRole) => Promise<void>;
  updateUserProfile: (userId: string, updates: {
    name?: string;
    email?: string;
    avatarUrl?: string;
  }) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
}
