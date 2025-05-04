
import { UserRole } from '@/types/user';

export interface PermissionCheck {
  canCreateTeams: boolean;
  canUpdateTeams: boolean;
  canViewTeams: boolean;
  canAssignTeamLeads: boolean;
  canAssignEmployees: boolean;
  canChangeUserRoles: boolean;
  canUploadProfileImage: boolean;
  canViewTasks: boolean;
  canUpdateTasks: boolean;
  canUpdateOwnProfile: boolean;
}

export function getUserPermissions(
  userRole: UserRole,
  targetUserId?: string,
  currentUserId?: string,
  isUserUnderManager: boolean = false
): PermissionCheck {
  // Base permissions
  const permissions: PermissionCheck = {
    canCreateTeams: false,
    canUpdateTeams: false,
    canViewTeams: false,
    canAssignTeamLeads: false,
    canAssignEmployees: false,
    canChangeUserRoles: false,
    canUploadProfileImage: true, // Everyone can upload profile image
    canViewTasks: true, // Everyone can view their own tasks
    canUpdateTasks: true, // Everyone can update their own tasks
    canUpdateOwnProfile: true, // Everyone can update their own profile
  };

  // Role-specific permissions
  switch (userRole) {
    case 'admin':
      permissions.canCreateTeams = true;
      permissions.canUpdateTeams = true;
      permissions.canViewTeams = true;
      permissions.canAssignTeamLeads = true;
      permissions.canAssignEmployees = true;
      permissions.canChangeUserRoles = targetUserId !== currentUserId; // Admin can't change their own role
      break;
      
    case 'manager':
      permissions.canCreateTeams = true;
      permissions.canUpdateTeams = true;
      permissions.canViewTeams = true;
      permissions.canAssignTeamLeads = isUserUnderManager;
      permissions.canAssignEmployees = isUserUnderManager;
      // Manager can only promote employees to team leads
      permissions.canChangeUserRoles = isUserUnderManager && targetUserId !== currentUserId;
      break;
      
    case 'team-lead':
      permissions.canViewTeams = true;
      break;
      
    case 'employee':
      // Default permissions only
      break;
  }

  return permissions;
}

export function canChangeUserRole(
  currentUserRole: UserRole,
  targetUserRole: UserRole,
  newRole: UserRole,
  isUserUnderManager: boolean = false
): boolean {
  // Admin can change anyone's role except their own
  if (currentUserRole === 'admin') {
    return true;
  }
  
  // Manager can only promote employees to team leads if they're under their management
  if (currentUserRole === 'manager' && isUserUnderManager) {
    // Only allow employee -> team-lead promotion
    return targetUserRole === 'employee' && newRole === 'team-lead';
  }
  
  // All other cases: no permission
  return false;
}

export function isAllowedToViewTeams(role: UserRole): boolean {
  // Admins, Managers, and Team Leads can view teams
  return ['admin', 'manager', 'team-lead'].includes(role);
}

export function isAllowedToManageTeams(role: UserRole): boolean {
  // Only Admins and Managers can manage teams
  return ['admin', 'manager'].includes(role);
}
