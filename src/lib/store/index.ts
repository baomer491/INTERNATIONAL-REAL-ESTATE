'use client';

// Unified store — re-exported from sub-modules
// `import { store } from '@/lib/store'` still works as before

import {
  cache,
  db,
} from './shared';
import {
  mapEmployeeRow, mapBankRow, mapBeneficiaryRow, mapReportRow,
  mapNotificationRow, mapTaskRow, mapLoginLogRow, mapSettingsRow, mapPreliminaryTemplateRow,
} from './mappers';
import { authStore, seedDefaultAdmin } from './auth';
import { reportsStore } from './reports';
import { employeesStore } from './employees';
import { beneficiariesStore } from './beneficiaries';
import { banksStore } from './banks';
import { tasksStore } from './tasks';
import { notificationsStore } from './notifications';
import { settingsStore } from './settings';
import { preliminaryStore } from './preliminary';
import { preliminaryTemplateStore } from './preliminary-templates';

/* ===== Initialize Store ===== */
export async function initializeStore(): Promise<void> {
  try {
    const [empRes, bankRes, benRes, repRes, notifRes, taskRes, logRes, settingsRes, draftsRes, tmplRes] = await Promise.all([
      db.from('employees').select('*'),
      db.from('banks').select('*'),
      db.from('beneficiaries').select('*'),
      db.from('reports').select('*').order('created_at', { ascending: false }),
      db.from('notifications').select('*').order('created_at', { ascending: false }),
      db.from('tasks').select('*'),
      db.from('login_logs').select('*').order('timestamp', { ascending: false }),
      db.from('app_settings').select('*').limit(1),
      db.from('drafts').select('*'),
      db.from('preliminary_templates').select('*').order('created_at', { ascending: false }),
    ]);

    cache.employees = (empRes.data ?? []).map((r: Record<string, unknown>) => mapEmployeeRow(r));

    if (cache.employees.length === 0) {
      await seedDefaultAdmin();
    }

    cache.banks = (bankRes.data ?? []).map((r: Record<string, unknown>) => mapBankRow(r));
    cache.beneficiaries = (benRes.data ?? []).map((r: Record<string, unknown>) => mapBeneficiaryRow(r));
    cache.reports = (repRes.data ?? []).map((r: Record<string, unknown>) => mapReportRow(r));
    cache.notifications = (notifRes.data ?? []).map((r: Record<string, unknown>) => mapNotificationRow(r));
    cache.tasks = (taskRes.data ?? []).map((r: Record<string, unknown>) => mapTaskRow(r));
    cache.loginLogs = (logRes.data ?? []).map((r: Record<string, unknown>) => mapLoginLogRow(r));

    if (settingsRes.data && settingsRes.data.length > 0) {
      cache.settings = mapSettingsRow(settingsRes.data[0] as Record<string, unknown>);
    }

    const draftsRows = draftsRes.data ?? [];
    const draftsMap: Record<string, unknown> = {};
    for (const d of draftsRows) {
      const row = d as Record<string, unknown>;
      if (row.key) {
        draftsMap[row.key as string] = row.data;
      }
    }
    cache.drafts = draftsMap;

    // Cache preliminary templates in the store module (not in shared cache)
    if (tmplRes.data) {
      const templates = (tmplRes.data ?? []).map((r: Record<string, unknown>) => mapPreliminaryTemplateRow(r));
      // Update the module-level cache via a setter if needed, but for now we rely on the store's own cache
      // The preliminaryTemplateStore maintains its own cache
      // We'll force a refresh
      await preliminaryTemplateStore.refreshFromDB();
    }

  } catch (err) {
    console.error('[store] initializeStore error:', err);
  }
}

/* ===== Unified Store ===== */
export const store = {

  /* ============================= Auth ============================= */
  isLoggedIn: authStore.isLoggedIn,
  getCurrentUserId: authStore.getCurrentUserId,
  getCurrentUser: authStore.getCurrentUser,
  login: authStore.login,
  logout: () => authStore.logout(store),
  changePassword: authStore.changePassword,

  /* ============================= Reports ============================= */
  getReports: reportsStore.getReports,
  getReport: reportsStore.getReport,
  refreshReportsFromDB: reportsStore.refreshReportsFromDB,
  addReport: reportsStore.addReport,
  updateReport: reportsStore.updateReport,
  deleteReport: reportsStore.deleteReport,

  /* ============================= Banks ============================= */
  getBanks: banksStore.getBanks,
  getActiveBanks: banksStore.getActiveBanks,
  addBank: banksStore.addBank,
  updateBank: banksStore.updateBank,
  deleteBank: banksStore.deleteBank,
  toggleBank: banksStore.toggleBank,
  refreshBanksFromDB: banksStore.refreshBanksFromDB,

  /* ============================= Beneficiaries ============================= */
  getBeneficiaries: beneficiariesStore.getBeneficiaries,
  getBeneficiary: beneficiariesStore.getBeneficiary,
  addBeneficiary: beneficiariesStore.addBeneficiary,
  updateBeneficiary: beneficiariesStore.updateBeneficiary,
  deleteBeneficiary: beneficiariesStore.deleteBeneficiary,
  refreshBeneficiariesFromDB: beneficiariesStore.refreshBeneficiariesFromDB,

  /* ============================= Notifications ============================= */
  getNotifications: () => notificationsStore.getNotifications(authStore.getCurrentUserId),
  addNotification: notificationsStore.addNotification,
  deleteNotification: notificationsStore.deleteNotification,
  clearReadNotifications: notificationsStore.clearReadNotifications,
  markAsRead: notificationsStore.markAsRead,
  markAllAsRead: notificationsStore.markAllAsRead,
  unreadCount: notificationsStore.unreadCount,
  refreshNotificationsFromDB: notificationsStore.refreshNotificationsFromDB,

  /* ============================= Tasks ============================= */
  getTasks: tasksStore.getTasks,
  getTasksByReportId: (reportId: string) => tasksStore.getTasksByReportId(reportId),
  refreshTasksFromDB: tasksStore.refreshTasksFromDB,
  getTasksForUser: (userId: string) => tasksStore.getTasksForUser(userId),
  getTodayTasks: (userId?: string) => tasksStore.getTodayTasks(userId, tasksStore.getTasksForUser),
  getTaskStats: (userId?: string) => tasksStore.getTaskStats(userId, tasksStore.getTasksForUser),
  addTask: (task: Parameters<typeof tasksStore.addTask>[0]) => tasksStore.addTask(task, store),
  updateTask: tasksStore.updateTask,
  startTask: (id: string) => tasksStore.startTask(id, store),
  submitTaskForReview: (id: string) => tasksStore.submitTaskForReview(id, store),
  completeTask: (id: string) => tasksStore.completeTask(id, store),
  reopenTask: (id: string) => tasksStore.reopenTask(id, store),
  addTaskComment: (taskId: string, text: string) => tasksStore.addTaskComment(taskId, text, store),
  createAutoTask: (params: Parameters<typeof tasksStore.createAutoTask>[1]) => tasksStore.createAutoTask(store, params),
  updateTaskStatuses: tasksStore.updateTaskStatuses,
  deleteTask: tasksStore.deleteTask,

  /* ============================= Preliminary Templates ============================= */
  getPreliminaryTemplates: preliminaryTemplateStore.getAll,
  addPreliminaryTemplate: preliminaryTemplateStore.add,
  deletePreliminaryTemplate: preliminaryTemplateStore.delete,
  getPreliminaryTemplateById: preliminaryTemplateStore.getById,
  downloadPreliminaryTemplate: preliminaryTemplateStore.download,
  refreshPreliminaryTemplatesFromDB: preliminaryTemplateStore.refreshFromDB,

  /* ============================= Preliminary Valuations ============================= */
  getPreliminaryValuations: preliminaryStore.getAll,
  getPreliminaryValuation: preliminaryStore.getById,
  addPreliminaryValuation: preliminaryStore.add,
  updatePreliminaryValuation: preliminaryStore.update,
  deletePreliminaryValuation: preliminaryStore.delete,

  /* ============================= Settings ============================= */
  getSettings: settingsStore.getSettings,
  updateSettings: settingsStore.updateSettings,

  /* ============================= Employees ============================= */
  getEmployees: employeesStore.getEmployees,
  getEmployee: employeesStore.getEmployee,
  addEmployee: employeesStore.addEmployee,
  updateEmployee: employeesStore.updateEmployee,
  deleteEmployee: employeesStore.deleteEmployee,
  refreshEmployeesFromDB: employeesStore.refreshEmployeesFromDB,
  suspendEmployee: (id: string) => employeesStore.suspendEmployee(id, employeesStore.updateEmployee),
  activateEmployee: (id: string) => employeesStore.activateEmployee(id, employeesStore.updateEmployee),

  /* ============================= Login Logs ============================= */
  getLoginLogs: authStore.getLoginLogs,
  addLoginLog: authStore.addLoginLog,

  /* ============================= Drafts ============================= */
  getDraft: (key: string): unknown => {
    return cache.drafts[key];
  },

  saveDraft: async (key: string, data: unknown): Promise<void> => {
    const oldValue = cache.drafts[key];
    cache.drafts[key] = data;
    const { data: rows, error: selectError } = await db.from('drafts').select('id').eq('key', key).limit(1);
    if (selectError) {
      console.error('[store] saveDraft select error:', selectError.message);
      if (oldValue !== undefined) cache.drafts[key] = oldValue; else delete cache.drafts[key];
      throw new Error(selectError.message);
    }
    if (rows && rows.length > 0) {
      const { error } = await db.from('drafts').update({ data, updated_at: new Date().toISOString() }).eq('key', key);
      if (error) {
        console.error('[store] saveDraft update error:', error.message);
        if (oldValue !== undefined) cache.drafts[key] = oldValue; else delete cache.drafts[key];
        throw new Error(error.message);
      }
    } else {
      const { error } = await db.from('drafts').insert({ key, data, updated_at: new Date().toISOString() });
      if (error) {
        console.error('[store] saveDraft insert error:', error.message);
        if (oldValue !== undefined) cache.drafts[key] = oldValue; else delete cache.drafts[key];
        throw new Error(error.message);
      }
    }
  },

  clearDraft: async (key: string): Promise<void> => {
    const oldValue = cache.drafts[key];
    delete cache.drafts[key];
    const { error } = await db.from('drafts').delete().eq('key', key);
    if (error) {
      console.error('[store] clearDraft error:', error.message);
      cache.drafts[key] = oldValue;
      throw new Error(error.message);
    }
  },
};
