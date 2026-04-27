import type { Task, TaskStatus, TaskPriority, TaskCategory, TaskRecurrence } from '@/types';
import React from 'react';
import { ArrowUpLeft, CircleDot, Zap, AlertTriangle, Clock, Eye, CheckCircle2 } from 'lucide-react';

export function generateUUID(): string {
  const buf = new Uint8Array(16);
  crypto.getRandomValues(buf);
  buf[6] = (buf[6] & 0x0f) | 0x40;
  buf[8] = (buf[8] & 0x3f) | 0x80;
  return Array.from(buf, b => b.toString(16).padStart(2, '0')).join('');
}

export const priorityConfig: Record<TaskPriority, { bg: string; color: string; label: string; icon: React.ReactNode; value: number }> = {
  high: { bg: 'var(--color-danger-bg, #fff1f2)', color: 'var(--color-danger)', label: 'عالية', icon: React.createElement(ArrowUpLeft, { size: 12 }), value: 3 },
  medium: { bg: 'var(--color-warning-bg, #fffbeb)', color: 'var(--color-warning)', label: 'متوسطة', icon: React.createElement(CircleDot, { size: 12 }), value: 2 },
  low: { bg: 'var(--color-success-bg, #ecfdf5)', color: 'var(--color-success)', label: 'منخفضة', icon: React.createElement(Zap, { size: 12 }), value: 1 },
};

export const statusConfig: Record<TaskStatus, { label: string; color: string; bg: string; headerBg: string }> = {
  pending: { label: 'قيد الانتظار', color: 'var(--color-text-secondary)', bg: 'var(--color-surface-alt)', headerBg: 'var(--color-surface-alt)' },
  in_progress: { label: 'قيد التنفيذ', color: 'var(--color-info)', bg: 'var(--color-info-bg)', headerBg: 'var(--color-info-bg)' },
  under_review: { label: 'تحت المراجعة', color: '#8b5cf6', bg: '#ede9fe', headerBg: '#ede9fe' },
  completed: { label: 'مكتملة', color: 'var(--color-success)', bg: 'var(--color-success-bg)', headerBg: 'var(--color-success-bg)' },
  overdue: { label: 'متأخرة', color: 'var(--color-danger)', bg: 'var(--color-danger-bg)', headerBg: 'var(--color-danger-bg)' },
};

export const COLUMNS: { status: TaskStatus; label: string; color: string; icon: React.ReactNode }[] = [
  { status: 'overdue', label: 'متأخرة', color: 'var(--color-danger)', icon: React.createElement(AlertTriangle, { size: 16 }) },
  { status: 'pending', label: 'قيد الانتظار', color: 'var(--color-text-secondary)', icon: React.createElement(Clock, { size: 16 }) },
  { status: 'in_progress', label: 'قيد التنفيذ', color: 'var(--color-info)', icon: React.createElement(CircleDot, { size: 16 }) },
  { status: 'under_review', label: 'تحت المراجعة', color: '#8b5cf6', icon: React.createElement(Eye, { size: 16 }) },
  { status: 'completed', label: 'مكتملة', color: 'var(--color-success)', icon: React.createElement(CheckCircle2, { size: 16 }) },
];

export function getTimeRemaining(dueDate: string): { text: string; color: string; days: number; urgency: 'overdue' | 'urgent' | 'soon' | 'normal' } {
  const due = new Date(dueDate);
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  const days = Math.ceil(diffMs / 86400000);

  if (days < 0) return { text: `متأخر ${Math.abs(days)} يوم`, color: 'var(--color-danger)', days, urgency: 'overdue' };
  if (days === 0) return { text: 'اليوم', color: 'var(--color-warning)', days, urgency: 'urgent' };
  if (days === 1) return { text: 'غداً', color: 'var(--color-warning)', days, urgency: 'urgent' };
  if (days <= 3) return { text: `باقي ${days} أيام`, color: 'var(--color-warning)', days, urgency: 'soon' };
  return { text: `باقي ${days} يوم`, color: 'var(--color-success)', days, urgency: 'normal' };
}

export function isTaskOverdue(task: Task): boolean {
  if (task.status === 'completed') return false;
  const due = new Date(task.dueDate);
  const now = new Date();
  return due < now;
}

export function computeTaskStatus(task: Task): TaskStatus {
  if (task.status === 'completed') return 'completed';
  if (isTaskOverdue(task)) return 'overdue';
  return task.status;
}

export const categoryLabels: Record<TaskCategory, string> = {
  general: 'عامة',
  valuation: 'تثمين',
  followup: 'متابعة',
  administrative: 'إدارية',
  field_visit: 'زيارة ميدانية',
  review: 'مراجعة',
};

export const recurrenceLabels: Record<TaskRecurrence, string> = {
  none: 'بدون',
  daily: 'يومي',
  weekly: 'أسبوعي',
  monthly: 'شهري',
};

export function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const priDiff = priorityConfig[b.priority].value - priorityConfig[a.priority].value;
    if (priDiff !== 0) return priDiff;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });
}

export function canModifyTaskStatus(task: Task, currentUserId: string | undefined, isAdmin: boolean): boolean {
  if (isAdmin) return true;
  if (!currentUserId) return false;
  return task.assignedTo === currentUserId;
}

export function canEditTask(task: Task, currentUserId: string | undefined, isAdmin: boolean, canManage: boolean): boolean {
  if (isAdmin) return true;
  if (!canManage) return false;
  if (!currentUserId) return false;
  return task.assignedTo === currentUserId || task.createdBy === currentUserId;
}
