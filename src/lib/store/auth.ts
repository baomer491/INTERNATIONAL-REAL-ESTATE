'use client';

import type { Employee, LoginLog } from '@/types';
import { PERMISSIONS } from '@/types';
import {
  cache,
  STORAGE_KEYS, lsGet, lsSet, lsRemove,
  db, generateId,
} from './shared';
import { mapEmployeeRow, employeeToSnake, mapLoginLogRow, loginLogToSnake } from './mappers';

/* ===== Password Hashing (Legacy SHA-256 based — kept as fallback for client-side operations) ===== */

// Simple SHA-256 hash using crypto.subtle if available, otherwise a pure-JS fallback
async function sha256(message: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const enc = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', enc.encode(message));
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function rightRotate(value: number, amount: number): number {
    return (value >>> amount) | (value << (32 - amount));
  }

  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];

  const encoder = new TextEncoder();
  const msgBytes = encoder.encode(message);
  const msgLen = msgBytes.length;
  const bitLen = msgLen * 8;
  const newLen = Math.ceil((msgLen + 1 + 8) / 64) * 64;
  const padded = new Uint8Array(newLen);
  padded.set(msgBytes);
  padded[msgLen] = 0x80;
  const dv = new DataView(padded.buffer);
  dv.setUint32(newLen - 4, bitLen, false);

  let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a;
  let h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;

  for (let offset = 0; offset < newLen; offset += 64) {
    const w = new Uint32Array(64);
    for (let i = 0; i < 16; i++) {
      w[i] = dv.getUint32(offset + i * 4, false);
    }
    for (let i = 16; i < 64; i++) {
      const s0 = rightRotate(w[i - 15], 7) ^ rightRotate(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rightRotate(w[i - 2], 17) ^ rightRotate(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
    }

    let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
    for (let i = 0; i < 64; i++) {
      const S1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + K[i] + w[i]) | 0;
      const S0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) | 0;
      h = g; g = f; f = e; e = (d + temp1) | 0;
      d = c; c = b; b = a; a = (temp1 + temp2) | 0;
    }

    h0 = (h0 + a) | 0; h1 = (h1 + b) | 0; h2 = (h2 + c) | 0; h3 = (h3 + d) | 0;
    h4 = (h4 + e) | 0; h5 = (h5 + f) | 0; h6 = (h6 + g) | 0; h7 = (h7 + h) | 0;
  }

  const result = [h0, h1, h2, h3, h4, h5, h6, h7];
  return result.map(v => (v >>> 0).toString(16).padStart(8, '0')).join('');
}

function generateSalt(): string {
  const arr = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(arr);
  } else {
    for (let i = 0; i < 16; i++) arr[i] = (Date.now() + i * 37) & 0xFF;
  }
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Hash password with multiple rounds of SHA-256 (salted)
export async function hashPassword(password: string, salt?: string): Promise<string> {
  const s = salt || generateSalt();
  let hash = await sha256(s + ':' + password);
  for (let i = 0; i < 100; i++) {
    hash = await sha256(s + ':' + hash);
  }
  return `${s}:${hash}`;
}

/* ===== Auth Store Functions ===== */

export const authStore = {
  isLoggedIn: (): boolean => {
    if (typeof window === 'undefined') return false;
    return lsGet(STORAGE_KEYS.isLoggedIn) === 'true';
  },

  getCurrentUserId: (): string | null => {
    if (typeof window === 'undefined') return null;
    return lsGet(STORAGE_KEYS.currentUserId);
  },

  getCurrentUser: (): Employee | undefined => {
    const id = authStore.getCurrentUserId();
    if (!id) return undefined;
    return cache.employees.find(e => e.id === id);
  },

  login: async (username: string, password: string): Promise<{ success: boolean; reason?: string }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!data.success) {
        return { success: false, reason: data.reason || 'unknown_error' };
      }

      const user = data.user;
      lsSet(STORAGE_KEYS.isLoggedIn, 'true');
      lsSet(STORAGE_KEYS.currentUserId, user.id);

      const idx = cache.employees.findIndex(e => e.id === user.id);
      if (idx !== -1) {
        cache.employees[idx] = { ...cache.employees[idx], ...user, lastLogin: new Date().toISOString(), isActiveSession: true };
      }

      const logEntry: LoginLog = {
        id: generateId(),
        employeeId: user.id,
        employeeName: user.fullName,
        action: 'login',
        timestamp: new Date().toISOString(),
        ipAddress: '',
      };
      cache.loginLogs.unshift(logEntry);

      return { success: true };
    } catch (err) {
      console.error('[store] login fetch error:', err);
      return { success: false, reason: 'network_error' };
    }
  },

  logout: (storeRef: any): void => {
    const userId = authStore.getCurrentUserId();
    if (userId) {
      const emp = storeRef.getEmployee(userId);
      if (emp) {
        storeRef.updateEmployee(userId, {
          lastLogout: new Date().toISOString(),
          isActiveSession: false,
        });
        storeRef.addLoginLog({
          id: generateId(),
          employeeId: userId,
          employeeName: emp.fullName,
          action: 'logout',
          timestamp: new Date().toISOString(),
          ipAddress: '',
        });
      }
    }
    lsRemove(STORAGE_KEYS.isLoggedIn);
    lsRemove(STORAGE_KEYS.currentUserId);
  },

  /* ===== Login Logs ===== */
  getLoginLogs: (): LoginLog[] => cache.loginLogs,

  addLoginLog: async (log: LoginLog): Promise<void> => {
    cache.loginLogs.unshift(log);
    const row = loginLogToSnake(log);
    const { error } = await db.from('login_logs').insert(row);
    if (error) {
      console.error('[store] addLoginLog error:', error.message);
      cache.loginLogs = cache.loginLogs.filter(l => l.id !== log.id);
      throw new Error(error.message);
    }
  },

  /* ===== Password Management ===== */
  changePassword: async (employeeId: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; reason?: string }> => {
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: employeeId, currentPassword, newPassword }),
      });

      const data = await res.json();

      if (!data.success) {
        return { success: false, reason: data.reason || 'unknown_error' };
      }

      const empIdx = cache.employees.findIndex(e => e.id === employeeId);
      if (empIdx !== -1) {
        cache.employees[empIdx] = { ...cache.employees[empIdx] };
      }

      return { success: true };
    } catch (err) {
      console.error('[store] changePassword fetch error:', err);
      return { success: false, reason: 'network_error' };
    }
  },
};

/* Seed default admin — called during initialization */
export async function seedDefaultAdmin(): Promise<void> {
  if (cache.employees.length === 0) {
    const bcryptAdminHash = '$2b$10$uQwU9cdAi1SoRqULWrMh9OA4sm2W59Nkh6ElODfD5sVzyhQ1bWtKi';
    const adminRow = {
      id: 'e1',
      full_name: 'مدير النظام',
      username: 'admin',
      email: 'admin@ireo.om',
      phone: '',
      role: 'admin',
      status: 'active',
      avatar: '',
      department: 'الإدارة العامة',
      join_date: new Date().toISOString(),
      last_login: null,
      last_logout: null,
      is_active_session: false,
      permissions: PERMISSIONS.map(p => p.id),
      notes: 'حساب مدير النظام الافتراضي',
      password_hash: bcryptAdminHash,
    };
    await db.from('employees').insert(adminRow);
    cache.employees.push(mapEmployeeRow(adminRow));
  }
}
