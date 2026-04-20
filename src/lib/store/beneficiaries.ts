'use client';

import type { Beneficiary } from '@/types';
import { cache, db } from './shared';
import { beneficiaryToSnake, mapBeneficiaryRow } from './mappers';

export const beneficiariesStore = {
  getBeneficiaries: (): Beneficiary[] => cache.beneficiaries,

  getBeneficiary: (id: string): Beneficiary | undefined => {
    return cache.beneficiaries.find((b) => b.id === id);
  },

  addBeneficiary: async (bn: Beneficiary): Promise<void> => {
    cache.beneficiaries.push(bn);
    const row = beneficiaryToSnake(bn);
    row.id = bn.id;
    row.created_at = new Date().toISOString();
    row.updated_at = new Date().toISOString();
    const { error } = await db.from('beneficiaries').insert(row);
    if (error) {
      console.error('[store] addBeneficiary error:', error.message);
      cache.beneficiaries = cache.beneficiaries.filter(b => b.id !== bn.id);
      throw new Error(error.message);
    }
  },

  updateBeneficiary: async (id: string, data: Partial<Beneficiary>): Promise<void> => {
    const idx = cache.beneficiaries.findIndex((b) => b.id === id);
    if (idx !== -1) {
      const oldValue = { ...cache.beneficiaries[idx] };
      cache.beneficiaries[idx] = { ...cache.beneficiaries[idx], ...data };
      const row = beneficiaryToSnake(data);
      row.updated_at = new Date().toISOString();
      const { error } = await db.from('beneficiaries').update(row).eq('id', id);
      if (error) {
        console.error('[store] updateBeneficiary error:', error.message);
        cache.beneficiaries[idx] = oldValue;
        throw new Error(error.message);
      }
    }
  },

  deleteBeneficiary: async (id: string): Promise<void> => {
    const deleted = cache.beneficiaries.find(b => b.id === id);
    cache.beneficiaries = cache.beneficiaries.filter((b) => b.id !== id);
    const { error } = await db.from('beneficiaries').delete().eq('id', id);
    if (error) {
      console.error('[store] deleteBeneficiary error:', error.message);
      if (deleted) cache.beneficiaries.push(deleted);
      throw new Error(error.message);
    }
  },

  refreshBeneficiariesFromDB: async (): Promise<void> => {
    try {
      const { data, error } = await db.from('beneficiaries').select('*');
      if (!error && data) {
        cache.beneficiaries = data.map((r: Record<string, unknown>) => mapBeneficiaryRow(r));
        console.log('[store] refreshBeneficiariesFromDB: refreshed', cache.beneficiaries.length, 'beneficiaries');
      } else if (error) {
        console.error('[store] refreshBeneficiariesFromDB error:', error.message);
      }
    } catch (err) {
      console.error('[store] refreshBeneficiariesFromDB exception:', err);
    }
  },
};
