'use client';

import type { AppSettings } from '@/types';
import { cache, db } from './shared';
import { settingsToSnake } from './mappers';

export const settingsStore = {
  getSettings: (): AppSettings => cache.settings,

  updateSettings: async (data: Partial<AppSettings>): Promise<void> => {
    const oldValue = { ...cache.settings };
    cache.settings = { ...cache.settings, ...data };
    const row = settingsToSnake(data);
    const { data: rows, error: selectError } = await db.from('app_settings').select('id').limit(1);
    if (selectError) {
      console.error('[store] updateSettings select error:', selectError.message);
      cache.settings = oldValue;
      throw new Error(selectError.message);
    }
    if (rows && rows.length > 0) {
      const { error } = await db.from('app_settings').update(row).eq('id', (rows[0] as Record<string, unknown>).id);
      if (error) {
        console.error('[store] updateSettings error:', error.message);
        cache.settings = oldValue;
        throw new Error(error.message);
      }
    } else {
      const { error } = await db.from('app_settings').insert(row);
      if (error) {
        console.error('[store] updateSettings insert error:', error.message);
        cache.settings = oldValue;
        throw new Error(error.message);
      }
    }
  },
};
