
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Task, Quadrant } from '@/types/task';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext'; 
import { taskService } from '@/services/taskService';
import { userService } from '@/services/userService';
import { User } from '@/types/user';

interface TaskFilterState {
  showCompleted: boolean;
  searchQuery: string;
  assigneeFilter: string;
}

interface TaskContextType {
  tasks: Task[];
  filteredTasks: Task[];
  isLoading: boolean;
  error: string | null;
  filter: TaskFilterState;
  setFilter: React.Dispatch<React.SetStateAction<TaskFilterState>>;
  createTask: (task: any) => Promise<void>;
  updateTask: (task: any) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  getVisibleUsers: () => User[];
}

const initialFilterState: TaskFilterState = {
  showCompleted: false,
  searchQuery: '',
  assigneeFilter: 'all'
};

const TaskContext = createContext<TaskContextType | null>(null);

export const useTaskContext = (): TaskContextType => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTaskContext must be used within a TaskProvider');
  }
  return context;
};

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<TaskFilterState>(initialFilterState);
  const { toast } = useToast();
  const { user, profile, isAuthenticated } = useAuth();

  // Load tasks when the user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchTasks();
      fetchUsers();
    } else {
      setTasks([]);
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  // Fetch tasks from Supabase
  const fetchTasks = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const fetchedTasks = await taskService.getTasks();
      setTasks(fetchedTasks);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch tasks');
      toast({
        title: 'Error',
        description: 'Failed to load tasks',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch users based on the current user's role
  const fetchUsers = async () => {
    if (!user || !profile) return;
    
    try {
      let fetchedUsers: User[] = [];
      
      switch (profile.role) {
        case 'admin':
          fetchedUsers = await userService.getUsers();
          break;
        case 'manager':
          // For managers, get all users from their teams
          // This would need a more sophisticated query in a real app
          fetchedUsers = await userService.getUsers();
          break;
        case 'team-lead':
          // Get team members for this team lead
          const teamMembers = await userService.getTeamMembersByLeadId(user.id);
          // Also add the team lead themselves
          const leadUser = await userService.getUserById(user.id);
          if (leadUser) {
            fetchedUsers = [leadUser, ...teamMembers];
          } else {
            fetchedUsers = teamMembers;
          }
          break;
        case 'employee':
          // Employees can only see themselves
          const employeeUser = await userService.getUserById(user.id);
          if (employeeUser) {
            fetchedUsers = [employeeUser];
          }
          break;
      }
      
      setUsers(fetchedUsers);
    } catch (err: any) {
      console.error('Error fetching users:', err);
    }
  };

  // Create a new task
  const createTask = async (taskData: any) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const newTask = await taskService.createTask({
        ...taskData,
        createdById: user.id,
      });
      
      setTasks(prevTasks => [newTask, ...prevTasks]);
      toast({
        title: 'Task Created',
        description: 'Your task has been created successfully'
      });
    } catch (err: any) {
      setError(err.message || 'Failed to create task');
      toast({
        title: 'Error',
        description: 'Failed to create task',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Update an existing task
  const updateTask = async (taskData: any) => {
    setIsLoading(true);
    try {
      const updatedTask = await taskService.updateTask(taskData);
      
      if (updatedTask) {
        setTasks(prevTasks => 
          prevTasks.map(task => 
            task.id === updatedTask.id ? updatedTask : task
          )
        );
        
        toast({
          title: 'Task Updated',
          description: 'Your task has been updated successfully'
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update task');
      toast({
        title: 'Error',
        description: 'Failed to update task',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a task
  const deleteTask = async (taskId: string) => {
    setIsLoading(true);
    try {
      await taskService.deleteTask(taskId);
      
      setTasks(prevTasks => 
        prevTasks.filter(task => task.id !== taskId)
      );
      
      toast({
        title: 'Task Deleted',
        description: 'Your task has been deleted successfully'
      });
    } catch (err: any) {
      setError(err.message || 'Failed to delete task');
      toast({
        title: 'Error',
        description: 'Failed to delete task',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Return visible users based on permissions
  const getVisibleUsers = (): User[] => {
    return users;
  };

  // Apply filters to tasks
  const filteredTasks = tasks.filter(task => {
    // Filter by completion status
    if (!filter.showCompleted && task.completed) {
      return false;
    }

    // Filter by assignee
    if (filter.assigneeFilter !== 'all' && task.assignedToId !== filter.assigneeFilter) {
      return false;
    }

    // Filter by search query
    if (filter.searchQuery && !task.title.toLowerCase().includes(filter.searchQuery.toLowerCase())) {
      return false;
    }

    return true;
  });

  const value: TaskContextType = {
    tasks,
    filteredTasks,
    isLoading,
    error,
    filter,
    setFilter,
    createTask,
    updateTask,
    deleteTask,
    getVisibleUsers
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};
