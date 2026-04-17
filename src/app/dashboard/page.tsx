'use client';

import React, { useMemo, useEffect } from 'react';
import Link from 'next/link';
import { store } from '@/lib/store';
import { formatCurrency, formatRelative, getStatusInfo } from '@/lib/utils';
import { useApp } from '@/components/layout/AppContext';
import { checkPendingNotifications } from '@/lib/notification-checker';
import { useTheme } from '@/hooks/useTheme';
import {
  FileText, CheckCircle2, Clock, AlertCircle, Coins,
  PlusCircle, TrendingUp, BarChart3,
  Eye, Archive, CircleDot, Ban, FileEdit,
  Send, Activity, Building2,
  Calendar, ArrowUpLeft, ArrowDownLeft, Sparkles,
  ChevronLeft, User, Bell, Zap,
  Landmark, Home, Warehouse, TreePine, Store, Building,
  RotateCcw,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { reportStatuses } from '@/data/mock';
import { EMPLOYEE_ROLES } from '@/types';

/* ─── Color Constants ─── */
const GOLD = '#c9a96e';
const GOLD_LIGHT = '#e8d5a8';
const GOLD_DARK = '#a8883f';
const NAVY = '#1e3a5f';
const NAVY_LIGHT = '#2d5a8e';

/* ─── Status → Icon Map ─── */
const statusIconMap: Record<string, React.ReactNode> = {
  draft: <FileEdit size={15} />,
  in_progress: <Clock size={15} />,
  pending_approval: <Send size={15} />,
  approved: <CheckCircle2 size={15} />,
  rejected: <Ban size={15} />,
  needs_revision: <FileEdit size={15} />,
  archived: <RotateCcwIcon size={15} />,
};

/* ─── Property Type → Icon ─── */
function getPropertyIcon(type: string) {
  const map: Record<string, React.ReactNode> = {
    land: <Landmark size={18} />,
    villa: <Home size={18} />,
    apartment: <Building size={18} />,
    residential_building: <Building2 size={18} />,
    commercial_building: <Building2 size={18} />,
    mixed_use: <Building2 size={18} />,
    farm: <TreePine size={18} />,
    warehouse: <Warehouse size={18} />,
    shop: <Store size={18} />,
  };
  return map[type] || <FileText size={18} />;
}

type ColorEntry = { main: string; bg: string; bar: string; pie: string };
type ColorMap = Record<string, ColorEntry>;

/* ─── Color palette for statuses (light/dark) ─── */
function getColorMap(dm: boolean): ColorMap {
  return dm ? {
    gray: { main: '#94a3b8', bg: '#334155', bar: '#64748b', pie: '#64748b' },
    blue: { main: '#60a5fa', bg: '#1e3a5f', bar: '#3b82f6', pie: '#3b82f6' },
    green: { main: '#34d399', bg: '#14532d', bar: '#10b981', pie: '#10b981' },
    amber: { main: '#fbbf24', bg: '#451a03', bar: '#f59e0b', pie: '#f59e0b' },
    red: { main: '#f87171', bg: '#450a0a', bar: '#ef4444', pie: '#ef4444' },
    orange: { main: '#fb923c', bg: '#431407', bar: '#f97316', pie: '#f97316' },
    purple: { main: '#a78bfa', bg: '#2e1065', bar: '#8b5cf6', pie: '#8b5cf6' },
  } : {
    gray: { main: '#475569', bg: '#f1f5f9', bar: '#cbd5e1', pie: '#94a3b8' },
    blue: { main: '#1d4ed8', bg: '#dbeafe', bar: '#93c5fd', pie: '#3b82f6' },
    green: { main: '#15803d', bg: '#dcfce7', bar: '#86efac', pie: '#22c55e' },
    amber: { main: '#b45309', bg: '#fef3c7', bar: '#fcd34d', pie: '#f59e0b' },
    red: { main: '#b91c1c', bg: '#fee2e2', bar: '#fca5a5', pie: '#ef4444' },
    orange: { main: '#c2410c', bg: '#ffedd5', bar: '#fdba74', pie: '#f97316' },
    purple: { main: '#7c3aed', bg: '#f3e8ff', bar: '#c4b5fd', pie: '#8b5cf6' },
  };
}

/* ─── Time-aware greeting ─── */
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'صباح الخير';
  if (hour < 17) return 'مساء الخير';
  return 'مساء الخير';
}

/* ─── Notif type → color key ─── */
function notifColorKey(type: string) {
  if (type === 'approval') return 'green';
  if (type === 'task') return 'amber';
  if (type === 'reminder') return 'red';
  return 'blue';
}

/* ─── Notif type → icon ─── */
function notifIcon(type: string) {
  if (type === 'approval') return <CheckCircle2 size={15} />;
  if (type === 'task') return <AlertCircle size={15} />;
  if (type === 'reminder') return <AlertCircle size={15} />;
  return <Bell size={15} />;
}

/* ─── Small RotateCcw Icon ─── */
function RotateCcwIcon({ size = 24 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}

/* ─── Section Header Component ─── */
function SectionHeader({ icon, iconBg, title, subtitle, action }: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {icon}
        </div>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{title}</h3>
          {subtitle && <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{subtitle}</span>}
        </div>
      </div>
      {action}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN DASHBOARD PAGE
   ═══════════════════════════════════════════════════ */
export default function DashboardPage() {
  const { currentUser, hasPermission } = useApp();
  const { isDark } = useTheme();
  const dm = isDark;

  const allReports = store.getReports();
  const tasks = store.getTasks();
  const pendingTasks = tasks.filter(t => t.status !== 'completed');

  useEffect(() => { checkPendingNotifications(); }, []);

  const isAdmin = currentUser?.role === 'admin';
  const isReviewer = currentUser?.role === 'reviewer';
  const isDataEntry = currentUser?.role === 'data_entry';
  const isViewer = currentUser?.role === 'viewer';

  const myReports = allReports.filter(r => r.appraiserId === currentUser?.id);
  const displayReports = isAdmin || isViewer ? allReports : myReports;
  const recentReports = displayReports.slice(0, 6);

  const statusCounts = reportStatuses.map(s => ({
    ...s,
    count: displayReports.filter(r => r.status === s.value).length,
  }));
  const totalReports = displayReports.length;
  const totalFees = displayReports.reduce((sum, r) => sum + (r.fees || 0), 0);
  const totalValue = displayReports.reduce((sum, r) => sum + (r.valuation?.totalMarketValue || 0), 0);

  const myCompleted = myReports.filter(r => r.status === 'approved').length;
  const myInProgress = myReports.filter(r => ['in_progress', 'pending_approval'].includes(r.status)).length;
  const myPendingApproval = myReports.filter(r => r.status === 'pending_approval').length;
  const pendingReviewAll = allReports.filter(r => r.status === 'pending_approval').length;

  const colorMap = getColorMap(dm);

  /* ─── Monthly Chart Data ─── */
  const monthlyData = useMemo(() => {
    const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    const now = new Date();
    const result: { month: string; count: number; fees: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth();
      const monthReports = displayReports.filter(r => {
        const rd = new Date(r.createdAt);
        return rd.getFullYear() === year && rd.getMonth() === month;
      });
      result.push({
        month: monthNames[month],
        count: monthReports.length,
        fees: monthReports.reduce((sum, r) => sum + (r.fees || 0), 0),
      });
    }
    return result;
  }, [displayReports]);

  /* ─── Pie Chart Data ─── */
  const pieData = useMemo(() =>
    statusCounts.filter(s => s.count > 0).map(s => ({
      name: s.label,
      value: s.count,
      color: colorMap[s.color]?.pie || '#94a3b8',
    })),
    [statusCounts, colorMap]
  );

  /* ─── Stat Cards ─── */
  const statCards = useMemo(() => {
    if (isAdmin) {
      return [
        { title: 'إجمالي التقارير', value: allReports.length, icon: <FileText size={22} />, color: dm ? '#60a5fa' : NAVY, bg: dm ? '#1e3a5f' : '#e8eef6', trend: '+12%', trendUp: true },
        { title: 'بانتظار الاعتماد', value: pendingReviewAll, icon: <AlertCircle size={22} />, color: dm ? '#fbbf24' : '#b45309', bg: dm ? '#451a03' : '#fef3c7', trend: '', trendUp: false },
        { title: 'المعاملات المنجزة', value: allReports.filter(r => r.status === 'approved').length, icon: <CheckCircle2 size={22} />, color: dm ? '#34d399' : '#15803d', bg: dm ? '#14532d' : '#dcfce7', trend: '+8%', trendUp: true },
        { title: 'الأتعاب الكلية', value: formatCurrency(totalFees), icon: <Coins size={22} />, color: dm ? '#a78bfa' : '#7c3aed', bg: dm ? '#2e1065' : '#f3e8ff', trend: '+23%', trendUp: true },
      ];
    }
    if (isReviewer) {
      return [
        { title: 'بانتظار المراجعة', value: pendingReviewAll, icon: <Send size={22} />, color: dm ? '#fbbf24' : '#b45309', bg: dm ? '#451a03' : '#fef3c7', trend: '', trendUp: false },
        { title: 'تم اعتمادها', value: allReports.filter(r => r.status === 'approved').length, icon: <CheckCircle2 size={22} />, color: dm ? '#34d399' : '#15803d', bg: dm ? '#14532d' : '#dcfce7', trend: '', trendUp: false },
        { title: 'تم رفضها', value: allReports.filter(r => r.status === 'rejected').length, icon: <Ban size={22} />, color: dm ? '#f87171' : '#b91c1c', bg: dm ? '#450a0a' : '#fee2e2', trend: '', trendUp: false },
        { title: 'تم إرجاعها', value: allReports.filter(r => r.status === 'needs_revision').length, icon: <RotateCcwIcon size={22} />, color: dm ? '#fb923c' : '#c2410c', bg: dm ? '#431407' : '#ffedd5', trend: '', trendUp: false },
      ];
    }
    return [
      { title: 'تقاريري', value: myReports.length, icon: <FileText size={22} />, color: dm ? '#60a5fa' : NAVY, bg: dm ? '#1e3a5f' : '#e8eef6', trend: '', trendUp: false },
      { title: 'قيد الإنجاز', value: myInProgress, icon: <Clock size={22} />, color: dm ? '#60a5fa' : '#1d4ed8', bg: dm ? '#1e3a5f' : '#dbeafe', trend: '', trendUp: false },
      { title: 'بانتظار الاعتماد', value: myPendingApproval, icon: <AlertCircle size={22} />, color: dm ? '#fbbf24' : '#b45309', bg: dm ? '#451a03' : '#fef3c7', trend: '', trendUp: false },
      { title: 'المنجزة', value: myCompleted, icon: <CheckCircle2 size={22} />, color: dm ? '#34d399' : '#15803d', bg: dm ? '#14532d' : '#dcfce7', trend: '', trendUp: false },
    ];
  }, [isAdmin, isReviewer, isDataEntry, myReports, allReports, dm]);

  /* ─── Shortcuts ─── */
  const shortcuts = useMemo(() => {
    const items = [];
    if (hasPermission('reports_create')) items.push({ href: '/reports/new', icon: <PlusCircle size={20} />, label: 'تقرير جديد', color: dm ? '#60a5fa' : NAVY, bg: dm ? '#1e3a5f' : '#e8eef6' });
    if (hasPermission('reports_view')) items.push({ href: '/reports', icon: <Eye size={20} />, label: 'عرض التقارير', color: dm ? '#60a5fa' : '#3b82f6', bg: dm ? '#1e3a5f' : '#dbeafe' });
    if (hasPermission('approvals_view')) items.push({ href: '/approvals', icon: <CheckCircle2 size={20} />, label: 'الاعتمادات', color: dm ? '#34d399' : '#15803d', bg: dm ? '#14532d' : '#dcfce7' });
    if (hasPermission('archive_view')) items.push({ href: '/archive', icon: <Archive size={20} />, label: 'الأرشيف', color: dm ? '#a78bfa' : '#7c3aed', bg: dm ? '#2e1065' : '#f3e8ff' });
    if (hasPermission('beneficiaries_view')) items.push({ href: '/beneficiaries', icon: <User size={20} />, label: 'المستفيدين', color: dm ? '#22d3ee' : '#0891b2', bg: dm ? '#164e63' : '#cffafe' });
    return items;
  }, [hasPermission, dm]);

  /* ─── Date / Greeting ─── */
  const now = new Date();
  const todayDate = now.toLocaleDateString('ar-SA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const roleLabel = currentUser ? EMPLOYEE_ROLES.find(r => r.value === currentUser.role)?.label : '';
  const greetingText = isAdmin
    ? `${getGreeting()} — مرحباً بك في نظام التثمين العقاري`
    : `${getGreeting()} ${currentUser?.fullName?.split(' ')[0] || ''} — ${roleLabel}`;

  const allNotifications = store.getNotifications();
  const unreadNotifications = allNotifications.filter(n => !n.isRead);

  /* ─── Chart Tooltip Style ─── */
  const tooltipStyle = dm
    ? { borderRadius: 12, border: '1px solid var(--color-border)', fontSize: 13, background: 'var(--color-surface)', color: 'var(--color-text)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }
    : { borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' };
  const gridStroke = dm ? 'var(--color-border)' : '#e2e8f0';
  const axisFill = dm ? '#94a3b8' : '#64748b';

  /* ─── Custom Pie Label ─── */
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={700}>
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="animate-fade-in" style={{ direction: 'rtl' }}>

      {/* ════════════════════════════════════════════
          HERO SECTION
          ════════════════════════════════════════════ */}
      <div
        className="dash-hero-gradient dash-stagger-in"
        style={{
          background: dm
            ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #334155 100%)'
            : `linear-gradient(135deg, ${NAVY} 0%, ${NAVY_LIGHT} 50%, #3a6fa0 100%)`,
          borderRadius: 20, padding: '32px 28px', marginBottom: 24,
          position: 'relative', overflow: 'hidden', color: 'white',
        }}
      >
        {/* Decorative geometric pattern */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.03,
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,0.1) 35px, rgba(255,255,255,0.1) 36px),
            repeating-linear-gradient(-45deg, transparent, transparent 35px, rgba(255,255,255,0.1) 35px, rgba(255,255,255,0.1) 36px)`,
        }} />
        {/* Ambient circles */}
        <div style={{
          position: 'absolute', top: -50, left: -50, width: 220, height: 220,
          borderRadius: '50%', background: dm ? 'rgba(251, 191, 36, 0.06)' : 'rgba(201, 169, 110, 0.1)',
        }} />
        <div style={{
          position: 'absolute', bottom: -80, right: -40, width: 280, height: 280,
          borderRadius: '50%', background: dm ? 'rgba(251, 191, 36, 0.04)' : 'rgba(201, 169, 110, 0.06)',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12,
                  background: dm ? 'rgba(251, 191, 36, 0.15)' : 'rgba(201, 169, 110, 0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Sparkles size={20} color={dm ? '#fbbf24' : GOLD_LIGHT} />
                </div>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', margin: 0, fontWeight: 500 }}>
                  {todayDate}
                </p>
              </div>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: 'white', margin: '0 0 4px', letterSpacing: '-0.01em' }}>
                لوحة التحكم
              </h1>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', margin: 0, fontWeight: 500 }}>
                {greetingText}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {hasPermission('reports_create') && (
                <Link href="/reports/new" className="dash-quick-action" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '11px 22px', borderRadius: 12,
                  background: dm ? '#fbbf24' : GOLD,
                  color: dm ? '#1e293b' : NAVY,
                  fontWeight: 700, fontSize: 14, textDecoration: 'none',
                  boxShadow: dm ? '0 4px 16px rgba(251, 191, 36, 0.25)' : '0 4px 16px rgba(201, 169, 110, 0.3)',
                }}>
                  <PlusCircle size={18} />
                  إنشاء تقرير جديد
                </Link>
              )}
              <Link href="/market-prices" className="dash-quick-action" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '11px 22px', borderRadius: 12,
                background: 'rgba(255,255,255,0.1)', color: 'white',
                fontWeight: 600, fontSize: 14, textDecoration: 'none',
                border: '1px solid rgba(255,255,255,0.15)',
              }}>
                <Activity size={18} />
                مؤشرات السوق
              </Link>
            </div>
          </div>

          {/* Inline summary pills (admin only) */}
          {isAdmin && (
            <div style={{
              display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap',
            }}>
              {[
                { label: 'إجمالي القيمة المُقيمة', value: formatCurrency(totalValue), icon: <Building2 size={16} /> },
                { label: 'إجمالي الأتعاب', value: formatCurrency(totalFees), icon: <Coins size={16} /> },
                { label: 'نسبة الإنجاز', value: `${totalReports > 0 ? ((allReports.filter(r => r.status === 'approved').length / totalReports) * 100).toFixed(0) : 0}%`, icon: <TrendingUp size={16} /> },
              ].map((item, i) => (
                <div key={i} className="dash-glass" style={{
                  background: 'rgba(255,255,255,0.07)',
                  borderRadius: 12, padding: '12px 18px',
                  border: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <span style={{ color: dm ? '#fbbf24' : GOLD_LIGHT, display: 'flex' }}>{item.icon}</span>
                  <div>
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', margin: 0, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{item.label}</p>
                    <p style={{ fontSize: 17, fontWeight: 800, color: 'white', margin: '2px 0 0', lineHeight: 1.2 }}>{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════
          STAT CARDS (with stagger animation)
          ════════════════════════════════════════════ */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16, marginBottom: 24,
      }}>
        {statCards.map((card, i) => (
          <div
            key={i}
            className="card dash-stat-card dash-stagger-in"
            style={{
              padding: '22px 20px', position: 'relative', overflow: 'hidden',
              border: '1px solid var(--color-border)',
              borderRadius: 16,
              animationDelay: `${i * 80}ms`,
            }}
          >
            {/* Background decorative circle */}
            <div style={{
              position: 'absolute', top: -16, left: -16, width: 70, height: 70,
              borderRadius: '50%', background: card.bg, opacity: 0.4,
            }} />
            <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: '0 0 8px', fontWeight: 600, letterSpacing: '0.03em' }}>
                  {card.title}
                </p>
                <p className="dash-count-up" style={{ fontSize: 28, fontWeight: 800, color: card.color, margin: 0, lineHeight: 1.1, animationDelay: `${i * 80 + 200}ms` }}>
                  {card.value}
                </p>
                {card.trend && (
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 3,
                    marginTop: 8, padding: '3px 10px', borderRadius: 20,
                    background: card.trendUp ? (dm ? '#14532d' : '#dcfce7') : (dm ? '#450a0a' : '#fee2e2'),
                    fontSize: 11, fontWeight: 700,
                    color: card.trendUp ? (dm ? '#34d399' : '#15803d') : (dm ? '#f87171' : '#b91c1c'),
                  }}>
                    {card.trendUp ? <ArrowUpLeft size={12} /> : <ArrowDownLeft size={12} />}
                    {card.trend}
                  </div>
                )}
              </div>
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: card.bg, display: 'flex',
                alignItems: 'center', justifyContent: 'center', color: card.color,
              }}>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ════════════════════════════════════════════
          NOTIFICATIONS (always visible)
          ════════════════════════════════════════════ */}
      <div className="card dash-stagger-in" style={{
        padding: '18px 20px', borderRadius: 16, marginBottom: 24,
        animationDelay: '300ms',
        borderRight: unreadNotifications.length > 0 ? `4px solid ${dm ? '#f87171' : '#ef4444'}` : undefined,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: unreadNotifications.length > 0 ? 14 : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: unreadNotifications.length > 0
                ? (dm ? 'rgba(239, 68, 68, 0.12)' : '#fee2e2')
                : (dm ? 'rgba(59, 130, 246, 0.12)' : '#dbeafe'),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative',
            }}>
              <Bell size={18} color={unreadNotifications.length > 0 ? (dm ? '#f87171' : '#ef4444') : (dm ? '#60a5fa' : '#3b82f6')} />
              {unreadNotifications.length > 0 && (
                <span className="dash-subtle-pulse" style={{
                  position: 'absolute', top: -2, right: -2,
                  width: 10, height: 10, borderRadius: '50%',
                  background: '#ef4444', border: '2px solid var(--color-surface)',
                }} />
              )}
            </div>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>التنبيهات</h3>
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: '2px 0 0' }}>
                {unreadNotifications.length > 0 ? `${unreadNotifications.length} تنبيه غير مقروء` : 'لا توجد تنبيهات جديدة'}
              </p>
            </div>
          </div>
          <Link href="/notifications" style={{ textDecoration: 'none', fontSize: 12, color: dm ? '#60a5fa' : NAVY, fontWeight: 600 }}>
            عرض الكل ←
          </Link>
        </div>

        {unreadNotifications.length > 0 && (
          <div style={{ display: 'grid', gap: 8 }}>
            {unreadNotifications.slice(0, 4).map(n => {
              const nc = colorMap[notifColorKey(n.type)] || colorMap.blue;
              return (
                <Link key={n.id} href={n.relatedReportId ? `/reports/${n.relatedReportId}` : '/notifications'}
                  className="dash-notif-card"
                  style={{
                    textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px', borderRadius: 10, background: nc.bg,
                    borderLeft: `3px solid ${nc.main}`,
                  }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, background: 'var(--color-surface)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: nc.main, flexShrink: 0,
                  }}>
                    {notifIcon(n.type)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: nc.main, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</p>
                    <p style={{ fontSize: 11, color: 'var(--color-text-muted)', margin: '2px 0 0' }}>{formatRelative(n.createdAt)}</p>
                  </div>
                  {n.priority === 'high' && (
                    <span className="dash-subtle-pulse" style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════
          CHART + STATUS DONUT
          ════════════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 16, marginBottom: 24 }}>

        {/* Monthly Bar Chart (admin only) */}
        {isAdmin && (
          <div className="card dash-stagger-in" style={{ padding: 24, borderRadius: 16, animationDelay: '400ms' }}>
            <SectionHeader
              icon={<BarChart3 />}
              iconBg={dm ? '#1e3a5f' : '#e8eef6'}
              iconColor={dm ? '#60a5fa' : NAVY}
              title="التقييمات الشهرية"
              subtitle="عدد التقارير والأتعاب"
            />
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} style={{ direction: 'ltr' }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: axisFill }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: axisFill }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value: any, name: any) => [
                      name === 'fees' ? `${value} ر.ع` : value,
                      name === 'fees' ? 'الأتعاب' : 'عدد التقارير'
                    ]}
                  />
                  <Bar dataKey="count" fill={dm ? '#3b82f6' : NAVY} radius={[6, 6, 0, 0]} barSize={28} />
                  <Bar dataKey="fees" fill={dm ? '#fbbf24' : GOLD} radius={[6, 6, 0, 0]} barSize={28} opacity={0.7} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Status Donut */}
        <div className="card dash-stagger-in" style={{ padding: 24, borderRadius: 16, animationDelay: isAdmin ? '480ms' : '400ms' }}>
          <SectionHeader
            icon={<Zap />}
            iconBg={dm ? '#451a03' : '#fef3c7'}
            iconColor={dm ? '#fbbf24' : '#b45309'}
            title="حالة المعاملات"
            subtitle={`إجمالي ${totalReports} معاملة`}
          />

          {/* Donut Chart */}
          {pieData.length > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20 }}>
              <div style={{ width: 140, height: 140, flexShrink: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={65}
                      paddingAngle={3}
                      dataKey="value"
                      labelLine={false}
                      label={renderCustomizedLabel}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ flex: 1, display: 'grid', gap: 6 }}>
                {pieData.slice(0, 5).map(item => {
                  const pct = totalReports > 0 ? ((item.value / totalReports) * 100) : 0;
                  return (
                    <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 3, background: item.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', flex: 1 }}>{item.name}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>{item.value}</span>
                      <span style={{ fontSize: 10, color: 'var(--color-text-muted)', width: 32, textAlign: 'left' }}>({pct.toFixed(0)}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--color-text-muted)' }}>
              <FileText size={28} style={{ marginBottom: 6, opacity: 0.3 }} />
              <p style={{ fontSize: 13, margin: 0 }}>لا توجد معاملات</p>
            </div>
          )}

          {/* Actionable status pills */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {statusCounts.filter(s => s.count > 0 && ['pending_approval', 'in_progress', 'needs_revision'].includes(s.value)).map(s => {
              const c = colorMap[s.color] || colorMap.gray;
              return (
                <Link key={s.value} href="/reports" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '6px 14px', borderRadius: 20,
                  background: c.bg, color: c.main,
                  fontSize: 12, fontWeight: 700, textDecoration: 'none',
                  border: `1px solid ${c.main}25`,
                  transition: 'all 0.15s',
                }}>
                  {statusIconMap[s.value]}
                  {s.label}
                  <span style={{
                    background: c.main, color: dm ? '#0f172a' : 'white',
                    width: 20, height: 20, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 800,
                  }}>
                    {s.count}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════
          RECENT REPORTS + SHORTCUTS & TASKS
          ════════════════════════════════════════════ */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: 16,
      }}>

        {/* Recent Reports */}
        <div className="card dash-stagger-in" style={{ padding: 24, borderRadius: 16, animationDelay: '550ms' }}>
          <SectionHeader
            icon={<FileText />}
            iconBg={dm ? '#1e3a5f' : '#e8eef6'}
            iconColor={dm ? '#60a5fa' : NAVY}
            title={isAdmin ? 'آخر التقارير' : 'آخر تقاريري'}
            action={
              hasPermission('reports_view') ? (
                <Link href="/reports" style={{
                  fontSize: 13, color: dm ? '#fbbf24' : GOLD_DARK, textDecoration: 'none', fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '4px 12px', borderRadius: 8,
                  background: dm ? 'rgba(251, 191, 36, 0.08)' : 'rgba(201, 169, 110, 0.08)',
                }}>
                  عرض الكل
                  <ChevronLeft size={14} />
                </Link>
              ) : undefined
            }
          />

          {recentReports.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-muted)' }}>
              <FileText size={32} style={{ marginBottom: 8, opacity: 0.3 }} />
              <p style={{ fontSize: 14, margin: 0 }}>لا توجد تقارير</p>
            </div>
          ) : (
            <div>
              {recentReports.map((report, idx) => {
                const status = getStatusInfo(report.status);
                return (
                  <Link key={report.id} href={`/reports/${report.id}`}
                    className="dash-activity-row"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0',
                      borderBottom: idx < recentReports.length - 1 ? '1px solid var(--color-border)' : 'none',
                      textDecoration: 'none', color: 'inherit',
                    }}
                  >
                    <div style={{
                      width: 40, height: 40, borderRadius: 12,
                      background: dm ? '#1e3a5f' : `${NAVY}08`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: dm ? '#60a5fa' : NAVY,
                      flexShrink: 0,
                    }}>
                      {getPropertyIcon(report.propertyType)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2, color: dm ? '#60a5fa' : NAVY }}>
                        {report.reportNumber}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{report.beneficiaryName}</span>
                        <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--color-text-muted)', opacity: 0.4, display: 'inline-block' }} />
                        <span>{report.bankName}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      <span className={`badge badge-${status.color}`}>
                        {status.label}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                        {formatRelative(report.createdAt)}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Shortcuts + Tasks Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Quick Actions */}
          {shortcuts.length > 0 && (
            <div className="card dash-stagger-in" style={{ padding: 24, borderRadius: 16, animationDelay: '620ms' }}>
              <SectionHeader
                icon={<Sparkles />}
                iconBg={dm ? 'rgba(251, 191, 36, 0.12)' : 'rgba(201, 169, 110, 0.12)'}
                iconColor={dm ? '#fbbf24' : GOLD_DARK}
                title="اختصارات سريعة"
              />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
                {shortcuts.map((item) => (
                  <Link key={item.href} href={item.href}
                    className="dash-quick-action"
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      gap: 8, padding: '16px 12px', borderRadius: 14,
                      background: item.bg, border: '1px solid transparent',
                      textDecoration: 'none', color: 'inherit', textAlign: 'center',
                    }}
                  >
                    <div style={{
                      width: 40, height: 40, borderRadius: 12,
                      background: 'var(--color-surface)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', color: item.color,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    }}>
                      {item.icon}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: item.color }}>{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Urgent Tasks */}
          <div className="card dash-stagger-in" style={{ padding: 24, borderRadius: 16, animationDelay: '700ms' }}>
            <SectionHeader
              icon={<AlertCircle />}
              iconBg={dm ? '#451a03' : '#fef3c7'}
              iconColor={dm ? '#fbbf24' : '#b45309'}
              title="المهام العاجلة"
              action={
                pendingTasks.length > 0 ? (
                  <span style={{
                    background: dm ? '#450a0a' : '#fee2e2', color: dm ? '#f87171' : '#b91c1c',
                    fontSize: 11, fontWeight: 700, padding: '2px 10px',
                    borderRadius: 20,
                  }}>
                    {pendingTasks.length}
                  </span>
                ) : undefined
              }
            />

            {pendingTasks.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '24px 0',
                color: 'var(--color-text-muted)',
              }}>
                <CheckCircle2 size={32} style={{ marginBottom: 8, opacity: 0.3 }} />
                <p style={{ fontSize: 14, margin: 0 }}>لا توجد مهام عاجلة</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 8 }}>
                {pendingTasks.slice(0, 4).map((task) => {
                  const isOverdue = task.status === 'overdue';
                  const isHigh = task.priority === 'high';
                  return (
                    <div key={task.id} style={{
                      padding: '12px 14px', borderRadius: 12,
                      background: isOverdue
                        ? (dm ? 'linear-gradient(135deg, #450a0a, #2d0a0a)' : 'linear-gradient(135deg, #fef2f2, #fff5f5)')
                        : (dm ? 'linear-gradient(135deg, #1e293b, #1a2332)' : 'linear-gradient(135deg, #f8fafc, #fafbfc)'),
                      border: `1px solid ${isOverdue ? (dm ? '#7f1d1d' : '#fecaca') : 'var(--color-border)'}`,
                      display: 'flex', alignItems: 'center', gap: 12,
                      ...(isOverdue ? { borderRight: '3px solid #ef4444' } : {}),
                    }}>
                      <div className={isOverdue ? 'dash-pulse-glow' : undefined} style={{
                        width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                        background: isHigh ? '#ef4444' : (isOverdue ? '#ef4444' : '#f59e0b'),
                      }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2, color: 'var(--color-text)' }}>{task.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                          {task.relatedReportNumber && (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                              padding: '1px 6px', borderRadius: 4,
                              background: dm ? 'var(--color-surface-alt)' : '#f1f5f9',
                              fontSize: 10, fontWeight: 600,
                            }}>
                              <FileText size={9} />
                              {task.relatedReportNumber}
                            </span>
                          )}
                        </div>
                      </div>
                      {task.dueDate && (
                        <div style={{
                          fontSize: 11, color: isOverdue ? '#ef4444' : 'var(--color-text-muted)',
                          fontWeight: isOverdue ? 700 : 500,
                          display: 'flex', alignItems: 'center', gap: 4,
                        }}>
                          <Calendar size={12} />
                          {formatRelative(task.dueDate)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}