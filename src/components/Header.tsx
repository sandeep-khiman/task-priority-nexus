
import { useAuth } from '@/contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { CircleUserRound, Settings, ClipboardList, UsersRound } from 'lucide-react';

export function Header() {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <header className="bg-primary text-primary-foreground shadow-md">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold">Task Priority Nexus</span>
          </Link>
        </div>

        <nav className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link to="/" className="flex items-center">
              <ClipboardList className="mr-2 h-5 w-5" />
              Tasks
            </Link>
          </Button>

          {profile?.role === 'admin' && (
            <Button variant="ghost" asChild>
              <Link to="/admin" className="flex items-center">
                <Settings className="mr-2 h-5 w-5" />
                Admin Settings
              </Link>
            </Button>
          )}

          {profile?.role === 'manager' && (
            <Button variant="ghost" asChild>
              <Link to="/manager" className="flex items-center">
                <UsersRound className="mr-2 h-5 w-5" />
                Team Management
              </Link>
            </Button>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{profile ? getInitials(profile.name) : <CircleUserRound className="h-5 w-5" />}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              {profile && (
                <DropdownMenuItem className="flex flex-col items-start">
                  <div className="text-sm font-medium">{profile.name}</div>
                  <div className="text-xs text-muted-foreground">{profile.role}</div>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleLogout}>Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>
    </header>
  );
}
