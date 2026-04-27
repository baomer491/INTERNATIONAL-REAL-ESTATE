'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { Notification, Employee } from '@/types';
import { store, initializeStore } from '@/lib/store';
import { checkAndAutoArchive } from '@/lib/auto-archiver';
import { useTheme } from '@/hooks/useTheme';
import {
  startRealtimeEngine,
  stopRealtimeEngine,
  requestNotificationPermission,
  showBrowserNotification,
  playNotificationSound,
  broadcastChange,
} from '@/lib/realtime-engine';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { fetchCsrfToken, clearCsrfToken } from '@/lib/csrf-client';
import { loadSeedMarketData } from '@/lib/market-price-lookup';

interface AppContextType {
  isLoggedIn: boolean;
  currentUser: Employee | null;
  login: (username: string, password: string) => Promise<{ success: boolean; reason?: string }>;
  logout: () => Promise<void>;
  hasPermission: (permissionId: string) => boolean;
  unreadNotifications: number;
  refreshNotifications: () => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  toast: { message: string; type: string } | null;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  isMobile: boolean;
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  notify: (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => void;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | null>(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

const MOBILE_BREAKPOINT = 1024;

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { isDark } = useTheme();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [toast, setToast] = useState<{ message: string; type: string } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  // Track previous unread count to detect new notifications
  const prevUnreadRef = useRef(0);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const engineStartedRef = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
    const handleResize = (e: MediaQueryListEvent | MediaQueryList) => {
      const mobile = e.matches;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    handleResize(mq);
    mq.addEventListener('change', handleResize);

    // Initialize store from Supabase, then set auth state
    const initTimeout = setTimeout(() => {
      console.warn('[AppContext] initializeStore timeout after 15s — forcing error state');
      setInitError('انتهت مهلة الاتصال بالخادم. تحقق من اتصال الإنترنت وأعد المحاولة.');
      setMounted(true);
      setIsLoading(false);
    }, 15000);

    initializeStore().then(() => {
      // Load market price seed data in background
      loadSeedMarketData();
      clearTimeout(initTimeout);
      let loggedIn = store.isLoggedIn();

      // The middleware already validates the httpOnly session cookie server-side.
      // If we reached this code, the cookie is present and valid.
      // No need for a redundant client-side cookie check.

      setIsLoggedIn(loggedIn);
      if (loggedIn) {
        const user = store.getCurrentUser();
        setCurrentUser(user || null);

        // Fetch CSRF token for already-logged-in sessions
        fetchCsrfToken().catch(err => console.error('[AppContext] CSRF token fetch failed:', err));

        // Start the FULL realtime engine (replaces old notification-service)
        if (user && !engineStartedRef.current) {
          engineStartedRef.current = true;
          startRealtimeEngine(user.id, user.fullName, user.role, {
            onNewPendingApproval: (report) => {
              // Show in-app toast for new pending approvals
              setToast({
                message: `تقرير جديد بانتظار الاعتماد: ${report.reportNumber}`,
                type: 'info',
              });
              if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
              toastTimeoutRef.current = setTimeout(() => setToast(null), 5000);
            },
            onNewNotification: (notif) => {
              // Only show toast if notification is targeted to current user or broadcast
              const user2 = store.getCurrentUser();
              if (!notif.targetEmployeeId || notif.targetEmployeeId === user2?.id) {
                // Refresh unread count
                const newUnread = store.unreadCount();
                setUnreadNotifications(newUnread);

                // Play sound for high priority
                if (notif.priority === 'high') {
                  playNotificationSound();
                }

                // Show browser notification for approval/task types
                if (notif.type === 'approval' || notif.type === 'task') {
                  showBrowserNotification(notif.title, {
                    body: notif.message,
                    tag: `notif-${notif.id}`,
                    data: { path: notif.type === 'approval' ? '/approvals' : '/tasks' },
                  });
                }
              }
            },
            onEntityChanged: (event) => {
              // Update unread count when notifications change
              if (event.type === 'notifications') {
                setUnreadNotifications(store.unreadCount());
              }
            },
            onPresenceChange: (users) => {
              // Dispatch presence event for useActiveUsers hook
              window.dispatchEvent(new CustomEvent('presence-changed', { detail: users }));
            },
          });

          requestNotificationPermission();
        }
      }
      setUnreadNotifications(store.unreadCount());
      prevUnreadRef.current = store.unreadCount();
      setMounted(true);
      setIsLoading(false);

      if (loggedIn) {
        checkAndAutoArchive().then((archivedCount) => {
          if (archivedCount > 0) {
            setTimeout(() => {
              setToast({ message: `تمت أرشفة ${archivedCount} تقرير تلقائياً (معتمدة منذ أكثر من 7 أيام)`, type: 'info' });
              if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
              toastTimeoutRef.current = setTimeout(() => setToast(null), 5000);
            }, 500);
          }
        });
      }
    }).catch((err) => {
      clearTimeout(initTimeout);
      console.error('Failed to initialize store:', err);
      setInitError(err instanceof Error ? err.message : 'حدث خطأ أثناء تحميل البيانات');
      setMounted(true);
      setIsLoading(false);
    });

    return () => {
      mq.removeEventListener('change', handleResize);
      engineStartedRef.current = false;
      stopRealtimeEngine();
    };
  }, []);

  const refreshNotifications = useCallback(() => {
    setUnreadNotifications(store.unreadCount());
  }, []);

  const notify = useCallback(async (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => {
    try {
      await store.addNotification(notification);
    } catch (err) {
      console.error('[AppContext] notify: addNotification failed:', err);
    }
    const newUnread = store.unreadCount();
    setUnreadNotifications(newUnread);

    // Play sound for high priority notifications
    if (notification.priority === 'high') {
      playNotificationSound();
    }

    // Show browser push notification for approval-related notifications
    if (notification.type === 'approval') {
      showBrowserNotification(notification.title, {
        body: notification.message,
        tag: `notif-${Date.now()}`,
        data: { path: '/approvals' },
      });
    }

    // Broadcast to other tabs and dispatch local event
    broadcastChange('notifications');
    window.dispatchEvent(new CustomEvent('notifications-updated'));
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const result = await store.login(username, password);
    if (result.success) {
      // Server already sets the httpOnly session cookie — no client-side cookie needed
      setIsLoggedIn(true);
      const user = store.getCurrentUser();
      setCurrentUser(user || null);

      // Fetch CSRF token for subsequent API calls
      fetchCsrfToken().catch(err => console.error('[AppContext] CSRF token fetch failed:', err));

      // Start realtime engine after login
      if (user) {
        engineStartedRef.current = true;
        startRealtimeEngine(user.id, user.fullName, user.role, {
          onNewPendingApproval: (report) => {
            setToast({
              message: `تقرير جديد بانتظار الاعتماد: ${report.reportNumber}`,
              type: 'info',
            });
            if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
            toastTimeoutRef.current = setTimeout(() => setToast(null), 5000);
          },
          onNewNotification: (notif) => {
            const newUnread = store.unreadCount();
            setUnreadNotifications(newUnread);
            if (notif.priority === 'high') playNotificationSound();
          },
          onEntityChanged: (event) => {
            if (event.type === 'notifications') {
              setUnreadNotifications(store.unreadCount());
            }
          },
          onPresenceChange: (users) => {
            window.dispatchEvent(new CustomEvent('presence-changed', { detail: users }));
          },
        });

        requestNotificationPermission();
      }
    }
    return result;
  }, []);

  const logout = useCallback(async () => {
    stopRealtimeEngine();
    clearCsrfToken();
    // Clear the httpOnly session cookie via server-side API
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('[AppContext] logout API call failed:', err);
    }
    await store.logout();
    setIsLoggedIn(false);
    setCurrentUser(null);
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  }, []);

  const hasPermission = useCallback((permissionId: string) => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    return currentUser.permissions.includes(permissionId);
  }, [currentUser]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast({ message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
      toastTimeoutRef.current = null;
    }, 3000);
  }, []);

  if (!mounted || isLoading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', direction: 'rtl', fontFamily: 'Noto Kufi Arabic'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 48, height: 48, border: '4px solid var(--color-border)',
            borderTopColor: 'var(--color-primary)', borderRadius: '50%',
            animation: 'spin 1s linear infinite', margin: '0 auto 16px'
          }} />
          <p style={{ color: 'var(--color-text-secondary)' }}>جاري التحميل...</p>
        </div>
        <style dangerouslySetInnerHTML={{
          __html: `@keyframes spin { to { transform: rotate(360deg); } }`
        }} />
      </div>
    );
  }

  // Show error state when initialization fails
  if (initError) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', direction: 'rtl', fontFamily: 'Noto Kufi Arabic'
      }}>
        <div style={{
          background: 'var(--color-surface, #fff)',
          borderRadius: 12, padding: 32, textAlign: 'center',
          border: '1px solid var(--color-border, #e5e7eb)',
          maxWidth: 480, width: '100%',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>
            خطأ في تحميل البيانات
          </h2>
          <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 16 }}>
            {initError}
          </p>
          <button onClick={() => window.location.reload()} style={{
            padding: '10px 24px', background: 'var(--color-primary)', color: 'white',
            border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}>
            إعادة المحاولة
          </button>
        </div>
        <style dangerouslySetInnerHTML={{
          __html: `@keyframes spin { to { transform: rotate(360deg); } }`
        }} />
      </div>
    );
  }

  return (
    <AppContext.Provider value={{
      isLoggedIn, currentUser, login, logout, hasPermission,
      unreadNotifications, refreshNotifications, showToast, toast,
      sidebarOpen, setSidebarOpen, sidebarCollapsed, setSidebarCollapsed, isMobile, searchOpen, setSearchOpen,
      notify, isLoading,
    }}>
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
    </AppContext.Provider>
  );
}
