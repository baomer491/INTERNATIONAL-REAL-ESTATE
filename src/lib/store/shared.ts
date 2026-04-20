'use client';

import type { Report, Bank, Beneficiary, Notification, Task, AppSettings, Employee, LoginLog } from '@/types';
import { settings as initialSettings } from '@/data/mock';
import { db } from '../supabase';
import { generateId } from '../utils';

/* ===== In-Memory Cache (mutable object so all modules share the same references) ===== */
export const cache = {
  reports: [] as Report[],
  banks: [] as Bank[],
  beneficiaries: [] as Beneficiary[],
  notifications: [] as Notification[],
  tasks: [] as Task[],
  employees: [] as Employee[],
  loginLogs: [] as LoginLog[],
  settings: { ...initialSettings } as AppSettings,
  drafts: {} as Record<string, unknown>,
};

/* ===== localStorage Keys (auth only) ===== */
export const STORAGE_KEYS = {
  isLoggedIn: 'ireo_logged_in',
  currentUserId: 'ireo_current_user_id',
} as const;

export function lsGet(key: string): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(key);
}
export function lsSet(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, value);
}
export function lsRemove(key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(key);
}

export { db, generateId };
