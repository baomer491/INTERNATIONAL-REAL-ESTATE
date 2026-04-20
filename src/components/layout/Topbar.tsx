'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from './AppContext';
import { useTheme } from '@/hooks/useTheme';
import { Bell, Menu, Search, User } from 'lucide-react';
import { EMPLOYEE_ROLES } from '@/types';
import CommandPalette from '@/components/search/CommandPalette';

export default function Topbar() {
  const { unreadNotifications, sidebarOpen, setSidebarOpen, toast, isMobile, currentUser, searchOpen, setSearchOpen } = useApp();
  const { isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  const sidebarVisible = sidebarOpen && !isMobile;

  const roleLabel = currentUser
    ? EMPLOYEE_ROLES.find(r => r.value === currentUser.role)?.label || ''
    : '';

  useEffect(() => {
    if (!searchOpen) {
      setSearchQuery('');
    }
  }, [searchOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(!searchOpen);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen, setSearchOpen]);

  return (
    <>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
          zIndex: 200, padding: '12px 24px', borderRadius: 10,
          background: toast.type === 'success' ? 'var(--color-success)' :
            toast.type === 'error' ? 'var(--color-danger)' :
            toast.type === 'warning' ? 'var(--color-warning)' : 'var(--color-info)',
          color: 'white', fontWeight: 600, fontSize: 14,
          boxShadow: 'var(--shadow-lg)', animation: 'slideInUp 0.3s ease-out',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          {toast.type === 'success' && '✓ '}
          {toast.type === 'error' && '✕ '}
          {toast.type === 'warning' && '⚠ '}
          {toast.message}
        </div>
      )}

      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: sidebarVisible ? 'var(--sidebar-width)' : 0,
        height: 'var(--topbar-height)',
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        zIndex: 30,
        gap: 8,
        transition: 'right 0.3s ease',
      }}>
        {/* Menu toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: 8, borderRadius: 8, color: 'var(--color-text-secondary)',
            display: 'flex', alignItems: 'center',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-surface-alt)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <Menu size={22} />
        </button>

        {/* Search */}
        <button
          onClick={() => setSearchOpen(true)}
          style={{
            flex: 1, maxWidth: 480, position: 'relative',
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 14px', borderRadius: 8,
            background: 'var(--color-surface-alt)',
            border: '1.5px solid var(--color-border)',
            cursor: 'pointer', fontFamily: 'inherit',
            textAlign: 'right', direction: 'rtl',
            transition: 'border-color 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-primary)'}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
        >
          <Search size={18} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
          <span style={{ fontSize: 14, color: 'var(--color-text-muted)', flex: 1 }}>
            {searchQuery || 'ابحث في التقارير، المستفيدين، الموظفين...'}
          </span>
          {!isMobile && (
          <kbd style={{
            fontSize: 10, color: 'var(--color-text-muted)', background: 'var(--color-surface-alt)',
            padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace',
            border: '1px solid var(--color-border)',
          }}>⌘K</kbd>
          )}
        </button>

        {/* Right section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Notifications */}
          <Link href="/notifications" style={{
            position: 'relative', padding: 8, borderRadius: 8,
            color: 'var(--color-text-secondary)',
            display: 'flex', alignItems: 'center',
            textDecoration: 'none',
          }}>
            <Bell size={20} />
            {unreadNotifications > 0 && (
              <span style={{
                position: 'absolute', top: 2, left: 2,
                background: 'var(--color-danger)', color: 'white',
                fontSize: 10, fontWeight: 700, width: 18, height: 18,
                borderRadius: '50%', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}>
                {unreadNotifications}
              </span>
            )}
          </Link>

          {/* User */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: isMobile ? '4px 6px' : '6px 12px', borderRadius: 8,
            border: '1px solid var(--color-border)',
          }}>
            <div style={{
              width: isMobile ? 28 : 32, height: isMobile ? 28 : 32, borderRadius: '50%',
              background: 'var(--color-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white',
            }}>
              <User size={isMobile ? 14 : 16} />
            </div>
            {!isMobile && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>
                {currentUser?.fullName || 'مستخدم'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                {roleLabel}
              </div>
            </div>
            )}
          </div>
        </div>
      </header>

      {/* Command Palette */}
      <CommandPalette isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
