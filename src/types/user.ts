
import { User as SupabaseUser } from '@supabase/supabase-js';

export type UserRole = 'admin' | 'manager' | 'team-lead' | 'employee';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
  teamId?: string; // ID of the team the user belongs to (for employees)
  teamMembers?: string[]; // IDs of team members (for team leads)
  managerId?: string; // ID of the manager this user reports to (for team leads)
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
  manager_id?: string; // Changed from managerId to match DB schema
  leadId?: string;
  memberIds?: string[];
  created_at?: string; // Added to match DB schema
  updated_at?: string; // Added to match DB schema
}

export interface CreateTeamPayload {
  name: string;
  leadId: string;
  memberIds: string[];
  managerId: string;
}

export interface EditTeamPayload {
  id: string;
  name: string;
  leadId: string;
  memberIds: string[];
  managerId: string;
}
