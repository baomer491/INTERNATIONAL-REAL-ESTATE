'use client';

import type { Report, Bank, Beneficiary, Notification, Task, AppSettings, Employee, LoginLog } from '@/types';
import { PERMISSIONS } from '@/types';
import {
  reports as initialReports,
  banks as initialBanks,
  beneficiaries as initialBeneficiaries,
  notifications as initialNotifications,
  tasks as initialTasks,
  settings as initialSettings,
  employees as initialEmployees,
  loginLogs as initialLoginLogs,
} from '@/data/mock';

/* ===== Local Storage Keys ===== */
const STORAGE_KEYS = {
  reports: 'ireo_reports',
  banks: 'ireo_banks',
  beneficiaries: 'ireo_beneficiaries',
  notifications: 'ireo_notifications',
  tasks: 'ireo_tasks',
  settings: 'ireo_settings',
  isLoggedIn: 'ireo_logged_in',
  currentUserId: 'ireo_current_user_id',
  drafts: 'ireo_drafts',
  employees: 'ireo_employees',
  loginLogs: 'ireo_login_logs',
} as const;

/* ===== Generic Storage Helpers ===== */
function getFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

function setToStorage<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Storage error:', e);
  }
}

/* ===== Store ===== */
export const store = {
  /* --- Auth --- */
  isLoggedIn: (): boolean => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(STORAGE_KEYS.isLoggedIn) === 'true';
  },
  getCurrentUserId: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEYS.currentUserId);
  },
  getCurrentUser: (): Employee | undefined => {
    const id = store.getCurrentUserId();
    if (!id) return undefined;
    return store.getEmployees().find(e => e.id === id);
  },
  login: (username: string, password: string): { success: boolean; reason?: string } => {
    let employee = store.getEmployees().find(
      e => e.username === username && e.password === password
    );

    if (!employee && username === 'admin' && password === 'admin123') {
      const adminEmployee: Employee = {
        id: 'e1',
        fullName: 'مدير النظام',
        username: 'admin',
        password: 'admin123',
        email: 'admin@ireo.om',
        phone: '',
        role: 'admin',
        status: 'active',
        avatar: '',
        department: 'الإدارة العامة',
        joinDate: new Date().toISOString(),
        lastLogin: null,
        lastLogout: null,
        isActiveSession: false,
        permissions: PERMISSIONS.map(p => p.id),
        notes: 'حساب مدير النظام الافتراضي',
      };
      store.addEmployee(adminEmployee);
      employee = adminEmployee;
    }

    if (!employee) return { success: false, reason: 'invalid_credentials' };
    if (employee.status === 'suspended') return { success: false, reason: 'suspended' };
    if (employee.status === 'inactive') return { success: false, reason: 'inactive' };

    localStorage.setItem(STORAGE_KEYS.isLoggedIn, 'true');
    localStorage.setItem(STORAGE_KEYS.currentUserId, employee.id);

    store.updateEmployee(employee.id, {
      lastLogin: new Date().toISOString(),
      isActiveSession: true,
    });

    store.addLoginLog({
      id: `l-${Date.now()}`,
      employeeId: employee.id,
      employeeName: employee.fullName,
      action: 'login',
      timestamp: new Date().toISOString(),
      ipAddress: '192.168.1.' + Math.floor(Math.random() * 255),
    });

    return { success: true };
  },
  logout: (): void => {
    const userId = store.getCurrentUserId();
    if (userId) {
      const emp = store.getEmployee(userId);
      if (emp) {
        store.updateEmployee(userId, {
          lastLogout: new Date().toISOString(),
          isActiveSession: false,
        });
        store.addLoginLog({
          id: `l-${Date.now()}`,
          employeeId: userId,
          employeeName: emp.fullName,
          action: 'logout',
          timestamp: new Date().toISOString(),
          ipAddress: '192.168.1.' + Math.floor(Math.random() * 255),
        });
      }
    }
    localStorage.removeItem(STORAGE_KEYS.isLoggedIn);
    localStorage.removeItem(STORAGE_KEYS.currentUserId);
  },

  /* --- Reports --- */
  getReports: (): Report[] => getFromStorage(STORAGE_KEYS.reports, initialReports),
  getReport: (id: string): Report | undefined => {
    return store.getReports().find((r) => r.id === id);
  },
  addReport: (report: Report): void => {
    const reports = store.getReports();
    reports.unshift(report);
    setToStorage(STORAGE_KEYS.reports, reports);
  },
  updateReport: (id: string, data: Partial<Report>): void => {
    const reports = store.getReports();
    const idx = reports.findIndex((r) => r.id === id);
    if (idx !== -1) {
      reports[idx] = { ...reports[idx], ...data, updatedAt: new Date().toISOString() };
      setToStorage(STORAGE_KEYS.reports, reports);
    }
  },
  deleteReport: (id: string): void => {
    const reports = store.getReports().filter((r) => r.id !== id);
    setToStorage(STORAGE_KEYS.reports, reports);
  },

  /* --- Banks --- */
  getBanks: (): Bank[] => getFromStorage(STORAGE_KEYS.banks, initialBanks),
  getActiveBanks: (): Bank[] => store.getBanks().filter((b) => b.isActive),
  addBank: (bank: Bank): void => {
    const banks = store.getBanks();
    banks.push(bank);
    setToStorage(STORAGE_KEYS.banks, banks);
  },
  updateBank: (id: string, data: Partial<Bank>): void => {
    const banks = store.getBanks();
    const idx = banks.findIndex((b) => b.id === id);
    if (idx !== -1) {
      banks[idx] = { ...banks[idx], ...data };
      setToStorage(STORAGE_KEYS.banks, banks);
    }
  },
  toggleBank: (id: string): void => {
    const banks = store.getBanks();
    const idx = banks.findIndex((b) => b.id === id);
    if (idx !== -1) {
      banks[idx].isActive = !banks[idx].isActive;
      setToStorage(STORAGE_KEYS.banks, banks);
    }
  },

  /* --- Beneficiaries --- */
  getBeneficiaries: (): Beneficiary[] => getFromStorage(STORAGE_KEYS.beneficiaries, initialBeneficiaries),
  getBeneficiary: (id: string): Beneficiary | undefined => {
    return store.getBeneficiaries().find((b) => b.id === id);
  },
  addBeneficiary: (bn: Beneficiary): void => {
    const list = store.getBeneficiaries();
    list.push(bn);
    setToStorage(STORAGE_KEYS.beneficiaries, list);
  },
  updateBeneficiary: (id: string, data: Partial<Beneficiary>): void => {
    const list = store.getBeneficiaries();
    const idx = list.findIndex((b) => b.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...data };
      setToStorage(STORAGE_KEYS.beneficiaries, list);
    }
  },
  deleteBeneficiary: (id: string): void => {
    const list = store.getBeneficiaries().filter((b) => b.id !== id);
    setToStorage(STORAGE_KEYS.beneficiaries, list);
  },

  /* --- Notifications --- */
  getNotifications: (): Notification[] => getFromStorage(STORAGE_KEYS.notifications, initialNotifications),
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>): Notification => {
    const list = store.getNotifications();
    const newNotification: Notification = {
      ...notification,
      id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
      isRead: false,
    };
    list.unshift(newNotification);
    setToStorage(STORAGE_KEYS.notifications, list);
    return newNotification;
  },
  deleteNotification: (id: string): void => {
    const list = store.getNotifications().filter(n => n.id !== id);
    setToStorage(STORAGE_KEYS.notifications, list);
  },
  clearReadNotifications: (): void => {
    const list = store.getNotifications().filter(n => !n.isRead);
    setToStorage(STORAGE_KEYS.notifications, list);
  },
  markAsRead: (id: string): void => {
    const list = store.getNotifications();
    const idx = list.findIndex((n) => n.id === id);
    if (idx !== -1) {
      list[idx].isRead = true;
      setToStorage(STORAGE_KEYS.notifications, list);
    }
  },
  markAllAsRead: (): void => {
    const list = store.getNotifications().map((n) => ({ ...n, isRead: true }));
    setToStorage(STORAGE_KEYS.notifications, list);
  },
  unreadCount: (): number => store.getNotifications().filter((n) => !n.isRead).length,

  /* --- Tasks --- */
  getTasks: (): Task[] => getFromStorage(STORAGE_KEYS.tasks, initialTasks),
  addTask: (task: Task): void => {
    const list = store.getTasks();
    list.push(task);
    setToStorage(STORAGE_KEYS.tasks, list);
  },
  updateTask: (id: string, data: Partial<Task>): void => {
    const list = store.getTasks();
    const idx = list.findIndex((t) => t.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...data };
      setToStorage(STORAGE_KEYS.tasks, list);
    }
  },
  completeTask: (id: string): void => {
    store.updateTask(id, { status: 'completed' });
  },
  updateTaskStatuses: (): void => {
    const tasks = store.getTasks();
    const now = new Date();
    let changed = false;
    const updated = tasks.map(t => {
      if (t.status === 'completed') return t;
      const due = new Date(t.dueDate);
      if (due < now && t.status !== 'overdue') {
        changed = true;
        return { ...t, status: 'overdue' as const };
      }
      return t;
    });
    if (changed) setToStorage(STORAGE_KEYS.tasks, updated);
  },
  deleteTask: (id: string): void => {
    const list = store.getTasks().filter((t) => t.id !== id);
    setToStorage(STORAGE_KEYS.tasks, list);
  },

  /* --- Settings --- */
  getSettings: (): AppSettings => getFromStorage(STORAGE_KEYS.settings, initialSettings),
  updateSettings: (data: Partial<AppSettings>): void => {
    const current = store.getSettings();
    setToStorage(STORAGE_KEYS.settings, { ...current, ...data });
  },

  /* --- Employees --- */
  getEmployees: (): Employee[] => getFromStorage(STORAGE_KEYS.employees, initialEmployees),
  getEmployee: (id: string): Employee | undefined => store.getEmployees().find((e) => e.id === id),
  addEmployee: (employee: Employee): void => {
    const list = store.getEmployees();
    list.push(employee);
    setToStorage(STORAGE_KEYS.employees, list);
  },
  updateEmployee: (id: string, data: Partial<Employee>): void => {
    const list = store.getEmployees();
    const idx = list.findIndex((e) => e.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...data };
      setToStorage(STORAGE_KEYS.employees, list);
    }
  },
  deleteEmployee: (id: string): void => {
    const list = store.getEmployees().filter((e) => e.id !== id);
    setToStorage(STORAGE_KEYS.employees, list);
  },
  suspendEmployee: (id: string): void => {
    store.updateEmployee(id, { status: 'suspended' });
  },
  activateEmployee: (id: string): void => {
    store.updateEmployee(id, { status: 'active' });
  },
  changePassword: (employeeId: string, currentPassword: string, newPassword: string): { success: boolean; reason?: string } => {
    const emp = store.getEmployee(employeeId);
    if (!emp) return { success: false, reason: 'not_found' };
    if (emp.password !== currentPassword) return { success: false, reason: 'wrong_password' };
    store.updateEmployee(employeeId, { password: newPassword });
    return { success: true };
  },

  /* --- Login Logs --- */
  getLoginLogs: (): LoginLog[] => getFromStorage(STORAGE_KEYS.loginLogs, initialLoginLogs),
  addLoginLog: (log: LoginLog): void => {
    const logs = store.getLoginLogs();
    logs.unshift(log);
    setToStorage(STORAGE_KEYS.loginLogs, logs);
  },

  /* --- Drafts --- */
  getDraft: (key: string): unknown => {
    const drafts = getFromStorage<Record<string, unknown>>(STORAGE_KEYS.drafts, {});
    return drafts[key];
  },
  saveDraft: (key: string, data: unknown): void => {
    const drafts = getFromStorage<Record<string, unknown>>(STORAGE_KEYS.drafts, {});
    drafts[key] = data;
    setToStorage(STORAGE_KEYS.drafts, drafts);
  },
  clearDraft: (key: string): void => {
    const drafts = getFromStorage<Record<string, unknown>>(STORAGE_KEYS.drafts, {});
    delete drafts[key];
    setToStorage(STORAGE_KEYS.drafts, drafts);
  },
};
