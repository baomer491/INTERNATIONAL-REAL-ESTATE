'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from './AppContext';
import {
  LayoutDashboard, FileText, PlusCircle, CheckCircle2,
  Archive, Users, Building2, Bell, ListTodo, Settings, TrendingUp,
  LogOut, ChevronRight, UserCog, BarChart3,
  LayoutTemplate, PanelLeftClose, PanelLeft
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
  const { logout, unreadNotifications, sidebarOpen, setSidebarOpen, isMobile, hasPermission, sidebarCollapsed, setSidebarCollapsed } = useApp();

  const allNavItems: NavItem[] = useMemo(() => [
    { href: '/dashboard', label: 'لوحة التحكم', icon: <LayoutDashboard size={20} /> },
    { href: '/reports/new', label: 'إنشاء تقرير جديد', icon: <PlusCircle size={20} />, permission: 'reports_create' },
    { href: '/reports', label: 'التقارير', icon: <FileText size={20} />, permission: 'reports_view' },
    { href: '/approvals', label: 'الاعتمادات', icon: <CheckCircle2 size={20} />, permission: 'approvals_view' },
    { href: '/archive', label: 'الأرشيف', icon: <Archive size={20} />, permission: 'archive_view' },
    { href: '/beneficiaries', label: 'المستفيدين', icon: <Users size={20} />, permission: 'beneficiaries_view' },
    { href: '/banks', label: 'البنوك', icon: <Building2 size={20} />, permission: 'banks_manage' },
    { href: '/notifications', label: 'التنبيهات', icon: <Bell size={20} />, badge: unreadNotifications, permission: 'notifications_view' },
    { href: '/tasks', label: 'المهام', icon: <ListTodo size={20} /> },
    { href: '/employees', label: 'الموظفين', icon: <UserCog size={20} />, permission: 'employees_view' },
    { href: '/employees/analytics', label: 'تحليل الأداء', icon: <BarChart3 size={20} />, permission: 'employees_view' },
    { href: '/market-prices', label: 'أسعار السوق', icon: <TrendingUp size={20} /> },
    { href: '/settings', label: 'الإعدادات', icon: <Settings size={20} /> },
  ], [unreadNotifications]);

  const navItems = useMemo(() => {
    return allNavItems.filter(item => {
      if (!item.permission) return true;
      return hasPermission(item.permission);
    });
  }, [allNavItems, hasPermission]);

  const closeSidebar = () => {
    if (isMobile) setSidebarOpen(false);
  };

  const toggleCollapse = () => {
    if (isMobile) {
      setSidebarOpen(!sidebarOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  const exactPaths = ['/dashboard', '/reports/new', '/reports', '/reports/preliminary', '/approvals', '/archive', '/beneficiaries', '/banks', '/notifications', '/tasks', '/market-prices', '/settings', '/employees', '/employees/analytics'];

  return (
    <aside
      className={sidebarCollapsed && !isMobile ? 'sidebar-collapsed' : ''}
      style={{
        height: '100%',
        background: 'linear-gradient(180deg, #0f1d33 0%, #152a45 100%)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        ...(isMobile && sidebarOpen ? {
          boxShadow: '-8px 0 32px rgba(0,0,0,0.35)',
        } : {}),
      }}
      role="navigation"
      aria-label="القائمة الرئيسية"
    >
      {/* Logo area */}
      <div
        className="sidebar-logo-area"
        style={{
          padding: 'var(--space-5) var(--space-4)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--space-3)',
          flexShrink: 0,
        }}
      >
        <div style={{
          width: 56,
          height: 56,
          borderRadius: 14,
          background: 'rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          flexShrink: 0,
        }}>
          <img
            src="/IRE-logopdf-trans.png"
            alt="مكتب العقارات الدولية"
            style={{
              width: 40,
              height: 40,
              borderRadius: 6,
              objectFit: 'contain',
              filter: 'brightness(0) invert(1)',
            }}
          />
        </div>
        <div className="sidebar-logo-text" style={{ textAlign: 'center' }}>
          <div style={{ color: 'white', fontWeight: 800, fontSize: 14, lineHeight: 1.4 }}>
            نظام التثمين العقاري
          </div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, marginTop: 2, fontWeight: 500, letterSpacing: '0.04em' }}>
            IRE VALUATION
          </div>
        </div>
      </div>

      {/* Collapse toggle — desktop only */}
      {!isMobile && (
        <div style={{ padding: 'var(--space-2) var(--space-3)', flexShrink: 0 }}>
          <button
            onClick={toggleCollapse}
            aria-label={sidebarCollapsed ? 'توسيع القائمة' : 'تصغير القائمة'}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
              gap: 'var(--space-3)',
              width: '100%',
              padding: sidebarCollapsed ? 'var(--space-2)' : 'var(--space-2) var(--space-3)',
              borderRadius: 'var(--radius-sm)',
              color: 'rgba(255,255,255,0.45)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 500,
              fontFamily: 'inherit',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
              e.currentTarget.style.color = 'rgba(255,255,255,0.8)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'rgba(255,255,255,0.45)';
            }}
          >
            {sidebarCollapsed ? <PanelLeft size={18} /> : (
              <>
                <PanelLeftClose size={18} />
                <span className="sidebar-nav-label">تصغير القائمة</span>
              </>
            )}
            {sidebarCollapsed && <span className="sidebar-tooltip">توسيع القائمة</span>}
          </button>
        </div>
      )}

      {/* Nav items */}
      <nav style={{ flex: 1, padding: 'var(--space-2) var(--space-3)', overflowY: 'auto', overflowX: 'hidden' }}>
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (pathname !== item.href && !exactPaths.includes(pathname) && pathname.startsWith(item.href));
          return (
            <React.Fragment key={item.href}>
              <Link
                href={item.href}
                onClick={closeSidebar}
                className="sidebar-nav-item"
                aria-current={isActive ? 'page' : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  padding: sidebarCollapsed && !isMobile ? 'var(--space-3)' : '10px 14px',
                  marginBottom: 2,
                  borderRadius: 'var(--radius-sm)',
                  color: isActive ? 'white' : 'rgba(255,255,255,0.6)',
                  background: isActive
                    ? 'linear-gradient(135deg, rgba(201,169,110,0.25) 0%, rgba(201,169,110,0.08) 100%)'
                    : 'transparent',
                  textDecoration: 'none',
                  fontSize: 14,
                  fontWeight: isActive ? 700 : 500,
                  transition: 'all 0.2s ease',
                  border: isActive ? '1px solid rgba(201,169,110,0.2)' : '1px solid transparent',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                    e.currentTarget.style.color = 'white';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                  }
                }}
              >
                <span
                  className="sidebar-nav-icon"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    background: isActive ? 'rgba(201,169,110,0.2)' : 'transparent',
                    color: isActive ? '#c9a96e' : 'inherit',
                    transition: 'all 0.2s ease',
                    flexShrink: 0,
                  }}
                >
                  {item.icon}
                </span>
                <span className="sidebar-nav-label" style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.label}
                </span>
                {item.badge ? (
                  <span className="sidebar-nav-badge" style={{
                    background: 'linear-gradient(135deg, #f43f5e, #e11d48)',
                    color: 'white',
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 20,
                    minWidth: 20,
                    textAlign: 'center',
                    boxShadow: '0 2px 8px rgba(244,63,94,0.3)',
                  }}>
                    {item.badge}
                  </span>
                ) : null}
                {isActive && !sidebarCollapsed && (
                  <ChevronRight size={16} style={{ opacity: 0.5, color: '#c9a96e', flexShrink: 0 }} />
                )}
                {/* Tooltip for collapsed state */}
                {sidebarCollapsed && !isMobile && (
                  <span className="sidebar-tooltip">{item.label}</span>
                )}
              </Link>

              {/* Preliminary valuations sub-item after Reports */}
              {item.href === '/reports' && (
                <Link
                  href="/reports/preliminary"
                  onClick={closeSidebar}
                  className="sidebar-nav-item"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-3)',
                    padding: sidebarCollapsed && !isMobile ? 'var(--space-3)' : '10px 14px',
                    marginBottom: 2,
                    borderRadius: 'var(--radius-sm)',
                    color: pathname.startsWith('/reports/preliminary') ? 'white' : 'rgba(255,255,255,0.6)',
                    background: pathname.startsWith('/reports/preliminary')
                      ? 'linear-gradient(135deg, rgba(201,169,110,0.25) 0%, rgba(201,169,110,0.08) 100%)'
                      : 'transparent',
                    textDecoration: 'none',
                    fontSize: 14,
                    fontWeight: pathname.startsWith('/reports/preliminary') ? 700 : 500,
                    transition: 'all 0.2s ease',
                    border: pathname.startsWith('/reports/preliminary') ? '1px solid rgba(201,169,110,0.2)' : '1px solid transparent',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => {
                    if (!pathname.startsWith('/reports/preliminary')) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                      e.currentTarget.style.color = 'white';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!pathname.startsWith('/reports/preliminary')) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                    }
                  }}
                >
                  <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    background: pathname.startsWith('/reports/preliminary') ? 'rgba(201,169,110,0.2)' : 'transparent',
                    color: pathname.startsWith('/reports/preliminary') ? '#c9a96e' : 'inherit',
                    transition: 'all 0.2s ease',
                    flexShrink: 0,
                  }}>
                    <LayoutTemplate size={20} />
                  </span>
                  <span className="sidebar-nav-label" style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    تقارير تثمين مبدئية
                  </span>
                  {pathname.startsWith('/reports/preliminary') && !sidebarCollapsed && (
                    <ChevronRight size={16} style={{ opacity: 0.5, color: '#c9a96e', flexShrink: 0 }} />
                  )}
                  {sidebarCollapsed && !isMobile && (
                    <span className="sidebar-tooltip">تقارير تثمين مبدئية</span>
                  )}
                </Link>
              )}
            </React.Fragment>
          );
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding: 'var(--space-3) var(--space-3)', borderTop: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
        <button
          onClick={logout}
          aria-label="تسجيل الخروج"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            width: '100%',
            padding: sidebarCollapsed && !isMobile ? 'var(--space-3)' : '10px 14px',
            borderRadius: 'var(--radius-sm)',
            color: 'rgba(255,255,255,0.55)',
            background: 'transparent',
            border: '1px solid transparent',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 500,
            fontFamily: 'inherit',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(244,63,94,0.1)';
            e.currentTarget.style.color = '#f87171';
            e.currentTarget.style.borderColor = 'rgba(244,63,94,0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'rgba(255,255,255,0.55)';
            e.currentTarget.style.borderColor = 'transparent';
          }}
        >
          <span style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 34,
            height: 34,
            borderRadius: 10,
            flexShrink: 0,
          }}>
            <LogOut size={20} />
          </span>
          <span className="sidebar-logout-label">تسجيل الخروج</span>
          {sidebarCollapsed && !isMobile && (
            <span className="sidebar-tooltip">تسجيل الخروج</span>
          )}
        </button>
      </div>
    </aside>
  );
}
