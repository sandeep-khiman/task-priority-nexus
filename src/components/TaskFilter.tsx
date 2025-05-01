
import { useTaskContext } from '@/contexts/TaskContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export function TaskFilter() {
  const { hideCompleted, setHideCompleted, selectedUserId, setSelectedUserId, getVisibleUsers } = useTaskContext();
  const visibleUsers = getVisibleUsers();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="flex-1">
        <Select
          value={selectedUserId || ''}
          onValueChange={value => setSelectedUserId(value === '' ? null : value)}
        >
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filter by team member" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All team members</SelectItem>
            {visibleUsers.map(user => (
              <SelectItem key={user.id} value={user.id}>
                {user.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex items-center space-x-2">
        <Switch
          id="hide-completed"
          checked={hideCompleted}
          onCheckedChange={setHideCompleted}
        />
        <Label htmlFor="hide-completed">Hide completed tasks</Label>
      </div>
    </div>
  );
}
