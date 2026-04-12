'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from './AppContext';
import {
  LayoutDashboard, FileText, PlusCircle, CheckCircle2,
  Archive, Users, Building2, Bell, ListTodo, Settings,
  LogOut, ChevronRight, UserCog, BarChart3, TrendingUp
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  permission?: string;
}

export default function Sidebar() {
  const pathname = usePathname();
  const { logout, unreadNotifications, sidebarOpen, setSidebarOpen, isMobile, hasPermission } = useApp();

  const allNavItems: NavItem[] = [
    { href: '/dashboard', label: 'لوحة التحكم', icon: <LayoutDashboard size={20} /> },
    { href: '/reports/new', label: 'إنشاء تقرير جديد', icon: <PlusCircle size={20} />, permission: 'reports_create' },
    { href: '/reports', label: 'التقارير', icon: <FileText size={20} />, permission: 'reports_view' },
    { href: '/approvals', label: 'الاعتمادات', icon: <CheckCircle2 size={20} />, permission: 'approvals_view' },
    { href: '/archive', label: 'الأرشيف', icon: <Archive size={20} />, permission: 'archive_view' },
    { href: '/beneficiaries', label: 'المستفيدين', icon: <Users size={20} />, permission: 'beneficiaries_view' },
    { href: '/banks', label: 'البنوك', icon: <Building2 size={20} />, permission: 'banks_manage' },
    { href: '/notifications', label: 'التنبيهات', icon: <Bell size={20} />, badge: unreadNotifications, permission: 'notifications_view' },
    { href: '/tasks', label: 'المهام', icon: <ListTodo size={20} /> },
    { href: '/settings', label: 'الإعدادات', icon: <Settings size={20} /> },
    { href: '/employees', label: 'الموظفين', icon: <UserCog size={20} />, permission: 'employees_view' },
    { href: '/employees/analytics', label: 'تحليل الأداء', icon: <BarChart3 size={20} />, permission: 'employees_view' },
    { href: '/market-prices', label: 'أسعار السوق', icon: <TrendingUp size={20} /> },
  ];

  const navItems = useMemo(() => {
    return allNavItems.filter(item => {
      if (!item.permission) return true;
      return hasPermission(item.permission);
    });
  }, [allNavItems, hasPermission]);

  const closeSidebar = () => {
    if (isMobile) setSidebarOpen(false);
  };

  return (
    <>
      {/* Backdrop overlay — only on mobile when sidebar is open */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 40,
            backdropFilter: 'blur(2px)',
          }}
        />
      )}

      <aside
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 'var(--sidebar-width)',
          background: 'var(--color-primary)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 50,
          transition: 'transform 0.3s ease',
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(100%)',
          boxShadow: isMobile && sidebarOpen ? '-4px 0 24px rgba(0,0,0,0.3)' : 'none',
        }}
      >
        {/* Logo */}
        <div style={{
          padding: '24px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
        }}>
          <img
            src="/IRE-logopdf-trans.png"
            alt="مكتب العقارات الدولية"
            style={{
              width: 85, height: 85, borderRadius: 10,
              objectFit: 'contain',
              filter: 'brightness(0) invert(1)',
            }}
          />
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: 'white', fontWeight: 800, fontSize: 15, lineHeight: 1.4 }}>
              نظام التثمين العقاري
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
          {navItems.map((item) => {
            const exactPaths = ['/dashboard', '/reports/new', '/reports', '/approvals', '/archive', '/beneficiaries', '/banks', '/notifications', '/tasks', '/settings', '/employees', '/employees/analytics', '/market-prices'];
            const isActive = pathname === item.href ||
              (pathname !== item.href && !exactPaths.includes(pathname) && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeSidebar}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 14px', marginBottom: 4, borderRadius: 8,
                  color: isActive ? 'white' : 'rgba(255,255,255,0.7)',
                  background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
                  textDecoration: 'none', fontSize: 14, fontWeight: isActive ? 700 : 500,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.color = 'white';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                  }
                }}
              >
                {item.icon}
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge ? (
                  <span style={{
                    background: 'var(--color-danger)', color: 'white',
                    fontSize: 11, fontWeight: 700, padding: '2px 8px',
                    borderRadius: 12, minWidth: 20, textAlign: 'center',
                  }}>
                    {item.badge}
                  </span>
                ) : null}
                {isActive && <ChevronRight size={16} style={{ opacity: 0.5 }} />}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <button
            onClick={logout}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              width: '100%', padding: '10px 14px', borderRadius: 8,
              color: 'rgba(255,255,255,0.7)', background: 'transparent',
              border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500,
              fontFamily: 'inherit',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
            }}
          >
            <LogOut size={20} />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>
    </>
  );
}
