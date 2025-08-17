
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Task, Quadrant, DueDateChange, TaskProgressUpdate } from '@/types/task';
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
  updateTask: (task: any) => Promise<any>;
  deleteTask: (taskId: string) => Promise<void>;
  getVisibleUsers: () => User[];
  moveTask: (taskId: string, quadrant: Quadrant) => Promise<void>;
  toggleTaskCompletion: (taskId: string) => Promise<void>;
  hideCompleted: boolean;
  setHideCompleted: React.Dispatch<React.SetStateAction<boolean>>;
  selectedUserId: string | null;
  setSelectedUserId: (userId: string | null) => void;
  fetchLatestDueDateChange: (taskId: string) => Promise<DueDateChange | null>;
  fetchDueDateChanges: (taskId: string) => Promise<DueDateChange[]>;
  fetchLatestProgressChange :(taskId :string) => Promise<TaskProgressUpdate | null>;
  fetchProgressChanges :(taskId :string) => Promise<TaskProgressUpdate[]>;
}
const defaultSettings: SystemSettings = {
  taskDueDateThresholds: {
    critical: 2,
    medium: 4,
    low: 6
  },
  tasksPerPage: 10,
  defaultSortOrder: 'duedate-asc',
  markOverdueDays: 3,
  warningDays: 2
};
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
   // Move this to just one useEffect
useEffect(() => {
  const initialize = async () => {
    if (isAuthenticated && user) {
      await fetchSystemSettings();
      await fetchTasks();
      await fetchUsers();
    } else {
      setTasks([]);
      setIsLoading(false);
    }
  };
  initialize();
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

  // Define it at component level
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

  const fetchMyTasks = async () => {
  if (!user) return;

  setIsLoading(true);
  try {
    const fetchedTasks = await taskService.getTasks();

    // Filter only tasks where the current user is one of the assignees
    const myTasks = fetchedTasks.filter(task =>
      Array.isArray(task.assignees) &&
      task.assignees.some(assignee => assignee.id === user.id)
    );

    // Update tasks with appropriate quadrants based on due dates
    const updatedTasks = myTasks.map(task => ({
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
        // Admins can see all users
        fetchedUsers = await userService.getUsers();
        break;
        
      case 'super-manager':
        // Super managers can see all users where they are the manager (user.manager_id === user.id)
        const allUsers = await userService.getUsers();
        fetchedUsers = allUsers.filter(u => u.managerId === profile.id||u.id === profile.id);
        break;
        
      case 'manager':
        // Managers can see users where they are the manager (user.manager_id === user.id)
        const allUsersForManager = await userService.getUsers();
        fetchedUsers = allUsersForManager.filter(u => u.managerId === profile.id);
        break;
        
      case 'team-lead':
        // Team leads can see their team members
        const teamMembers = await userService.getTeamMembersByLeadId(user.id);
        if (teamMembers) {
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
    console.log("taskData---------",taskData);

      // Determine the appropriate quadrant based on due date
      const quadrant = taskData.quadrant || 
        (taskData.dueDate ? determineTaskQuadrant({
          ...taskData,
          dueDate: taskData.dueDate
        } as Task, settings) : 4);
    console.log("quadrant---------",quadrant);
      
      const newTask = await taskService.createTask({
        ...taskData,
        createdById: user.id,
        quadrant
      });
    console.log("newTask---------",newTask);
      
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
const updateTask = async (taskData: any) => {
  const {
    id,
    assignees,
    reasonToChangeDueDate,
    progressUpdateNote,
    ...taskFields
  } = taskData;

  // 1️⃣ Fetch the existing task (for comparison)
  const { data: existingTask, error: fetchError } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError) {
    throw fetchError;
  }

  // Helper function to compare dates by timestamp
  const isSameDate = (a: any, b: any) => {
    const dateA = a ? new Date(a) : null;
    const dateB = b ? new Date(b) : null;
    if (!dateA || !dateB) return a === b;
    return dateA.getTime() === dateB.getTime();
  };

  // 2️⃣ Update task core fields ONLY if there are changes
  const fieldsToCheck = {
    title: taskFields.title,
    notes: taskFields.notes,
    icon: taskFields.icon,
    progress: taskFields.progress,
    due_date: taskFields.dueDate,
    completed: taskFields.completed,
    quadrant: taskFields.quadrant,
  };

  const changes: Record<string, { from: any; to: any }> = {};

  for (const [key, newValue] of Object.entries(fieldsToCheck)) {
    const oldValue = existingTask[key];
    const changed =
      key === "due_date"
        ? !isSameDate(oldValue, newValue)
        : oldValue !== newValue;

    if (changed) {
      changes[key] = { from: oldValue, to: newValue };
    }
  }

  let updatedTask = existingTask;

  if (Object.keys(changes).length > 0) {
    const { data, error: taskError } = await supabase
      .from("tasks")
      .update(fieldsToCheck)
      .eq("id", id)
      .select("*")
      .single();

    if (taskError) {
      throw taskError;
    }

    updatedTask = data;
  }

  // 3️⃣ Track due date changes
  if (existingTask.due_date !== taskFields.dueDate && reasonToChangeDueDate) {
    const { error: dueDateError } = await supabase.from("due_date_change").insert([
      {
        task_id: id,
        last_due_date: existingTask.due_date,
        updated_due_date: taskFields.dueDate,
        reason_to_change: reasonToChangeDueDate,
      },
    ]);

    if (dueDateError) {
      throw dueDateError;
    }
  }

  // 4️⃣ Track progress updates
  if (existingTask.progress !== taskFields.progress && progressUpdateNote) {
    const { error: progressError } = await supabase.from("task_progress_update").insert([
      {
        task_id: id,
        current_progress: taskFields.progress,
        previous_progress: existingTask.progress,
        updates: progressUpdateNote,
      },
    ]);

    if (progressError) {
      throw progressError;
    }
  }

  // 5️⃣ Handle assignees
  if (Array.isArray(assignees)) {
    const { data: existingAssignees, error: fetchAssigneesError } = await supabase
      .from("task_assignees")
      .select("user_id")
      .eq("task_id", id);

    if (fetchAssigneesError) {
      throw fetchAssigneesError;
    }

    const existingUserIds = existingAssignees?.map((a) => a.user_id) || [];
    const newUserIds = assignees.map((a: { id: string }) => a.id);

    const toDelete = existingUserIds.filter((userId) => !newUserIds.includes(userId));
    const toAdd = assignees.filter((a: { id: string }) => !existingUserIds.includes(a.id));

    if (toDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from("task_assignees")
        .delete()
        .eq("task_id", id)
        .in("user_id", toDelete);

      if (deleteError) {
        throw deleteError;
      }
    }

    if (toAdd.length > 0) {
      const { error: insertError } = await supabase.from("task_assignees").insert(
        toAdd.map((a: { id: string; name: string }) => ({
          task_id: id,
          user_id: a.id,
          assigned_by_id: profile.id || null, // ensure profile is in scope
        }))
      );

      if (insertError) {
        throw insertError;
      }
    }
  }

  // 6️⃣ Return full task with assignees + profile names
  const { data: finalTask, error: finalError } = await supabase
    .from("tasks")
    .select(
      `
      *,
      task_assignees (
        user_id,
        profiles!task_assignees_user_id_fkey ( id, name )
      )
    `
    )
    .eq("id", id)
    .single();

  if (finalError) {
    throw finalError;
  }

  const response = {
    ...finalTask,
    assigneeIds: finalTask.task_assignees.map((ta: any) => ta.user_id),
    assignedToNames: finalTask.task_assignees.map((ta: any) => ta.profiles?.name),
    assignees: finalTask.task_assignees.map((ta: any) => ({
      id: ta.profiles?.id || ta.user_id,
      name: ta.profiles?.name || "Unknown",
    })),
  };

  return response;
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
  const currentUserId = profile.id;

  const hasSelf = users.some(user => user.id === currentUserId);

  const result = hasSelf ? users : [...users, profile];


  return result;
};



  // Fetch the latest due date change for a task
  const fetchLatestDueDateChange = async (taskId: string): Promise<DueDateChange | null> => {
    try {
      const { data, error } = await supabase
        .from('due_date_change')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error) {
        console.error('Error fetching latest due date change:', error);
        return null;
      }
      
      return data as DueDateChange;
    } catch (err) {
      console.error('Failed to fetch latest due date change:', err);
      return null;
    }
  };

  // Fetch all due date changes for a task
  const fetchDueDateChanges = async (taskId: string): Promise<DueDateChange[]> => {
    try {
      const { data, error } = await supabase
        .from('due_date_change')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching due date changes:', error);
        return [];
      }
      
      return data as DueDateChange[];
    } catch (err) {
      console.error('Failed to fetch due date changes:', err);
      return [];
    }
  };
const fetchLatestProgressChange = async (taskId: string): Promise<TaskProgressUpdate | null> => {
    try {
      const { data, error } = await supabase
        .from('task_progress_update')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error) {
        console.error('Error fetching latest due date change:', error);
        return null;
      }
      
      return data as TaskProgressUpdate;
    } catch (err) {
      console.error('Failed to fetch latest due date change:', err);
      return null;
    }
  };

  // Fetch all due date changes for a task
  const fetchProgressChanges = async (taskId: string): Promise<TaskProgressUpdate[]> => {
    try {
      const { data, error } = await supabase
        .from('task_progress_update')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching due date changes:', error);
        return [];
      }
      
      return data as TaskProgressUpdate[];
    } catch (err) {
      console.error('Failed to fetch due date changes:', err);
      return [];
    }
  };
  
  const filteredTasks = tasks.filter(task => {
    // Filter by completion status
    if (hideCompleted && (task.completed || task.progress === 100)) {
      return false;
    }
    
    // Filter by assignee (now supports multiple assignees)
    if (
      selectedUserId &&
      (!Array.isArray(task.assignees) || !task.assignees.some(a => String(a.id) === String(selectedUserId)))
    ) {
      return false;
    }

    // Filter by search query
    if (
      filter.searchQuery &&
      !task.title.toLowerCase().includes(filter.searchQuery.toLowerCase())
    ) {
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
    setSelectedUserId,
    fetchLatestDueDateChange,
    fetchDueDateChanges,
    fetchLatestProgressChange,
    fetchProgressChanges
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};
