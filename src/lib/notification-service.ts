'use client';

import { db } from './supabase';
import type { EmployeeRole } from '@/types';
import { RealtimeChannel } from '@supabase/supabase-js';

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

/* ===== Realtime Service (Supabase Realtime + Polling fallback) ===== */

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
let realtimeChannel: RealtimeChannel | null = null;
let realtimeActive = false;
let retryCount = 0;
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY = 2000; // 2s, 4s, 6s

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

  // Try to set up Supabase Realtime subscription
  setupRealtimeSubscriptions();

  // Poll as fallback — use longer interval when realtime is active
  const pollInterval = realtimeActive ? 30000 : 5000;
  pollingIntervalId = setInterval(pollForChanges, pollInterval);

  console.log('[notification-service] Started polling for user:', userId, 'role:', userRole, '(realtime:', realtimeActive, ')');
}

function setupRealtimeSubscriptions() {
  try {
    realtimeChannel = db
      .channel('notification-service-changes')
      // Listen for report status changes (INSERT and UPDATE on status column)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'reports', filter: 'status=eq.pending_approval' },
        (payload) => {
          console.log('[notification-service] Realtime: new report with pending_approval', payload);
          handleRealtimeReportChange(payload.new as Record<string, unknown>);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'reports' },
        (payload) => {
          const newRec = payload.new as Record<string, unknown>;
          const oldRec = payload.old as Record<string, unknown>;
          const newStatus = newRec.status as string;
          const oldStatus = oldRec.status as string;

          // React to any status change (approved, rejected, pending_approval, etc.)
          if (newStatus !== oldStatus) {
            console.log('[notification-service] Realtime: report status changed', oldStatus, '->', newStatus);

            // Send browser notification to reviewers/admins about new pending approvals
            if (newStatus === 'pending_approval' && (currentUserRole === 'admin' || currentUserRole === 'reviewer')) {
              handleRealtimeReportChange(newRec);
            } else {
              // For other status changes (approved, rejected, etc.), just notify reports changed
              if (callbacks.onReportsChanged) {
                callbacks.onReportsChanged();
              }
            }
          }
        }
      )
      // Listen for new notifications
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          console.log('[notification-service] Realtime: new notification', payload);
          const n = payload.new as Record<string, unknown>;
          if (callbacks.onNewNotification) {
            callbacks.onNewNotification({
              id: (n.id as string) || '',
              title: (n.title as string) || '',
              message: (n.message as string) || '',
              type: (n.type as string) || 'system',
              priority: (n.priority as string) || 'medium',
            });
          }
        }
      )
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          realtimeActive = true;
          retryCount = 0; // Reset on success
          console.log('[notification-service] Realtime subscription active');
          // Switch to longer polling interval since realtime is working
          if (pollingIntervalId) {
            clearInterval(pollingIntervalId);
            pollingIntervalId = setInterval(pollForChanges, 30000);
          }
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          realtimeActive = false;
          console.warn('[notification-service] Realtime subscription failed, attempt', retryCount + 1, 'of', MAX_RETRIES);
          
          if (retryCount < MAX_RETRIES) {
            const delay = RETRY_BASE_DELAY * (retryCount + 1);
            retryCount++;
            console.log('[notification-service] Retrying realtime connection in', delay, 'ms');
            setTimeout(() => {
              // Only retry if we haven't been stopped
              if (pollingIntervalId && currentUserRole) {
                setupRealtimeSubscriptions();
              }
            }, delay);
          } else {
            console.warn('[notification-service] Max retries reached, falling back to fast polling');
            // Switch to faster polling
            if (pollingIntervalId) {
              clearInterval(pollingIntervalId);
              pollingIntervalId = setInterval(pollForChanges, 5000);
            }
          }
        }
      });
  } catch (err) {
    console.warn('[notification-service] Could not setup realtime subscriptions, using polling only:', err);
    realtimeActive = false;
  }
}

function handleRealtimeReportChange(reportRow: Record<string, unknown>) {
  // Only notify reviewers/admins about pending approvals
  if (currentUserRole === 'admin' || currentUserRole === 'reviewer') {
    const reportNumber = (reportRow.report_number as string) || '';
    const appraiserName = (reportRow.appraiser_name as string) || '';
    const beneficiaryName = (reportRow.beneficiary_name as string) || '';
    const reportId = (reportRow.id as string) || '';

    showBrowserNotification('تقرير جديد بانتظار الاعتماد', {
      body: `تقرير ${reportNumber} من ${appraiserName} - المستفيد: ${beneficiaryName}`,
      tag: `approval-${reportId}`,
      data: { path: '/approvals' },
    });

    playNotificationSound();

    if (callbacks.onNewPendingApproval) {
      callbacks.onNewPendingApproval({
        id: reportId,
        reportNumber,
        appraiserName,
        beneficiaryName,
      });
    }
  }

  if (callbacks.onReportsChanged) {
    callbacks.onReportsChanged();
  }
}

export function stopNotificationPolling() {
  if (pollingIntervalId) {
    clearInterval(pollingIntervalId);
    pollingIntervalId = null;
  }
  if (realtimeChannel) {
    try {
      db.removeChannel(realtimeChannel);
    } catch (err) {
      console.warn('[notification-service] Error removing realtime channel:', err);
    }
    realtimeChannel = null;
  }
  realtimeActive = false;
  retryCount = 0;
  console.log('[notification-service] Stopped polling and realtime');
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
      if (currentPending !== lastKnownPendingCount) {
        // Pending count changed (increased OR decreased) — notify accordingly
        if (currentPending > lastKnownPendingCount) {
          // New reports arrived — only notify reviewers/admins about new pending approvals
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

                // Skip if realtime already handled this
                if (realtimeActive) continue;

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
              if (!realtimeActive) playNotificationSound();
            }
          }
        }

        // Any change in pending count means reports were updated — notify all users
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
        // Only fetch and notify via polling if realtime didn't handle it
        if (!realtimeActive) {
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
