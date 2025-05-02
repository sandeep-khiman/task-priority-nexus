import { supabase } from '@/integrations/supabase/client';
import { Task, Quadrant } from '@/types/task';

interface CreateTaskPayload {
  title: string;
  notes?: string;
  icon?: string;
  progress: number;
  createdById: string;
  createdByName: string;
  assignedToId: string;
  assignedToName: string;
  dueDate?: string | null;
  completed: boolean;
  quadrant: Quadrant;
}

interface UpdateTaskPayload {
  id: string;
  title?: string;
  notes?: string;
  icon?: string;
  progress?: number;
  assignedToId?: string;
  assignedToName?: string;
  dueDate?: string | null;
  completed?: boolean;
  quadrant?: Quadrant;
}

export const taskService = {
  // Get all tasks for the current user based on their role and permissions
  async getTasks(): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        id,
        title,
        notes,
        icon,
        progress,
        created_by_id,
        assigned_to_id,
        due_date,
        completed,
        quadrant,
        created_at,
        updated_at,
        profiles!assigned_to_id(name),
        profiles!created_by_id(name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tasks:', error);
      throw error;
    }

    return (data || []).map(task => ({
      id: task.id,
      title: task.title,
      notes: task.notes,
      icon: task.icon || '📝',
      progress: task.progress,
      createdById: task.created_by_id,
      createdByName: task.profiles && task.profiles.name ? task.profiles.name : 'Unknown',
      assignedToId: task.assigned_to_id,
      assignedToName: task.profiles && task.profiles.name ? task.profiles.name : 'Unassigned',
      dueDate: task.due_date,
      completed: task.completed,
      quadrant: task.quadrant as Quadrant,
      createdAt: task.created_at,
      updatedAt: task.updated_at
    }));
  },

  // Get a task by ID
  async getTaskById(taskId: string): Promise<Task | null> {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        id,
        title,
        notes,
        icon,
        progress,
        created_by_id,
        assigned_to_id,
        due_date,
        completed,
        quadrant,
        created_at,
        updated_at,
        profiles!assigned_to_id(name),
        profiles!created_by_id(name)
      `)
      .eq('id', taskId)
      .single();

    if (error) {
      console.error('Error fetching task:', error);
      return null;
    }

    if (!data) return null;

    return {
      id: data.id,
      title: data.title,
      notes: data.notes,
      icon: data.icon || '📝',
      progress: data.progress,
      createdById: data.created_by_id,
      createdByName: data.profiles && data.profiles.name ? data.profiles.name : 'Unknown',
      assignedToId: data.assigned_to_id,
      assignedToName: data.profiles && data.profiles.name ? data.profiles.name : 'Unassigned',
      dueDate: data.due_date,
      completed: data.completed,
      quadrant: data.quadrant as Quadrant,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  },

  // Create a new task
  async createTask(task: CreateTaskPayload): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        title: task.title,
        notes: task.notes,
        icon: task.icon,
        progress: task.progress,
        created_by_id: task.createdById,
        assigned_to_id: task.assignedToId,
        due_date: task.dueDate,
        completed: task.completed,
        quadrant: task.quadrant
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating task:', error);
      throw error;
    }

    return {
      id: data.id,
      title: data.title,
      notes: data.notes,
      icon: data.icon || '📝',
      progress: data.progress,
      createdById: data.created_by_id,
      createdByName: task.createdByName,
      assignedToId: data.assigned_to_id,
      assignedToName: task.assignedToName,
      dueDate: data.due_date,
      completed: data.completed,
      quadrant: data.quadrant as Quadrant,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  },

  // Update a task
  async updateTask(task: UpdateTaskPayload): Promise<Task | null> {
    const updates: any = {};
    if (task.title !== undefined) updates.title = task.title;
    if (task.notes !== undefined) updates.notes = task.notes;
    if (task.icon !== undefined) updates.icon = task.icon;
    if (task.progress !== undefined) updates.progress = task.progress;
    if (task.assignedToId !== undefined) updates.assigned_to_id = task.assignedToId;
    if (task.dueDate !== undefined) updates.due_date = task.dueDate;
    if (task.completed !== undefined) updates.completed = task.completed;
    if (task.quadrant !== undefined) updates.quadrant = task.quadrant;
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', task.id)
      .select(`
        id,
        title,
        notes,
        icon,
        progress,
        created_by_id,
        assigned_to_id,
        due_date,
        completed,
        quadrant,
        created_at,
        updated_at,
        profiles!assigned_to_id(name),
        profiles!created_by_id(name)
      `)
      .single();

    if (error) {
      console.error('Error updating task:', error);
      throw error;
    }

    if (!data) return null;

    return {
      id: data.id,
      title: data.title,
      notes: data.notes,
      icon: data.icon || '📝',
      progress: data.progress,
      createdById: data.created_by_id,
      createdByName: data.profiles && data.profiles.name ? data.profiles.name : 'Unknown',
      assignedToId: data.assigned_to_id,
      assignedToName: data.profiles && data.profiles.name ? data.profiles.name : 'Unassigned',
      dueDate: data.due_date,
      completed: data.completed,
      quadrant: data.quadrant as Quadrant,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  },

  // Delete a task
  async deleteTask(taskId: string): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  }
};
