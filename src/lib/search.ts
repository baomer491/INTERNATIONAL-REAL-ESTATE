import type { Report, Beneficiary, Employee, Bank, Task, Notification } from '@/types';
import { store } from './store';

/* ===== Search Result Types ===== */

export type SearchResultType = 'report' | 'beneficiary' | 'employee' | 'bank' | 'task' | 'notification';

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle: string;
  meta?: string;
  href: string;
  relevance: number;
}

export interface SearchResults {
  reports: SearchResult[];
  beneficiaries: SearchResult[];
  employees: SearchResult[];
  banks: SearchResult[];
  tasks: SearchResult[];
  notifications: SearchResult[];
  total: number;
}

const TYPE_CONFIG: Record<SearchResultType, { label: string; color: string; icon: string }> = {
  report: { label: 'التقارير', color: '#1e3a5f', icon: '📄' },
  beneficiary: { label: 'المستفيدين', color: '#0891b2', icon: '👤' },
  employee: { label: 'الموظفين', color: '#7c3aed', icon: '🧑‍💼' },
  bank: { label: 'البنوك', color: '#15803d', icon: '🏦' },
  task: { label: 'المهام', color: '#b45309', icon: '📋' },
  notification: { label: 'التنبيهات', color: '#64748b', icon: '🔔' },
};

export { TYPE_CONFIG };

/* ===== Fuzzy Match ===== */

function normalizeArabic(str: string): string {
  return str
    .replace(/[إأآا]/g, 'ا')
    .replace(/[ة]/g, 'ه')
    .replace(/[ى]/g, 'ي')
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .toLowerCase()
    .trim();
}

function fuzzyMatch(query: string, text: string): number {
  const normalizedQuery = normalizeArabic(query);
  const normalizedText = normalizeArabic(text);
  const lowerQuery = normalizedQuery.toLowerCase();
  const lowerText = normalizedText.toLowerCase();

  if (!lowerQuery) return 0;

  const exactIndex = lowerText.indexOf(lowerQuery);
  if (exactIndex === 0) return 100;
  if (exactIndex > 0) return 80 - Math.min(exactIndex, 50);

  const queryChars = lowerQuery.split('');
  let score = 0;
  let lastMatchIndex = -1;
  let matchedChars = 0;

  for (const char of queryChars) {
    const index = lowerText.indexOf(char, lastMatchIndex + 1);
    if (index !== -1) {
      score += index === lastMatchIndex + 1 ? 15 : 5;
      lastMatchIndex = index;
      matchedChars++;
    }
  }

  if (matchedChars === 0) return 0;
  const matchRatio = matchedChars / queryChars.length;
  return Math.min(score * matchRatio, 60);
}

function searchFields(query: string, fields: string[]): number {
  let bestScore = 0;
  for (const field of fields) {
    const score = fuzzyMatch(query, field);
    if (score > bestScore) bestScore = score;
  }
  return bestScore;
}

/* ===== Entity Searchers ===== */

function searchReports(query: string, reports: Report[]): SearchResult[] {
  return reports
    .map(r => {
      const fields = [
        r.reportNumber, r.beneficiaryName, r.beneficiaryCivilId,
        r.beneficiaryPhone, r.bankName, r.appraiserName,
        r.propertyDetails?.governorate, r.propertyDetails?.wilayat,
        r.propertyDetails?.village, r.propertyDetails?.plotNumber,
        r.propertyDetails?.street, r.propertyDetails?.blockNumber,
        r.extractedData?.owner, r.extractedData?.wilayat,
        r.notes, r.beneficiaryAddress, r.beneficiaryWorkplace,
      ].filter(Boolean) as string[];

      const relevance = searchFields(query, fields);
      return {
        id: r.id,
        type: 'report' as const,
        title: r.reportNumber,
        subtitle: r.beneficiaryName,
        meta: r.bankName,
        href: `/reports/${r.id}`,
        relevance,
      };
    })
    .filter(r => r.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 5);
}

function searchBeneficiaries(query: string, beneficiaries: Beneficiary[]): SearchResult[] {
  return beneficiaries
    .map(b => {
      const fields = [
        b.fullName, b.civilId, b.phone, b.email,
        b.address, b.workplace, b.notes,
      ].filter(Boolean) as string[];

      const relevance = searchFields(query, fields);
      return {
        id: b.id,
        type: 'beneficiary' as const,
        title: b.fullName,
        subtitle: b.civilId,
        meta: b.phone,
        href: `/beneficiaries`,
        relevance,
      };
    })
    .filter(r => r.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 5);
}

function searchEmployees(query: string, employees: Employee[]): SearchResult[] {
  return employees
    .map(e => {
      const fields = [
        e.fullName, e.username, e.email,
        e.phone, e.department, e.notes,
      ].filter(Boolean) as string[];

      const relevance = searchFields(query, fields);
      return {
        id: e.id,
        type: 'employee' as const,
        title: e.fullName,
        subtitle: e.username,
        meta: e.department || e.email,
        href: `/employees`,
        relevance,
      };
    })
    .filter(r => r.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 5);
}

function searchBanks(query: string, banks: Bank[]): SearchResult[] {
  return banks
    .map(b => {
      const fields = [
        b.name, b.nameEn, b.contactPerson,
        b.phone, b.email, b.address,
      ].filter(Boolean) as string[];

      const relevance = searchFields(query, fields);
      return {
        id: b.id,
        type: 'bank' as const,
        title: b.name,
        subtitle: b.nameEn,
        meta: b.contactPerson,
        href: `/banks`,
        relevance,
      };
    })
    .filter(r => r.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 3);
}

function searchTasks(query: string, tasks: Task[]): SearchResult[] {
  return tasks
    .map(t => {
      const fields = [
        t.title, t.description,
        t.relatedReportNumber,
      ].filter(Boolean) as string[];

      const relevance = searchFields(query, fields);
      return {
        id: t.id,
        type: 'task' as const,
        title: t.title,
        subtitle: t.description,
        meta: t.dueDate,
        href: `/tasks`,
        relevance,
      };
    })
    .filter(r => r.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 3);
}

function searchNotifications(query: string, notifications: Notification[]): SearchResult[] {
  return notifications
    .map(n => {
      const fields = [n.title, n.message].filter(Boolean) as string[];
      const relevance = searchFields(query, fields);
      return {
        id: n.id,
        type: 'notification' as const,
        title: n.title,
        subtitle: n.message,
        href: `/notifications`,
        relevance,
      };
    })
    .filter(r => r.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 3);
}

/* ===== Main Search Function ===== */

export function searchAll(query: string): SearchResults {
  if (!query || query.trim().length < 1) {
    return { reports: [], beneficiaries: [], employees: [], banks: [], tasks: [], notifications: [], total: 0 };
  }

  const trimmed = query.trim();
  const reports = searchReports(trimmed, store.getReports());
  const beneficiaries = searchBeneficiaries(trimmed, store.getBeneficiaries());
  const employees = searchEmployees(trimmed, store.getEmployees());
  const banks = searchBanks(trimmed, store.getActiveBanks());
  const tasks = searchTasks(trimmed, store.getTasks());
  const notifications = searchNotifications(trimmed, store.getNotifications());

  const total = reports.length + beneficiaries.length + employees.length + banks.length + tasks.length + notifications.length;

  return { reports, beneficiaries, employees, banks, tasks, notifications, total };
}
