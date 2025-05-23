import { Link, useLocation } from 'react-router-dom';
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
import {
  KeyRound,
  ListTodo,
  LogOut,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ✅ Custom hook for active path check
function useIsActive(path: string, exact = false) {
  const location = useLocation();
  if (exact) {
    return location.pathname === path;
  }
  return location.pathname === path || location.pathname.startsWith(`${path}/`);
}

export function Header() {
  const { isAuthenticated, profile, logout } = useAuth();
  const location = useLocation();

  const getUserInitials = (name: string): string =>
    name?.split(' ').map((part) => part[0]).join('').toUpperCase().substring(0, 2) || 'U';

  const formatRole = (role: string): string =>
    role.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase());

  const permissions = profile
    ? getUserPermissions(profile.role)
    : {
        canViewTeams: false,
        canCreateTeams: false,
      };

  return (
    <header className="border-b bg-[#7c7da4] ">
      <div className="container flex h-16 items-center justify-between">
        {/* Left Side */}
        <div className="flex items-center gap-6">
          <Link to="/" className="font-bold text-4xl">
            TaskFlow
          </Link>

          {isAuthenticated && profile && (
            <nav className="hidden md:flex items-center gap-6">
              <Link
                to="/dashboard"
                className={cn(
                  'px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2',
                  useIsActive('/dashboard',true) ? 'bg-[#464786] text-white'
                    : 'text-white hover:text-primary'
                )}
              >
                Dashboard
              </Link>

              {permissions.canViewTeams && (
                <Link
                  to={profile.role === 'manager' ? '/manager' : '/teams'}
                  className={cn(
                    'px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2',
                    useIsActive(profile.role === 'manager' ? '/manager' : '/teams',true)? 'bg-[#464786] text-white'
                    : 'text-white hover:text-primary'
                  )}
                >
                  Teams
                </Link>
              )}

              {profile.role === 'admin' && (
                <Link
                  to="/admin"
                  className={cn(
                    'px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2',
                    useIsActive('/admin', true)
                    ? 'bg-[#464786] text-white'
                    : 'text-white hover:text-primary'
                  )}
                >
                  Admin
                </Link>
              )}

              
              <Link
                to="/reportDashboard"
                className={cn(
                  'px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2',
                  useIsActive('/reportDashboard', true)
                    ? 'bg-[#464786] text-white'
                    : 'text-white hover:text-primary'
                )}
              >
                Report Dashboard
              </Link>

              <Link
                to="/employee-management"
                className={cn(
                  'px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2',
                  useIsActive('/employee-management', true)
                    ? 'bg-[#464786] text-white'
                    : 'text-white hover:text-primary'
                )}
              >
                Employee
              </Link>
            </nav>
          )}
        </div>

        {/* Right Side */}
        {isAuthenticated && profile ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  {profile.avatar_url ? (
                    <AvatarImage src={profile.avatar_url} alt={profile.name} />
                  ) : (
                    <AvatarFallback className="text-xs bg-[#464786] text-primary-foreground">
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
                    {formatRole(profile.role)}
                  </span>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              <DropdownMenuItem asChild>
                <Link to="/profile">
                  <User className="mr-2 h-4 w-4" />
                  My Profile
                </Link>
              </DropdownMenuItem>

              {/* <DropdownMenuItem asChild>
                <Link to="/tasks">
                  <ListTodo className="mr-2 h-4 w-4" />
                  My Tasks
                </Link>
              </DropdownMenuItem> */}

              {/* <DropdownMenuItem asChild>
                <Link to="/reset-password" className="flex items-center">
                  <KeyRound className="mr-2 h-4 w-4" />
                  Reset Password
                </Link>
              </DropdownMenuItem> */}

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={logout}
                className="text-red-500 cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
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
