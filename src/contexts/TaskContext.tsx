
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Task, Quadrant } from '@/types/task';
import { User, UserRole } from '@/types/user';
import { useAuth } from './AuthContext';
import { format, addDays, parseISO, isAfter, isBefore, differenceInDays } from 'date-fns';

interface TaskContextType {
  tasks: Task[];
  filteredTasks: Task[];
  isLoading: boolean;
  error: string | null;
  hideCompleted: boolean;
  selectedUserId: string | null;
  createTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTask: (task: Task) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  moveTask: (taskId: string, quadrant: Quadrant) => Promise<void>;
  updateTaskProgress: (taskId: string, progress: number) => Promise<void>;
  toggleTaskCompletion: (taskId: string) => Promise<void>;
  setHideCompleted: (hide: boolean) => void;
  setSelectedUserId: (userId: string | null) => void;
  getVisibleUsers: () => User[];
  recalculateQuadrants: () => void;
}

const TaskContext = createContext<TaskContextType | null>(null);

// Mock users for demo
const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'admin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    email: 'manager@example.com',
    name: 'Manager User',
    role: 'manager',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    email: 'teamlead@example.com',
    name: 'Team Lead',
    role: 'team-lead',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '4',
    email: 'employee@example.com',
    name: 'Employee',
    role: 'employee',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Mock initial tasks
const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Quarterly Review Meeting',
    notes: 'Prepare slides and financial summary',
    icon: '📊',
    progress: 75,
    createdById: '1',
    createdByName: 'Admin User',
    assignedToId: '2',
    assignedToName: 'Manager User',
    dueDate: addDays(new Date(), 1).toISOString(),
    completed: false,
    quadrant: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    title: 'Update Technical Documentation',
    notes: 'Review and update API documentation',
    icon: '📝',
    progress: 30,
    createdById: '2',
    createdByName: 'Manager User',
    assignedToId: '3',
    assignedToName: 'Team Lead',
    dueDate: addDays(new Date(), 5).toISOString(),
    completed: false,
    quadrant: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    title: 'Review Pull Requests',
    notes: 'At least 3 PRs need to be reviewed today',
    icon: '👨‍💻',
    progress: 0,
    createdById: '3',
    createdByName: 'Team Lead',
    assignedToId: '4',
    assignedToName: 'Employee',
    dueDate: new Date().toISOString(),
    completed: false,
    quadrant: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '4',
    title: 'Weekly Team Meeting',
    notes: 'Discuss project status and blockers',
    icon: '👥',
    progress: 0,
    createdById: '2',
    createdByName: 'Manager User',
    assignedToId: '2',
    assignedToName: 'Manager User',
    dueDate: addDays(new Date(), -2).toISOString(),
    completed: false,
    quadrant: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '5',
    title: 'Research New Technologies',
    notes: 'Look into GraphQL and serverless options',
    icon: '🔍',
    progress: 50,
    createdById: '3',
    createdByName: 'Team Lead',
    assignedToId: '4',
    assignedToName: 'Employee',
    dueDate: addDays(new Date(), 8).toISOString(),
    completed: false,
    quadrant: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '6',
    title: 'Fill Timesheet',
    notes: 'Complete weekly timesheet',
    icon: '⏰',
    progress: 0,
    createdById: '4',
    createdByName: 'Employee',
    assignedToId: '4',
    assignedToName: 'Employee',
    dueDate: null,
    completed: false,
    quadrant: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const useTaskContext = (): TaskContextType => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTaskContext must be used within a TaskProvider');
  }
  return context;
};

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hideCompleted, setHideCompleted] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Helper function to determine if a user should have access to another user's tasks
  const canAccessUserTasks = (currentUserRole: UserRole, targetUserId: string): boolean => {
    if (!user) return false;

    // Admin can access all tasks
    if (currentUserRole === 'admin') return true;
    
    // Users can always access their own tasks
    if (user.id === targetUserId) return true;
    
    // Manager can access team lead and employee tasks
    if (currentUserRole === 'manager') {
      const targetUser = mockUsers.find(u => u.id === targetUserId);
      return targetUser?.role === 'team-lead' || targetUser?.role === 'employee';
    }
    
    // Team lead can access employee tasks
    if (currentUserRole === 'team-lead') {
      const targetUser = mockUsers.find(u => u.id === targetUserId);
      return targetUser?.role === 'employee';
    }
    
    // Employee can only access their own tasks (already handled above)
    return false;
  };

  // Get list of users that the current user can see tasks for
  const getVisibleUsers = (): User[] => {
    if (!user) return [];

    switch (user.role) {
      case 'admin':
        return mockUsers;
      case 'manager':
        return mockUsers.filter(u => 
          u.id === user.id || 
          u.role === 'team-lead' || 
          u.role === 'employee'
        );
      case 'team-lead':
        return mockUsers.filter(u => 
          u.id === user.id || 
          u.role === 'employee'
        );
      case 'employee':
        return mockUsers.filter(u => u.id === user.id);
      default:
        return [];
    }
  };

  // Filter tasks based on user role and other filters
  useEffect(() => {
    if (!user) {
      setFilteredTasks([]);
      return;
    }

    let filtered = [...tasks];

    // Filter by user access permissions
    filtered = filtered.filter(task => {
      return canAccessUserTasks(user.role, task.assignedToId);
    });

    // Filter by selected user if any
    if (selectedUserId) {
      filtered = filtered.filter(task => task.assignedToId === selectedUserId);
    }

    // Filter out completed tasks if hideCompleted is true
    if (hideCompleted) {
      filtered = filtered.filter(task => !task.completed);
    }

    setFilteredTasks(filtered);
  }, [tasks, user, hideCompleted, selectedUserId]);

  // Function to recalculate quadrants based on due dates
  const recalculateQuadrants = () => {
    const today = new Date();
    
    setTasks(prevTasks => {
      return prevTasks.map(task => {
        // Skip routine tasks (quadrant 5) and tasks without due dates
        if (task.quadrant === 5 || !task.dueDate) {
          return task;
        }

        const dueDate = parseISO(task.dueDate);
        
        // Move tasks due today to Quadrant 1 (Urgent & Important)
        if (format(dueDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
          return { ...task, quadrant: 1 };
        }
        
        return task;
      });
    });
  };

  // Run quadrant recalculation once a day or when tasks change
  useEffect(() => {
    recalculateQuadrants();
    
    // Set up a daily check
    const intervalId = setInterval(() => {
      recalculateQuadrants();
    }, 86400000); // 24 hours
    
    return () => clearInterval(intervalId);
  }, [tasks]);

  // CRUD Operations
  const createTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    setIsLoading(true);
    
    try {
      // In a real app, this would be an API call
      const newTask: Task = {
        ...taskData,
        id: `${tasks.length + 1}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setTasks(prevTasks => [...prevTasks, newTask]);
      setError(null);
    } catch (error) {
      setError('Failed to create task');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateTask = async (updatedTask: Task) => {
    setIsLoading(true);
    
    try {
      // In a real app, this would be an API call
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === updatedTask.id 
            ? { ...updatedTask, updatedAt: new Date().toISOString() } 
            : task
        )
      );
      setError(null);
    } catch (error) {
      setError('Failed to update task');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTask = async (taskId: string) => {
    setIsLoading(true);
    
    try {
      // In a real app, this would be an API call
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
      setError(null);
    } catch (error) {
      setError('Failed to delete task');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const moveTask = async (taskId: string, quadrant: Quadrant) => {
    setIsLoading(true);
    
    try {
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId 
            ? { ...task, quadrant, updatedAt: new Date().toISOString() } 
            : task
        )
      );
      setError(null);
    } catch (error) {
      setError('Failed to move task');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateTaskProgress = async (taskId: string, progress: number) => {
    setIsLoading(true);
    
    try {
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId 
            ? { 
                ...task, 
                progress,
                completed: progress === 100,
                updatedAt: new Date().toISOString() 
              } 
            : task
        )
      );
      setError(null);
    } catch (error) {
      setError('Failed to update task progress');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTaskCompletion = async (taskId: string) => {
    setIsLoading(true);
    
    try {
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId 
            ? { 
                ...task, 
                completed: !task.completed,
                progress: task.completed ? task.progress : 100,
                updatedAt: new Date().toISOString() 
              } 
            : task
        )
      );
      setError(null);
    } catch (error) {
      setError('Failed to toggle task completion');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const value: TaskContextType = {
    tasks,
    filteredTasks,
    isLoading,
    error,
    hideCompleted,
    selectedUserId,
    createTask,
    updateTask,
    deleteTask,
    moveTask,
    updateTaskProgress,
    toggleTaskCompletion,
    setHideCompleted,
    setSelectedUserId,
    getVisibleUsers,
    recalculateQuadrants
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};
