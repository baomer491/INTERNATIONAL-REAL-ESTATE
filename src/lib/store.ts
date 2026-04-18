'use client';

import type { Report, Bank, Beneficiary, Notification, Task, AppSettings, Employee, LoginLog } from '@/types';
import { PERMISSIONS } from '@/types';
import { settings as initialSettings } from '@/data/mock';
import { db } from './supabase';
import { generateId } from './utils';

/* ===== Password Hashing (SHA-256 based, works in non-secure HTTP contexts) ===== */

// Simple SHA-256 hash using crypto.subtle if available, otherwise a pure-JS fallback
async function sha256(message: string): Promise<string> {
  // Try native crypto.subtle first (secure contexts: HTTPS, localhost)
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const enc = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', enc.encode(message));
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Pure-JS fallback for non-secure HTTP contexts (e.g. http://192.168.x.x)
  // Based on the SHA-256 algorithm
  function rightRotate(value: number, amount: number): number {
    return (value >>> amount) | (value << (32 - amount));
  }

  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];

  // Convert string to UTF-8 bytes
  const encoder = new TextEncoder();
  const msgBytes = encoder.encode(message);

  // Pre-processing: adding padding bits
  const msgLen = msgBytes.length;
  const bitLen = msgLen * 8;
  const newLen = Math.ceil((msgLen + 1 + 8) / 64) * 64;
  const padded = new Uint8Array(newLen);
  padded.set(msgBytes);
  padded[msgLen] = 0x80;
  const dv = new DataView(padded.buffer);
  dv.setUint32(newLen - 4, bitLen, false);

  // Initial hash values
  let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a;
  let h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;

  // Process each 64-byte chunk
  for (let offset = 0; offset < newLen; offset += 64) {
    const w = new Uint32Array(64);
    for (let i = 0; i < 16; i++) {
      w[i] = dv.getUint32(offset + i * 4, false);
    }
    for (let i = 16; i < 64; i++) {
      const s0 = rightRotate(w[i - 15], 7) ^ rightRotate(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rightRotate(w[i - 2], 17) ^ rightRotate(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
    }

    let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
    for (let i = 0; i < 64; i++) {
      const S1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + K[i] + w[i]) | 0;
      const S0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) | 0;
      h = g; g = f; f = e; e = (d + temp1) | 0;
      d = c; c = b; b = a; a = (temp1 + temp2) | 0;
    }

    h0 = (h0 + a) | 0; h1 = (h1 + b) | 0; h2 = (h2 + c) | 0; h3 = (h3 + d) | 0;
    h4 = (h4 + e) | 0; h5 = (h5 + f) | 0; h6 = (h6 + g) | 0; h7 = (h7 + h) | 0;
  }

  const result = [h0, h1, h2, h3, h4, h5, h6, h7];
  return result.map(v => (v >>> 0).toString(16).padStart(8, '0')).join('');
}

function generateSalt(): string {
  const arr = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(arr);
  } else {
    for (let i = 0; i < 16; i++) arr[i] = (Date.now() + i * 37) & 0xFF;
  }
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Hash password with multiple rounds of SHA-256 (salted)
async function hashPassword(password: string, salt?: string): Promise<string> {
  const s = salt || generateSalt();
  // 100 iterations for key stretching (balances security & performance)
  let hash = await sha256(s + ':' + password);
  for (let i = 0; i < 100; i++) {
    hash = await sha256(s + ':' + hash);
  }
  return `${s}:${hash}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  // If stored password is plain text (no colon separator), do direct comparison
  if (!stored.includes(':')) {
    return password === stored;
  }
  const [salt] = stored.split(':');
  const computed = await hashPassword(password, salt);
  return computed === stored;
}

/* ===== In-Memory Cache ===== */
let _reports: Report[] = [];
let _banks: Bank[] = [];
let _beneficiaries: Beneficiary[] = [];
let _notifications: Notification[] = [];
let _tasks: Task[] = [];
let _employees: Employee[] = [];
let _loginLogs: LoginLog[] = [];
let _settings: AppSettings = { ...initialSettings };
let _drafts: Record<string, unknown> = {};

/* ===== localStorage Keys (auth only) ===== */
const STORAGE_KEYS = {
  isLoggedIn: 'ireo_logged_in',
  currentUserId: 'ireo_current_user_id',
} as const;

function lsGet(key: string): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(key);
}
function lsSet(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, value);
}
function lsRemove(key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(key);
}

/* ===== Mapper helpers (camelCase ↔ snake_case) ===== */

/* --- Employee --- */
function mapEmployeeRow(row: Record<string, unknown>): Employee {
  return {
    id: row.id as string,
    fullName: (row.full_name ?? '') as string,
    username: (row.username ?? '') as string,
    password: (row.password_hash ?? '') as string,
    email: (row.email ?? '') as string,
    phone: (row.phone ?? '') as string,
    role: (row.role ?? 'viewer') as Employee['role'],
    status: (row.status ?? 'active') as Employee['status'],
    avatar: (row.avatar ?? '') as string,
    department: (row.department ?? '') as string,
    joinDate: (row.join_date ?? '') as string,
    lastLogin: (row.last_login ?? null) as string | null,
    lastLogout: (row.last_logout ?? null) as string | null,
    isActiveSession: (row.is_active_session ?? false) as boolean,
    permissions: (row.permissions ?? []) as string[],
    notes: (row.notes ?? '') as string,
  };
}

function employeeToSnake(emp: Partial<Employee>): Record<string, unknown> {
  const m: Record<string, unknown> = {};
  if (emp.fullName !== undefined) m.full_name = emp.fullName;
  if (emp.username !== undefined) m.username = emp.username;
  if (emp.password !== undefined) m.password_hash = emp.password;
  if (emp.email !== undefined) m.email = emp.email;
  if (emp.phone !== undefined) m.phone = emp.phone;
  if (emp.role !== undefined) m.role = emp.role;
  if (emp.status !== undefined) m.status = emp.status;
  if (emp.avatar !== undefined) m.avatar = emp.avatar;
  if (emp.department !== undefined) m.department = emp.department;
  if (emp.joinDate !== undefined) m.join_date = emp.joinDate;
  if (emp.lastLogin !== undefined) m.last_login = emp.lastLogin;
  if (emp.lastLogout !== undefined) m.last_logout = emp.lastLogout;
  if (emp.isActiveSession !== undefined) m.is_active_session = emp.isActiveSession;
  if (emp.permissions !== undefined) m.permissions = emp.permissions;
  if (emp.notes !== undefined) m.notes = emp.notes;
  return m;
}

/* --- Bank --- */
function mapBankRow(row: Record<string, unknown>): Bank {
  return {
    id: row.id as string,
    name: (row.name ?? '') as string,
    nameEn: (row.name_en ?? '') as string,
    logo: (row.logo ?? '') as string,
    isActive: (row.is_active ?? true) as boolean,
    reportTemplate: (row.report_template ?? '') as string,
    contactPerson: (row.contact_person ?? '') as string,
    phone: (row.phone ?? '') as string,
    email: (row.email ?? '') as string,
    address: (row.address ?? '') as string,
  };
}

function bankToSnake(bank: Partial<Bank>): Record<string, unknown> {
  const m: Record<string, unknown> = {};
  if (bank.name !== undefined) m.name = bank.name;
  if (bank.nameEn !== undefined) m.name_en = bank.nameEn;
  if (bank.logo !== undefined) m.logo = bank.logo;
  if (bank.isActive !== undefined) m.is_active = bank.isActive;
  if (bank.reportTemplate !== undefined) m.report_template = bank.reportTemplate;
  if (bank.contactPerson !== undefined) m.contact_person = bank.contactPerson;
  if (bank.phone !== undefined) m.phone = bank.phone;
  if (bank.email !== undefined) m.email = bank.email;
  if (bank.address !== undefined) m.address = bank.address;
  return m;
}

/* --- Beneficiary --- */
function mapBeneficiaryRow(row: Record<string, unknown>): Beneficiary {
  return {
    id: row.id as string,
    fullName: (row.full_name ?? '') as string,
    civilId: (row.civil_id ?? '') as string,
    phone: (row.phone ?? '') as string,
    email: (row.email ?? '') as string,
    address: (row.address ?? '') as string,
    relation: (row.relation ?? 'other') as Beneficiary['relation'],
    workplace: (row.workplace ?? '') as string,
    notes: (row.notes ?? '') as string,
    reportsCount: (row.reports_count ?? 0) as number,
    lastReportDate: (row.last_report_date ?? undefined) as string | undefined,
    banksIds: (row.bank_ids ?? []) as string[],
  };
}

function beneficiaryToSnake(bn: Partial<Beneficiary>): Record<string, unknown> {
  const m: Record<string, unknown> = {};
  if (bn.fullName !== undefined) m.full_name = bn.fullName;
  if (bn.civilId !== undefined) m.civil_id = bn.civilId;
  if (bn.phone !== undefined) m.phone = bn.phone;
  if (bn.email !== undefined) m.email = bn.email;
  if (bn.address !== undefined) m.address = bn.address;
  if (bn.relation !== undefined) m.relation = bn.relation;
  if (bn.workplace !== undefined) m.workplace = bn.workplace;
  if (bn.notes !== undefined) m.notes = bn.notes;
  if (bn.reportsCount !== undefined) m.reports_count = bn.reportsCount;
  if (bn.lastReportDate !== undefined) m.last_report_date = bn.lastReportDate;
  if (bn.banksIds !== undefined) m.bank_ids = bn.banksIds;
  return m;
}

/* --- Report --- */
function mapReportRow(row: Record<string, unknown>): Report {
  return {
    id: row.id as string,
    reportNumber: (row.report_number ?? '') as string,
    bankId: (row.bank_id ?? '') as string,
    bankName: (row.bank_name ?? '') as string,
    beneficiaryId: (row.beneficiary_id ?? '') as string,
    beneficiaryName: (row.beneficiary_name ?? '') as string,
    beneficiaryCivilId: (row.beneficiary_civil_id ?? '') as string,
    beneficiaryPhone: (row.beneficiary_phone ?? '') as string,
    beneficiaryEmail: (row.beneficiary_email ?? '') as string,
    beneficiaryAddress: (row.beneficiary_address ?? '') as string,
    beneficiaryRelation: (row.beneficiary_relation ?? 'other') as Report['beneficiaryRelation'],
    beneficiaryWorkplace: (row.beneficiary_workplace ?? '') as string,
    applicantName: (row.applicant_name ?? '') as string | undefined,
    propertyType: (row.property_type ?? 'land') as Report['propertyType'],
    propertyUsage: (row.property_usage ?? 'residential') as Report['propertyUsage'],
    propertyCondition: (row.property_condition ?? 'average') as Report['propertyCondition'],
    propertyDetails: (row.property_details ?? {}) as Report['propertyDetails'],
    documents: (row.documents ?? []) as Report['documents'],
    extractedData: (row.extracted_data ?? {}) as Report['extractedData'],
    valuation: (row.valuation ?? {}) as Report['valuation'],
    status: (row.status ?? 'draft') as Report['status'],
    approval: (row.approval ?? {}) as Report['approval'],
    appraiserId: (row.appraiser_id ?? '') as string,
    appraiserName: (row.appraiser_name ?? '') as string,
    createdAt: (row.created_at ?? '') as string,
    updatedAt: (row.updated_at ?? '') as string,
    fees: (row.fees ?? 0) as number,
    notes: (row.notes ?? '') as string,
    purposeOfValuation: (row.purpose_of_valuation ?? undefined) as string | undefined,
    apartmentDetails: (row.apartment_details ?? undefined) as Report['apartmentDetails'],
  };
}

function reportToSnake(report: Partial<Report>): Record<string, unknown> {
  const m: Record<string, unknown> = {};
  if (report.reportNumber !== undefined) m.report_number = report.reportNumber;
  // UUID columns: convert empty strings to null to avoid Supabase UUID validation errors
  if (report.bankId !== undefined) m.bank_id = report.bankId || null;
  if (report.bankName !== undefined) m.bank_name = report.bankName;
  if (report.beneficiaryId !== undefined) m.beneficiary_id = report.beneficiaryId || null;
  if (report.beneficiaryName !== undefined) m.beneficiary_name = report.beneficiaryName;
  if (report.beneficiaryCivilId !== undefined) m.beneficiary_civil_id = report.beneficiaryCivilId;
  if (report.beneficiaryPhone !== undefined) m.beneficiary_phone = report.beneficiaryPhone;
  if (report.beneficiaryEmail !== undefined) m.beneficiary_email = report.beneficiaryEmail;
  if (report.beneficiaryAddress !== undefined) m.beneficiary_address = report.beneficiaryAddress;
  if (report.beneficiaryRelation !== undefined) m.beneficiary_relation = report.beneficiaryRelation;
  if (report.beneficiaryWorkplace !== undefined) m.beneficiary_workplace = report.beneficiaryWorkplace;
  if (report.applicantName !== undefined) m.applicant_name = report.applicantName;
  if (report.propertyType !== undefined) m.property_type = report.propertyType;
  if (report.propertyUsage !== undefined) m.property_usage = report.propertyUsage;
  if (report.propertyCondition !== undefined) m.property_condition = report.propertyCondition;
  if (report.propertyDetails !== undefined) m.property_details = report.propertyDetails;
  if (report.documents !== undefined) m.documents = report.documents;
  if (report.extractedData !== undefined) m.extracted_data = report.extractedData;
  if (report.valuation !== undefined) m.valuation = report.valuation;
  if (report.status !== undefined) m.status = report.status;
  if (report.approval !== undefined) m.approval = report.approval;
  if (report.appraiserId !== undefined) m.appraiser_id = report.appraiserId || null;
  if (report.appraiserName !== undefined) m.appraiser_name = report.appraiserName;
  if (report.fees !== undefined) m.fees = report.fees;
  if (report.notes !== undefined) m.notes = report.notes;
  if (report.purposeOfValuation !== undefined) m.purpose_of_valuation = report.purposeOfValuation;
  if (report.apartmentDetails !== undefined) m.apartment_details = report.apartmentDetails;
  if (report.updatedAt !== undefined) m.updated_at = report.updatedAt;
  return m;
}

/* --- Notification --- */
function mapNotificationRow(row: Record<string, unknown>): Notification {
  return {
    id: row.id as string,
    type: (row.type ?? 'system') as Notification['type'],
    title: (row.title ?? '') as string,
    message: (row.message ?? '') as string,
    priority: (row.priority ?? 'medium') as Notification['priority'],
    isRead: (row.is_read ?? false) as boolean,
    createdAt: (row.created_at ?? '') as string,
    relatedReportId: (row.related_report_id ?? undefined) as string | undefined,
  };
}

function notificationToSnake(n: Partial<Notification>): Record<string, unknown> {
  const m: Record<string, unknown> = {};
  if (n.type !== undefined) m.type = n.type;
  if (n.title !== undefined) m.title = n.title;
  if (n.message !== undefined) m.message = n.message;
  if (n.priority !== undefined) m.priority = n.priority;
  if (n.isRead !== undefined) m.is_read = n.isRead;
  if (n.relatedReportId !== undefined) m.related_report_id = n.relatedReportId;
  if (n.createdAt !== undefined) m.created_at = n.createdAt;
  return m;
}

/* --- Task --- */
function mapTaskRow(row: Record<string, unknown>): Task {
  return {
    id: row.id as string,
    title: (row.title ?? '') as string,
    description: (row.description ?? '') as string,
    priority: (row.priority ?? 'medium') as Task['priority'],
    status: (row.status ?? 'pending') as Task['status'],
    dueDate: (row.due_date ?? '') as string,
    createdAt: (row.created_at ?? '') as string,
    assignedName: (row.assigned_name ?? undefined) as string | undefined,
    relatedReportId: (row.related_report_id ?? undefined) as string | undefined,
    relatedReportNumber: (row.related_report_number ?? undefined) as string | undefined,
  };
}

function taskToSnake(t: Partial<Task>): Record<string, unknown> {
  const m: Record<string, unknown> = {};
  if (t.title !== undefined) m.title = t.title;
  if (t.description !== undefined) m.description = t.description;
  if (t.priority !== undefined) m.priority = t.priority;
  if (t.status !== undefined) m.status = t.status;
  if (t.dueDate !== undefined) m.due_date = t.dueDate;
  if (t.assignedName !== undefined) m.assigned_name = t.assignedName;
  if (t.relatedReportId !== undefined) m.related_report_id = t.relatedReportId;
  if (t.relatedReportNumber !== undefined) m.related_report_number = t.relatedReportNumber;
  return m;
}

/* --- LoginLog --- */
function mapLoginLogRow(row: Record<string, unknown>): LoginLog {
  return {
    id: row.id as string,
    employeeId: (row.employee_id ?? '') as string,
    employeeName: (row.employee_name ?? '') as string,
    action: (row.action ?? 'login') as LoginLog['action'],
    timestamp: (row.timestamp ?? '') as string,
    ipAddress: (row.ip_address ?? '') as string,
  };
}

function loginLogToSnake(log: LoginLog): Record<string, unknown> {
  return {
    id: log.id,
    employee_id: log.employeeId,
    employee_name: log.employeeName,
    action: log.action,
    ip_address: log.ipAddress,
    timestamp: log.timestamp,
  };
}

/* --- AppSettings --- */
function mapSettingsRow(row: Record<string, unknown>): AppSettings {
  return {
    officeName: (row.office_name ?? '') as string,
    officeNameEn: (row.office_name_en ?? '') as string,
    logo: (row.logo ?? '') as string,
    reportPrefix: (row.report_prefix ?? 'VER') as string,
    reportNextNumber: (row.report_next_number ?? 1) as number,
    defaultCurrency: (row.default_currency ?? 'OMR') as string,
    language: (row.language ?? 'ar') as string,
    theme: (row.theme ?? 'light') as string,
    userName: (row.user_name ?? '') as string,
    userRole: (row.user_role ?? '') as string,
    userEmail: (row.user_email ?? '') as string,
    userPhone: (row.user_phone ?? '') as string,
    defaultFees: (row.default_fees ?? 500) as number,
  };
}

function settingsToSnake(s: Partial<AppSettings>): Record<string, unknown> {
  const m: Record<string, unknown> = {};
  if (s.officeName !== undefined) m.office_name = s.officeName;
  if (s.officeNameEn !== undefined) m.office_name_en = s.officeNameEn;
  if (s.logo !== undefined) m.logo = s.logo;
  if (s.reportPrefix !== undefined) m.report_prefix = s.reportPrefix;
  if (s.reportNextNumber !== undefined) m.report_next_number = s.reportNextNumber;
  if (s.defaultCurrency !== undefined) m.default_currency = s.defaultCurrency;
  if (s.language !== undefined) m.language = s.language;
  if (s.theme !== undefined) m.theme = s.theme;
  if (s.userName !== undefined) m.user_name = s.userName;
  if (s.userRole !== undefined) m.user_role = s.userRole;
  if (s.userEmail !== undefined) m.user_email = s.userEmail;
  if (s.userPhone !== undefined) m.user_phone = s.userPhone;
  if (s.defaultFees !== undefined) m.default_fees = s.defaultFees;
  m.updated_at = new Date().toISOString();
  return m;
}

/* ===== Initialize Store ===== */
export async function initializeStore(): Promise<void> {
  try {
    // Fetch all tables in parallel
    const [empRes, bankRes, benRes, repRes, notifRes, taskRes, logRes, settingsRes, draftsRes] = await Promise.all([
      db.from('employees').select('*'),
      db.from('banks').select('*'),
      db.from('beneficiaries').select('*'),
      db.from('reports').select('*').order('created_at', { ascending: false }),
      db.from('notifications').select('*').order('created_at', { ascending: false }),
      db.from('tasks').select('*'),
      db.from('login_logs').select('*').order('timestamp', { ascending: false }),
      db.from('app_settings').select('*').limit(1),
      db.from('drafts').select('*'),
    ]);

    // Map employees
    _employees = (empRes.data ?? []).map((r: Record<string, unknown>) => mapEmployeeRow(r));

    // Seed default admin if employees table is empty
    if (_employees.length === 0) {
      const adminRow = {
        id: 'e1',
        full_name: 'مدير النظام',
        username: 'admin',
        email: 'admin@ireo.om',
        phone: '',
        role: 'admin',
        status: 'active',
        avatar: '',
        department: 'الإدارة العامة',
        join_date: new Date().toISOString(),
        last_login: null,
        last_logout: null,
        is_active_session: false,
        permissions: PERMISSIONS.map(p => p.id),
        notes: 'حساب مدير النظام الافتراضي',
        password_hash: await hashPassword('admin123'),
      };
      await db.from('employees').insert(adminRow);
      _employees.push(mapEmployeeRow(adminRow));
    }

    // Map banks
    _banks = (bankRes.data ?? []).map((r: Record<string, unknown>) => mapBankRow(r));

    // Map beneficiaries
    _beneficiaries = (benRes.data ?? []).map((r: Record<string, unknown>) => mapBeneficiaryRow(r));

    // Map reports
    _reports = (repRes.data ?? []).map((r: Record<string, unknown>) => mapReportRow(r));

    // Map notifications
    _notifications = (notifRes.data ?? []).map((r: Record<string, unknown>) => mapNotificationRow(r));

    // Map tasks
    _tasks = (taskRes.data ?? []).map((r: Record<string, unknown>) => mapTaskRow(r));

    // Map login logs
    _loginLogs = (logRes.data ?? []).map((r: Record<string, unknown>) => mapLoginLogRow(r));

    // Map settings (use DB row if present, else keep initialSettings)
    if (settingsRes.data && settingsRes.data.length > 0) {
      _settings = mapSettingsRow(settingsRes.data[0] as Record<string, unknown>);
    }

    // Map drafts
    const draftsRows = draftsRes.data ?? [];
    const draftsMap: Record<string, unknown> = {};
    for (const d of draftsRows) {
      const row = d as Record<string, unknown>;
      if (row.key) {
        draftsMap[row.key as string] = row.data;
      }
    }
    _drafts = draftsMap;

  } catch (err) {
    console.error('[store] initializeStore error:', err);
    // Keep fallback defaults — store will operate with empty arrays + initialSettings
  }
}

/* ===== Store (synchronous reads from cache, writes go to Supabase + cache) ===== */
export const store = {

  /* ============================= Auth ============================= */
  isLoggedIn: (): boolean => {
    if (typeof window === 'undefined') return false;
    return lsGet(STORAGE_KEYS.isLoggedIn) === 'true';
  },

  getCurrentUserId: (): string | null => {
    if (typeof window === 'undefined') return null;
    return lsGet(STORAGE_KEYS.currentUserId);
  },

  getCurrentUser: (): Employee | undefined => {
    const id = store.getCurrentUserId();
    if (!id) return undefined;
    return _employees.find(e => e.id === id);
  },

  login: async (username: string, password: string): Promise<{ success: boolean; reason?: string }> => {
    // Find employee by username first
    const employee = _employees.find(e => e.username === username);

    if (!employee) return { success: false, reason: 'invalid_credentials' };

    // Verify password using hash comparison
    const passwordValid = await verifyPassword(password, employee.password);
    if (!passwordValid) return { success: false, reason: 'invalid_credentials' };

    if (employee.status === 'suspended') return { success: false, reason: 'suspended' };
    if (employee.status === 'inactive') return { success: false, reason: 'inactive' };

    lsSet(STORAGE_KEYS.isLoggedIn, 'true');
    lsSet(STORAGE_KEYS.currentUserId, employee.id);

    store.updateEmployee(employee.id, {
      lastLogin: new Date().toISOString(),
      isActiveSession: true,
    });

    store.addLoginLog({
      id: generateId(),
      employeeId: employee.id,
      employeeName: employee.fullName,
      action: 'login',
      timestamp: new Date().toISOString(),
      ipAddress: '', // TODO: Capture real client IP from server-side
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
          id: generateId(),
          employeeId: userId,
          employeeName: emp.fullName,
          action: 'logout',
          timestamp: new Date().toISOString(),
          ipAddress: '', // TODO: Capture real client IP from server-side
        });
      }
    }
    lsRemove(STORAGE_KEYS.isLoggedIn);
    lsRemove(STORAGE_KEYS.currentUserId);
  },

  /* ============================= Reports ============================= */
  getReports: (): Report[] => _reports,

  getReport: (id: string): Report | undefined => {
    return _reports.find((r) => r.id === id);
  },

  /**
   * Refresh reports from Supabase into the in-memory cache.
   * Called when polling/realtime detects changes made by another user/session.
   */
  refreshReportsFromDB: async (): Promise<void> => {
    try {
      const { data, error } = await db
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) {
        _reports = data.map((r: Record<string, unknown>) => mapReportRow(r));
        console.log('[store] refreshReportsFromDB: refreshed', _reports.length, 'reports');
      } else if (error) {
        console.error('[store] refreshReportsFromDB error:', error.message);
      }
    } catch (err) {
      console.error('[store] refreshReportsFromDB exception:', err);
    }
  },

  addReport: async (report: Report): Promise<void> => {
    _reports.unshift(report);
    const row = reportToSnake(report);
    row.id = report.id;
    row.created_at = report.createdAt || new Date().toISOString();
    row.updated_at = report.updatedAt || new Date().toISOString();
    const { error } = await db.from('reports').insert(row);
    if (error) {
      console.error('[store] addReport error:', error.message);
      _reports = _reports.filter(r => r.id !== report.id);
      throw new Error(error.message);
    }
  },

  updateReport: async (id: string, data: Partial<Report>): Promise<void> => {
    const idx = _reports.findIndex((r) => r.id === id);
    if (idx !== -1) {
      const oldValue = { ..._reports[idx] };
      _reports[idx] = { ..._reports[idx], ...data, updatedAt: new Date().toISOString() };
      const row = reportToSnake({ ...data, updatedAt: new Date().toISOString() });
      const { error } = await db.from('reports').update(row).eq('id', id);
      if (error) {
        console.error('[store] updateReport error:', error.message, 'data:', JSON.stringify(row));
        _reports[idx] = oldValue;
        throw new Error(error.message);
      }
    }
  },

  deleteReport: async (id: string): Promise<void> => {
    const deleted = _reports.find(r => r.id === id);
    _reports = _reports.filter((r) => r.id !== id);
    const { error } = await db.from('reports').delete().eq('id', id);
    if (error) {
      console.error('[store] deleteReport error:', error.message);
      if (deleted) _reports.unshift(deleted);
      throw new Error(error.message);
    }
  },

  /* ============================= Banks ============================= */
  getBanks: (): Bank[] => _banks,

  getActiveBanks: (): Bank[] => _banks.filter((b) => b.isActive),

  addBank: async (bank: Bank): Promise<void> => {
    _banks.push(bank);
    const row = bankToSnake(bank);
    row.id = bank.id;
    row.created_at = new Date().toISOString();
    row.updated_at = new Date().toISOString();
    const { error } = await db.from('banks').insert(row);
    if (error) {
      console.error('[store] addBank error:', error.message);
      _banks = _banks.filter(b => b.id !== bank.id);
      throw new Error(error.message);
    }
  },

  updateBank: async (id: string, data: Partial<Bank>): Promise<void> => {
    const idx = _banks.findIndex((b) => b.id === id);
    if (idx !== -1) {
      const oldValue = { ..._banks[idx] };
      _banks[idx] = { ..._banks[idx], ...data };
      const row = bankToSnake(data);
      row.updated_at = new Date().toISOString();
      const { error } = await db.from('banks').update(row).eq('id', id);
      if (error) {
        console.error('[store] updateBank error:', error.message);
        _banks[idx] = oldValue;
        throw new Error(error.message);
      }
    }
  },

  toggleBank: async (id: string): Promise<void> => {
    const idx = _banks.findIndex((b) => b.id === id);
    if (idx !== -1) {
      const oldValue = _banks[idx].isActive;
      _banks[idx].isActive = !_banks[idx].isActive;
      const row = { is_active: _banks[idx].isActive, updated_at: new Date().toISOString() };
      const { error } = await db.from('banks').update(row).eq('id', id);
      if (error) {
        console.error('[store] toggleBank error:', error.message);
        _banks[idx].isActive = oldValue;
        throw new Error(error.message);
      }
    }
  },

  /* ============================= Beneficiaries ============================= */
  getBeneficiaries: (): Beneficiary[] => _beneficiaries,

  getBeneficiary: (id: string): Beneficiary | undefined => {
    return _beneficiaries.find((b) => b.id === id);
  },

  addBeneficiary: async (bn: Beneficiary): Promise<void> => {
    _beneficiaries.push(bn);
    const row = beneficiaryToSnake(bn);
    row.id = bn.id;
    row.created_at = new Date().toISOString();
    row.updated_at = new Date().toISOString();
    const { error } = await db.from('beneficiaries').insert(row);
    if (error) {
      console.error('[store] addBeneficiary error:', error.message);
      _beneficiaries = _beneficiaries.filter(b => b.id !== bn.id);
      throw new Error(error.message);
    }
  },

  updateBeneficiary: async (id: string, data: Partial<Beneficiary>): Promise<void> => {
    const idx = _beneficiaries.findIndex((b) => b.id === id);
    if (idx !== -1) {
      const oldValue = { ..._beneficiaries[idx] };
      _beneficiaries[idx] = { ..._beneficiaries[idx], ...data };
      const row = beneficiaryToSnake(data);
      row.updated_at = new Date().toISOString();
      const { error } = await db.from('beneficiaries').update(row).eq('id', id);
      if (error) {
        console.error('[store] updateBeneficiary error:', error.message);
        _beneficiaries[idx] = oldValue;
        throw new Error(error.message);
      }
    }
  },

  deleteBeneficiary: async (id: string): Promise<void> => {
    const deleted = _beneficiaries.find(b => b.id === id);
    _beneficiaries = _beneficiaries.filter((b) => b.id !== id);
    const { error } = await db.from('beneficiaries').delete().eq('id', id);
    if (error) {
      console.error('[store] deleteBeneficiary error:', error.message);
      if (deleted) _beneficiaries.push(deleted);
      throw new Error(error.message);
    }
  },

  /* ============================= Notifications ============================= */
  getNotifications: (): Notification[] => _notifications,

  addNotification: async (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>): Promise<Notification> => {
    const newNotification: Notification = {
      ...notification,
      id: generateId(),
      createdAt: new Date().toISOString(),
      isRead: false,
    };
    _notifications.unshift(newNotification);
    const row = notificationToSnake(newNotification);
    row.id = newNotification.id;
    const { error } = await db.from('notifications').insert(row);
    if (error) {
      console.error('[store] addNotification error:', error.message);
      _notifications = _notifications.filter(n => n.id !== newNotification.id);
      throw new Error(error.message);
    }
    return newNotification;
  },

  deleteNotification: async (id: string): Promise<void> => {
    const deleted = _notifications.find(n => n.id === id);
    _notifications = _notifications.filter(n => n.id !== id);
    const { error } = await db.from('notifications').delete().eq('id', id);
    if (error) {
      console.error('[store] deleteNotification error:', error.message);
      if (deleted) _notifications.unshift(deleted);
      throw new Error(error.message);
    }
  },

  clearReadNotifications: async (): Promise<void> => {
    const readIds = _notifications.filter(n => n.isRead).map(n => n.id);
    const readNotifs = _notifications.filter(n => n.isRead);
    _notifications = _notifications.filter(n => !n.isRead);
    if (readIds.length > 0) {
      const { error } = await db.from('notifications').delete().in('id', readIds);
      if (error) {
        console.error('[store] clearReadNotifications error:', error.message);
        _notifications = [...readNotifs, ..._notifications];
        throw new Error(error.message);
      }
    }
  },

  markAsRead: async (id: string): Promise<void> => {
    const idx = _notifications.findIndex((n) => n.id === id);
    if (idx !== -1) {
      _notifications[idx].isRead = true;
      const { error } = await db.from('notifications').update({ is_read: true }).eq('id', id);
      if (error) {
        console.error('[store] markAsRead error:', error.message);
        _notifications[idx].isRead = false;
        throw new Error(error.message);
      }
    }
  },

  markAllAsRead: async (): Promise<void> => {
    const oldNotifications = _notifications.map(n => ({ ...n }));
    _notifications = _notifications.map((n) => ({ ...n, isRead: true }));
    const { error } = await db.from('notifications').update({ is_read: true }).neq('is_read', true);
    if (error) {
      console.error('[store] markAllAsRead error:', error.message);
      _notifications = oldNotifications;
      throw new Error(error.message);
    }
  },

  unreadCount: (): number => _notifications.filter((n) => !n.isRead).length,

  /* ============================= Tasks ============================= */
  getTasks: (): Task[] => _tasks,

  addTask: async (task: Task): Promise<void> => {
    _tasks.push(task);
    const row = taskToSnake(task);
    row.id = task.id;
    row.created_at = task.createdAt || new Date().toISOString();
    const { error } = await db.from('tasks').insert(row);
    if (error) {
      console.error('[store] addTask error:', error.message);
      _tasks = _tasks.filter(t => t.id !== task.id);
      throw new Error(error.message);
    }
  },

  updateTask: async (id: string, data: Partial<Task>): Promise<void> => {
    const idx = _tasks.findIndex((t) => t.id === id);
    if (idx !== -1) {
      const oldValue = { ..._tasks[idx] };
      _tasks[idx] = { ..._tasks[idx], ...data };
      const row = taskToSnake(data);
      const { error } = await db.from('tasks').update(row).eq('id', id);
      if (error) {
        console.error('[store] updateTask error:', error.message);
        _tasks[idx] = oldValue;
        throw new Error(error.message);
      }
    }
  },

  completeTask: async (id: string): Promise<void> => {
    await store.updateTask(id, { status: 'completed' });
  },

  updateTaskStatuses: async (): Promise<void> => {
    const now = new Date();
    let changed = false;
    const updated = _tasks.map(t => {
      if (t.status === 'completed') return t;
      const due = new Date(t.dueDate);
      if (due < now && t.status !== 'overdue') {
        changed = true;
        return { ...t, status: 'overdue' as const };
      }
      return t;
    });
    if (changed) {
      _tasks = updated;
      // Sync overdue tasks to Supabase
      for (const t of _tasks) {
        if (t.status === 'overdue') {
          const { error } = await db.from('tasks').update({ status: 'overdue' }).eq('id', t.id);
          if (error) console.error('[store] updateTaskStatuses error:', error.message);
        }
      }
    }
  },

  deleteTask: async (id: string): Promise<void> => {
    const deleted = _tasks.find(t => t.id === id);
    _tasks = _tasks.filter((t) => t.id !== id);
    const { error } = await db.from('tasks').delete().eq('id', id);
    if (error) {
      console.error('[store] deleteTask error:', error.message);
      if (deleted) _tasks.push(deleted);
      throw new Error(error.message);
    }
  },

  /* ============================= Settings ============================= */
  getSettings: (): AppSettings => _settings,

  updateSettings: async (data: Partial<AppSettings>): Promise<void> => {
    const oldValue = { ..._settings };
    _settings = { ..._settings, ...data };
    const row = settingsToSnake(data);
    // Upsert: update the first row in app_settings
    const { data: rows, error: selectError } = await db.from('app_settings').select('id').limit(1);
    if (selectError) {
      console.error('[store] updateSettings select error:', selectError.message);
      _settings = oldValue;
      throw new Error(selectError.message);
    }
    if (rows && rows.length > 0) {
      const { error } = await db.from('app_settings').update(row).eq('id', (rows[0] as Record<string, unknown>).id);
      if (error) {
        console.error('[store] updateSettings error:', error.message);
        _settings = oldValue;
        throw new Error(error.message);
      }
    } else {
      const { error } = await db.from('app_settings').insert(row);
      if (error) {
        console.error('[store] updateSettings insert error:', error.message);
        _settings = oldValue;
        throw new Error(error.message);
      }
    }
  },

  /* ============================= Employees ============================= */
  getEmployees: (): Employee[] => _employees,

  getEmployee: (id: string): Employee | undefined => _employees.find((e) => e.id === id),

  addEmployee: async (employee: Employee): Promise<void> => {
    // Hash the password before storing
    const hashedPw = await hashPassword(employee.password);
    const empWithHash = { ...employee, password: hashedPw };
    _employees.push(empWithHash);
    const row = employeeToSnake(empWithHash);
    row.id = employee.id;
    row.created_at = new Date().toISOString();
    row.updated_at = new Date().toISOString();
    const { error } = await db.from('employees').insert(row);
    if (error) {
      console.error('[store] addEmployee error:', error.message);
      _employees = _employees.filter(e => e.id !== employee.id);
      throw new Error(error.message);
    }
  },

  updateEmployee: async (id: string, data: Partial<Employee>): Promise<void> => {
    const idx = _employees.findIndex((e) => e.id === id);
    if (idx !== -1) {
      // If password is being updated, hash it first
      const oldValue = { ..._employees[idx] };
      let updateData = { ...data };
      if (data.password && !data.password.includes(':')) {
        updateData.password = await hashPassword(data.password);
      }
      _employees[idx] = { ..._employees[idx], ...updateData };
      const row = employeeToSnake(updateData);
      row.updated_at = new Date().toISOString();
      const { error } = await db.from('employees').update(row).eq('id', id);
      if (error) {
        console.error('[store] updateEmployee error:', error.message);
        _employees[idx] = oldValue;
        throw new Error(error.message);
      }
    }
  },

  deleteEmployee: async (id: string): Promise<void> => {
    const deleted = _employees.find(e => e.id === id);
    _employees = _employees.filter((e) => e.id !== id);
    const { error } = await db.from('employees').delete().eq('id', id);
    if (error) {
      console.error('[store] deleteEmployee error:', error.message);
      if (deleted) _employees.push(deleted);
      throw new Error(error.message);
    }
  },

  suspendEmployee: async (id: string): Promise<void> => {
    await store.updateEmployee(id, { status: 'suspended' });
  },

  activateEmployee: async (id: string): Promise<void> => {
    await store.updateEmployee(id, { status: 'active' });
  },

  changePassword: async (employeeId: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; reason?: string }> => {
    const emp = store.getEmployee(employeeId);
    if (!emp) return { success: false, reason: 'not_found' };
    const valid = await verifyPassword(currentPassword, emp.password);
    if (!valid) return { success: false, reason: 'wrong_password' };
    const hashedNew = await hashPassword(newPassword);
    await store.updateEmployee(employeeId, { password: hashedNew });
    return { success: true };
  },

  /* ============================= Login Logs ============================= */
  getLoginLogs: (): LoginLog[] => _loginLogs,

  addLoginLog: async (log: LoginLog): Promise<void> => {
    _loginLogs.unshift(log);
    const row = loginLogToSnake(log);
    const { error } = await db.from('login_logs').insert(row);
    if (error) {
      console.error('[store] addLoginLog error:', error.message);
      _loginLogs = _loginLogs.filter(l => l.id !== log.id);
      throw new Error(error.message);
    }
  },

  /* ============================= Drafts ============================= */
  getDraft: (key: string): unknown => {
    return _drafts[key];
  },

  saveDraft: async (key: string, data: unknown): Promise<void> => {
    const oldValue = _drafts[key];
    _drafts[key] = data;
    // Upsert draft by key
    const { data: rows, error: selectError } = await db.from('drafts').select('id').eq('key', key).limit(1);
    if (selectError) {
      console.error('[store] saveDraft select error:', selectError.message);
      if (oldValue !== undefined) _drafts[key] = oldValue; else delete _drafts[key];
      throw new Error(selectError.message);
    }
    if (rows && rows.length > 0) {
      const { error } = await db.from('drafts').update({ data, updated_at: new Date().toISOString() }).eq('key', key);
      if (error) {
        console.error('[store] saveDraft update error:', error.message);
        if (oldValue !== undefined) _drafts[key] = oldValue; else delete _drafts[key];
        throw new Error(error.message);
      }
    } else {
      const { error } = await db.from('drafts').insert({ key, data, updated_at: new Date().toISOString() });
      if (error) {
        console.error('[store] saveDraft insert error:', error.message);
        if (oldValue !== undefined) _drafts[key] = oldValue; else delete _drafts[key];
        throw new Error(error.message);
      }
    }
  },

  clearDraft: async (key: string): Promise<void> => {
    const oldValue = _drafts[key];
    delete _drafts[key];
    const { error } = await db.from('drafts').delete().eq('key', key);
    if (error) {
      console.error('[store] clearDraft error:', error.message);
      _drafts[key] = oldValue;
      throw new Error(error.message);
    }
  },
};
