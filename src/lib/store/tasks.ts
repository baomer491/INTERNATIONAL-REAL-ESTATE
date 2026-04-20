'use client';

import type { Task } from '@/types';
import { cache, db, generateId } from './shared';
import { mapTaskRow, taskToSnake } from './mappers';

export const tasksStore = {
  getTasks: (): Task[] => cache.tasks,

  refreshTasksFromDB: async (): Promise<void> => {
    try {
      const { data, error } = await db.from('tasks').select('*');
      if (!error && data) {
        cache.tasks = data.map((r: Record<string, unknown>) => mapTaskRow(r));
        console.log('[store] refreshTasksFromDB: refreshed', cache.tasks.length, 'tasks');
      } else if (error) {
        console.error('[store] refreshTasksFromDB error:', error.message);
      }
    } catch (err) {
      console.error('[store] refreshTasksFromDB exception:', err);
    }
  },

  getTasksForUser: (userId: string): Task[] => {
    const currentEmp = cache.employees.find(e => e.id === userId);
    const isAdmin = currentEmp?.role === 'admin';
    if (isAdmin) return cache.tasks;
    return cache.tasks.filter(t => t.assignedTo === userId || t.createdBy === userId);
  },

  getTodayTasks: (userId?: string, getTasksForUserFn?: (userId: string) => Task[]): Task[] => {
    const today = new Date().toDateString();
    const source = userId && getTasksForUserFn ? getTasksForUserFn(userId) : cache.tasks;
    return source.filter(t => {
      const due = new Date(t.dueDate);
      return due.toDateString() === today && t.status !== 'completed';
    });
  },

  getTaskStats: (userId?: string, getTasksForUserFn?: (userId: string) => Task[]): { total: number; pending: number; inProgress: number; completed: number; overdue: number } => {
    const source = userId && getTasksForUserFn ? getTasksForUserFn(userId) : cache.tasks;
    const total = source.length;
    const overdue = source.filter(t => t.status === 'overdue').length;
    const completed = source.filter(t => t.status === 'completed').length;
    const inProgress = source.filter(t => t.status === 'in_progress').length;
    const pending = total - completed - inProgress - overdue;
    return { total, pending, inProgress, completed, overdue };
  },

  addTask: async (task: Task, storeRef: any): Promise<void> => {
    const userId = storeRef.getCurrentUserId();
    const emp = userId ? storeRef.getEmployee(userId) : undefined;
    const enrichedTask = {
      ...task,
      createdBy: userId || undefined,
      createdByName: emp?.fullName || '',
    };

    if (enrichedTask.assignedTo && !enrichedTask.assignedName) {
      const assignedEmp = storeRef.getEmployee(enrichedTask.assignedTo);
      if (assignedEmp) enrichedTask.assignedName = assignedEmp.fullName;
    }

    cache.tasks.push(enrichedTask);
    const row = taskToSnake(enrichedTask);
    row.id = task.id;
    row.created_at = task.createdAt || new Date().toISOString();
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
      cache.tasks[idx] = { ...cache.tasks[idx], ...data };
      const row = taskToSnake(data);
      const { error } = await db.from('tasks').update(row).eq('id', id);
      if (error) {
        console.error('[store] updateTask error:', error.message);
        cache.tasks[idx] = oldValue;
        throw new Error(error.message);
      }
    }
  },

  completeTask: async (id: string, storeRef: any): Promise<void> => {
    const task = cache.tasks.find(t => t.id === id);
    await storeRef.updateTask(id, { status: 'completed', completedAt: new Date().toISOString() });

    if (task && task.createdBy && task.createdBy !== storeRef.getCurrentUserId()) {
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
  },

  updateTaskStatuses: async (): Promise<void> => {
    const now = new Date();
    let changed = false;
    const updated = cache.tasks.map(t => {
      if (t.status === 'completed') return t;
      const due = new Date(t.dueDate);
      if (due < now && t.status !== 'overdue') {
        changed = true;
        return { ...t, status: 'overdue' as const };
      }
      return t;
    });
    if (changed) {
      cache.tasks = updated;
      for (const t of cache.tasks) {
        if (t.status === 'overdue') {
          const { error } = await db.from('tasks').update({ status: 'overdue' }).eq('id', t.id);
          if (error) console.error('[store] updateTaskStatuses error:', error.message);
        }
      }
    }
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
