'use client';

import { db } from './supabase';
import type { EmployeeRole } from '@/types';

/* ===== Notification Sound ===== */

// Generate a notification beep sound using Web Audio API (no external file needed)
let audioContext: AudioContext | null = null;

export function playNotificationSound() {
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    const ctx = audioContext;

    // Create a pleasant two-tone notification sound
    const now = ctx.currentTime;

    // First tone
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.frequency.value = 880; // A5
    osc1.type = 'sine';
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    osc1.start(now);
    osc1.stop(now + 0.3);

    // Second tone (higher pitch, slight delay)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.frequency.value = 1100; // C#6
    osc2.type = 'sine';
    gain2.gain.setValueAtTime(0.3, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.5);
  } catch (err) {
    // Audio not supported - silent fallback
    console.warn('[notification-service] Could not play sound:', err);
  }
}

/* ===== Browser Push Notification ===== */

let notificationPermissionGranted = false;

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.warn('[notification-service] Browser notifications not supported');
    return false;
  }

  if (Notification.permission === 'granted') {
    notificationPermissionGranted = true;
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    notificationPermissionGranted = permission === 'granted';
    return notificationPermissionGranted;
  }

  return false;
}

export function showBrowserNotification(title: string, options?: NotificationOptions) {
  if (!notificationPermissionGranted && Notification.permission === 'granted') {
    notificationPermissionGranted = true;
  }

  if (notificationPermissionGranted || Notification.permission === 'granted') {
    try {
      const notif = new Notification(title, {
        icon: '/logo.svg',
        badge: '/logo.svg',
        dir: 'rtl',
        lang: 'ar',
        ...options,
      });

      notif.onclick = () => {
        window.focus();
        notif.close();
        // Navigate to approvals page if related to approval
        if (options?.data?.path) {
          window.location.href = options.data.path;
        }
      };

      // Auto-close after 8 seconds
      setTimeout(() => notif.close(), 8000);
    } catch (err) {
      console.warn('[notification-service] Could not show browser notification:', err);
    }
  }
}

/* ===== Realtime Polling Service ===== */

export interface NotificationCallbacks {
  onNewPendingApproval?: (report: { id: string; reportNumber: string; appraiserName: string; beneficiaryName: string }) => void;
  onNewNotification?: (notification: { id: string; title: string; message: string; type: string; priority: string }) => void;
  onReportsChanged?: () => void;
}

let pollingIntervalId: ReturnType<typeof setInterval> | null = null;
let lastKnownPendingCount = 0;
let lastKnownNotificationCount = 0;
let lastPollTimestamp = new Date().toISOString();
let callbacks: NotificationCallbacks = {};
let currentUserRole: EmployeeRole | null = null;
let currentUserId: string | null = null;

export function startNotificationPolling(
  userRole: EmployeeRole,
  userId: string,
  cbs: NotificationCallbacks
) {
  stopNotificationPolling();

  currentUserRole = userRole;
  currentUserId = userId;
  callbacks = cbs;

  // Request browser notification permission on start
  requestNotificationPermission();

  // Initial count fetch
  fetchInitialCounts();

  // Poll every 5 seconds for changes
  pollingIntervalId = setInterval(pollForChanges, 5000);

  console.log('[notification-service] Started polling for user:', userId, 'role:', userRole);
}

export function stopNotificationPolling() {
  if (pollingIntervalId) {
    clearInterval(pollingIntervalId);
    pollingIntervalId = null;
  }
  console.log('[notification-service] Stopped polling');
}

async function fetchInitialCounts() {
  try {
    // Get current pending approvals count
    const { count: pendingCount, error: err1 } = await db
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending_approval');

    if (!err1 && pendingCount !== null) {
      lastKnownPendingCount = pendingCount;
    }

    // Get unread notifications count
    const { count: notifCount, error: err2 } = await db
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false);

    if (!err2 && notifCount !== null) {
      lastKnownNotificationCount = notifCount;
    }

    lastPollTimestamp = new Date().toISOString();
  } catch (err) {
    console.error('[notification-service] Initial count fetch error:', err);
  }
}

async function pollForChanges() {
  try {
    // Check for new pending approval reports
    const { count: currentPending, error: err1 } = await db
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending_approval');

    if (!err1 && currentPending !== null) {
      if (currentPending > lastKnownPendingCount) {
        // New reports arrived! Notify reviewers/admins
        if (currentUserRole === 'admin' || currentUserRole === 'reviewer') {
          // Fetch the new report details
          const { data: newReports } = await db
            .from('reports')
            .select('id, report_number, appraiser_name, beneficiary_name, created_at')
            .eq('status', 'pending_approval')
            .gt('created_at', lastPollTimestamp)
            .order('created_at', { ascending: false });

          if (newReports && newReports.length > 0) {
            for (const report of newReports) {
              const r = report as Record<string, unknown>;

              // Browser push notification
              showBrowserNotification('تقرير جديد بانتظار الاعتماد', {
                body: `تقرير ${r.report_number || ''} من ${r.appraiser_name || ''} - المستفيد: ${r.beneficiary_name || ''}`,
                tag: `approval-${r.id}`,
                data: { path: '/approvals' },
              });

              // Play sound
              playNotificationSound();

              // Callback
              if (callbacks.onNewPendingApproval) {
                callbacks.onNewPendingApproval({
                  id: r.id as string,
                  reportNumber: (r.report_number as string) || '',
                  appraiserName: (r.appraiser_name as string) || '',
                  beneficiaryName: (r.beneficiary_name as string) || '',
                });
              }
            }
          } else {
            // Reports count increased but we can't find new ones by timestamp - still notify
            playNotificationSound();
          }
        }

        // Notify all about reports change
        if (callbacks.onReportsChanged) {
          callbacks.onReportsChanged();
        }
      }
      lastKnownPendingCount = currentPending;
    }

    // Check for new unread notifications
    const { count: currentNotifCount, error: err2 } = await db
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false);

    if (!err2 && currentNotifCount !== null) {
      if (currentNotifCount > lastKnownNotificationCount) {
        // New notifications exist - fetch them
        const { data: newNotifs } = await db
          .from('notifications')
          .select('id, title, message, type, priority, created_at')
          .eq('is_read', false)
          .gt('created_at', lastPollTimestamp)
          .order('created_at', { ascending: false });

        if (newNotifs && newNotifs.length > 0) {
          for (const notif of newNotifs) {
            const n = notif as Record<string, unknown>;

            if (callbacks.onNewNotification) {
              callbacks.onNewNotification({
                id: n.id as string,
                title: (n.title as string) || '',
                message: (n.message as string) || '',
                type: (n.type as string) || 'system',
                priority: (n.priority as string) || 'medium',
              });
            }
          }
        }
      }
      lastKnownNotificationCount = currentNotifCount;
    }

    lastPollTimestamp = new Date().toISOString();
  } catch (err) {
    console.error('[notification-service] Poll error:', err);
  }
}

/* ===== Manual trigger for testing ===== */

export function testNotification() {
  playNotificationSound();
  showBrowserNotification('اختبار الإشعارات', {
    body: 'هذا إشعار تجريبي من نظام التثمين العقاري',
    tag: 'test',
  });
}
