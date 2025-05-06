
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { getUserPermissions } from '@/utils/permissionUtils';
import { KeyRound } from 'lucide-react';

export function Header() {
  const { isAuthenticated, profile, logout } = useAuth();

  // Function to get user initials for avatar fallback
  const getUserInitials = (name: string): string => {
    return name
      ?.split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2) || 'U';
  };

  // Get permissions based on user role
  const permissions = profile ? getUserPermissions(profile.role) : {
    canViewTeams: false,
    canCreateTeams: false
  };

  const handlePasswordReset = async () => {
    try {
      // Redirect to the reset password page
      window.location.href = '/reset-password';
    } catch (error) {
      console.error('Error redirecting to reset password:', error);
    }
  };

  return (
    <header className="border-b">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="font-bold text-lg">
            TaskFlow
          </Link>
          {isAuthenticated && profile && (
            <nav className="hidden md:flex items-center gap-6">
              <Link 
                to="/dashboard" 
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                Dashboard
              </Link>
              
              {permissions.canViewTeams && (
                <Link 
                  to={profile.role === 'manager' ? "/manager" : "/teams"} 
                  className="text-sm font-medium transition-colors hover:text-primary"
                >
                  Teams
                </Link>
              )}
              
              {profile.role === 'admin' && (
                <Link 
                  to="/admin" 
                  className="text-sm font-medium transition-colors hover:text-primary"
                >
                  Admin
                </Link>
              )}
            </nav>
          )}
        </div>
        {isAuthenticated && profile ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  {profile.avatarUrl ? (
                    <AvatarImage src={profile.avatarUrl} alt={profile.name} />
                  ) : (
                    <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                      {getUserInitials(profile.name)}
                    </AvatarFallback>
                  )}
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span>{profile.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {profile.role.charAt(0).toUpperCase() + profile.role.slice(1).replace('-', ' ')}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/profile">My Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/tasks">My Tasks</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/reset-password" className="flex items-center">
                  <KeyRound className="mr-2 h-4 w-4" />
                  Reset Password
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={logout}
                className="text-red-500 cursor-pointer"
              >
                Log Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button asChild variant="default">
            <Link to="/login">Log In</Link>
          </Button>
        )}
      </div>
    </header>
  );
}
