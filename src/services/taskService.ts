
import { supabase } from '@/integrations/supabase/client';
import { Task, Quadrant,DueDateChange } from '@/types/task';

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
  progressUpdateNote?:string;

}

export const taskService = {
  // Get all tasks for the current user based on their role and permissions
  async getTasks(): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tasks:', error);
      throw error;
    }

    // Get created by and assigned to profiles in separate queries
    const tasks: Task[] = [];
    for (const task of data || []) {
      // Get creator profile
      let createdByName = 'Unknown';
      if (task.created_by_id) {
        const { data: creatorData } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', task.created_by_id)
          .single();
        if (creatorData) {
          createdByName = creatorData.name;
        }
      }

      // Get assignee profile
      let assignedToName = 'Unassigned';
      if (task.assigned_to_id) {
        const { data: assigneeData } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', task.assigned_to_id)
          .single();
        if (assigneeData) {
          assignedToName = assigneeData.name;
        }
      }

      tasks.push({
        id: task.id,
        title: task.title,
        notes: task.notes,
        icon: task.icon || '📝',
        progress: task.progress,
        createdById: task.created_by_id,
        createdByName,
        assignedToId: task.assigned_to_id,
        assignedToName,
        dueDate: task.due_date,
        completed: task.completed,
        quadrant: task.quadrant as Quadrant,
        createdAt: task.created_at,
        updatedAt: task.updated_at
      });
    }

    return tasks;
  },

  // Get a task by ID
  async getTaskById(taskId: string): Promise<Task | null> {
    const { data: task, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (error) {
      console.error('Error fetching task:', error);
      return null;
    }

    if (!task) return null;

    // Get creator profile
    let createdByName = 'Unknown';
    if (task.created_by_id) {
      const { data: creatorData } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', task.created_by_id)
        .single();
      if (creatorData) {
        createdByName = creatorData.name;
      }
    }

    // Get assignee profile
    let assignedToName = 'Unassigned';
    if (task.assigned_to_id) {
      const { data: assigneeData } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', task.assigned_to_id)
        .single();
      if (assigneeData) {
        assignedToName = assigneeData.name;
      }
    }

    return {
      id: task.id,
      title: task.title,
      notes: task.notes,
      icon: task.icon || '📝',
      progress: task.progress,
      createdById: task.created_by_id,
      createdByName,
      assignedToId: task.assigned_to_id,
      assignedToName,
      dueDate: task.due_date,
      completed: task.completed,
      quadrant: task.quadrant as Quadrant,
      createdAt: task.created_at,
      updatedAt: task.updated_at
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

  // Get the current task to check for dueDate and progress changes
  const { data: existingTask, error: fetchError } = await supabase
    .from('tasks')
    .select('due_date, progress')
    .eq('id', task.id)
    .single();

  if (fetchError || !existingTask) {
    console.error('Failed to fetch current task:', fetchError);
    return null;
  }

  const oldDueDate = existingTask.due_date;
  const oldProgress = existingTask.progress;
  const newDueDate = task.dueDate;
  const newProgress = task.progress;
console.log(oldDueDate,"           ",newDueDate);

  // Track due date change
  if (newDueDate !== undefined && new Date(newDueDate).getTime() !== new Date(oldDueDate).getTime())  {
    console.log("entered");
    
    updates.due_date = newDueDate;

    const dueChange = {
      task_id: task.id,
      last_due_date: oldDueDate,
      updated_due_date: newDueDate,
      reason_to_change: task.reasonToChangeDueDate || 'Updated via system',
      created_at: new Date().toISOString(),
    };

    const { error: dueDateError } = await supabase
      .from('due_date_change')
      .insert([dueChange]);

    if (dueDateError) {
      console.error('Failed to log due date change:', dueDateError);
    }
  }
console.log("task: ",task);

  // Track progress change
  if (newProgress!== undefined && newProgress !== oldProgress) {
    const progressUpdate = {
      task_id: task.id,
      previous_progress: oldProgress,
      current_progress: newProgress,
      updates: task.progressUpdateNote||'update via system',
      created_at: new Date().toISOString(),
    };
console.log("progressUpdate: ",progressUpdate);

    const { error: progressUpdateError } = await supabase
      .from('task_progress_update')
      .insert([progressUpdate]);

    if (progressUpdateError) {
      console.error('Failed to log progress update:', progressUpdateError);
    }
  }

  // Update task
  const { data: task_data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', task.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating task:', error);
    throw error;
  }

  if (!task_data) return null;

  // Get creator profile
  let createdByName = 'Unknown';
  if (task_data.created_by_id) {
    const { data: creatorData } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', task_data.created_by_id)
      .single();
    if (creatorData) {
      createdByName = creatorData.name;
    }
  }

  // Get assignee profile
  let assignedToName = task.assignedToName || 'Unassigned';
  if (task_data.assigned_to_id && !task.assignedToName) {
    const { data: assigneeData } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', task_data.assigned_to_id)
      .single();
    if (assigneeData) {
      assignedToName = assigneeData.name;
    }
  }

  return {
    id: task_data.id,
    title: task_data.title,
    notes: task_data.notes,
    icon: task_data.icon || '📝',
    progress: task_data.progress,
    createdById: task_data.created_by_id,
    createdByName,
    assignedToId: task_data.assigned_to_id,
    assignedToName,
    dueDate: task_data.due_date,
    completed: task_data.completed,
    quadrant: task_data.quadrant as Quadrant,
    createdAt: task_data.created_at,
    updatedAt: task_data.updated_at
  };
}
,
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
