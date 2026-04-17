'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { Notification, Employee } from '@/types';
import { store, initializeStore } from '@/lib/store';
import { checkAndAutoArchive } from '@/lib/auto-archiver';
import { useTheme } from '@/hooks/useTheme';
import {
  startNotificationPolling,
  stopNotificationPolling,
  requestNotificationPermission,
  showBrowserNotification,
  playNotificationSound,
} from '@/lib/notification-service';
import { ErrorBoundary } from '@/components/ErrorBoundary';

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
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  // Track previous unread count to detect new notifications
  const prevUnreadRef = useRef(0);

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
    initializeStore().then(() => {
      const loggedIn = store.isLoggedIn();
      setIsLoggedIn(loggedIn);
      if (loggedIn) {
        const user = store.getCurrentUser();
        setCurrentUser(user || null);

        // Start notification polling for logged-in users
        if (user) {
          startNotificationPolling(user.role, user.id, {
            onNewPendingApproval: (report) => {
              // Show in-app toast
              setToast({
                message: `تقرير جديد بانتظار الاعتماد: ${report.reportNumber}`,
                type: 'info',
              });
              setTimeout(() => setToast(null), 5000);
            },
            onNewNotification: () => {
              // Refresh notification count
              setUnreadNotifications(store.unreadCount());
            },
            onReportsChanged: () => {
              // Dispatch custom event so other components can refresh
              window.dispatchEvent(new CustomEvent('reports-updated'));
            },
          });

          // Request browser notification permission
          requestNotificationPermission();
        }
      }
      setUnreadNotifications(store.unreadCount());
      prevUnreadRef.current = store.unreadCount();
      setMounted(true);
      setIsLoading(false);

      if (loggedIn) {
        const archivedCount = checkAndAutoArchive();
        if (archivedCount > 0) {
          setTimeout(() => {
            setToast({ message: `تمت أرشفة ${archivedCount} تقرير تلقائياً (معتمدة منذ أكثر من 7 أيام)`, type: 'info' });
            setTimeout(() => setToast(null), 5000);
          }, 500);
        }
      }
    }).catch((err) => {
      console.error('Failed to initialize store:', err);
      setInitError(err instanceof Error ? err.message : 'حدث خطأ أثناء تحميل البيانات');
      setMounted(true);
      setIsLoading(false);
    });

    return () => {
      mq.removeEventListener('change', handleResize);
      stopNotificationPolling();
    };
  }, []);

  const refreshNotifications = useCallback(() => {
    setUnreadNotifications(store.unreadCount());
  }, []);

  const notify = useCallback((notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => {
    store.addNotification(notification);
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

    // Dispatch event for real-time updates
    window.dispatchEvent(new CustomEvent('reports-updated'));
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const result = await store.login(username, password);
    if (result.success) {
      document.cookie = 'ireo_session=1; path=/; max-age=86400; SameSite=Strict';
      setIsLoggedIn(true);
      const user = store.getCurrentUser();
      setCurrentUser(user || null);

      // Start notification polling after login
      if (user) {
        startNotificationPolling(user.role, user.id, {
          onNewPendingApproval: (report) => {
            setToast({
              message: `تقرير جديد بانتظار الاعتماد: ${report.reportNumber}`,
              type: 'info',
            });
            setTimeout(() => setToast(null), 5000);
          },
          onNewNotification: () => {
            setUnreadNotifications(store.unreadCount());
          },
          onReportsChanged: () => {
            window.dispatchEvent(new CustomEvent('reports-updated'));
          },
        });

        requestNotificationPermission();
      }
    }
    return result;
  }, []);

  const logout = useCallback(async () => {
    stopNotificationPolling();
    document.cookie = 'ireo_session=; path=/; max-age=0';
    await store.logout();
    setIsLoggedIn(false);
    setCurrentUser(null);
    // Redirect to home (login page) and clear any nested route
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
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
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
      sidebarOpen, setSidebarOpen, isMobile, searchOpen, setSearchOpen,
      notify, isLoading,
    }}>
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
    </AppContext.Provider>
  );
}
