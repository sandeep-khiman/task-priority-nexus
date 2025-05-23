
import { useTaskContext } from '@/contexts/TaskContext';
import { useAuth } from '@/contexts/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

export function TaskFilter() {
  const { hideCompleted, setHideCompleted, selectedUserId, setSelectedUserId, getVisibleUsers } = useTaskContext();
  const { profile } = useAuth();
  const visibleUsers = getVisibleUsers();


  // Get user role label for display
  const getUserRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-red-500 ml-2">Admin</Badge>;
      case 'manager':
        return <Badge className="bg-blue-500 ml-2">Manager</Badge>;
      case 'team-lead':
        return <Badge className="bg-green-500 ml-2">Team Lead</Badge>;
      default:
        return <Badge className="bg-gray-500 ml-2">Employee</Badge>;
    }
  };

  return (
    <div className="bg-[#7c7da4] p-4 rounded-lg shadow-sm border">

      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
  {profile.role === 'employee' ? (
    <div className="text-lg font-medium">
      Hello, {profile.name}!
    </div>
  ) : (
    <Select
      value={selectedUserId || 'all'}
      onValueChange={value => setSelectedUserId(value === 'all' ? null : value)}
    >
      <SelectTrigger className="w-full sm:w-[250px]">
        <SelectValue placeholder="Filter by team member" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All team members</SelectItem>
        {visibleUsers.map(user => (
          <SelectItem key={user.id} value={user.id}>
            <div className="flex items-center">
              <span>{user.name}</span>
              {getUserRoleLabel(user.role)}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )}
</div>

        <div className="flex items-center space-x-2">
          <Switch
            id="hide-completed"
            checked={hideCompleted}
            onCheckedChange={setHideCompleted}
          />
          <Label htmlFor="hide-completed" className='text-white'>Hide completed tasks</Label>
        </div>
      </div>
    </div>
  );
}
