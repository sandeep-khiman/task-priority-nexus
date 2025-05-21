
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Task, Quadrant } from '@/types/task';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext'; 
import { taskService } from '@/services/taskService';
import { userService } from '@/services/userService';
import { User, SystemSettings } from '@/types/user';
import { supabase } from '@/integrations/supabase/client';
import { determineTaskQuadrant, calculateTaskProgress } from '@/services/taskUtils';

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
  moveTask: (taskId: string, quadrant: Quadrant) => Promise<void>;
  toggleTaskCompletion: (taskId: string) => Promise<void>;
  hideCompleted: boolean;
  setHideCompleted: React.Dispatch<React.SetStateAction<boolean>>;
  selectedUserId: string | null;
  setSelectedUserId: (userId: string | null) => void;
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
  const [hideCompleted, setHideCompleted] = useState<boolean>(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [settings, setSettings] = useState<SystemSettings | null>(null);

  
  const { toast } = useToast();
  const { user, profile, isAuthenticated } = useAuth();

  // Load tasks when the user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchTasks();
      fetchUsers();
      fetchSystemSettings(); 
    } else {
      setTasks([]);
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  // Subscribe to task updates
   useEffect(() => {
    if (!isAuthenticated || !user) return;

    const tasksChannel = supabase
      .channel('tasks-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        // Refresh tasks when there are changes
        fetchTasks();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(tasksChannel);
    };
  }, [isAuthenticated, user]);

// Define it at component level (outside any useEffect)
const fetchSystemSettings = async () => {
  const { data, error } = await supabase
    .from('system_settings')
    .select('settings')
    .single();

  if (error) {
    console.error('Failed to fetch system settings:', error.message);
    return;
  }

  try {
    const parsedSettings: SystemSettings =
      typeof data.settings === 'string'
        ? JSON.parse(data.settings)
        : data.settings;

    setSettings(parsedSettings);
  } catch (e) {
    console.error('Failed to parse settings:', e);
  }
};

// Now your effect can use it safely
useEffect(() => {
  fetchSystemSettings();
}, []);
  

  // Fetch tasks from Supabase
  const fetchTasks = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const fetchedTasks = await taskService.getTasks();
      
      // Update tasks with appropriate quadrants based on due dates
      const updatedTasks = fetchedTasks.map(task => ({
        ...task,
        quadrant: task.quadrant ?? determineTaskQuadrant(task, settings)
      }));
      
      setTasks(updatedTasks);
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
      // Determine the appropriate quadrant based on due date
      const quadrant = taskData.quadrant || 
        (taskData.dueDate ? determineTaskQuadrant({
          ...taskData,
          dueDate: taskData.dueDate
        } as Task, settings) : 4);
      
      const newTask = await taskService.createTask({
        ...taskData,
        createdById: user.id,
        quadrant
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
  // const updateTask = async (taskData: any) => { 
  //   setIsLoading(true);
  //   try {
  //     const existingTask = tasks.find(t => t.id === taskData.id);
  //     if (!existingTask) return;
  // console.log("-----------------------------");
  
  //     const updatedQuadrant = taskData.dueDate
  //       ? determineTaskQuadrant({ ...existingTask, ...taskData }, settings)
  //       : existingTask.quadrant;
  
  //     const updatedTask = await taskService.updateTask({
  //       ...taskData,
  //       quadrant: updatedQuadrant
  //     });
  // console.log(updatedTask);
    
  //     if (updatedTask) {
  //       setTasks(prevTasks => 
  //         prevTasks.map(task => 
  //           task.id === updatedTask.id ? updatedTask : task
  //         )
  //       );
        
  //       toast({
  //         title: 'Task Updated',
  //         description: 'Your task has been updated successfully'
  //       });
  //     }
  //   } catch (err: any) {
  //     setError(err.message || 'Failed to update task');
  //     toast({
  //       title: 'Error',
  //       description: 'Failed to update task',
  //       variant: 'destructive'
  //     });
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };
const updateTask = async (taskData: any) => {
  setIsLoading(true);
  try {
    const existingTask = tasks.find(t => t.id === taskData.id);
    if (!existingTask) return;

    const dueDateChanged =
      existingTask.dueDate !== taskData.dueDate;

    console.log("-----------------------------");

    const updatedQuadrant = taskData.dueDate
      ? determineTaskQuadrant({ ...existingTask, ...taskData }, settings)
      : existingTask.quadrant;

    const updatedTask = await taskService.updateTask({
      ...taskData,
      quadrant: updatedQuadrant,
      dueDateChangeReason: dueDateChanged ? taskData.dueDateChangeReason : undefined
    });

    console.log(updatedTask);

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

  // Move task to different quadrant
  const moveTask = async (taskId: string, quadrant: Quadrant) => {
    setIsLoading(true);
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;
      
      const updatedTask = await taskService.updateTask({
        id: taskId,
        quadrant
      });
      
      if (updatedTask) {
        setTasks(prevTasks => 
          prevTasks.map(task => 
            task.id === updatedTask.id ? updatedTask : task
          )
        );
        
        toast({
          title: 'Task Updated',
          description: 'Task moved to new quadrant successfully'
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to move task');
      toast({
        title: 'Error',
        description: 'Failed to move task',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Toggle task completion status
  const toggleTaskCompletion = async (taskId: string) => {
    setIsLoading(true);
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;
      
      // Calculate new completion state
      const newCompleted = !task.completed;
      
      // Update progress based on completion state
      const newProgress = calculateTaskProgress(task, newCompleted);
      
      const updatedTask = await taskService.updateTask({
        id: taskId,
        completed: newCompleted,
        progress: newProgress
      });
      
      if (updatedTask) {
        setTasks(prevTasks => 
          prevTasks.map(task => 
            task.id === updatedTask.id ? updatedTask : task
          )
        );
        
        toast({
          title: 'Task Updated',
          description: `Task marked as ${updatedTask.completed ? 'completed' : 'incomplete'}`
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

  // Return visible users based on permissions
  const getVisibleUsers = (): User[] => {
    return users;
  };

  // Apply filters to tasks
  const filteredTasks = tasks.filter(task => {
    // Filter by completion status
    if (hideCompleted && task.completed) {
      return false;
    }

    // Filter by assignee
    if (selectedUserId && task.assignedToId !== selectedUserId) {
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
    getVisibleUsers,
    moveTask,
    toggleTaskCompletion,
    hideCompleted,
    setHideCompleted,
    selectedUserId,
    setSelectedUserId
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};
