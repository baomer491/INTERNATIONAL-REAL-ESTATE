'use client';

import type { PreliminaryValuation } from '@/types';
import { generateId, lsGet, lsSet } from './shared';

const STORAGE_KEY = 'ireo_preliminary_valuations';

function getList(): PreliminaryValuation[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = lsGet(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PreliminaryValuation[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function setList(list: PreliminaryValuation[]): void {
  if (typeof window === 'undefined') return;
  lsSet(STORAGE_KEY, JSON.stringify(list));
}

export const preliminaryStore = {
  getAll: (): PreliminaryValuation[] => {
    return getList().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getById: (id: string): PreliminaryValuation | undefined => {
    return getList().find(item => item.id === id);
  },

  add: (data: Omit<PreliminaryValuation, 'id' | 'createdAt'>): PreliminaryValuation => {
    const item: PreliminaryValuation = {
      ...data,
      id: generateId('pv'),
      createdAt: new Date().toISOString(),
    };
    const list = getList();
    list.push(item);
    setList(list);
    return item;
  },

  update: (id: string, updates: Partial<PreliminaryValuation>): PreliminaryValuation | null => {
    const list = getList();
    const idx = list.findIndex(item => item.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...updates };
    setList(list);
    return list[idx];
  },

  delete: (id: string): boolean => {
    const list = getList();
    const filtered = list.filter(item => item.id !== id);
    if (filtered.length === list.length) return false;
    setList(filtered);
    return true;
  },
};
