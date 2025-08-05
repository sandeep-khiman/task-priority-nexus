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
  reasonToChangeDueDate?: string;
  progressUpdateNote?: string;
}

export const taskService = {
  async getTasks(): Promise<Task[]> {
    const { data: tasksData, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError);
      throw tasksError;
    }

    if (!tasksData) return [];

    const userIds = Array.from(
      new Set(
        tasksData.flatMap(task => [task.created_by_id, task.assigned_to_id])
      )
    ).filter(Boolean);

    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name')
      .in('id', userIds);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      throw profilesError;
    }

    const profileMap = new Map<string, string>();
    for (const profile of profilesData || []) {
      profileMap.set(profile.id, profile.name);
    }

    return tasksData.map(task => ({
      id: task.id,
      title: task.title,
      notes: task.notes,
      icon: task.icon || '📝',
      progress: task.progress,
      createdById: task.created_by_id,
      createdByName: profileMap.get(task.created_by_id) || 'Unknown',
      assignedToId: task.assigned_to_id,
      assignedToName: profileMap.get(task.assigned_to_id) || 'Unassigned',
      dueDate: task.due_date,
      completed: task.completed,
      quadrant: task.quadrant as Quadrant,
      createdAt: task.created_at,
      updatedAt: task.updated_at,
    }));
  },

  async getTaskById(taskId: string): Promise<Task | null> {
    const { data: task, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (error || !task) {
      console.error('Error fetching task:', error);
      return null;
    }

    const userIds = [task.created_by_id, task.assigned_to_id].filter(Boolean);

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name')
      .in('id', userIds);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      throw profilesError;
    }

    const profileMap = new Map<string, string>();
    for (const profile of profiles || []) {
      profileMap.set(profile.id, profile.name);
    }

    return {
      id: task.id,
      title: task.title,
      notes: task.notes,
      icon: task.icon || '📝',
      progress: task.progress,
      createdById: task.created_by_id,
      createdByName: profileMap.get(task.created_by_id) || 'Unknown',
      assignedToId: task.assigned_to_id,
      assignedToName: profileMap.get(task.assigned_to_id) || 'Unassigned',
      dueDate: task.due_date,
      completed: task.completed,
      quadrant: task.quadrant as Quadrant,
      createdAt: task.created_at,
      updatedAt: task.updated_at
    };
  },

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

  async updateTask(task: UpdateTaskPayload): Promise<Task | null> {
    const updates: any = {};
    if (task.title !== undefined) updates.title = task.title;
    if (task.notes !== undefined) updates.notes = task.notes;
    if (task.icon !== undefined) updates.icon = task.icon;
    if (task.progress !== undefined) updates.progress = task.progress;
    if (task.assignedToId !== undefined) updates.assigned_to_id = task.assignedToId;
    if (task.completed !== undefined) updates.completed = task.completed;
    if (task.quadrant !== undefined) updates.quadrant = task.quadrant;
    updates.updated_at = new Date().toISOString();

    const { data: existingTask, error: fetchError } = await supabase
      .from('tasks')
      .select('due_date, progress, created_by_id, assigned_to_id')
      .eq('id', task.id)
      .single();
console.log("------------------189--------------",existingTask,"-----------------error--------------",fetchError);

    if (fetchError || !existingTask) {
      console.error('Failed to fetch current task:', fetchError);
      return null;
    }

    const oldDueDate = existingTask.due_date;
    const oldProgress = existingTask.progress;
    const newDueDate = task.dueDate;
    const newProgress = task.progress;

    if (newDueDate !== undefined && new Date(newDueDate).getTime() !== new Date(oldDueDate).getTime()) {
      updates.due_date = newDueDate;

      const dueChange = {
        task_id: task.id,
        last_due_date: oldDueDate,
        updated_due_date: newDueDate,
        reason_to_change: task.reasonToChangeDueDate || 'Updated via system',
        created_at: new Date().toISOString(),
      };
console.log("------------------211--------------",dueChange);

      const { error: dueDateError } = await supabase
        .from('due_date_change')
        .insert([dueChange]);

      if (dueDateError) {
        console.log("due_date_error",dueDateError);
        
        console.error('Failed to log due date change:', dueDateError);
      }
    }

    if (newProgress !== undefined && newProgress !== oldProgress) {
      const progressUpdate = {
        task_id: task.id,
        previous_progress: oldProgress,
        current_progress: newProgress,
        updates: task.progressUpdateNote || 'Updated via system',
        created_at: new Date().toISOString(),
      };

      const { error: progressUpdateError } = await supabase
        .from('task_progress_update')
        .insert([progressUpdate]);

      if (progressUpdateError) {
        console.error('Failed to log progress update:', progressUpdateError);
      }
    }

    const { data: task_data, error: updateError } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', task.id)
      .select()
      .single();

    if (updateError || !task_data) {
      console.error('Error updating task:', updateError);
      throw updateError;
    }

    const userIds = [task_data.created_by_id, task_data.assigned_to_id].filter(Boolean);
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name')
      .in('id', userIds);

    const profileMap = new Map<string, string>();
    for (const profile of profiles || []) {
      profileMap.set(profile.id, profile.name);
    }

    return {
      id: task_data.id,
      title: task_data.title,
      notes: task_data.notes,
      icon: task_data.icon || '📝',
      progress: task_data.progress,
      createdById: task_data.created_by_id,
      createdByName: profileMap.get(task_data.created_by_id) || 'Unknown',
      assignedToId: task_data.assigned_to_id,
      assignedToName: profileMap.get(task_data.assigned_to_id) || 'Unassigned',
      dueDate: task_data.due_date,
      completed: task_data.completed,
      quadrant: task_data.quadrant as Quadrant,
      createdAt: task_data.created_at,
      updatedAt: task_data.updated_at
    };
  },

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
 