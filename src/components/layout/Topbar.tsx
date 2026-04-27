'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from './AppContext';
import { useTheme } from '@/hooks/useTheme';
import { Bell, Menu, Search, User, PanelLeftClose, PanelLeft } from 'lucide-react';
import { EMPLOYEE_ROLES } from '@/types';
import CommandPalette from '@/components/search/CommandPalette';

export default function Topbar() {
  const { unreadNotifications, sidebarOpen, setSidebarOpen, toast, isMobile, currentUser, searchOpen, setSearchOpen, sidebarCollapsed, setSidebarCollapsed } = useApp();
  const { isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

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

  const handleMenuToggle = () => {
    if (isMobile) {
      setSidebarOpen(!sidebarOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  const MenuIcon = isMobile ? Menu : (sidebarCollapsed ? PanelLeft : PanelLeftClose);

  return (
    <>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
          zIndex: 200, padding: '12px 24px', borderRadius: 12,
          background: toast.type === 'success' ? 'linear-gradient(135deg, #10b981, #059669)' :
            toast.type === 'error' ? 'linear-gradient(135deg, #f43f5e, #e11d48)' :
            toast.type === 'warning' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #38bdf8, #0ea5e9)',
          color: 'white', fontWeight: 700, fontSize: 14,
          boxShadow: '0 12px 32px rgba(0,0,0,0.2)', animation: 'slideInUp 0.35s cubic-bezier(0.4,0,0.2,1)',
          display: 'flex', alignItems: 'center', gap: 10,
          border: '1px solid rgba(255,255,255,0.15)',
          backdropFilter: 'blur(8px)',
        }}>
          {toast.type === 'success' && (
            <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>✓</span>
          )}
          {toast.type === 'error' && (
            <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>✕</span>
          )}
          {toast.type === 'warning' && (
            <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>⚠</span>
          )}
          {toast.message}
        </div>
      )}

      {/* Mobile backdrop */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.35)',
            zIndex: 40,
            backdropFilter: 'blur(4px)',
            animation: 'fadeIn 0.2s ease',
          }}
        />
      )}

      <header
        className="app-shell__topbar"
        style={{
          background: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-border-light)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 var(--space-5)',
          gap: 'var(--space-4)',
          boxShadow: 'var(--shadow-xs)',
        }}
      >
        {/* Menu / collapse toggle */}
        <button
          onClick={handleMenuToggle}
          aria-label={isMobile ? 'فتح القائمة' : (sidebarCollapsed ? 'توسيع القائمة' : 'تصغير القائمة')}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: 8, borderRadius: 10, color: 'var(--color-text-secondary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s ease',
            width: 36, height: 36,
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--color-surface-alt)';
            e.currentTarget.style.color = 'var(--color-text)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--color-text-secondary)';
          }}
        >
          <MenuIcon size={20} />
        </button>

        {/* Search */}
        <button
          onClick={() => setSearchOpen(true)}
          style={{
            flex: 1, maxWidth: 480, position: 'relative',
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 16px', borderRadius: 12,
            background: 'var(--color-surface-alt)',
            border: '1.5px solid var(--color-border)',
            cursor: 'pointer', fontFamily: 'inherit',
            textAlign: 'right', direction: 'rtl',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-primary)';
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(15,29,51,0.06)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-border)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <Search size={16} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: 'var(--color-text-muted)', flex: 1, fontWeight: 500 }}>
            {searchQuery || 'ابحث في التقارير، المستفيدين، الموظفين...'}
          </span>
          {!isMobile && (
            <kbd style={{
              fontSize: 11, color: 'var(--color-text-muted)', background: 'var(--color-surface)',
              padding: '3px 7px', borderRadius: 6, fontFamily: 'monospace',
              border: '1px solid var(--color-border)', fontWeight: 600,
            }}>⌘K</kbd>
          )}
        </button>

        {/* Right section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {/* Notifications */}
          <Link href="/notifications" style={{
            position: 'relative', width: 36, height: 36, borderRadius: 10,
            color: 'var(--color-text-secondary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            textDecoration: 'none',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--color-surface-alt)';
            e.currentTarget.style.color = 'var(--color-text)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--color-text-secondary)';
          }}
          >
            <Bell size={18} />
            {unreadNotifications > 0 && (
              <span style={{
                position: 'absolute', top: 2, left: 2,
                background: 'linear-gradient(135deg, #f43f5e, #e11d48)',
                color: 'white',
                fontSize: 10, fontWeight: 800, minWidth: 16, height: 16,
                borderRadius: '50%', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                padding: '0 3px',
                boxShadow: '0 2px 6px rgba(244,63,94,0.4)',
                border: '2px solid var(--color-surface)',
              }}>
                {unreadNotifications}
              </span>
            )}
          </Link>

          {/* User */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: isMobile ? '3px 6px' : '4px 12px 4px 6px', borderRadius: 12,
            border: '1.5px solid var(--color-border)',
            background: 'var(--color-surface)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-primary)';
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(15,29,51,0.06)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-border)';
            e.currentTarget.style.boxShadow = 'none';
          }}
          >
            <div style={{
              width: isMobile ? 26 : 32, height: isMobile ? 26 : 32, borderRadius: 8,
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-light))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white',
              boxShadow: '0 2px 8px rgba(15,29,51,0.25)',
            }}>
              <User size={isMobile ? 13 : 15} />
            </div>
            {!isMobile && (
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.3 }}>
                  {currentUser?.fullName || 'مستخدم'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 500, lineHeight: 1.3 }}>
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
