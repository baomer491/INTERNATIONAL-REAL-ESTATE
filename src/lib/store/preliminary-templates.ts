export interface TemplateField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'textarea' | 'select';
  options?: string[];
  required?: boolean;
}

export interface PreliminaryTemplate {
  id: string;
  name: string;
  description: string;
  fileName: string;
  contentType: string;
  size: number;
  content: string; // base64
  fields: TemplateField[];
  createdAt: string;
}

import { db } from '../supabase';
import { mapPreliminaryTemplateRow, preliminaryTemplateToSnake } from './mappers';

/* ===== In-memory cache (populated from Supabase) ===== */
let cache: PreliminaryTemplate[] | null = null;

function setCache(items: PreliminaryTemplate[]) {
  cache = items;
}

function getCache(): PreliminaryTemplate[] {
  return cache ?? [];
}

export const preliminaryTemplateStore = {
  async getAll(): Promise<PreliminaryTemplate[]> {
    if (cache !== null) return getCache();
    try {
      const { data, error } = await db
        .from('preliminary_templates')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        console.error('[preliminaryTemplateStore] getAll error:', error.message);
        return [];
      }
      const items = (data ?? []).map((row: Record<string, unknown>) => mapPreliminaryTemplateRow(row));
      setCache(items);
      return items;
    } catch (err) {
      console.error('[preliminaryTemplateStore] getAll exception:', err);
      return [];
    }
  },

  async refreshFromDB(): Promise<PreliminaryTemplate[]> {
    cache = null;
    return this.getAll();
  },

  async add(template: Omit<PreliminaryTemplate, 'id' | 'createdAt'> & { createdBy?: string; createdByName?: string }): Promise<PreliminaryTemplate | null> {
    try {
      const payload = preliminaryTemplateToSnake(template);
      const { data, error } = await db
        .from('preliminary_templates')
        .insert(payload)
        .select()
        .single();
      if (error) {
        console.error('[preliminaryTemplateStore] add error:', error.message);
        return null;
      }
      const newItem = mapPreliminaryTemplateRow(data as Record<string, unknown>);
      // Update cache
      if (cache !== null) {
        cache.unshift(newItem);
      }
      return newItem;
    } catch (err) {
      console.error('[preliminaryTemplateStore] add exception:', err);
      return null;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await db.from('preliminary_templates').delete().eq('id', id);
      if (error) {
        console.error('[preliminaryTemplateStore] delete error:', error.message);
        return false;
      }
      if (cache !== null) {
        cache = cache.filter(i => i.id !== id);
      }
      return true;
    } catch (err) {
      console.error('[preliminaryTemplateStore] delete exception:', err);
      return false;
    }
  },

  async getById(id: string): Promise<PreliminaryTemplate | undefined> {
    const items = await this.getAll();
    return items.find(i => i.id === id);
  },

  download(template: PreliminaryTemplate) {
    const byteString = atob(template.content.split(',')[1] || template.content);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: template.contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = template.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
};
