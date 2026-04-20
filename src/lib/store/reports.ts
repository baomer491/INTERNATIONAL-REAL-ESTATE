'use client';

import type { Report } from '@/types';
import { cache, db } from './shared';
import { mapReportRow, reportToSnake } from './mappers';

export const reportsStore = {
  getReports: (): Report[] => cache.reports,

  getReport: (id: string): Report | undefined => {
    return cache.reports.find((r) => r.id === id);
  },

  refreshReportsFromDB: async (): Promise<void> => {
    try {
      const { data, error } = await db
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) {
        cache.reports = data.map((r: Record<string, unknown>) => mapReportRow(r));
        console.log('[store] refreshReportsFromDB: refreshed', cache.reports.length, 'reports');
      } else if (error) {
        console.error('[store] refreshReportsFromDB error:', error.message);
      }
    } catch (err) {
      console.error('[store] refreshReportsFromDB exception:', err);
    }
  },

  addReport: async (report: Report): Promise<void> => {
    cache.reports.unshift(report);
    const row = reportToSnake(report);
    row.id = report.id;
    row.created_at = report.createdAt || new Date().toISOString();
    row.updated_at = report.updatedAt || new Date().toISOString();
    const { error } = await db.from('reports').insert(row);
    if (error) {
      console.error('[store] addReport error:', error.message);
      cache.reports = cache.reports.filter(r => r.id !== report.id);
      throw new Error(error.message);
    }
  },

  updateReport: async (id: string, data: Partial<Report>): Promise<void> => {
    const idx = cache.reports.findIndex((r) => r.id === id);
    if (idx !== -1) {
      const oldValue = { ...cache.reports[idx] };
      cache.reports[idx] = { ...cache.reports[idx], ...data, updatedAt: new Date().toISOString() };
      const row = reportToSnake({ ...data, updatedAt: new Date().toISOString() });
      const { error } = await db.from('reports').update(row).eq('id', id);
      if (error) {
        console.error('[store] updateReport error:', error.message, 'data:', JSON.stringify(row));
        cache.reports[idx] = oldValue;
        throw new Error(error.message);
      }
    }
  },

  deleteReport: async (id: string): Promise<void> => {
    const deleted = cache.reports.find(r => r.id === id);
    cache.reports = cache.reports.filter((r) => r.id !== id);
    const { error } = await db.from('reports').delete().eq('id', id);
    if (error) {
      console.error('[store] deleteReport error:', error.message);
      if (deleted) cache.reports.unshift(deleted);
      throw new Error(error.message);
    }
  },
};
