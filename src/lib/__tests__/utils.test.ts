import { describe, it, expect, vi } from 'vitest';
import {
  formatCurrency,
  formatRelative,
  getStatusInfo,
  formatDate,
  formatDateShort,
  formatFileSize,
  cn,
  toEnglishNums,
  generateReportNumber,
  generateId,
} from '@/lib/utils';

describe('formatCurrency', () => {
  it('should format a whole number with OMR currency suffix', () => {
    const result = formatCurrency(1000);
    expect(result).toContain('1,000');
    expect(result).toContain('ر.ع');
  });

  it('should format a decimal number', () => {
    const result = formatCurrency(1500.75);
    expect(result).toContain('1,500.75');
    expect(result).toContain('ر.ع');
  });

  it('should format zero correctly', () => {
    const result = formatCurrency(0);
    expect(result).toContain('0');
    expect(result).toContain('ر.ع');
  });

  it('should format large numbers with commas', () => {
    const result = formatCurrency(1234567);
    expect(result).toContain('1,234,567');
  });

  it('should format small numbers without commas', () => {
    const result = formatCurrency(50);
    expect(result).toBe('50 ر.ع');
  });

  it('should handle negative numbers', () => {
    const result = formatCurrency(-100);
    expect(result).toContain('-100');
    expect(result).toContain('ر.ع');
  });
});

describe('formatRelative', () => {
  it('should return "اليوم" for today', () => {
    const today = new Date().toISOString();
    expect(formatRelative(today)).toBe('اليوم');
  });

  it('should return "أمس" for yesterday', () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    expect(formatRelative(yesterday)).toBe('أمس');
  });

  it('should return days format for dates within a week', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString();
    const result = formatRelative(threeDaysAgo);
    expect(result).toContain('3');
    expect(result).toContain('أيام');
  });

  it('should return weeks format for dates within a month', () => {
    const twoWeeksAgo = new Date(Date.now() - 14 * 86400000).toISOString();
    const result = formatRelative(twoWeeksAgo);
    expect(result).toContain('أسابيع');
  });

  it('should fall back to formatDate for dates older than a month', () => {
    const sixtyDaysAgo = new Date(Date.now() - 60 * 86400000).toISOString();
    const result = formatRelative(sixtyDaysAgo);
    // Should be a formatted date, not relative text
    expect(result).not.toBe('اليوم');
    expect(result).not.toBe('أمس');
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('getStatusInfo', () => {
  it('should return correct info for "draft" status', () => {
    const info = getStatusInfo('draft');
    expect(info.value).toBe('draft');
    expect(info.label).toBe('مسودة');
    expect(info.color).toBe('gray');
  });

  it('should return correct info for "approved" status', () => {
    const info = getStatusInfo('approved');
    expect(info.value).toBe('approved');
    expect(info.label).toBe('معتمد');
    expect(info.color).toBe('green');
  });

  it('should return correct info for "rejected" status', () => {
    const info = getStatusInfo('rejected');
    expect(info.value).toBe('rejected');
    expect(info.label).toBe('مرفوض');
    expect(info.color).toBe('red');
  });

  it('should return correct info for "in_progress" status', () => {
    const info = getStatusInfo('in_progress');
    expect(info.value).toBe('in_progress');
    expect(info.label).toBe('قيد الإنجاز');
    expect(info.color).toBe('blue');
  });

  it('should return fallback for unknown status', () => {
    const info = getStatusInfo('unknown_status' as any);
    expect(info.value).toBe('unknown_status');
    expect(info.label).toBe('unknown_status');
    expect(info.color).toBe('gray');
  });

  it('should return all standard statuses', () => {
    const statuses = ['draft', 'in_progress', 'pending_approval', 'approved', 'rejected', 'needs_revision', 'archived'] as const;
    for (const s of statuses) {
      const info = getStatusInfo(s);
      expect(info.value).toBe(s);
      expect(info.label).toBeTruthy();
      expect(info.color).toBeTruthy();
    }
  });
});

describe('formatFileSize', () => {
  it('should format bytes correctly', () => {
    expect(formatFileSize(500)).toBe('500 بايت');
  });

  it('should format kilobytes correctly', () => {
    expect(formatFileSize(1536)).toBe('1.5 ك.ب');
  });

  it('should format megabytes correctly', () => {
    expect(formatFileSize(2097152)).toBe('2.0 م.ب');
  });

  it('should handle zero bytes', () => {
    expect(formatFileSize(0)).toBe('0 بايت');
  });
});

describe('cn (classname merger)', () => {
  it('should join multiple class strings', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c');
  });

  it('should filter out falsy values', () => {
    expect(cn('a', undefined, null, false, 'b')).toBe('a b');
  });

  it('should return empty string for all falsy values', () => {
    expect(cn(undefined, null, false)).toBe('');
  });
});

describe('toEnglishNums', () => {
  it('should convert Arabic numerals to English', () => {
    expect(toEnglishNums('٠١٢٣٤٥٦٧٨٩')).toBe('0123456789');
  });

  it('should leave English numerals unchanged', () => {
    expect(toEnglishNums('12345')).toBe('12345');
  });

  it('should handle mixed content', () => {
    expect(toEnglishNums('price: ١٠٠ rials')).toBe('price: 100 rials');
  });
});

describe('generateReportNumber', () => {
  it('should include current year', () => {
    const year = new Date().getFullYear();
    const result = generateReportNumber(5);
    expect(result).toBe(`VER-${year}-005`);
  });

  it('should pad single digit numbers with zeros', () => {
    const result = generateReportNumber(1);
    expect(result).toMatch(/VER-\d{4}-001/);
  });

  it('should not pad three digit numbers', () => {
    const result = generateReportNumber(123);
    expect(result).toMatch(/VER-\d{4}-123/);
  });
});

describe('generateId', () => {
  it('should generate a valid UUID v4 format', () => {
    const id = generateId();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('should generate unique IDs', () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
  });
});
