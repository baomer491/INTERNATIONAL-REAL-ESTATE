'use client';

import { db } from './supabase';
import type { EmployeeRole } from '@/types';
import { RealtimeChannel } from '@supabase/supabase-js';
import { store } from './store';

/* =================================================================
   REALTIME ENGINE — Full-duplex realtime for ALL app entities
   =================================================================
   Architecture:
   1. Supabase postgres_changes → per-table subscriptions
   2. Supabase Broadcast → cross-tab sync (same browser)
   3. Supabase Presence → active users tracking
   4. Polling fallback → when realtime fails
   ================================================================= */

// ─── Types ────────────────────────────────────────────────────────

export type EntityType = 'reports' | 'tasks' | 'notifications' | 'employees' | 'banks' | 'beneficiaries' | 'settings';

export interface RealtimeEvent {
  type: EntityType;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  id: string;
  data?: Record<string, unknown>;
  old?: Record<string, unknown>;
}

export interface ActiveUser {
  id: string;
  name: string;
  role: EmployeeRole;
  onlineAt: string;
}

export interface RealtimeCallbacks {
  /** Fired when any entity changes in DB via Realtime */
  onEntityChanged?: (event: RealtimeEvent) => void;
  /** Fired when new report with pending_approval is inserted (for reviewers/admins) */
  onNewPendingApproval?: (report: { id: string; reportNumber: string; appraiserName: string; beneficiaryName: string }) => void;
  /** Fired when new notification arrives */
  onNewNotification?: (notif: { id: string; title: string; message: string; type: string; priority: string; targetEmployeeId?: string }) => void;
  /** Fired when presence changes (users go online/offline) */
  onPresenceChange?: (users: ActiveUser[]) => void;
}

// ─── Sound & Browser Notifications (kept from old service) ────────

let audioContext: AudioContext | null = null;

export function playNotificationSound() {
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioContext;
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.frequency.value = 880;
    osc1.type = 'sine';
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    osc1.start(now);
    osc1.stop(now + 0.3);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.frequency.value = 1100;
    osc2.type = 'sine';
    gain2.gain.setValueAtTime(0.3, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.5);
  } catch (err) {
    console.warn('[realtime] Audio error:', err);
  }
}

let notifPermissionGranted = false;

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission === 'granted') { notifPermissionGranted = true; return true; }
  if (Notification.permission !== 'denied') {
    const perm = await Notification.requestPermission();
    notifPermissionGranted = perm === 'granted';
    return notifPermissionGranted;
  }
  return false;
}

export function showBrowserNotification(title: string, options?: NotificationOptions) {
  if (!notifPermissionGranted && Notification.permission === 'granted') notifPermissionGranted = true;
  if (notifPermissionGranted || Notification.permission === 'granted') {
    try {
      const notif = new Notification(title, { icon: '/logo.svg', badge: '/logo.svg', dir: 'rtl', lang: 'ar', ...options });
      notif.onclick = () => { window.focus(); notif.close(); if (options?.data?.path) window.location.href = options.data.path; };
      setTimeout(() => notif.close(), 8000);
    } catch {}
  }
}

// ─── Engine State (module-level singleton) ────────────────────────

let mainChannel: RealtimeChannel | null = null;
let broadcastChannel: RealtimeChannel | null = null;
let presenceChannel: RealtimeChannel | null = null;
let pollingTimer: ReturnType<typeof setInterval> | null = null;
let callbacks: RealtimeCallbacks = {};
let currentUserRole: EmployeeRole | null = null;
let currentUserId: string | null = null;
let currentUserName: string | null = null;
let isActive = false;
let realtimeConnected = false;
let retryCount = 0;
const MAX_RETRIES = 3;
const RETRY_BASE_MS = 2000;

// Track active users
let activeUsers: ActiveUser[] = [];

// Debounce rapid refresh calls (e.g., batch inserts)
let refreshDebounceTimers: Map<EntityType, ReturnType<typeof setTimeout>> = new Map();
const DEBOUNCE_MS = 300;

// ─── Public API ───────────────────────────────────────────────────

/**
 * Start the full realtime engine.
 * - Subscribes to postgres_changes for all 6 entity tables
 * - Sets up Broadcast channel for cross-tab sync
 * - Sets up Presence channel for active user tracking
 * - Starts polling as fallback
 */
export function startRealtimeEngine(
  userId: string,
  userName: string,
  userRole: EmployeeRole,
  cbs: RealtimeCallbacks
) {
  stopRealtimeEngine();

  currentUserId = userId;
  currentUserName = userName;
  currentUserRole = userRole;
  callbacks = cbs;
  isActive = true;
  retryCount = 0;

  requestNotificationPermission();

  // 1) Main channel: postgres_changes for all tables
  setupMainChannel();

  // 2) Broadcast channel: cross-tab sync within same browser
  setupBroadcastChannel();

  // 3) Presence channel: track who's online
  setupPresenceChannel();

  // 4) Polling fallback
  startPolling();

  console.log('[realtime] Engine started for', userName, '(' + userRole + ')');
}

export function stopRealtimeEngine() {
  isActive = false;

  // Clear debounce timers
  for (const timer of refreshDebounceTimers.values()) clearTimeout(timer);
  refreshDebounceTimers.clear();

  // Remove channels
  for (const ch of [mainChannel, broadcastChannel, presenceChannel]) {
    if (ch) {
      try { db.removeChannel(ch); } catch {}
    }
  }
  mainChannel = null;
  broadcastChannel = null;
  presenceChannel = null;

  if (pollingTimer) { clearInterval(pollingTimer); pollingTimer = null; }

  realtimeConnected = false;
  activeUsers = [];
  retryCount = 0;

  console.log('[realtime] Engine stopped');
}

/** Get currently active/online users */
export function getActiveUsers(): ActiveUser[] {
  return [...activeUsers];
}

/** Check if realtime WebSocket is connected */
export function isRealtimeConnected(): boolean {
  return realtimeConnected;
}

/** Manual test trigger */
export function testNotification() {
  playNotificationSound();
  showBrowserNotification('اختبار الإشعارات', {
    body: 'هذا إشعار تجريبي من نظام التثمين العقاري',
    tag: 'test',
  });
}

// ─── Main Channel: Postgres Changes ───────────────────────────────

function setupMainChannel() {
  try {
    mainChannel = db
      .channel('realtime-all-tables')
      // ── Reports ──
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'reports' },
        (payload) => {
          const evt = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';
          const newRow = payload.new as Record<string, unknown> | undefined;
          const oldRow = payload.old as Record<string, unknown> | undefined;

          console.log('[realtime] reports', evt);

          // Handle pending_approval notifications for reviewers/admins
          if (evt === 'INSERT' && newRow?.status === 'pending_approval' &&
              (currentUserRole === 'admin' || currentUserRole === 'reviewer')) {
            const reportNumber = (newRow.report_number as string) || '';
            const appraiserName = (newRow.appraiser_name as string) || '';
            const beneficiaryName = (newRow.beneficiary_name as string) || '';
            const reportId = (newRow.id as string) || '';

            showBrowserNotification('تقرير جديد بانتظار الاعتماد', {
              body: `تقرير ${reportNumber} من ${appraiserName} - المستفيد: ${beneficiaryName}`,
              tag: `approval-${reportId}`,
              data: { path: '/approvals' },
            });
            playNotificationSound();

            if (callbacks.onNewPendingApproval) {
              callbacks.onNewPendingApproval({ id: reportId, reportNumber, appraiserName, beneficiaryName });
            }
          }

          // Handle status change notifications for report owners
          if (evt === 'UPDATE' && newRow && oldRow) {
            const newStatus = newRow.status as string;
            const oldStatus = oldRow.status as string;
            if (newStatus !== oldStatus) {
              // Notify the appraiser if their report got approved/rejected
              if (newStatus === 'approved' || newStatus === 'rejected') {
                showBrowserNotification(
                  newStatus === 'approved' ? 'تم اعتماد التقرير' : 'تم رفض التقرير',
                  {
                    body: `تقرير ${(newRow.report_number as string) || ''} — ${newStatus === 'approved' ? 'تمت الموافقة' : 'تم الرفض'}`,
                    tag: `status-${newRow.id}`,
                    data: { path: '/reports' },
                  }
                );
                playNotificationSound();
              }
            }
          }

          debouncedRefresh('reports');
          if (callbacks.onEntityChanged) {
            callbacks.onEntityChanged({ type: 'reports', action: evt, id: (newRow?.id || oldRow?.id || '') as string, data: newRow, old: oldRow });
          }
        }
      )
      // ── Tasks ──
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        (payload) => {
          const evt = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';
          const newRow = payload.new as Record<string, unknown> | undefined;
          console.log('[realtime] tasks', evt);
          debouncedRefresh('tasks');
          if (callbacks.onEntityChanged) {
            callbacks.onEntityChanged({ type: 'tasks', action: evt, id: (newRow?.id || (payload.old as any)?.id || '') as string, data: newRow });
          }
        }
      )
      // ── Notifications ──
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          const n = payload.new as Record<string, unknown>;
          console.log('[realtime] notifications INSERT');
          if (callbacks.onNewNotification) {
            callbacks.onNewNotification({
              id: (n.id as string) || '',
              title: (n.title as string) || '',
              message: (n.message as string) || '',
              type: (n.type as string) || 'system',
              priority: (n.priority as string) || 'medium',
              targetEmployeeId: (n.target_employee_id as string) || undefined,
            });
          }
          debouncedRefresh('notifications');
          if (callbacks.onEntityChanged) {
            callbacks.onEntityChanged({ type: 'notifications', action: 'INSERT', id: (n.id as string) || '', data: n });
          }
        }
      )
      // ── Employees ──
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'employees' },
        (payload) => {
          console.log('[realtime] employees', payload.eventType);
          debouncedRefresh('employees');
          if (callbacks.onEntityChanged) {
            callbacks.onEntityChanged({ type: 'employees', action: payload.eventType as any, id: ((payload.new as any)?.id || (payload.old as any)?.id || '') as string });
          }
        }
      )
      // ── Banks ──
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'banks' },
        (payload) => {
          console.log('[realtime] banks', payload.eventType);
          debouncedRefresh('banks');
          if (callbacks.onEntityChanged) {
            callbacks.onEntityChanged({ type: 'banks', action: payload.eventType as any, id: ((payload.new as any)?.id || (payload.old as any)?.id || '') as string });
          }
        }
      )
      // ── Beneficiaries ──
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'beneficiaries' },
        (payload) => {
          console.log('[realtime] beneficiaries', payload.eventType);
          debouncedRefresh('beneficiaries');
          if (callbacks.onEntityChanged) {
            callbacks.onEntityChanged({ type: 'beneficiaries', action: payload.eventType as any, id: ((payload.new as any)?.id || (payload.old as any)?.id || '') as string });
          }
        }
      )
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          realtimeConnected = true;
          retryCount = 0;
          console.log('[realtime] Main channel SUBSCRIBED');
          // Switch to slow polling
          restartPolling(30000);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          realtimeConnected = false;
          console.warn('[realtime] Main channel error, retry', retryCount + 1);
          handleRealtimeFailure();
        }
      });
  } catch (err) {
    console.warn('[realtime] Main channel setup failed:', err);
    realtimeConnected = false;
    restartPolling(5000);
  }
}

// ─── Broadcast Channel: Cross-Tab Sync ────────────────────────────

function setupBroadcastChannel() {
  try {
    broadcastChannel = db
      .channel('realtime-broadcast')
      .on('broadcast', { event: 'entity-changed' }, (payload) => {
        const entityType = payload.payload?.type as EntityType;
        if (entityType) {
          console.log('[realtime] Broadcast received:', entityType);
          // Refresh the specific entity from DB
          refreshEntity(entityType);
          // Dispatch DOM event for React components
          window.dispatchEvent(new CustomEvent(`${entityType}-updated`));
        }
      })
      .subscribe();
  } catch (err) {
    console.warn('[realtime] Broadcast channel failed:', err);
  }
}

/** Broadcast a change to other tabs (call after local mutations) */
export function broadcastChange(entityType: EntityType) {
  if (broadcastChannel) {
    broadcastChannel.send({
      type: 'broadcast',
      event: 'entity-changed',
      payload: { type: entityType, timestamp: Date.now() },
    }).catch(() => {});
  }
}

// ─── Presence Channel: Active Users ──────────────────────────────

function setupPresenceChannel() {
  if (!currentUserId || !currentUserName) return;

  try {
    presenceChannel = db
      .channel('realtime-presence', {
        config: { presence: { key: currentUserId } },
      })
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel!.presenceState();
        const users: ActiveUser[] = [];
        for (const [id, presences] of Object.entries(state)) {
          for (const p of presences as any[]) {
            if (p.id && p.name) {
              users.push({ id: p.id, name: p.name, role: p.role, onlineAt: p.onlineAt });
            }
          }
        }
        activeUsers = users;
        if (callbacks.onPresenceChange) callbacks.onPresenceChange(users);
      })
      .subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel!.track({
            id: currentUserId,
            name: currentUserName,
            role: currentUserRole,
            onlineAt: new Date().toISOString(),
          });
        }
      });
  } catch (err) {
    console.warn('[realtime] Presence channel failed:', err);
  }
}

// ─── Debounced Refresh ────────────────────────────────────────────

function debouncedRefresh(entity: EntityType) {
  const existing = refreshDebounceTimers.get(entity);
  if (existing) clearTimeout(existing);

  refreshDebounceTimers.set(entity, setTimeout(async () => {
    refreshDebounceTimers.delete(entity);
    await refreshEntity(entity);
    window.dispatchEvent(new CustomEvent(`${entity}-updated`));
  }, DEBOUNCE_MS));
}

async function refreshEntity(entity: EntityType) {
  try {
    switch (entity) {
      case 'reports':
        await store.refreshReportsFromDB();
        break;
      case 'tasks':
        await store.refreshTasksFromDB();
        break;
      case 'notifications':
        // For notifications, refresh from DB
        await store.refreshNotificationsFromDB?.();
        break;
      case 'employees':
        await store.refreshEmployeesFromDB?.();
        break;
      case 'banks':
        await store.refreshBanksFromDB?.();
        break;
      case 'beneficiaries':
        await store.refreshBeneficiariesFromDB?.();
        break;
    }
  } catch (err) {
    console.error(`[realtime] refresh ${entity} error:`, err);
  }
}

// ─── Polling Fallback ─────────────────────────────────────────────

function startPolling() {
  const interval = realtimeConnected ? 30000 : 5000;
  pollingTimer = setInterval(pollForChanges, interval);
}

function restartPolling(intervalMs: number) {
  if (pollingTimer) clearInterval(pollingTimer);
  pollingTimer = setInterval(pollForChanges, intervalMs);
}

async function pollForChanges() {
  if (!isActive) return;
  try {
    // Lightweight count-based polling to detect changes missed by realtime
    const [repRes, taskRes, notifRes] = await Promise.all([
      db.from('reports').select('id', { count: 'exact', head: true }),
      db.from('tasks').select('id', { count: 'exact', head: true }),
      db.from('notifications').select('id', { count: 'exact', head: true }).eq('is_read', false),
    ]);

    // Compare with cached counts
    const reportCount = repRes.count ?? -1;
    const taskCount = taskRes.count ?? -1;
    const notifCount = notifRes.count ?? -1;

    const cachedReportCount = store.getReports().length;
    const cachedTaskCount = store.getTasks().length;
    const cachedNotifCount = store.unreadCount();

    if (reportCount !== cachedReportCount && reportCount >= 0) {
      console.log('[realtime] Poll: reports count changed', cachedReportCount, '→', reportCount);
      await refreshEntity('reports');
      window.dispatchEvent(new CustomEvent('reports-updated'));
    }

    if (taskCount !== cachedTaskCount && taskCount >= 0) {
      console.log('[realtime] Poll: tasks count changed', cachedTaskCount, '→', taskCount);
      await refreshEntity('tasks');
      window.dispatchEvent(new CustomEvent('tasks-updated'));
    }

    if (notifCount !== cachedNotifCount && notifCount >= 0) {
      console.log('[realtime] Poll: notifications count changed', cachedNotifCount, '→', notifCount);
      if (!realtimeConnected && callbacks.onNewNotification) {
        // Fetch recent unread notifications to deliver
        const { data: recentNotifs } = await db
          .from('notifications')
          .select('*')
          .eq('is_read', false)
          .order('created_at', { ascending: false })
          .limit(5);
        if (recentNotifs && recentNotifs.length > 0) {
          for (const n of recentNotifs) {
            const row = n as Record<string, unknown>;
            callbacks.onNewNotification({
              id: row.id as string,
              title: (row.title as string) || '',
              message: (row.message as string) || '',
              type: (row.type as string) || 'system',
              priority: (row.priority as string) || 'medium',
              targetEmployeeId: (row.target_employee_id as string) || undefined,
            });
          }
        }
      }
      await refreshEntity('notifications');
      window.dispatchEvent(new CustomEvent('notifications-updated'));
    }
  } catch (err) {
    console.error('[realtime] Poll error:', err);
  }
}

// ─── Retry Logic ──────────────────────────────────────────────────

function handleRealtimeFailure() {
  if (retryCount < MAX_RETRIES) {
    const delay = RETRY_BASE_MS * (retryCount + 1);
    retryCount++;
    console.log('[realtime] Retrying in', delay, 'ms');
    setTimeout(() => {
      if (isActive && currentUserId) {
        // Clean up old channel first
        if (mainChannel) {
          try { db.removeChannel(mainChannel); } catch {}
          mainChannel = null;
        }
        setupMainChannel();
      }
    }, delay);
  } else {
    console.warn('[realtime] Max retries reached — fast polling');
    restartPolling(5000);
  }
}
