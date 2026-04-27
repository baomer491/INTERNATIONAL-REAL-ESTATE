'use client';

import React, { useMemo, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { store } from '@/lib/store';
import { formatCurrency, formatRelative, getStatusInfo, getPropertyTypeLabel } from '@/lib/utils';
import { useApp } from '@/components/layout/AppContext';
import { useTheme } from '@/hooks/useTheme';
import { useRealtime } from '@/hooks/useRealtime';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { reportStatuses, propertyTypes } from '@/data/mock';
import { EMPLOYEE_ROLES } from '@/types';
import type { Report, Notification, Task, LoginLog } from '@/types';
import styles from './dashboard.module.css';
import {
  FileText, CheckCircle2, Clock, AlertCircle, Coins,
  PlusCircle, TrendingUp, BarChart3, Eye, Archive,
  Send, Activity, Building2, Calendar, ArrowUp, Sparkles,
  ChevronLeft, Bell, Zap, Landmark, Home, Warehouse,
  TreePine, Store, Building, RotateCcw, FileEdit, Ban,
  CircleCheck, Loader2, Users, Target, PieChart, Layers,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, AreaChart, Area,
} from 'recharts';

/* ═══════════════════════════════════════════════════
   COLOR / STYLE TOKENS (consolidated, no duplication)
   ═══════════════════════════════════════════════════ */
const GOLD = 'var(--color-secondary)';
const GOLD_LIGHT = 'var(--color-secondary-light)';
const NAVY = 'var(--color-primary)';
const NAVY_LIGHT = 'var(--color-primary-light)';

const statusIconMap: Record<string, React.ReactNode> = {
  draft: <FileEdit size={15} />,
  in_progress: <Clock size={15} />,
  pending_approval: <Send size={15} />,
  approved: <CheckCircle2 size={15} />,
  rejected: <Ban size={15} />,
  needs_revision: <FileEdit size={15} />,
  archived: <RotateCcw size={15} />,
};

function getPropertyIcon(type: string) {
  const map: Record<string, React.ReactNode> = {
    land: <Landmark size={18} />, villa: <Home size={18} />,
    apartment: <Building size={18} />, residential_building: <Building2 size={18} />,
    commercial_building: <Building2 size={18} />, mixed_use: <Building2 size={18} />,
    farm: <TreePine size={18} />, warehouse: <Warehouse size={18} />,
    shop: <Store size={18} />,
  };
  return map[type] || <FileText size={18} />;
}

type ColorEntry = { main: string; bg: string; bar: string; pie: string };
type ColorMap = Record<string, ColorEntry>;

function getColorMap(dark: boolean): ColorMap {
  return dark ? {
    gray: { main: 'var(--color-text-muted)', bg: 'var(--color-surface-alt)', bar: 'var(--color-text-muted)', pie: 'var(--color-text-muted)' },
    blue: { main: 'var(--color-primary)', bg: 'var(--color-primary-50)', bar: 'var(--color-primary)', pie: 'var(--color-primary)' },
    green: { main: 'var(--color-success)', bg: 'var(--color-success-bg)', bar: 'var(--color-success)', pie: 'var(--color-success)' },
    amber: { main: 'var(--color-warning)', bg: 'var(--color-warning-bg)', bar: 'var(--color-warning)', pie: 'var(--color-warning)' },
    red: { main: 'var(--color-danger)', bg: 'var(--color-danger-bg)', bar: 'var(--color-danger)', pie: 'var(--color-danger)' },
    orange: { main: 'var(--color-warning)', bg: 'var(--color-warning-bg)', bar: 'var(--color-warning)', pie: 'var(--color-warning)' },
    purple: { main: 'var(--color-secondary)', bg: 'var(--color-secondary-50)', bar: 'var(--color-secondary)', pie: 'var(--color-secondary)' },
  } : {
    gray: { main: 'var(--color-text-secondary)', bg: 'var(--color-surface-alt)', bar: 'var(--color-border)', pie: 'var(--color-text-muted)' },
    blue: { main: 'var(--color-primary)', bg: 'var(--color-primary-50)', bar: 'var(--color-primary-200)', pie: 'var(--color-primary)' },
    green: { main: 'var(--color-success)', bg: 'var(--color-success-bg)', bar: 'var(--color-success-light)', pie: 'var(--color-success)' },
    amber: { main: 'var(--color-warning)', bg: 'var(--color-warning-bg)', bar: 'var(--color-warning-light)', pie: 'var(--color-warning)' },
    red: { main: 'var(--color-danger)', bg: 'var(--color-danger-bg)', bar: 'var(--color-danger-light)', pie: 'var(--color-danger)' },
    orange: { main: 'var(--color-warning)', bg: 'var(--color-warning-bg)', bar: 'var(--color-warning-light)', pie: 'var(--color-warning)' },
    purple: { main: 'var(--color-secondary)', bg: 'var(--color-secondary-50)', bar: 'var(--color-secondary-light)', pie: 'var(--color-secondary)' },
  };
}

function getGreeting() {
  const h = new Date().getHours();
  return h < 12 ? 'صباح الخير' : 'مساء الخير';
}

/* ═══════════════════════════════════════════════════
   SUB-COMPONENTS (extracted from main render)
   ═══════════════════════════════════════════════════ */

function SectionH({ icon, iconBg, iconColor, title, subtitle, action }: {
  icon: React.ReactNode; iconBg: string; iconColor: string;
  title: string; subtitle?: string; action?: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div className={styles.sectionIcon} style={{ background: iconBg, color: iconColor }}>
          {icon}
        </div>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>{title}</h3>
          {subtitle && <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 500 }}>{subtitle}</span>}
        </div>
      </div>
      {action}
    </div>
  );
}

/* ─── Skeleton Loading ─── */
function DashboardSkeleton() {
  return (
    <div style={{ direction: 'rtl' }}>
      <div className={styles.skeletonCard} style={{ height: 180, marginBottom: 32 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 32 }}>
        {[1, 2, 3, 4].map(i => <div key={i} className={styles.skeletonCard} />)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
        <div className={styles.skeletonCard} style={{ height: 340 }} />
        <div className={styles.skeletonCard} style={{ height: 340 }} />
      </div>
    </div>
  );
}

/* ─── Stat Card ─── */
function StatCard({ title, value, icon, color, bg, trend, trendUp }: {
  title: string; value: string | number; icon: React.ReactNode;
  color: string; bg: string; trend?: string | null; trendUp?: boolean;
}) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statDeco} style={{ background: bg }} />
      <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: '0 0 10px', fontWeight: 600 }}>
            {title}
          </p>
          <p style={{ fontSize: 32, fontWeight: 800, color, margin: 0, lineHeight: 1.1 }}>
            {value}
          </p>
          {trend && (
            <div className={styles.trendBadge} style={{
              background: trendUp ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
              color: trendUp ? 'var(--color-success)' : 'var(--color-danger)',
              border: `1px solid ${trendUp ? 'var(--color-success-light)' : 'var(--color-danger-light)'}`,
            }}>
              <ArrowUp size={13} style={{ transform: trendUp ? 'rotate(0deg)' : 'rotate(180deg)' }} />
              {trend}
            </div>
          )}
        </div>
        <div style={{
          width: 54, height: 54, borderRadius: 16,
          background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color, boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        }}>
          {icon}
        </div>
      </div>
    </div>
  );
}

/* ─── Activity Feed ─── */
interface ActivityItem {
  id: string; type: 'report_created' | 'report_approved' | 'report_rejected' | 'task_done' | 'login';
  title: string; subtitle: string; timestamp: string;
  color: string; bg: string; icon: React.ReactNode;
  link?: string;
}

function ActivityFeed({ activities }: { activities: ActivityItem[] }) {
  if (activities.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Activity size={40} className={styles.emptyIcon} />
        <p style={{ fontSize: 15, margin: 0, fontWeight: 500 }}>لا يوجد نشاط حديث</p>
      </div>
    );
  }
  return (
    <div>
      {activities.map((a) => (
        <Link key={a.id} href={a.link || '#'}
          className={styles.activityItem}
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <div className={styles.activityDot} style={{ background: a.color, boxShadow: `0 0 8px ${a.color}40` }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>
              {a.title}
            </p>
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: '3px 0 0', fontWeight: 500 }}>
              {a.subtitle}
            </p>
          </div>
          <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 500, whiteSpace: 'nowrap' }}>
            {formatRelative(a.timestamp)}
          </span>
        </Link>
      ))}
    </div>
  );
}

/* ─── Task Panel ─── */
function TasksPanel({ tasks, colorMap, dark }: {
  tasks: Task[]; colorMap: ColorMap; dark: boolean;
}) {
  const [completing, setCompleting] = useState<string | null>(null);

  const handleComplete = useCallback(async (e: React.MouseEvent, taskId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setCompleting(taskId);
    try {
      await store.completeTask(taskId);
    } catch (err) { /* ignore */ }
    setCompleting(null);
  }, []);

  const pendingTasks = useMemo(() => tasks.filter(t => t.status !== 'completed'), [tasks]);

  if (pendingTasks.length === 0) {
    return (
      <div className={styles.emptyState}>
        <CheckCircle2 size={40} className={styles.emptyIcon} />
        <p style={{ fontSize: 15, margin: 0, fontWeight: 500 }}>لا توجد مهام معلقة</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {pendingTasks.slice(0, 5).map(task => {
        const overdue = task.status === 'overdue';
        const high = task.priority === 'high';
        const bg = overdue
          ? ('var(--color-danger-bg)')
          : ('var(--color-surface-alt)');
        return (
          <div key={task.id} className={styles.taskItem} style={{
            background: bg,
            border: `1.5px solid ${overdue ? (dark ? 'var(--color-danger-bg)' : 'var(--color-danger-light)') : 'var(--color-border)'}`,
            ...(overdue ? { borderRight: '4px solid var(--color-danger)' } : {}),
            opacity: completing === task.id ? 0.5 : 1,
          }}>
            <div style={{
              width: 12, height: 12, borderRadius: '50%', flexShrink: 0,
              background: high ? 'var(--color-danger)' : (overdue ? 'var(--color-danger)' : 'var(--color-warning)'),
              boxShadow: high || overdue ? '0 0 8px rgba(244,63,94,0.4)' : 'none',
            }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', marginBottom: 3 }}>
                {task.title}
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                {task.relatedReportNumber && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '2px 8px', borderRadius: 6,
                    background: 'var(--color-surface-alt)',
                    fontSize: 11, fontWeight: 600,
                  }}>
                    <FileText size={10} /> {task.relatedReportNumber}
                  </span>
                )}
                {task.assignedName && (
                  <span style={{ marginRight: 8 }}>{task.assignedName}</span>
                )}
              </div>
            </div>
            <button
              onClick={(e) => handleComplete(e, task.id)}
              disabled={!!completing}
              style={{
                width: 32, height: 32, borderRadius: 10,
                border: `1.5px solid var(--color-success-light)`,
                background: completing === task.id ? 'var(--color-success-bg)' : 'transparent',
                color: 'var(--color-success)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, transition: 'all 0.15s',
              }}
              title="إتمام المهمة"
            >
              {completing === task.id ? <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> : <CircleCheck size={16} />}
            </button>
            {task.dueDate && (
              <span style={{
                fontSize: 12, color: overdue ? 'var(--color-danger)' : 'var(--color-text-muted)',
                fontWeight: overdue ? 800 : 600, whiteSpace: 'nowrap',
              }}>
                {formatRelative(task.dueDate)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN DASHBOARD PAGE
   ═══════════════════════════════════════════════════ */
export default function DashboardPage() {
  const { currentUser, hasPermission, isMobile } = useApp();
  const { isDark } = useTheme();
  const dm = isDark;
  const [loading, setLoading] = useState(true);

  const { data: allReports } = useRealtime('reports', () => store.getReports());
  const { data: tasks } = useRealtime('tasks', () => store.getTasks());
  const { data: allNotifications } = useRealtime('notifications', () => store.getNotifications());

  useEffect(() => {
    if (allReports !== undefined && tasks !== undefined) setLoading(false);
  }, [allReports, tasks]);

  const isAdmin = currentUser?.role === 'admin';
  const isReviewer = currentUser?.role === 'reviewer';
  const isViewer = currentUser?.role === 'viewer';

  /* ─── Derived Data ─── */
  const myReports = useMemo(() => allReports.filter(r => r.appraiserId === currentUser?.id), [allReports, currentUser?.id]);
  const displayReports = useMemo(() => (isAdmin || isViewer ? allReports : myReports), [isAdmin, isViewer, allReports, myReports]);
  const recentReports = useMemo(() => displayReports.slice(0, 6), [displayReports]);

  const totalReports = displayReports.length;
  const totalFees = useMemo(() => displayReports.reduce((s, r) => s + (r.fees || 0), 0), [displayReports]);
  const totalValue = useMemo(() => displayReports.reduce((s, r) => s + (r.valuation?.totalMarketValue || 0), 0), [displayReports]);
  const approvedCount = useMemo(() => displayReports.filter(r => r.status === 'approved').length, [displayReports]);
  const pendingApproval = useMemo(() => allReports.filter(r => r.status === 'pending_approval').length, [allReports]);

  const colorMap = useMemo(() => getColorMap(dm), [dm]);

  const statusCounts = useMemo(() =>
    reportStatuses.map(s => ({ ...s, count: displayReports.filter(r => r.status === s.value).length })),
    [displayReports]
  );

  /* ─── Monthly Trend ─── */
  const monthlyTrend = useMemo(() => {
    const now = new Date();
    const thisMonth = displayReports.filter(r => {
      const d = new Date(r.createdAt);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }).length;
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonth = displayReports.filter(r => {
      const d = new Date(r.createdAt);
      return d.getFullYear() === lastMonthDate.getFullYear() && d.getMonth() === lastMonthDate.getMonth();
    }).length;
    if (lastMonth === 0 && thisMonth === 0) return { text: null, up: false };
    if (lastMonth === 0) return { text: `+${thisMonth}`, up: true };
    const pct = Math.round(((thisMonth - lastMonth) / lastMonth) * 100);
    return { text: `${pct >= 0 ? '+' : ''}${pct}%`, up: pct >= 0 };
  }, [displayReports]);

  /* ─── Weekly Comparison ─── */
  const weeklyComparison = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 86400000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 86400000);
    const thisWeek = displayReports.filter(r => {
      const d = new Date(r.createdAt);
      return d >= weekAgo;
    }).length;
    const lastWeek = displayReports.filter(r => {
      const d = new Date(r.createdAt);
      return d >= twoWeeksAgo && d < weekAgo;
    }).length;
    const thisWeekFees = displayReports.filter(r => new Date(r.createdAt) >= weekAgo).reduce((s, r) => s + (r.fees || 0), 0);
    const lastWeekFees = displayReports.filter(r => {
      const d = new Date(r.createdAt);
      return d >= twoWeeksAgo && d < weekAgo;
    }).reduce((s, r) => s + (r.fees || 0), 0);
    return { thisWeek, lastWeek, thisWeekFees, lastWeekFees };
  }, [displayReports]);

  /* ─── Property Type Breakdown ─── */
  const propertyBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    displayReports.forEach(r => { map[r.propertyType] = (map[r.propertyType] || 0) + 1; });
    return Object.entries(map)
      .map(([type, count]) => ({ type, count, label: getPropertyTypeLabel(type as any) }))
      .sort((a, b) => b.count - a.count);
  }, [displayReports]);

  /* ─── Activity Feed (combine reports + notifications) ─── */
  const activities = useMemo((): ActivityItem[] => {
    const items: ActivityItem[] = [];
    const now = Date.now();

    // Recent reports created (last 7 days)
    allReports.filter(r => {
      const d = new Date(r.createdAt);
      return now - d.getTime() < 7 * 86400000;
    }).slice(0, 5).forEach(r => {
      items.push({
        id: `r-${r.id}`, type: 'report_created',
        title: `تقرير جديد: ${r.reportNumber}`,
        subtitle: `${r.beneficiaryName} — ${getPropertyTypeLabel(r.propertyType)}`,
        timestamp: r.createdAt,
        color: colorMap.blue.pie, bg: colorMap.blue.bg,
        icon: <FileText size={14} />,
        link: `/reports/${r.id}`,
      });
    });

    // Recent approvals
    allReports.filter(r => r.status === 'approved' && r.approval?.reviewedAt).slice(0, 3).forEach(r => {
      items.push({
        id: `a-${r.id}`, type: 'report_approved',
        title: `تم اعتماد: ${r.reportNumber}`,
        subtitle: r.approval?.reviewedBy ? `بواسطة ${r.approval.reviewedBy}` : '',
        timestamp: r.approval?.reviewedAt || r.updatedAt,
        color: colorMap.green.pie, bg: colorMap.green.bg,
        icon: <CheckCircle2 size={14} />,
        link: `/reports/${r.id}`,
      });
    });

    // Sort by time and take top 8
    items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return items.slice(0, 8);
  }, [allReports, colorMap]);

  /* ─── Monthly Chart Data ─── */
  const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  const monthlyData = useMemo(() => {
    const now = new Date();
    const result: { month: string; count: number; fees: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const yr = d.getFullYear(), mo = d.getMonth();
      const mReports = displayReports.filter(r => {
        const rd = new Date(r.createdAt);
        return rd.getFullYear() === yr && rd.getMonth() === mo;
      });
      result.push({ month: monthNames[mo], count: mReports.length, fees: mReports.reduce((s, r) => s + (r.fees || 0), 0) });
    }
    return result;
  }, [displayReports]);

  /* ─── Pie Data ─── */
  const pieData = useMemo(() =>
    statusCounts.filter(s => s.count > 0).map(s => ({
      name: s.label, value: s.count, color: colorMap[s.color]?.pie || 'var(--color-text-muted)',
    })),
    [statusCounts, colorMap]
  );

  /* ─── Stat Cards Config ─── */
  const statCards = useMemo(() => {
    if (isAdmin) return [
      { title: 'إجمالي التقارير', value: allReports.length, icon: <FileText size={24} />, color: 'var(--color-primary)', bg: 'var(--color-primary-50)', trend: monthlyTrend.text, trendUp: monthlyTrend.up },
      { title: 'بانتظار الاعتماد', value: pendingApproval, icon: <Send size={24} />, color: 'var(--color-warning)', bg: 'var(--color-warning-bg)', trend: null, trendUp: false },
      { title: 'المعاملات المنجزة', value: approvedCount, icon: <CheckCircle2 size={24} />, color: 'var(--color-success)', bg: 'var(--color-success-bg)', trend: totalReports > 0 ? `${((approvedCount / totalReports) * 100).toFixed(0)}%` : null, trendUp: true },
      { title: 'الأتعاب الكلية', value: formatCurrency(totalFees), icon: <Coins size={24} />, color: 'var(--color-secondary)', bg: 'var(--color-secondary-50)', trend: totalFees > 100 ? formatCurrency(totalFees / totalReports) : null, trendUp: true },
    ];
    if (isReviewer) return [
      { title: 'بانتظار المراجعة', value: pendingApproval, icon: <Send size={24} />, color: 'var(--color-warning)', bg: 'var(--color-warning-bg)', trend: null, trendUp: false },
      { title: 'تم اعتمادها', value: allReports.filter(r => r.status === 'approved').length, icon: <CheckCircle2 size={24} />, color: 'var(--color-success)', bg: 'var(--color-success-bg)', trend: null, trendUp: false },
      { title: 'تم رفضها', value: allReports.filter(r => r.status === 'rejected').length, icon: <Ban size={24} />, color: 'var(--color-danger)', bg: 'var(--color-danger-bg)', trend: null, trendUp: false },
      { title: 'تم إرجاعها', value: allReports.filter(r => r.status === 'needs_revision').length, icon: <RotateCcw size={24} />, color: 'var(--color-warning)', bg: 'var(--color-warning-bg)', trend: null, trendUp: false },
    ];
    return [
      { title: 'تقاريري', value: myReports.length, icon: <FileText size={24} />, color: 'var(--color-primary)', bg: 'var(--color-primary-50)', trend: null, trendUp: false },
      { title: 'قيد الإنجاز', value: myReports.filter(r => ['in_progress', 'pending_approval'].includes(r.status)).length, icon: <Clock size={24} />, color: 'var(--color-primary)', bg: 'var(--color-primary-50)', trend: null, trendUp: false },
      { title: 'بانتظار الاعتماد', value: myReports.filter(r => r.status === 'pending_approval').length, icon: <Send size={24} />, color: 'var(--color-warning)', bg: 'var(--color-warning-bg)', trend: null, trendUp: false },
      { title: 'المنجزة', value: myReports.filter(r => r.status === 'approved').length, icon: <CheckCircle2 size={24} />, color: 'var(--color-success)', bg: 'var(--color-success-bg)', trend: null, trendUp: false },
    ];
  }, [isAdmin, isReviewer, allReports, myReports, dm, monthlyTrend, pendingApproval, approvedCount, totalReports, totalFees]);

  /* ─── Shortcuts ─── */
  const shortcuts = useMemo(() => {
    const items = [];
    if (hasPermission('reports_create')) items.push({ href: '/reports/new', icon: <PlusCircle size={20} />, label: 'تقرير جديد', color: 'var(--color-primary)', bg: 'var(--color-primary-50)' });
    if (hasPermission('reports_view')) items.push({ href: '/reports', icon: <Eye size={20} />, label: 'عرض التقارير', color: 'var(--color-primary)', bg: 'var(--color-primary-50)' });
    if (hasPermission('approvals_view')) items.push({ href: '/approvals', icon: <CheckCircle2 size={20} />, label: 'الاعتمادات', color: 'var(--color-success)', bg: 'var(--color-success-bg)' });
    if (hasPermission('archive_view')) items.push({ href: '/archive', icon: <Archive size={20} />, label: 'الأرشيف', color: 'var(--color-secondary)', bg: 'var(--color-secondary-50)' });
    if (hasPermission('beneficiaries_view')) items.push({ href: '/beneficiaries', icon: <FileText size={20} />, label: 'المستفيدين', color: 'var(--color-accent)', bg: 'var(--color-accent-light)' });
    return items;
  }, [hasPermission, dm]);

  /* ─── Date / Greeting ─── */
  const todayDate = new Date().toLocaleDateString('ar-SA', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const roleLabel = currentUser ? EMPLOYEE_ROLES.find(r => r.value === currentUser.role)?.label : '';
  const greetingText = isAdmin
    ? `${getGreeting()} — مرحباً بك في نظام التثمين العقاري`
    : `${getGreeting()} ${currentUser?.fullName?.split(' ')[0] || ''} — ${roleLabel}`;

  const unreadNotifications = allNotifications.filter(n => !n.isRead);

  /* ─── Chart Styling ─── */
  const tooltipStyle = dm
    ? { borderRadius: 14, border: '1px solid var(--color-border)', fontSize: 13, background: 'var(--color-surface)', color: 'var(--color-text)', boxShadow: '0 12px 32px rgba(0,0,0,0.4)' }
    : { borderRadius: 14, border: '1px solid var(--color-border)', fontSize: 13, boxShadow: 'var(--shadow-lg)' };
  const gridStroke = 'var(--color-border)';
  const axisFill = 'var(--color-text-muted)';

  const pieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.06) return null;
    const RADIAN = Math.PI / 180;
    const r = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + r * Math.cos(-midAngle * RADIAN);
    const y = cy + r * Math.sin(-midAngle * RADIAN);
    return <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={700}>{`${(percent * 100).toFixed(0)}%`}</text>;
  };

  /* ─── Loading State ─── */
  if (loading) return <DashboardSkeleton />;

  /* ─── PROPERTY TYPE COLORS (for breakdown chart) ─── */
  const propertyColors = ['var(--color-primary)', 'var(--color-success)', 'var(--color-warning)', 'var(--color-danger)', 'var(--color-secondary)', 'var(--color-accent)', 'var(--color-danger-light)', 'var(--color-success-light)', 'var(--color-warning-light)'];

  return (
    <ErrorBoundary>
    <div className="animate-fade-in" style={{ direction: 'rtl' }}>

      {/* ════════════════════════════════════════════
          HERO SECTION — Clean, data-focused, spacious
          ════════════════════════════════════════════ */}
      <div className={styles.hero} style={{
        background: 'var(--color-primary)',
        padding: isMobile ? '28px 20px' : '40px 32px',
      }}>
        <div className={styles.heroPattern} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: 0, fontWeight: 500 }}>{todayDate}</p>
              </div>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: 'white', margin: '0 0 6px', letterSpacing: '-0.02em' }}>لوحة التحكم</h1>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', margin: 0, fontWeight: 500 }}>{greetingText}</p>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {hasPermission('reports_create') && (
                <Link href="/reports/new" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 10,
                  padding: '13px 26px', borderRadius: 14,
                  background: 'var(--color-secondary)', color: 'var(--color-surface)',
                  fontWeight: 800, fontSize: 15, textDecoration: 'none',
                  boxShadow: dm ? '0 6px 20px rgba(251, 191, 36, 0.3)' : '0 6px 20px rgba(201, 169, 110, 0.35)',
                  transition: 'all 0.2s ease',
                }}>
                  <PlusCircle size={20} /> إنشاء تقرير جديد
                </Link>
              )}
            </div>
          </div>

          {/* Admin summary pills */}
          {isAdmin && (
            <div style={{ display: 'flex', gap: 14, marginTop: 32, flexWrap: 'wrap' }}>
              {[
                { label: 'إجمالي القيمة المُقيمة', value: formatCurrency(totalValue), icon: <Building2 size={18} /> },
                { label: 'إجمالي الأتعاب', value: formatCurrency(totalFees), icon: <Coins size={18} /> },
                { label: 'نسبة الإنجاز', value: `${totalReports > 0 ? ((approvedCount / totalReports) * 100).toFixed(0) : 0}%`, icon: <TrendingUp size={18} /> },
                { label: 'أنواع العقارات', value: propertyBreakdown.length, icon: <PieChart size={18} /> },
              ].map((item, i) => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: '14px 22px',
                  border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 14, backdropFilter: 'blur(8px)',
                }}>
                  <span style={{ color: 'var(--color-secondary-light)', display: 'flex' }}>{item.icon}</span>
                  <div>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', margin: 0, fontWeight: 600 }}>{item.label}</p>
                    <p style={{ fontSize: 20, fontWeight: 800, color: 'white', margin: '4px 0 0', lineHeight: 1.2 }}>{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════
          STAT CARDS
          ════════════════════════════════════════════ */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 20, marginBottom: 32,
      }}>
        {statCards.map((card, i) => (
          <StatCard key={i} {...card} />
        ))}
      </div>

      {/* ════════════════════════════════════════════
          WEEKLY COMPARISON (Admin)
          ════════════════════════════════════════════ */}
      {isAdmin && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16, marginBottom: 32,
        }}>
          <div className={styles.statCard} style={{ border: '1px solid var(--color-border-light)' }}>
            <div style={{ fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 600, marginBottom: 10 }}>
              تقارير هذا الأسبوع
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <span style={{ fontSize: 32, fontWeight: 800, color: 'var(--color-primary)' }}>{weeklyComparison.thisWeek}</span>
              {weeklyComparison.lastWeek > 0 && (
                <span style={{
                  fontSize: 13, fontWeight: 700,
                  color: weeklyComparison.thisWeek >= weeklyComparison.lastWeek ? 'var(--color-success)' : 'var(--color-danger)',
                  background: weeklyComparison.thisWeek >= weeklyComparison.lastWeek ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
                  padding: '3px 10px', borderRadius: 12,
                }}>
                  {weeklyComparison.thisWeek >= weeklyComparison.lastWeek ? '+' : ''}
                  {weeklyComparison.lastWeek > 0 ? Math.round(((weeklyComparison.thisWeek - weeklyComparison.lastWeek) / weeklyComparison.lastWeek) * 100) : 0}%
                </span>
              )}
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 6 }}>
              الأسبوع الماضي: {weeklyComparison.lastWeek} تقرير
            </div>
          </div>
          <div className={styles.statCard} style={{ border: '1px solid var(--color-border-light)' }}>
            <div style={{ fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 600, marginBottom: 10 }}>
              أتعاب هذا الأسبوع
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <span style={{ fontSize: 32, fontWeight: 800, color: 'var(--color-secondary)' }}>{formatCurrency(weeklyComparison.thisWeekFees)}</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 6 }}>
              الأسبوع الماضي: {formatCurrency(weeklyComparison.lastWeekFees)}
            </div>
          </div>
          <div className={styles.statCard} style={{ border: '1px solid var(--color-border-light)' }}>
            <div style={{ fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 600, marginBottom: 10 }}>
              متوسط الأتعاب
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <span style={{ fontSize: 32, fontWeight: 800, color: 'var(--color-success)' }}>
                {totalReports > 0 ? formatCurrency(totalFees / totalReports) : '—'}
              </span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 6 }}>
              لكل تقرير
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════
          CHARTS ROW — Monthly Bar + Status Donut
          ════════════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: 32 }}>

        {/* Monthly Bar Chart (admin only) */}
        {isAdmin && (
          <div className={styles.statCard} style={{ padding: 28 }}>
            <SectionH
              icon={<BarChart3 size={22} />}
              iconBg="var(--color-primary-50)" iconColor={'var(--color-primary)'}
              title="التقييمات الشهرية" subtitle="عدد التقارير والأتعاب"
            />
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <BarChart data={monthlyData} style={{ direction: 'ltr' }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: axisFill }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: axisFill }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: any, n: any) => [n === 'fees' ? `${v} ر.ع` : v, n === 'fees' ? 'الأتعاب' : 'عدد التقارير']} />
                  <Bar dataKey="count" fill={'var(--color-primary)'} radius={[8, 8, 0, 0]} barSize={32} />
                  <Bar dataKey="fees" fill={'var(--color-secondary)'} radius={[8, 8, 0, 0]} barSize={32} opacity={0.7} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Status Donut */}
        <div className={styles.statCard} style={{ padding: 28 }}>
          <SectionH
            icon={<Zap size={22} />}
            iconBg={'var(--color-warning-bg)'} iconColor={'var(--color-warning)'}
            title="حالة المعاملات" subtitle={`إجمالي ${totalReports} معاملة`}
          />
          {pieData.length > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 20, flexWrap: 'wrap' }}>
              <div style={{ width: 160, height: 160, flexShrink: 0 }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <RechartsPieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={3} dataKey="value" labelLine={false} label={pieLabel}>
                      {pieData.map((entry, idx) => <Cell key={`c-${idx}`} fill={entry.color} stroke="none" />)}
                    </Pie>
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {pieData.slice(0, 5).map(item => {
                  const pct = totalReports > 0 ? ((item.value / totalReports) * 100) : 0;
                  return (
                    <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 12, height: 12, borderRadius: 4, background: item.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: 'var(--color-text-secondary)', flex: 1, fontWeight: 500 }}>{item.name}</span>
                      <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-text)' }}>{item.value}</span>
                      <span style={{ fontSize: 12, color: 'var(--color-text-muted)', width: 38, textAlign: 'left', fontWeight: 600 }}>({pct.toFixed(0)}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className={styles.emptyState}>
              <FileText size={32} className={styles.emptyIcon} />
              <p style={{ fontSize: 14, margin: 0, fontWeight: 500 }}>لا توجد معاملات بعد</p>
              {hasPermission('reports_create') && (
                <Link href="/reports/new" style={{ display: 'inline-block', marginTop: 12, fontSize: 14, color: 'var(--color-secondary)', fontWeight: 700, textDecoration: 'none' }}>
                  + إنشاء أول تقرير
                </Link>
              )}
            </div>
          )}
          {/* Status quick-filter pills */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {statusCounts.filter(s => s.count > 0 && ['pending_approval', 'in_progress', 'needs_revision'].includes(s.value)).map(s => {
              const c = colorMap[s.color] || colorMap.gray;
              return (
                <Link key={s.value} href="/reports" className={styles.statusPill} style={{ background: c.bg, color: c.main, border: `1px solid ${c.main}25` }}>
                  {statusIconMap[s.value]}
                  {s.label}
                  <span className={styles.statusPillCount} style={{ background: c.main, color: 'var(--color-surface)' }}>{s.count}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════
          PROPERTY TYPE BREAKDOWN (Admin)
          ════════════════════════════════════════════ */}
      {isAdmin && propertyBreakdown.length > 0 && (
        <div className={styles.statCard} style={{ padding: 28, marginBottom: 32 }}>
          <SectionH
            icon={<Layers size={22} />}
            iconBg="var(--color-primary-50)" iconColor={'var(--color-primary)'}
            title="توزيع أنواع العقارات" subtitle={`${propertyBreakdown.length} أنواع — ${totalReports} تقرير`}
          />
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: 1, minWidth: 280 }}>
              {propertyBreakdown.map((item, i) => {
                const pct = totalReports > 0 ? (item.count / totalReports) * 100 : 0;
                return (
                  <div key={item.type} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>{item.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>{item.count} ({pct.toFixed(0)}%)</span>
                    </div>
                    <div style={{ height: 8, borderRadius: 4, background: 'var(--color-surface-alt)', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 4,
                        background: propertyColors[i % propertyColors.length],
                        width: `${Math.max(pct, 2)}%`,
                        transition: 'width 0.5s ease',
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════
          RECENT REPORTS + SIDEBAR (Activity/Tasks/Shortcuts)
          ════════════════════════════════════════════ */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 20,
      }}>
        {/* Recent Reports */}
        <div className={styles.statCard} style={{ padding: 28 }}>
          <SectionH
            icon={<FileText size={22} />}
            iconBg="var(--color-primary-50)" iconColor={'var(--color-primary)'}
            title={isAdmin ? 'آخر التقارير' : 'آخر تقاريري'}
            action={hasPermission('reports_view') ? (
              <Link href="/reports" className={styles.linkBtn} style={{
                color: 'var(--color-secondary)', background: 'var(--color-secondary-50)',
              }}>
                عرض الكل <ChevronLeft size={14} />
              </Link>
            ) : undefined}
          />
          {recentReports.length === 0 ? (
            <div className={styles.emptyState}>
              <FileText size={40} className={styles.emptyIcon} />
              <p style={{ fontSize: 15, margin: 0, fontWeight: 500 }}>لا توجد تقارير بعد</p>
              {hasPermission('reports_create') && (
                <Link href="/reports/new" style={{ display: 'inline-block', marginTop: 12, fontSize: 14, color: 'var(--color-secondary)', fontWeight: 700, textDecoration: 'none' }}>
                  + إنشاء تقرير جديد
                </Link>
              )}
            </div>
          ) : (
            <div>
              {recentReports.map((report, idx) => {
                const status = getStatusInfo(report.status);
                return (
                  <Link key={report.id} href={`/reports/${report.id}`} className={styles.reportRow}>
                    <div className={styles.reportIconWrap} style={{ background: 'var(--color-primary-50)', color: 'var(--color-primary)' }}>
                      {getPropertyIcon(report.propertyType)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 3, color: 'var(--color-primary)' }}>{report.reportNumber}</div>
                      <div style={{ fontSize: 13, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: '1 1 auto', minWidth: 0, fontWeight: 500 }}>{report.beneficiaryName}</span>
                        <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--color-text-muted)', opacity: 0.4, flexShrink: 0 }} />
                        <span style={{ fontWeight: 500 }}>{report.bankName}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                      <span className={`badge badge-${status.color}`} style={{ fontSize: 12 }}>{status.label}</span>
                      <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 500 }}>{formatRelative(report.createdAt)}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Side Column: Activity + Tasks + Shortcuts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Activity Feed */}
          <div className={styles.statCard} style={{ padding: 28 }}>
            <SectionH
              icon={<Activity size={22} />}
              iconBg={'var(--color-warning-bg)'} iconColor={'var(--color-warning)'}
              title="آخر النشاطات"
              subtitle={activities.length > 0 ? `آخر ${activities.length} أحداث` : undefined}
            />
            <ActivityFeed activities={activities} />
          </div>

          {/* Quick Actions */}
          {shortcuts.length > 0 && (
            <div className={styles.statCard} style={{ padding: 28 }}>
              <SectionH
                icon={<Sparkles size={22} />}
                iconBg={'var(--color-secondary-50)'}
                iconColor={'var(--color-secondary)'}
                title="اختصارات سريعة"
              />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 12 }}>
                {shortcuts.map(item => (
                  <Link key={item.href} href={item.href} className={styles.shortcutItem} style={{ background: item.bg }}>
                    <div className={styles.shortcutIconWrap} style={{ color: item.color }}>{item.icon}</div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: item.color }}>{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════
          TASKS (full-width for admins/reviewers)
          ════════════════════════════════════════════ */}
      {(hasPermission('tasks_view') || hasPermission('tasks_manage')) && (
        <div className={styles.statCard} style={{ padding: 28, marginTop: 20 }}>
          <SectionH
            icon={<Target size={22} />}
            iconBg={'var(--color-danger-bg)'} iconColor={'var(--color-danger)'}
            title="المهام المعلقة"
            subtitle={tasks.filter(t => t.status !== 'completed').length > 0 ? `${tasks.filter(t => t.status !== 'completed').length} مهمة` : 'جميع المهام منجزة ✓'}
            action={hasPermission('tasks_manage') ? (
              <Link href="/tasks" className={styles.linkBtn} style={{
                color: 'var(--color-secondary)', background: 'var(--color-secondary-50)',
              }}>
                إدارة المهام <ChevronLeft size={14} />
              </Link>
            ) : undefined}
          />
          <TasksPanel tasks={tasks} colorMap={colorMap} dark={dm} />
        </div>
      )}

    </div>
    </ErrorBoundary>
  );
}
