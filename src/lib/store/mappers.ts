'use client';

import type { Report, Bank, Beneficiary, Notification, Task, AppSettings, Employee, LoginLog, FeesRanges } from '@/types';
import type { PreliminaryTemplate } from './preliminary-templates';

/* ===== Mapper helpers (camelCase ↔ snake_case) ===== */

const defaultFeesRanges: FeesRanges = {
  land:                  { min: 50,  max: 70  },
  villa:                 { min: 100, max: 130 },
  apartment:             { min: 80,  max: 100 },
  residential_building:  { min: 100, max: 150 },
  commercial_building:   { min: 150, max: 250 },
  mixed_use:             { min: 150, max: 250 },
  farm:                  { min: 100, max: 200 },
  warehouse:             { min: 80,  max: 120 },
  shop:                  { min: 80,  max: 120 },
};

/* --- Employee --- */
export function mapEmployeeRow(row: Record<string, unknown>): Employee {
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

export function employeeToSnake(emp: Partial<Employee>): Record<string, unknown> {
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
export function mapBankRow(row: Record<string, unknown>): Bank {
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

export function bankToSnake(bank: Partial<Bank>): Record<string, unknown> {
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
export function mapBeneficiaryRow(row: Record<string, unknown>): Beneficiary {
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

export function beneficiaryToSnake(bn: Partial<Beneficiary>): Record<string, unknown> {
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
export function mapReportRow(row: Record<string, unknown>): Report {
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

export function reportToSnake(report: Partial<Report>): Record<string, unknown> {
  const m: Record<string, unknown> = {};
  if (report.reportNumber !== undefined) m.report_number = report.reportNumber;
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
export function mapNotificationRow(row: Record<string, unknown>): Notification {
  return {
    id: row.id as string,
    type: (row.type ?? 'system') as Notification['type'],
    title: (row.title ?? '') as string,
    message: (row.message ?? '') as string,
    priority: (row.priority ?? 'medium') as Notification['priority'],
    isRead: (row.is_read ?? false) as boolean,
    createdAt: (row.created_at ?? '') as string,
    relatedReportId: (row.related_report_id ?? undefined) as string | undefined,
    targetEmployeeId: (row.target_employee_id ?? undefined) as string | undefined,
  };
}

export function notificationToSnake(n: Partial<Notification>): Record<string, unknown> {
  const m: Record<string, unknown> = {};
  if (n.type !== undefined) m.type = n.type;
  if (n.title !== undefined) m.title = n.title;
  if (n.message !== undefined) m.message = n.message;
  if (n.priority !== undefined) m.priority = n.priority;
  if (n.isRead !== undefined) m.is_read = n.isRead;
  if (n.relatedReportId !== undefined) m.related_report_id = n.relatedReportId;
  if (n.createdAt !== undefined) m.created_at = n.createdAt;
  if (n.targetEmployeeId !== undefined) m.target_employee_id = n.targetEmployeeId || null;
  return m;
}

/* --- Task --- */
export function mapTaskRow(row: Record<string, unknown>): Task {
  return {
    id: row.id as string,
    title: (row.title ?? '') as string,
    description: (row.description ?? '') as string,
    priority: (row.priority ?? 'medium') as Task['priority'],
    status: (row.status ?? 'pending') as Task['status'],
    dueDate: (row.due_date ?? '') as string,
    createdAt: (row.created_at ?? '') as string,
    updatedAt: (row.updated_at ?? undefined) as string | undefined,
    startedAt: (row.started_at ?? undefined) as string | undefined,
    reviewedAt: (row.reviewed_at ?? undefined) as string | undefined,
    assignedTo: (row.assigned_to ?? undefined) as string | undefined,
    assignedName: (row.assigned_name ?? undefined) as string | undefined,
    createdBy: (row.created_by ?? undefined) as string | undefined,
    createdByName: (row.created_by_name ?? undefined) as string | undefined,
    completedAt: (row.completed_at ?? undefined) as string | undefined,
    recurrence: (row.recurrence ?? 'none') as Task['recurrence'],
    category: (row.category ?? 'general') as Task['category'],
    relatedReportId: (row.related_report_id ?? undefined) as string | undefined,
    relatedReportNumber: (row.related_report_number ?? undefined) as string | undefined,
    comments: (row.comments ?? []) as Task['comments'],
    isAutoGenerated: (row.is_auto_generated ?? false) as boolean,
    statusHistory: (row.status_history ?? []) as Task['statusHistory'],
    timeSpent: (row.time_spent ?? undefined) as number | undefined,
  };
}

export function taskToSnake(t: Partial<Task>): Record<string, unknown> {
  const m: Record<string, unknown> = {};
  if (t.title !== undefined) m.title = t.title;
  if (t.description !== undefined) m.description = t.description;
  if (t.priority !== undefined) m.priority = t.priority;
  if (t.status !== undefined) m.status = t.status;
  if (t.dueDate !== undefined) m.due_date = t.dueDate;
  if (t.updatedAt !== undefined) m.updated_at = t.updatedAt || null;
  if (t.startedAt !== undefined) m.started_at = t.startedAt || null;
  if (t.reviewedAt !== undefined) m.reviewed_at = t.reviewedAt || null;
  if (t.assignedTo !== undefined) m.assigned_to = t.assignedTo || null;
  if (t.assignedName !== undefined) m.assigned_name = t.assignedName;
  if (t.createdBy !== undefined) m.created_by = t.createdBy || null;
  if (t.createdByName !== undefined) m.created_by_name = t.createdByName;
  if (t.completedAt !== undefined) m.completed_at = t.completedAt || null;
  if (t.recurrence !== undefined) m.recurrence = t.recurrence;
  if (t.category !== undefined) m.category = t.category;
  if (t.relatedReportId !== undefined) m.related_report_id = t.relatedReportId;
  if (t.relatedReportNumber !== undefined) m.related_report_number = t.relatedReportNumber;
  if (t.comments !== undefined) m.comments = t.comments;
  if (t.isAutoGenerated !== undefined) m.is_auto_generated = t.isAutoGenerated;
  if (t.statusHistory !== undefined) m.status_history = t.statusHistory;
  if (t.timeSpent !== undefined) m.time_spent = t.timeSpent;
  return m;
}

/* --- LoginLog --- */
export function mapLoginLogRow(row: Record<string, unknown>): LoginLog {
  return {
    id: row.id as string,
    employeeId: (row.employee_id ?? '') as string,
    employeeName: (row.employee_name ?? '') as string,
    action: (row.action ?? 'login') as LoginLog['action'],
    timestamp: (row.timestamp ?? '') as string,
    ipAddress: (row.ip_address ?? '') as string,
  };
}

export function loginLogToSnake(log: LoginLog): Record<string, unknown> {
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
export function mapSettingsRow(row: Record<string, unknown>): AppSettings {
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
    feesRanges: (row.fees_ranges ?? defaultFeesRanges) as FeesRanges,
  };
}

export function settingsToSnake(s: Partial<AppSettings>): Record<string, unknown> {
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
  if (s.feesRanges !== undefined) m.fees_ranges = s.feesRanges;
  m.updated_at = new Date().toISOString();
  return m;
}

/* --- PreliminaryTemplate --- */
export function mapPreliminaryTemplateRow(row: Record<string, unknown>): PreliminaryTemplate {
  return {
    id: row.id as string,
    name: (row.name ?? '') as string,
    description: (row.description ?? '') as string,
    fileName: (row.file_name ?? '') as string,
    contentType: (row.content_type ?? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') as string,
    size: (row.size ?? 0) as number,
    content: (row.content ?? '') as string,
    fields: (row.fields ?? []) as PreliminaryTemplate['fields'],
    createdAt: (row.created_at ?? '') as string,
  };
}

export function preliminaryTemplateToSnake(t: Omit<PreliminaryTemplate, 'id' | 'createdAt'> & { createdBy?: string; createdByName?: string }): Record<string, unknown> {
  return {
    name: t.name,
    description: t.description,
    file_name: t.fileName,
    content_type: t.contentType,
    size: t.size,
    content: t.content,
    fields: t.fields,
    created_by: (t as any).createdBy || null,
    created_by_name: (t as any).createdByName || '',
  };
}
