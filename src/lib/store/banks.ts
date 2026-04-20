'use client';

import type { Bank } from '@/types';
import { cache, db } from './shared';
import { bankToSnake, mapBankRow } from './mappers';

export const banksStore = {
  getBanks: (): Bank[] => cache.banks,

  getActiveBanks: (): Bank[] => cache.banks.filter((b) => b.isActive),

  addBank: async (bank: Bank): Promise<void> => {
    cache.banks.push(bank);
    const row = bankToSnake(bank);
    row.id = bank.id;
    row.created_at = new Date().toISOString();
    row.updated_at = new Date().toISOString();
    const { error } = await db.from('banks').insert(row);
    if (error) {
      console.error('[store] addBank error:', error.message);
      cache.banks = cache.banks.filter(b => b.id !== bank.id);
      throw new Error(error.message);
    }
  },

  updateBank: async (id: string, data: Partial<Bank>): Promise<void> => {
    const idx = cache.banks.findIndex((b) => b.id === id);
    if (idx !== -1) {
      const oldValue = { ...cache.banks[idx] };
      cache.banks[idx] = { ...cache.banks[idx], ...data };
      const row = bankToSnake(data);
      row.updated_at = new Date().toISOString();
      const { error } = await db.from('banks').update(row).eq('id', id);
      if (error) {
        console.error('[store] updateBank error:', error.message);
        cache.banks[idx] = oldValue;
        throw new Error(error.message);
      }
    }
  },

  toggleBank: async (id: string): Promise<void> => {
    const idx = cache.banks.findIndex((b) => b.id === id);
    if (idx !== -1) {
      const oldValue = cache.banks[idx].isActive;
      cache.banks[idx].isActive = !cache.banks[idx].isActive;
      const row = { is_active: cache.banks[idx].isActive, updated_at: new Date().toISOString() };
      const { error } = await db.from('banks').update(row).eq('id', id);
      if (error) {
        console.error('[store] toggleBank error:', error.message);
        cache.banks[idx].isActive = oldValue;
        throw new Error(error.message);
      }
    }
  },

  refreshBanksFromDB: async (): Promise<void> => {
    try {
      const { data, error } = await db.from('banks').select('*');
      if (!error && data) {
        cache.banks = data.map((r: Record<string, unknown>) => mapBankRow(r));
        console.log('[store] refreshBanksFromDB: refreshed', cache.banks.length, 'banks');
      } else if (error) {
        console.error('[store] refreshBanksFromDB error:', error.message);
      }
    } catch (err) {
      console.error('[store] refreshBanksFromDB exception:', err);
    }
  },
};
