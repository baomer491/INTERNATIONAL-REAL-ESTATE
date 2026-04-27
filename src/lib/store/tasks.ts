'use client';

import type { Task, TaskComment, TaskCategory, TaskRecurrence, TaskStatus, TaskStatusHistoryEntry } from '@/types';
import { CATEGORY_DUE_DAYS as dueDaysMap } from '@/types';
import { cache, db } from './shared';
import { mapTaskRow, taskToSnake } from './mappers';

function generateUUID(): string {
  const buf = new Uint8Array(16);
  crypto.getRandomValues(buf);
  buf[6] = (buf[6] & 0x0f) | 0x40;
  buf[8] = (buf[8] & 0x3f) | 0x80;
  return Array.from(buf, b => b.toString(16).padStart(2, '0')).join('');
}

function nowISO(): string {
  return new Date().toISOString();
}

function buildStatusHistory(prev: TaskStatusHistoryEntry[] | undefined, status: TaskStatus, userId: string, userName: string): TaskStatusHistoryEntry[] {
  return [...(prev || []), { status, at: nowISO(), by: userId }];
}

/** Compute effective status — overdue is dynamic, never persisted as a DB mutation */
function computeStatus(task: Task): TaskStatus {
  if (task.status === 'completed') return 'completed';
  const due = new Date(task.dueDate);
  const now = new Date();
  if (due < now && task.status !== 'overdue') return 'overdue';
  return task.status;
}

/** Enrich a task with computed fields */
function enrichTask(task: Task): Task {
  return { ...task, status: computeStatus(task) };
}

/** Smart due date from category */
export function getDefaultDueDate(category: TaskCategory, fromDate?: Date): string {
  const days = dueDaysMap[category] ?? 7;
  const d = fromDate ? new Date(fromDate) : new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

/** Recurrence interval in days */
function getRecurrenceDays(recurrence: TaskRecurrence): number {
  switch (recurrence) {
    case 'daily': return 1;
    case 'weekly': return 7;
    case 'monthly': return 30;
    default: return 0;
  }
}

/** Check if user can modify task status */
function canModifyTask(task: Task, userId: string | undefined, isAdmin: boolean): boolean {
  if (isAdmin) return true;
  if (!userId) return false;
  return task.assignedTo === userId || task.createdBy === userId;
}

export const tasksStore = {
  getTasks: (): Task[] => cache.tasks.map(enrichTask),

  refreshTasksFromDB: async (): Promise<void> => {
    try {
      const { data, error } = await db.from('tasks').select('*');
      if (!error && data) {
        cache.tasks = data.map((r: Record<string, unknown>) => mapTaskRow(r));
      } else if (error) {
        console.error('[store] refreshTasksFromDB error:', error.message);
      }
    } catch (err) {
      console.error('[store] refreshTasksFromDB exception:', err);
    }
  },

  getTasksByReportId: (reportId: string): Task[] => {
    return cache.tasks
      .filter(t => t.relatedReportId === reportId)
      .map(enrichTask);
  },

  getTasksForUser: (userId: string): Task[] => {
    const currentEmp = cache.employees.find(e => e.id === userId);
    const isAdmin = currentEmp?.role === 'admin';
    if (isAdmin) return cache.tasks.map(enrichTask);
    return cache.tasks
      .filter(t => t.assignedTo === userId || t.createdBy === userId)
      .map(enrichTask);
  },

  getTodayTasks: (userId?: string, getTasksForUserFn?: (userId: string) => Task[]): Task[] => {
    const today = new Date().toDateString();
    const source = userId && getTasksForUserFn ? getTasksForUserFn(userId) : cache.tasks.map(enrichTask);
    return source.filter(t => {
      const due = new Date(t.dueDate);
      return due.toDateString() === today && t.status !== 'completed';
    });
  },

  getTaskStats: (userId?: string, getTasksForUserFn?: (userId: string) => Task[]): { total: number; pending: number; inProgress: number; underReview: number; completed: number; overdue: number } => {
    const source = userId && getTasksForUserFn ? getTasksForUserFn(userId) : cache.tasks.map(enrichTask);
    const total = source.length;
    const overdue = source.filter(t => t.status === 'overdue').length;
    const completed = source.filter(t => t.status === 'completed').length;
    const inProgress = source.filter(t => t.status === 'in_progress').length;
    const underReview = source.filter(t => t.status === 'under_review').length;
    const pending = total - completed - inProgress - underReview - overdue;
    return { total, pending, inProgress, underReview, completed, overdue };
  },

  addTask: async (task: Task, storeRef: any): Promise<void> => {
    const userId = storeRef.getCurrentUserId();
    const emp = userId ? storeRef.getEmployee(userId) : undefined;
    const enrichedTask: Task = {
      ...task,
      createdBy: userId || undefined,
      createdByName: emp?.fullName || '',
      updatedAt: nowISO(),
      statusHistory: [{ status: task.status || 'pending', at: nowISO(), by: userId || '' }],
      comments: task.comments || [],
    };

    if (enrichedTask.assignedTo && !enrichedTask.assignedName) {
      const assignedEmp = storeRef.getEmployee(enrichedTask.assignedTo);
      if (assignedEmp) enrichedTask.assignedName = assignedEmp.fullName;
    }

    cache.tasks.push(enrichedTask);
    const row = taskToSnake(enrichedTask);
    row.id = task.id;
    row.created_at = task.createdAt || nowISO();
    const { error } = await db.from('tasks').insert(row);
    if (error) {
      console.error('[store] addTask error:', error.message);
      cache.tasks = cache.tasks.filter(t => t.id !== task.id);
      throw new Error(error.message);
    }

    if (enrichedTask.assignedTo && enrichedTask.assignedTo !== userId) {
      try {
        await storeRef.addNotification({
          type: 'task',
          title: 'مهمة جديدة مسندة إليك',
          message: `تم إسناد مهمة "${enrichedTask.title}" إليك بواسطة ${emp?.fullName || 'المسؤول'}`,
          priority: enrichedTask.priority === 'high' ? 'high' : 'medium',
          relatedReportId: enrichedTask.relatedReportId,
          targetEmployeeId: enrichedTask.assignedTo,
        });
      } catch (notifErr) {
        console.error('[store] addTask notification error:', notifErr);
      }
    }
  },

  updateTask: async (id: string, data: Partial<Task>): Promise<void> => {
    const idx = cache.tasks.findIndex((t) => t.id === id);
    if (idx !== -1) {
      const oldValue = { ...cache.tasks[idx] };
      cache.tasks[idx] = { ...cache.tasks[idx], ...data, updatedAt: nowISO() };
      const row = taskToSnake(data);
      const { error } = await db.from('tasks').update(row).eq('id', id);
      if (error) {
        console.error('[store] updateTask error:', error.message);
        cache.tasks[idx] = oldValue;
        throw new Error(error.message);
      }
    }
  },

  /** Move task to in_progress */
  startTask: async (id: string, storeRef: any): Promise<void> => {
    const task = cache.tasks.find(t => t.id === id);
    if (!task) throw new Error('Task not found');
    const userId = storeRef.getCurrentUserId();
    const currentEmp = userId ? storeRef.getEmployee(userId) : undefined;
    const isAdmin = currentEmp?.role === 'admin';
    if (!canModifyTask(task, userId, isAdmin)) throw new Error('Unauthorized');

    const newHistory = buildStatusHistory(task.statusHistory, 'in_progress', userId || '', currentEmp?.fullName || '');
    await storeRef.updateTask(id, {
      status: 'in_progress',
      startedAt: nowISO(),
      statusHistory: newHistory,
    });
  },

  /** Move task to under_review */
  submitTaskForReview: async (id: string, storeRef: any): Promise<void> => {
    const task = cache.tasks.find(t => t.id === id);
    if (!task) throw new Error('Task not found');
    const userId = storeRef.getCurrentUserId();
    const currentEmp = userId ? storeRef.getEmployee(userId) : undefined;
    const isAdmin = currentEmp?.role === 'admin';
    if (!canModifyTask(task, userId, isAdmin)) throw new Error('Unauthorized');

    const newHistory = buildStatusHistory(task.statusHistory, 'under_review', userId || '', currentEmp?.fullName || '');
    await storeRef.updateTask(id, {
      status: 'under_review',
      reviewedAt: nowISO(),
      statusHistory: newHistory,
    });

    // Notify task creator or admin that task is ready for review
    if (task.createdBy && task.createdBy !== userId) {
      try {
        const submitter = storeRef.getCurrentUser();
        await storeRef.addNotification({
          type: 'task',
          title: 'مهمة بانتظار المراجعة',
          message: `المهمة "${task.title}" بانتظار مراجعتك — أكملها ${submitter?.fullName || 'موظف'}`,
          priority: 'medium',
          relatedReportId: task.relatedReportId,
          targetEmployeeId: task.createdBy,
        });
      } catch (notifErr) {
        console.error('[store] submitTaskForReview notification error:', notifErr);
      }
    }
  },

  completeTask: async (id: string, storeRef: any): Promise<void> => {
    const task = cache.tasks.find(t => t.id === id);
    if (!task) throw new Error('Task not found');
    const userId = storeRef.getCurrentUserId();
    const currentEmp = userId ? storeRef.getEmployee(userId) : undefined;
    const isAdmin = currentEmp?.role === 'admin';
    if (!canModifyTask(task, userId, isAdmin)) throw new Error('Unauthorized');

    // Calculate time spent in minutes
    let timeSpent = task.timeSpent || 0;
    if (task.startedAt) {
      const started = new Date(task.startedAt).getTime();
      timeSpent += Math.round((Date.now() - started) / 60000);
    }

    const newHistory = buildStatusHistory(task.statusHistory, 'completed', userId || '', currentEmp?.fullName || '');
    await storeRef.updateTask(id, {
      status: 'completed',
      completedAt: nowISO(),
      timeSpent,
      statusHistory: newHistory,
    });

    if (task.createdBy && task.createdBy !== userId) {
      try {
        const completer = storeRef.getCurrentUser();
        await storeRef.addNotification({
          type: 'task',
          title: 'تم إكمال مهمة',
          message: `تم إكمال المهمة "${task.title}" بواسطة ${completer?.fullName || 'موظف'}`,
          priority: 'low',
          relatedReportId: task.relatedReportId,
          targetEmployeeId: task.createdBy,
        });
      } catch (notifErr) {
        console.error('[store] completeTask notification error:', notifErr);
      }
    }

    // Handle recurrence: create next task if recurring
    if (task.recurrence && task.recurrence !== 'none') {
      try {
        const days = getRecurrenceDays(task.recurrence);
        if (days > 0) {
          const nextDue = new Date();
          nextDue.setDate(nextDue.getDate() + days);
          const nextTask: Task = {
            id: generateUUID(),
            title: task.title,
            description: task.description,
            priority: task.priority,
            status: 'pending',
            dueDate: nextDue.toISOString().split('T')[0],
            createdAt: nowISO(),
            updatedAt: nowISO(),
            assignedTo: task.assignedTo,
            assignedName: task.assignedName,
            createdBy: task.createdBy,
            createdByName: task.createdByName,
            recurrence: task.recurrence,
            category: task.category,
            relatedReportId: task.relatedReportId,
            relatedReportNumber: task.relatedReportNumber,
            comments: [],
            statusHistory: [{ status: 'pending', at: nowISO(), by: userId || '' }],
            isAutoGenerated: true,
          };
          await storeRef.addTask(nextTask, storeRef);
        }
      } catch (recErr) {
        console.error('[store] Recurrence creation error:', recErr);
      }
    }
  },

  reopenTask: async (id: string, storeRef: any): Promise<void> => {
    const task = cache.tasks.find(t => t.id === id);
    if (!task) throw new Error('Task not found');
    const userId = storeRef.getCurrentUserId();
    const currentEmp = userId ? storeRef.getEmployee(userId) : undefined;
    const isAdmin = currentEmp?.role === 'admin';
    if (!canModifyTask(task, userId, isAdmin)) throw new Error('Unauthorized');

    const newHistory = buildStatusHistory(task.statusHistory, 'pending', userId || '', currentEmp?.fullName || '');
    await storeRef.updateTask(id, {
      status: 'pending',
      completedAt: undefined,
      timeSpent: task.timeSpent, // keep accumulated time
      statusHistory: newHistory,
    });
  },

  /** Add a comment to a task */
  addTaskComment: async (taskId: string, text: string, storeRef: any): Promise<void> => {
    const task = cache.tasks.find(t => t.id === taskId);
    if (!task) return;

    const user = storeRef.getCurrentUser();
    const comment: TaskComment = {
      id: generateUUID(),
      taskId,
      employeeId: user?.id || '',
      employeeName: user?.fullName || 'مجهول',
      text,
      createdAt: nowISO(),
    };

    const updatedComments = [...(task.comments || []), comment];
    await storeRef.updateTask(taskId, { comments: updatedComments });

    // Notify assigned user if commenter is someone else
    if (task.assignedTo && task.assignedTo !== user?.id) {
      try {
        await storeRef.addNotification({
          type: 'task',
          title: 'تعليق جديد على مهمة',
          message: `${user?.fullName || 'موظف'} علّق على المهمة "${task.title}": ${text.substring(0, 80)}`,
          priority: 'low',
          relatedReportId: task.relatedReportId,
          targetEmployeeId: task.assignedTo,
        });
      } catch (notifErr) {
        console.error('[store] addTaskComment notification error:', notifErr);
      }
    }
  },

  /** Create an auto-task linked to a report (called from report flows) */
  createAutoTask: async (
    storeRef: any,
    params: {
      title: string;
      description: string;
      category: TaskCategory;
      assignedTo: string;
      relatedReportId?: string;
      relatedReportNumber?: string;
      priority?: 'low' | 'medium' | 'high';
    }
  ): Promise<void> => {
    const assignedEmp = storeRef.getEmployee(params.assignedTo);
    if (!assignedEmp) {
      console.warn('[store] createAutoTask: assigned employee not found', params.assignedTo);
      return;
    }

    const dueDate = getDefaultDueDate(params.category);
    const task: Task = {
      id: generateUUID(),
      title: params.title,
      description: params.description,
      priority: params.priority || 'medium',
      status: 'pending',
      dueDate,
      createdAt: nowISO(),
      updatedAt: nowISO(),
      assignedTo: params.assignedTo,
      assignedName: assignedEmp.fullName,
      createdBy: storeRef.getCurrentUserId(),
      createdByName: storeRef.getCurrentUser()?.fullName || '',
      recurrence: 'none',
      category: params.category,
      relatedReportId: params.relatedReportId,
      relatedReportNumber: params.relatedReportNumber,
      comments: [],
      statusHistory: [{ status: 'pending', at: nowISO(), by: storeRef.getCurrentUserId() || '' }],
      isAutoGenerated: true,
    };

    await storeRef.addTask(task, storeRef);
  },

  /** @deprecated Overdue is now computed dynamically in getters. Kept for backward compat but no-op. */
  updateTaskStatuses: async (): Promise<void> => {
    // Overdue status is computed in enrichTask(); no DB mutations needed.
  },

  deleteTask: async (id: string): Promise<void> => {
    const deleted = cache.tasks.find(t => t.id === id);
    cache.tasks = cache.tasks.filter((t) => t.id !== id);
    const { error } = await db.from('tasks').delete().eq('id', id);
    if (error) {
      console.error('[store] deleteTask error:', error.message);
      if (deleted) cache.tasks.push(deleted);
      throw new Error(error.message);
    }
  },
};
