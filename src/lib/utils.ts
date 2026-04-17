import type { ReportStatus, PropertyType, PropertyUsage } from '@/types';
import { reportStatuses, propertyTypes, propertyUsages } from '@/data/mock';

/* ===== Arabic → English Numerals ===== */
export function toEnglishNums(str: string): string {
  return str.replace(/[٠-٩]/g, (c) => String(c.charCodeAt(0) - 1632));
}

/* ===== ID Generator (UUID v4 — cryptographically secure) ===== */
export function generateId(_prefix: string = ''): string {
  // Use crypto.getRandomValues for cryptographically secure UUID generation
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    arr[6] = (arr[6] & 0x0f) | 0x40; // version 4
    arr[8] = (arr[8] & 0x3f) | 0x80; // variant 10
    const hex = Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
  }
  // Fallback (should rarely be needed)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/* ===== Report Number Generator ===== */
export function generateReportNumber(nextNum: number): string {
  const year = new Date().getFullYear();
  return `VER-${year}-${String(nextNum).padStart(3, '0')}`;
}

/* ===== Date Formatters ===== */
export function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

export function formatDateShort(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
  } catch {
    return dateStr;
  }
}

export function formatRelative(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return 'اليوم';
  if (diffDays === 1) return 'أمس';
  if (diffDays < 7) return `منذ ${diffDays} أيام`;
  if (diffDays < 30) return `منذ ${Math.floor(diffDays / 7)} أسابيع`;
  return formatDate(dateStr);
}

/* ===== Currency Formatter ===== */
export function formatCurrency(amount: number, currency: string = 'OMR'): string {
  return `${amount.toLocaleString('en-US')} ر.ع`;
}

/* ===== Status Helpers ===== */
export function getStatusInfo(status: ReportStatus) {
  return reportStatuses.find((s) => s.value === status) || { value: status, label: status, color: 'gray' };
}

export function getPropertyTypeLabel(type: PropertyType): string {
  return propertyTypes.find((t) => t.value === type)?.label || type;
}

export function getPropertyUsageLabel(usage: PropertyUsage): string {
  return propertyUsages.find((u) => u.value === usage)?.label || usage;
}

/* ===== File Size Formatter ===== */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} بايت`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} ك.ب`;
  return `${(bytes / 1048576).toFixed(1)} م.ب`;
}

/* ===== Classname Merger ===== */
export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
