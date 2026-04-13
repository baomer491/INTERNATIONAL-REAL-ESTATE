'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Notification, Employee } from '@/types';
import { store, initializeStore } from '@/lib/store';
import { checkAndAutoArchive } from '@/lib/auto-archiver';
import { useTheme } from '@/hooks/useTheme';

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
      }
      setUnreadNotifications(store.unreadCount());
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
      setMounted(true);
      setIsLoading(false);
    });

    return () => mq.removeEventListener('change', handleResize);
  }, []);

  const refreshNotifications = useCallback(() => {
    setUnreadNotifications(store.unreadCount());
  }, []);

  const notify = useCallback((notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => {
    store.addNotification(notification);
    setUnreadNotifications(store.unreadCount());
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const result = await store.login(username, password);
    if (result.success) {
      setIsLoggedIn(true);
      const user = store.getCurrentUser();
      setCurrentUser(user || null);
    }
    return result;
  }, []);

  const logout = useCallback(async () => {
    await store.logout();
    setIsLoggedIn(false);
    setCurrentUser(null);
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

  return (
    <AppContext.Provider value={{
      isLoggedIn, currentUser, login, logout, hasPermission,
      unreadNotifications, refreshNotifications, showToast, toast,
      sidebarOpen, setSidebarOpen, isMobile, searchOpen, setSearchOpen,
      notify, isLoading,
    }}>
      {children}
    </AppContext.Provider>
  );
}
