
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
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

export interface Team {
  id: string;
  name: string;
  leadId: string;
  memberIds: string[];
}

export interface CreateTeamPayload {
  name: string;
  leadId: string;
  memberIds: string[];
}
