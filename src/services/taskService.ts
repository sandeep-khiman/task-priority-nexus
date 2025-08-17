import { supabase } from '@/integrations/supabase/client';
import { Task, Quadrant } from '@/types/task';

interface CreateTaskPayload {
  title: string;
  notes?: string;
  icon?: string;
  progress: number;
  createdById: string;
  createdByName: string;
  assigneeIds: string[];
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
  assignees?: Array<{ id: string; name: string }>; // ✅ matches function usage
  dueDate?: string | null;
  completed?: boolean;
  quadrant?: Quadrant;
  reasonToChangeDueDate?: string;
  progressUpdateNote?: string;
}


export const taskService = {
  /** Get all tasks with multi-assignees */
  async getTasks(): Promise<Task[]> {
   
    const { data: tasksData, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (tasksError) throw tasksError;
    if (!tasksData) return [];

    const taskIds = tasksData.map(t => t.id);

    // Fetch all assignees
    const { data: taskAssigneesData, error: taskAssigneesError } = await supabase
      .from('task_assignees')
      .select('task_id, profiles!task_assignees_user_id_fkey(id, name)  ')
      .in('task_id', taskIds);

    if (taskAssigneesError) throw taskAssigneesError;

    const taskAssigneesMap = new Map<string, { id: string; name: string }[]>();
    (taskAssigneesData || []).forEach(a => {
      const profile = a.profiles as { id: string; name: string };
      const current = taskAssigneesMap.get(a.task_id) || [];
      taskAssigneesMap.set(a.task_id, [...current, { id: profile.id, name: profile.name }]);
    });

    // Fetch created_by profiles
    const creatorIds = Array.from(new Set(tasksData.map(t => t.created_by_id))).filter(Boolean);
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name')
      .in('id', creatorIds);

    if (profilesError) throw profilesError;

    const profileMap = new Map<string, string>();
    (profilesData || []).forEach(p => profileMap.set(p.id, p.name));

    
    return tasksData.map(task => ({
      id: task.id,
      title: task.title,
      notes: task.notes,
      icon: task.icon || '📝',
      progress: task.progress,
      createdById: task.created_by_id,
      createdByName: profileMap.get(task.created_by_id) || 'Unknown',
      assignees: taskAssigneesMap.get(task.id) || [],
      dueDate: task.due_date,
      completed: task.completed,
      quadrant: task.quadrant as Quadrant,
      createdAt: task.created_at,
      updatedAt: task.updated_at
    }));
  },

  /** Get single task with multi-assignees */
  async getTaskById(taskId: string): Promise<Task | null> {
    const { data: task, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (error || !task) return null;

    const { data: taskAssignees, error: assigneeError } = await supabase
      .from('task_assignees')
      .select('profiles(id, name)')
      .eq('task_id', taskId);

    if (assigneeError) throw assigneeError;

    const assignees =
      (taskAssignees || []).map(a => a.profiles as { id: string; name: string }) || [];

    const { data: creatorProfile } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('id', task.created_by_id)
      .single();

    return {
      id: task.id,
      title: task.title,
      notes: task.notes,
      icon: task.icon || '📝',
      progress: task.progress,
      createdById: task.created_by_id,
      createdByName: creatorProfile?.name || 'Unknown',
      assignees,
      dueDate: task.due_date,
      completed: task.completed,
      quadrant: task.quadrant as Quadrant,
      createdAt: task.created_at,
      updatedAt: task.updated_at
    };
  },

  /** Create task with multi-assignees */
async createTask(task: CreateTaskPayload): Promise<Task> {
  console.log("task---------", task);

  // Validate quadrant
  if (task.quadrant < 1 || task.quadrant > 5) {
    throw new Error('Quadrant must be between 1 and 5');
  }

  // Use get_user_role to check permissions
  const { data: roleData, error: roleError } = await supabase.rpc('get_user_role', { 
    user_id: task.createdById 
  });

  if (roleError || !roleData) {
    throw new Error('Failed to retrieve user role');
  }

  // Check if the role is allowed to create tasks
  const allowedRoles = ['admin', 'manager', 'super-manager'];
  if (!allowedRoles.includes(roleData)) {
    throw new Error('User not authorized to create tasks');
  }

  // Insert the task
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      title: task.title,
      notes: task.notes || '',
      icon: task.icon || '📋', 
      progress: task.progress || 0,
      created_by_id: task.createdById,
      due_date: task.dueDate,
      completed: task.completed || false,
      quadrant: task.quadrant
    })
    .select()
    .single();

  // Handle task insertion error
  if (error) {
    console.error("Error inserting task:", error);
    throw error;
  }

  // Handle assignees
  if (task.assigneeIds?.length) {
    // Validate assignee IDs exist and are accessible
    const { data: accessibleUserIds, error: accessError } = await supabase.rpc('get_accessible_user_ids', {
      lookup_user_id: task.createdById
    });

    if (accessError) {
      throw new Error('Failed to retrieve accessible user IDs');
    }

    // Filter assignees to only those accessible to the creator
    const validAssigneeIds = task.assigneeIds.filter(id => 
      accessibleUserIds.includes(id)
    );

    if (validAssigneeIds.length !== task.assigneeIds.length) {
      console.warn('Some assignees were filtered out due to access restrictions');
    }

    // Insert assignees
    if (validAssigneeIds.length) {
      const assigneeRows = validAssigneeIds.map(id => ({
        task_id: data.id,
        user_id: id,
        assigned_by_id: task.createdById
      }));

      const { error: assigneeInsertError } = await supabase
        .from('task_assignees')
        .insert(assigneeRows);

      if (assigneeInsertError) {
        console.error("Error inserting assignees:", assigneeInsertError);
        throw assigneeInsertError;
      }
    }
  }

  // Return the constructed Task object
  return {
    id: data.id,
    title: data.title,
    notes: data.notes,
    icon: data.icon || '📋',
    progress: data.progress,
    createdById: data.created_by_id,
    createdByName: task.createdByName,
    assignees: task.assigneeIds?.map(id => ({ id, name: '' })) || [],
    dueDate: data.due_date,
    completed: data.completed,
    quadrant: data.quadrant as Quadrant,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
},


  /** Update task & assignees */
  async updateTask(task: UpdateTaskPayload): Promise<Task | null> {
    console.log("UpdateTaskPayload",task);
    
  const updates: any = {};
  if (task.title !== undefined) updates.title = task.title;
  if (task.notes !== undefined) updates.notes = task.notes;
  if (task.icon !== undefined) updates.icon = task.icon;
  if (task.progress !== undefined) updates.progress = task.progress;
  if (task.completed !== undefined) updates.completed = task.completed;
  if (task.quadrant !== undefined) updates.quadrant = task.quadrant;
  if (task.dueDate !== undefined) updates.due_date = task.dueDate;
  updates.updated_at = new Date().toISOString();

  // ✅ Log due date & progress changes
  if (task.dueDate !== undefined || task.progress !== undefined) {
    const { data: oldTask } = await supabase
      .from('tasks')
      .select('due_date, progress')
      .eq('id', task.id)
      .single();

    if (
      oldTask?.due_date &&
      task.dueDate &&
      new Date(oldTask.due_date).getTime() !== new Date(task.dueDate).getTime()
    ) {
      await supabase.from('due_date_change').insert([{
        task_id: task.id,
        last_due_date: oldTask.due_date,
        updated_due_date: task.dueDate,
        reason_to_change: task.reasonToChangeDueDate || 'Updated via system',
        created_at: new Date().toISOString(),
      }]);
    }

    if (task.progress !== undefined && task.progress !== oldTask?.progress) {
      await supabase.from('task_progress_update').insert([{
        task_id: task.id,
        previous_progress: oldTask?.progress,
        current_progress: task.progress,
        updates: task.progressUpdateNote || 'Updated via system',
        created_at: new Date().toISOString(),
      }]);
    }
  }

  // ✅ Update main task
  const { data: updatedTask, error: updateError } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', task.id)
    .select()
    .single();

  if (updateError) throw updateError;

  // ✅ Update assignees only if provided
  if (task.assignees) {
    const newIds = task.assignees.map(a => a.id);

    // 1. Fetch current assignees
    const { data: currentAssignees } = await supabase
      .from('task_assignees')
      .select('user_id')
      .eq('task_id', task.id);

    const existingIds = (currentAssignees || []).map(a => a.user_id);

    const toAdd = newIds.filter(id => !existingIds.includes(id));
    const toRemove = existingIds.filter(id => !newIds.includes(id));

    if (toRemove.length) {
      await supabase
        .from('task_assignees')
        .delete()
        .eq('task_id', task.id)
        .in('user_id', toRemove);
    }

    if (toAdd.length) {
      const newRows = toAdd.map(id => ({ task_id: task.id, user_id: id }));
      await supabase.from('task_assignees').insert(newRows);
    }
  }

  const { data: updatedAssignees } = await supabase
    .from('task_assignees')
    .select('profiles(id, name)')
    .eq('task_id', task.id);

  const assignees =
    (updatedAssignees || []).map(a => a.profiles as { id: string; name: string });

  return {
    id: updatedTask.id,
    title: updatedTask.title,
    notes: updatedTask.notes,
    icon: updatedTask.icon || '📝',
    progress: updatedTask.progress,
    createdById: updatedTask.created_by_id,
    createdByName: '',
    assignees,
    dueDate: updatedTask.due_date,
    completed: updatedTask.completed,
    quadrant: updatedTask.quadrant as Quadrant,
    createdAt: updatedTask.created_at,
    updatedAt: updatedTask.updated_at,
  };
},
  
async deleteTask(taskId: string): Promise<void> {
  console.log(taskId);
  
    await supabase.from('task_assignees').delete().eq('task_id', taskId);
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);
    if (error) throw error;
  }
};
