'use client';

import React, { useState, useMemo } from 'react';
import { store } from '@/lib/store';
import { formatCurrency } from '@/lib/utils';
import { EMPLOYEE_ROLES } from '@/types';
import type { Employee, EmployeeRole, Report } from '@/types';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, AreaChart, Area, Legend,
  PieChart as RechartsPie, Pie, Cell,
} from 'recharts';
import {
  Clock, Award, BarChart3, Activity,
  FileText, CheckCircle2, Star, Calendar,
  UserCheck, Target, Timer, ChevronDown, Crown,
  Sparkles, Shield,
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

/* ─── helpers ─── */
function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map(w => w.charAt(0)).join('');
}

const AVATAR_COLORS = ['#1e3a5f', '#b45309', '#0891b2', '#7c3aed', '#15803d', '#dc2626', '#475569', '#be185d'];
function getAvatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

const AR_MONTHS = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

function getMonthKey(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function periodRange(period: 'week' | 'month' | 'quarter'): Date {
  const now = new Date();
  const ms = period === 'week' ? 7 : period === 'month' ? 30 : 90;
  return new Date(now.getTime() - ms * 86400000);
}

interface EmpPerf {
  id: string;
  name: string;
  role: EmployeeRole;
  reportsCreated: number;
  reportsApproved: number;
  totalFees: number;
  avgCompletionDays: number;
  total: number;
  monthlyReports: Record<string, number>;
  monthlyApprovals: Record<string, number>;
  monthlyFees: Record<string, number>;
}

/* ─── Premium Design Constants ─── */
const GOLD = '#c9a96e';
const GOLD_LIGHT = '#e0c080';
const GOLD_BG = 'rgba(201,169,110,0.08)';
const GOLD_BORDER = 'rgba(201,169,110,0.18)';
const NAVY = '#0f1d33';
const TEAL = '#4ecdc4';

/* ─── Chart Color Palette ─── */
const CHART_COLORS = [GOLD, '#4ecdc4', '#0f1d33', '#f43f5e', '#38bdf8', '#22c55e', '#7c3aed'];

export default function EmployeeAnalyticsPage() {
  const { isDark } = useTheme();
  const dm = isDark;

  const allEmployees = store.getEmployees();
  const allLogs = store.getLoginLogs();
  const allReports = store.getReports();

  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter'>('month');
  const [chartsOpen, setChartsOpen] = useState(true);

  const activeEmployees = allEmployees.filter(e => e.status === 'active');
  const periodStart = periodRange(period);

  const reportsInPeriod = useMemo(() =>
    allReports.filter(r => new Date(r.createdAt) >= periodStart),
    [allReports, periodStart]
  );

  const perfByEmployee = useMemo<EmpPerf[]>(() => {
    const map: Record<string, EmpPerf> = {};
    activeEmployees.forEach(e => {
      map[e.id] = {
        id: e.id, name: e.fullName, role: e.role,
        reportsCreated: 0, reportsApproved: 0, totalFees: 0,
        avgCompletionDays: 0, total: 0,
        monthlyReports: {}, monthlyApprovals: {}, monthlyFees: {},
      };
    });
    const completionDays: Record<string, number[]> = {};
    reportsInPeriod.forEach(r => {
      const mk = getMonthKey(r.createdAt);
      if (r.appraiserId && map[r.appraiserId]) {
        const emp = map[r.appraiserId];
        emp.reportsCreated++;
        emp.monthlyReports[mk] = (emp.monthlyReports[mk] || 0) + 1;
        emp.totalFees += r.fees || 0;
        emp.monthlyFees[mk] = (emp.monthlyFees[mk] || 0) + (r.fees || 0);
        if (r.status === 'approved' && r.approval?.reviewedAt) {
          const days = Math.max(0, (new Date(r.approval.reviewedAt).getTime() - new Date(r.createdAt).getTime()) / 86400000);
          if (!completionDays[r.appraiserId]) completionDays[r.appraiserId] = [];
          completionDays[r.appraiserId].push(days);
        }
      }
      if (r.approval?.reviewedBy) {
        const reviewer = Object.values(map).find(e => e.name === r.approval?.reviewedBy);
        if (reviewer) {
          reviewer.reportsApproved++;
          reviewer.monthlyApprovals[mk] = (reviewer.monthlyApprovals[mk] || 0) + 1;
        }
      }
    });
    Object.keys(map).forEach(id => {
      const emp = map[id];
      emp.total = emp.reportsCreated + emp.reportsApproved;
      if (completionDays[id] && completionDays[id].length > 0) {
        emp.avgCompletionDays = completionDays[id].reduce((a, b) => a + b, 0) / completionDays[id].length;
      }
    });
    return Object.values(map).filter(e => e.total > 0).sort((a, b) => b.total - a.total);
  }, [reportsInPeriod, activeEmployees]);

  const topPerformer = perfByEmployee[0];

  const logsInPeriod = useMemo(() =>
    allLogs.filter(l => new Date(l.timestamp) >= periodStart),
    [allLogs, periodStart]
  );

  const totalLoginSessions = logsInPeriod.filter(l => l.action === 'login').length;
  const avgSessionsPerEmployee = activeEmployees.length > 0 ? (totalLoginSessions / activeEmployees.length).toFixed(1) : '0';
  const onlineNow = activeEmployees.filter(e => e.isActiveSession).length;

  const monthlyProd = useMemo(() => {
    const monthKeys = new Set<string>();
    reportsInPeriod.forEach(r => monthKeys.add(getMonthKey(r.createdAt)));
    const sorted = Array.from(monthKeys).sort();
    return sorted.map(mk => {
      const m = parseInt(mk.split('-')[1]) - 1;
      const filtered = reportsInPeriod.filter(r => {
        if (selectedEmployee !== 'all' && r.appraiserId !== selectedEmployee) return false;
        return getMonthKey(r.createdAt) === mk;
      });
      return {
        month: AR_MONTHS[m] || mk,
        تقارير: filtered.filter(r => r.status !== 'draft').length,
        اعتمادات: filtered.filter(r => r.status === 'approved').length,
      };
    });
  }, [reportsInPeriod, selectedEmployee]);

  const monthlyAvgTime = useMemo(() => {
    const monthKeys = new Set<string>();
    reportsInPeriod.forEach(r => monthKeys.add(getMonthKey(r.createdAt)));
    const sorted = Array.from(monthKeys).sort();
    return sorted.map(mk => {
      const m = parseInt(mk.split('-')[1]) - 1;
      const filtered = reportsInPeriod.filter(r => {
        if (selectedEmployee !== 'all' && r.appraiserId !== selectedEmployee) return false;
        return r.status === 'approved' && r.approval?.reviewedAt && getMonthKey(r.createdAt) === mk;
      });
      const avg = filtered.length > 0
        ? +(filtered.reduce((s, r) => {
            const days = (new Date(r.approval!.reviewedAt!).getTime() - new Date(r.createdAt).getTime()) / 86400000;
            return s + Math.max(0, days);
          }, 0) / filtered.length).toFixed(1) : 0;
      return { month: AR_MONTHS[m] || mk, متوسط_الأيام: avg };
    });
  }, [reportsInPeriod, selectedEmployee]);

  const loginActivity = useMemo(() => {
    const logs = selectedEmployee !== 'all' ? logsInPeriod.filter(l => l.employeeId === selectedEmployee) : logsInPeriod;
    const days: Record<string, { date: string; logins: number; logouts: number }> = {};
    logs.forEach(l => {
      const d = new Date(l.timestamp).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' });
      if (!days[d]) days[d] = { date: d, logins: 0, logouts: 0 };
      if (l.action === 'login') days[d].logins++;
      else days[d].logouts++;
    });
    return Object.values(days).slice(-14);
  }, [logsInPeriod, selectedEmployee]);

  const radarData = useMemo(() => {
    const top3 = perfByEmployee.slice(0, 3);
    if (top3.length === 0) return [];
    return [
      { metric: 'التقارير', ...Object.fromEntries(top3.map(e => [e.name, e.reportsCreated])) },
      { metric: 'الاعتمادات', ...Object.fromEntries(top3.map(e => [e.name, e.reportsApproved])) },
      { metric: 'الأتعاب', ...Object.fromEntries(top3.map(e => [e.name, Math.round(e.totalFees / 1000)])) },
      { metric: 'السرعة', ...Object.fromEntries(top3.map(e => [e.name, Math.round((5 - Math.min(e.avgCompletionDays, 5)) / 5 * 100)])) },
    ];
  }, [perfByEmployee]);

  const roleDist = useMemo(() => {
    const counts: Record<string, number> = {};
    activeEmployees.forEach(e => { counts[e.role] = (counts[e.role] || 0) + 1; });
    return EMPLOYEE_ROLES.filter(r => counts[r.value]).map(r => ({
      name: r.label, value: counts[r.value], color: r.color,
    }));
  }, [activeEmployees]);

  const feesArea = useMemo(() => {
    const monthKeys = new Set<string>();
    reportsInPeriod.forEach(r => monthKeys.add(getMonthKey(r.createdAt)));
    const sorted = Array.from(monthKeys).sort();
    const topEmps = perfByEmployee.filter(e => e.totalFees > 0).slice(0, 3);
    return sorted.map(mk => {
      const m = parseInt(mk.split('-')[1]) - 1;
      const row: Record<string, any> = { month: AR_MONTHS[m] || mk };
      topEmps.forEach(e => { row[e.name] = e.monthlyFees[mk] || 0; });
      return row;
    });
  }, [reportsInPeriod, perfByEmployee]);

  const selectedData = selectedEmployee !== 'all' ? allEmployees.find(e => e.id === selectedEmployee) : null;
  const selectedPerf = perfByEmployee.find(e => e.id === selectedEmployee);
  const selectedLogs = selectedEmployee !== 'all' ? logsInPeriod.filter(l => l.employeeId === selectedEmployee) : logsInPeriod;

  const periodLabel = period === 'week' ? 'آخر أسبوع' : period === 'month' ? 'هذا الشهر' : 'هذا الربع';

  /* ─── Reusable Components ─── */

  const premiumCard: React.CSSProperties = {
    background: 'var(--color-surface)',
    border: `1px solid ${dm ? 'rgba(201,169,110,0.1)' : 'var(--color-border)'}`,
    borderRadius: 20,
    padding: '24px 28px',
    boxShadow: dm ? '0 4px 20px rgba(0,0,0,0.3)' : 'var(--shadow-card)',
    transition: 'all 0.3s ease',
    position: 'relative',
    overflow: 'hidden',
  };

  const sectionHeader = (icon: React.ReactNode, title: string, subtitle?: string, accent?: string) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
      <div style={{
        width: 42, height: 42, borderRadius: 14,
        background: accent
          ? `${accent}15`
          : dm ? 'rgba(201,169,110,0.12)' : 'rgba(201,169,110,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: accent || GOLD,
        border: `1px solid ${accent ? accent + '20' : GOLD_BORDER}`,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.01em' }}>{title}</div>
        {subtitle && <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 500, marginTop: 1 }}>{subtitle}</div>}
      </div>
    </div>
  );

  /* ─── KPI Definitions ─── */
  const kpiCards = [
    {
      label: 'الموظفون النشطون',
      value: activeEmployees.length,
      total: allEmployees.length,
      icon: <UserCheck size={21} />,
      color: '#22c55e',
      bg: dm ? 'rgba(34,197,94,0.1)' : 'rgba(34,197,94,0.08)',
      period: `${periodLabel}`,
    },
    {
      label: 'متصل الآن',
      value: onlineNow,
      icon: <Activity size={21} />,
      color: '#38bdf8',
      bg: dm ? 'rgba(56,189,248,0.1)' : 'rgba(56,189,248,0.08)',
      period: `${activeEmployees.length > 0 ? ((onlineNow / activeEmployees.length) * 100).toFixed(0) : 0}% من النشطين`,
    },
    {
      label: 'جلسات الدخول',
      value: totalLoginSessions,
      icon: <Calendar size={21} />,
      color: GOLD,
      bg: dm ? 'rgba(201,169,110,0.1)' : 'rgba(201,169,110,0.08)',
      period: `~${avgSessionsPerEmployee} لكل موظف`,
    },
    {
      label: 'أفضل أداء',
      value: topPerformer?.name || '—',
      icon: <Crown size={21} />,
      color: '#f59e0b',
      bg: dm ? 'rgba(245,158,11,0.1)' : 'rgba(245,158,11,0.08)',
      period: topPerformer ? `${topPerformer.total} عملية` : '',
      isText: true,
    },
  ];

  return (
    <div className="animate-fade-in" style={{ padding: '0 4px' }}>
      {/* ═══════════════════════════════════════════ */}
      {/* PREMIUM HEADER */}
      {/* ═══════════════════════════════════════════ */}
      <div style={{
        background: dm
          ? 'linear-gradient(145deg, #0f1522 0%, #0f1d33 40%, #1a2535 100%)'
          : 'linear-gradient(145deg, #0f1d33 0%, #142542 60%, #1a3050 100%)',
        borderRadius: 24,
        padding: '28px 34px',
        marginBottom: 28,
        position: 'relative',
        overflow: 'hidden',
        border: dm ? '1px solid rgba(201,169,110,0.12)' : '1px solid rgba(255,255,255,0.08)',
        boxShadow: dm ? '0 8px 32px rgba(0,0,0,0.4)' : '0 12px 40px rgba(15,29,51,0.3)',
      }}>
        {/* Decorative gold line top */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`,
          opacity: 0.7,
        }}></div>

        {/* Background decorative circles */}
        <div style={{
          position: 'absolute', top: -60, right: -40,
          width: 200, height: 200, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(201,169,110,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}></div>
        <div style={{
          position: 'absolute', bottom: -30, left: 80,
          width: 140, height: 140, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(78,205,196,0.05) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}></div>

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            {/* Icon container with gold border */}
            <div style={{
              width: 60, height: 60, borderRadius: 18,
              background: 'rgba(255,255,255,0.08)',
              border: '1.5px solid rgba(201,169,110,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 4px 20px rgba(201,169,110,0.1)',
            }}>
              <Sparkles size={28} color={GOLD} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2 }}>
                <h1 style={{ fontSize: 28, fontWeight: 800, color: 'white', margin: 0, letterSpacing: '-0.02em' }}>
                  تحليل أداء الموظفين
                </h1>
                <span style={{
                  fontSize: 10, fontWeight: 700, color: GOLD,
                  padding: '3px 10px', borderRadius: 20,
                  background: 'rgba(201,169,110,0.15)',
                  border: '1px solid rgba(201,169,110,0.25)',
                  letterSpacing: '0.05em',
                }}>
                  PREMIUM
                </span>
              </div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', margin: 0, fontWeight: 400 }}>
                Employee Performance Analytics · بيانات حقيقية من الفترة المحددة
              </p>
            </div>
          </div>

          {/* Filter controls */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{
              display: 'flex', borderRadius: 14,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              overflow: 'hidden',
              backdropFilter: 'blur(4px)',
            }}>
              {(['week', 'month', 'quarter'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  style={{
                    padding: '10px 18px',
                    fontSize: 12, fontWeight: 700,
                    fontFamily: 'inherit',
                    background: period === p ? 'rgba(201,169,110,0.2)' : 'transparent',
                    color: period === p ? GOLD : 'rgba(255,255,255,0.6)',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.25s ease',
                    borderLeft: p !== 'quarter' ? '1px solid rgba(255,255,255,0.08)' : 'none',
                  }}>
                  {p === 'week' ? 'أسبوع' : p === 'month' ? 'شهر' : 'ربع'}
                </button>
              ))}
            </div>

            <select value={selectedEmployee} onChange={(e) => setSelectedEmployee(e.target.value)}
              style={{
                padding: '10px 18px', borderRadius: 14,
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.06)',
                color: 'white', fontSize: 13, fontWeight: 600,
                fontFamily: 'inherit',
                cursor: 'pointer', direction: 'rtl',
                backdropFilter: 'blur(4px)',
                minWidth: 160,
                outline: 'none',
              }}>
              <option value="all" style={{ color: '#0f172a' }}>🎯 كل الموظفين</option>
              {activeEmployees.map(e => (
                <option key={e.id} value={e.id} style={{ color: '#0f172a' }}>
                  {e.fullName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Bottom stats row */}
        <div style={{
          position: 'relative',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 14,
          marginTop: 22,
          paddingTop: 20,
          borderTop: '1px solid rgba(255,255,255,0.08)',
        }}>
          <QuickStat icon={<FileText size={16} />} label="التقارير" value={reportsInPeriod.length} color="rgba(255,255,255,0.9)" />
          <QuickStat icon={<Crown size={16} />} label="أفضل موظف" value={topPerformer?.name || '—'} color={GOLD} />
          <QuickStat icon={<Activity size={16} />} label="متصل الآن" value={`${onlineNow} موظف`} color="#22c55e" />
          <QuickStat icon={<BarChart3 size={16} />} label="نسبة الإنجاز" value={reportsInPeriod.length > 0 ? `${Math.round((reportsInPeriod.filter(r => r.status === 'approved').length / reportsInPeriod.length) * 100)}%` : '0%'} color={TEAL} />
        </div>
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* KPI CARDS */}
      {/* ═══════════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 16, marginBottom: 28 }}>
        {kpiCards.map((kpi, i) => (
          <div key={i} style={{
            ...premiumCard,
            padding: '22px 24px',
          }}>
            {/* Gold accent bar top */}
            <div style={{
              position: 'absolute', top: 0, left: 16, right: 16, height: 2,
              borderRadius: '0 0 4px 4px',
              background: `linear-gradient(90deg, ${kpi.color}, transparent)`,
              opacity: 0.6,
            }}></div>

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', paddingTop: 4 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 11, color: 'var(--color-text-muted)', margin: '0 0 8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {kpi.label}
                </p>
                <p style={{
                  fontSize: kpi.isText ? 17 : 32,
                  fontWeight: 800, color: kpi.color, margin: 0, lineHeight: 1.2,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  letterSpacing: '-0.02em',
                }}>
                  {kpi.value}
                </p>
                {kpi.total !== undefined && (
                  <p style={{ fontSize: 11, color: dm ? '#475569' : '#94a3b8', margin: '3px 0 0', fontWeight: 500 }}>
                    من {kpi.total} إجمالي
                  </p>
                )}
                {kpi.period && (
                  <p style={{ fontSize: 11, color: 'var(--color-text-muted)', margin: '4px 0 0', fontWeight: 500 }}>
                    {kpi.period}
                  </p>
                )}
              </div>
              <div style={{
                width: 50, height: 50, borderRadius: 16,
                background: kpi.bg,
                border: `1px solid ${kpi.color}20`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: kpi.color,
                flexShrink: 0,
                boxShadow: `0 4px 12px ${kpi.color}10`,
              }}>
                {kpi.icon}
              </div>
            </div>

            {/* Bottom progress indicator */}
            <div style={{
              marginTop: 14,
              height: 3, borderRadius: 2,
              background: 'var(--color-surface-alt)',
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', borderRadius: 2,
                width: `${Math.min(100, i === 0 ? (activeEmployees.length / Math.max(allEmployees.length, 1) * 100) : i === 1 ? (onlineNow / Math.max(activeEmployees.length, 1) * 100) : i === 2 ? 75 : topPerformer ? Math.min(100, (topPerformer.total / Math.max(perfByEmployee.reduce((s, e) => Math.max(s, e.total), 0), 1)) * 100) : 0)}%`,
                background: `linear-gradient(90deg, ${kpi.color}, ${kpi.color}80)`,
                transition: 'width 1s ease',
              }}></div>
            </div>
          </div>
        ))}
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* TOP PERFORMER HERO */}
      {/* ═══════════════════════════════════════════ */}
      {topPerformer && (
        <div style={{
          ...premiumCard,
          marginBottom: 28,
          background: dm
            ? 'linear-gradient(135deg, #0f1522 0%, #1a2028 100%)'
            : 'linear-gradient(135deg, #fefefe 0%, #faf8f3 100%)',
          border: dm
            ? '1px solid rgba(201,169,110,0.25)'
            : '1px solid rgba(201,169,110,0.3)',
          boxShadow: dm
            ? '0 4px 24px rgba(201,169,110,0.08)'
            : '0 4px 24px rgba(201,169,110,0.12)',
        }}>
          {/* Gold corner accents */}
          <div style={{ position: 'absolute', top: 0, left: 0, width: 80, height: 80, borderTop: `2px solid ${GOLD}30`, borderLeft: `2px solid ${GOLD}30`, borderRadius: '20px 0 0 0' }}></div>
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: 80, height: 80, borderBottom: `2px solid ${GOLD}30`, borderRight: `2px solid ${GOLD}30`, borderRadius: '0 0 20px 0' }}></div>

          {/* Floating decorative element */}
          <div style={{
            position: 'absolute', top: -15, left: 40,
            width: 48, height: 48, borderRadius: 14,
            background: 'linear-gradient(135deg, #f59e0b, #c9a96e)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(245,158,11,0.3)',
            transform: 'rotate(-5deg)',
          }}>
            <Crown size={22} color="white" />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap', position: 'relative' }}>
            {/* Avatar */}
            <div style={{
              width: 80, height: 80, borderRadius: 22,
              background: 'linear-gradient(145deg, #fbbf24, #c9a96e, #b88a44)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontSize: 26, fontWeight: 900, flexShrink: 0,
              boxShadow: '0 8px 28px rgba(201,169,110,0.35)',
              position: 'relative',
            }}>
              {getInitials(topPerformer.name)}
              {/* Shine effect */}
              <div style={{
                position: 'absolute', inset: 0, borderRadius: 22,
                background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 50%)',
              }}></div>
            </div>

            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <Crown size={16} color={GOLD} />
                <span style={{ fontSize: 12, fontWeight: 700, color: GOLD, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  أفضل أداء · EMPLOYEE OF THE PERIOD
                </span>
              </div>
              <h3 style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-text)', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
                {topPerformer.name}
              </h3>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{
                  padding: '4px 12px', borderRadius: 14,
                  background: `${EMPLOYEE_ROLES.find(r => r.value === topPerformer.role)?.color}15`,
                  border: `1px solid ${EMPLOYEE_ROLES.find(r => r.value === topPerformer.role)?.color}25`,
                  color: EMPLOYEE_ROLES.find(r => r.value === topPerformer.role)?.color,
                  fontSize: 12, fontWeight: 700,
                }}>
                  {EMPLOYEE_ROLES.find(r => r.value === topPerformer.role)?.label}
                </span>
                <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 500 }}>
                  {topPerformer.reportsCreated} تقرير · {topPerformer.reportsApproved} اعتماد
                </span>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {[
                { label: 'التقارير', value: topPerformer.reportsCreated, color: 'var(--color-primary)' },
                { label: 'الاعتمادات', value: topPerformer.reportsApproved, color: '#22c55e' },
                { label: 'الأتعاب', value: formatCurrency(topPerformer.totalFees), color: GOLD },
                { label: 'أيام الإنجاز', value: topPerformer.avgCompletionDays > 0 ? `${topPerformer.avgCompletionDays.toFixed(1)} ي` : '—', color: TEAL },
              ].map((stat, i) => (
                <div key={i} style={{
                  textAlign: 'center',
                  padding: '14px 20px',
                  background: dm ? 'rgba(15,21,34,0.6)' : 'rgba(255,255,255,0.8)',
                  borderRadius: 16,
                  border: `1px solid ${stat.color}15`,
                  minWidth: 85,
                }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: stat.color, lineHeight: 1.2 }}>{stat.value}</div>
                  <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 4, fontWeight: 600 }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* SELECTED EMPLOYEE DETAIL */}
      {/* ═══════════════════════════════════════════ */}
      {selectedData && selectedPerf && (
        <div style={{
          ...premiumCard,
          marginBottom: 28,
          borderRight: `3px solid ${getAvatarColor(selectedData.id)}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 20,
              background: `linear-gradient(135deg, ${getAvatarColor(selectedData.id)}, ${getAvatarColor(selectedData.id)}dd)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontSize: 20, fontWeight: 800, flexShrink: 0,
              boxShadow: `0 4px 16px ${getAvatarColor(selectedData.id)}30`,
              position: 'relative',
            }}>
              {getInitials(selectedData.fullName)}
              <div style={{
                position: 'absolute', inset: 0, borderRadius: 20,
                background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 50%)',
              }}></div>
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 5px', color: 'var(--color-text)', letterSpacing: '-0.01em' }}>
                {selectedData.fullName}
              </h3>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{
                  padding: '3px 12px', borderRadius: 14,
                  background: `${EMPLOYEE_ROLES.find(r => r.value === selectedData.role)?.color}15`,
                  border: `1px solid ${EMPLOYEE_ROLES.find(r => r.value === selectedData.role)?.color}25`,
                  color: EMPLOYEE_ROLES.find(r => r.value === selectedData.role)?.color,
                  fontSize: 12, fontWeight: 700,
                }}>
                  {EMPLOYEE_ROLES.find(r => r.value === selectedData.role)?.label}
                </span>
                <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 500 }}>
                  {selectedData.department || 'بدون قسم'}
                </span>
                {selectedData.isActiveSession && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#22c55e', fontWeight: 700 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px rgba(34,197,94,0.5)', animation: 'pulse 2s infinite' }}></span>
                    متصل الآن
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => setSelectedEmployee('all')}
              style={{
                padding: '9px 18px', borderRadius: 14,
                border: '1px solid var(--color-border)',
                background: 'transparent',
                color: 'var(--color-text-muted)',
                cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 600,
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.color = GOLD; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}
            >
              عرض الكل ←
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
            {[
              { label: 'التقارير', value: selectedPerf.reportsCreated, icon: <FileText size={16} />, color: 'var(--color-primary)' },
              { label: 'الاعتمادات', value: selectedPerf.reportsApproved, icon: <CheckCircle2 size={16} />, color: '#22c55e' },
              { label: 'متوسط الإنجاز', value: selectedPerf.avgCompletionDays > 0 ? `${selectedPerf.avgCompletionDays.toFixed(1)} يوم` : '—', icon: <Timer size={16} />, color: TEAL },
              { label: 'الأتعاب', value: formatCurrency(selectedPerf.totalFees), icon: <Star size={16} />, color: GOLD },
              { label: 'جلسات الدخول', value: selectedLogs.filter(l => l.action === 'login').length, icon: <Calendar size={16} />, color: '#38bdf8' },
              { label: 'حالة الاتصال', value: selectedData.isActiveSession ? 'متصل' : 'غير متصل', icon: selectedData.isActiveSession ? <Activity size={16} /> : <Clock size={16} />, color: selectedData.isActiveSession ? '#22c55e' : 'var(--color-text-muted)' },
            ].map((item, i) => (
              <div key={i} style={{
                padding: '16px 18px',
                background: 'var(--color-bg)',
                borderRadius: 16,
                border: `1px solid ${item.color}15`,
                transition: 'all 0.2s ease',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                  <span style={{ color: item.color, opacity: 0.8 }}>{item.icon}</span>
                  <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600 }}>{item.label}</span>
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: item.color, letterSpacing: '-0.01em' }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* CHARTS SECTION */}
      {/* ═══════════════════════════════════════════ */}
      <div style={{ marginBottom: 28 }}>
        <button
          onClick={() => setChartsOpen(!chartsOpen)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            width: '100%', background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'inherit', padding: '0 0 16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 14,
              background: dm ? 'rgba(201,169,110,0.12)' : 'rgba(201,169,110,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: GOLD,
              border: `1px solid ${GOLD_BORDER}`,
            }}>
              <BarChart3 size={20} />
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>الرسوم البيانية التفصيلية</div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 500 }}>الإنتاج · الأتعاب · الدخول · وقت الإنجاز</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600 }}>
              {chartsOpen ? 'إخفاء' : 'عرض'}
            </span>
            <ChevronDown size={18} color={GOLD}
              style={{ transform: chartsOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.35s ease' }} />
          </div>
        </button>

        {chartsOpen && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 18 }}>
            {/* Monthly Production */}
            <div style={premiumCard}>
              {sectionHeader(<BarChart3 size={19} />, 'الإنتاج الشهري', 'التقارير المنجزة والاعتمادات')}
              {monthlyProd.length === 0 ? (
                <EmptyChart />
              ) : (
                <div style={{ height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <BarChart data={monthlyProd} style={{ direction: 'ltr' }}>
                      <defs>
                        <linearGradient id="gradReports" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={GOLD} stopOpacity={0.9} />
                          <stop offset="100%" stopColor={GOLD} stopOpacity={0.3} />
                        </linearGradient>
                        <linearGradient id="gradApprovals" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={TEAL} stopOpacity={0.9} />
                          <stop offset="100%" stopColor={TEAL} stopOpacity={0.3} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" strokeOpacity={0.4} />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--color-text-muted)', fontWeight: 500 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)', fontWeight: 500 }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: 16,
                          border: `1px solid ${GOLD_BORDER}`,
                          background: 'var(--color-surface)',
                          fontSize: 13,
                          boxShadow: 'var(--shadow-lg)',
                        }}
                        cursor={{ fill: 'var(--color-surface-alt)' }}
                      />
                      <Legend wrapperStyle={{ fontSize: 12, fontWeight: 600 }} />
                      <Bar dataKey="تقارير" fill="url(#gradReports)" radius={[6, 6, 0, 0]} barSize={32} />
                      <Bar dataKey="اعتمادات" fill="url(#gradApprovals)" radius={[6, 6, 0, 0]} barSize={32} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Fees Area */}
            <div style={premiumCard}>
              {sectionHeader(<Sparkles size={19} />, 'الأتعاب الشهرية', 'إجمالي أتعاب أفضل الموظفين')}
              {feesArea.length === 0 ? (
                <EmptyChart />
              ) : (
                <div style={{ height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <AreaChart data={feesArea} style={{ direction: 'ltr' }}>
                      <defs>
                        {perfByEmployee.filter(e => e.totalFees > 0).slice(0, 3).map((emp, i) => (
                          <linearGradient key={emp.id} id={`grad${emp.id}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={CHART_COLORS[i]} stopOpacity={0.3} />
                            <stop offset="100%" stopColor={CHART_COLORS[i]} stopOpacity={0.02} />
                          </linearGradient>
                        ))}
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" strokeOpacity={0.4} />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--color-text-muted)', fontWeight: 500 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)', fontWeight: 500 }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: 16,
                          border: `1px solid ${GOLD_BORDER}`,
                          background: 'var(--color-surface)',
                          fontSize: 13,
                          boxShadow: 'var(--shadow-lg)',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 12, fontWeight: 600 }} />
                      {perfByEmployee.filter(e => e.totalFees > 0).slice(0, 3).map((emp, i) => (
                        <Area
                          key={emp.id}
                          type="monotone"
                          dataKey={emp.name}
                          stroke={CHART_COLORS[i]}
                          fill={`url(#grad${emp.id})`}
                          strokeWidth={2.5}
                          dot={{ r: 4, fill: CHART_COLORS[i], strokeWidth: 0 }}
                          activeDot={{ r: 6, stroke: CHART_COLORS[i], strokeWidth: 2, fill: 'var(--color-surface)' }}
                        />
                      ))}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Login Activity */}
            <div style={premiumCard}>
              {sectionHeader(<Activity size={19} />, 'نشاط الدخول', 'سجلات آخر 14 يوماً')}
              {loginActivity.length === 0 ? (
                <EmptyChart />
              ) : (
                <div style={{ height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <LineChart data={loginActivity} style={{ direction: 'ltr' }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" strokeOpacity={0.4} />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-text-muted)', fontWeight: 500 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)', fontWeight: 500 }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: 16,
                          border: `1px solid ${GOLD_BORDER}`,
                          background: 'var(--color-surface)',
                          fontSize: 13,
                          boxShadow: 'var(--shadow-lg)',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 12, fontWeight: 600 }} />
                      <Line type="monotone" dataKey="logins" name="دخول" stroke={GOLD} strokeWidth={2.5}
                        dot={{ r: 5, fill: GOLD, strokeWidth: 0 }}
                        activeDot={{ r: 7, stroke: GOLD, strokeWidth: 2, fill: 'var(--color-surface)' }} />
                      <Line type="monotone" dataKey="logouts" name="خروج" stroke="#f43f5e" strokeWidth={2}
                        dot={{ r: 4, fill: '#f43f5e', strokeWidth: 0 }}
                        strokeDasharray="5 4"
                        activeDot={{ r: 6, stroke: '#f43f5e', strokeWidth: 2, fill: 'var(--color-surface)' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Avg Completion Time */}
            <div style={premiumCard}>
              {sectionHeader(<Target size={19} />, 'متوسط وقت الإنجاز', 'بالأيام — الأقل أفضل')}
              {monthlyAvgTime.length === 0 ? (
                <EmptyChart />
              ) : (
                <div style={{ height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <LineChart data={monthlyAvgTime} style={{ direction: 'ltr' }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" strokeOpacity={0.4} />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--color-text-muted)', fontWeight: 500 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)', fontWeight: 500 }} axisLine={false} tickLine={false} domain={[0, 'auto']} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: 16,
                          border: `1px solid ${GOLD_BORDER}`,
                          background: 'var(--color-surface)',
                          fontSize: 13,
                          boxShadow: 'var(--shadow-lg)',
                        }}
                      />
                      <Line type="monotone" dataKey="متوسط_الأيام" name="متوسط الأيام" stroke={TEAL} strokeWidth={3}
                        dot={{ r: 6, fill: TEAL, strokeWidth: 2, stroke: 'var(--color-surface)' }}
                        activeDot={{ r: 8, stroke: TEAL, strokeWidth: 3, fill: 'var(--color-surface)' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* RADAR + ROLE DISTRIBUTION */}
      {/* ═══════════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 20, marginBottom: 28 }}>
        {/* Radar Comparison */}
        <div style={premiumCard}>
          {sectionHeader(<Award size={19} />, 'مقارنة الأداء', 'الرادار — أفضل 3 موظفين')}
          {radarData.length === 0 ? (
            <EmptyChart h={300} />
          ) : (
            <div style={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <RadarChart data={radarData} style={{ direction: 'ltr' }}>
                  <PolarGrid stroke="var(--color-border)" strokeOpacity={0.5} />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12, fill: 'var(--color-text-secondary)', fontWeight: 600 }} />
                  <PolarRadiusAxis tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 16,
                      border: `1px solid ${GOLD_BORDER}`,
                      background: 'var(--color-surface)',
                      fontSize: 13,
                      boxShadow: 'var(--shadow-lg)',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, fontWeight: 600 }} />
                  {perfByEmployee.slice(0, 3).map((emp, i) => (
                    <Radar
                      key={emp.id}
                      name={emp.name}
                      dataKey={emp.name}
                      stroke={CHART_COLORS[i]}
                      fill={CHART_COLORS[i]}
                      fillOpacity={0.08}
                      strokeWidth={2}
                      dot={{ r: 3, fill: CHART_COLORS[i] }}
                    />
                  ))}
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Role Distribution */}
        <div style={premiumCard}>
          {sectionHeader(<Shield size={19} />, 'توزيع الأدوار', `${activeEmployees.length} موظف نشط`)}
          <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ width: 170, height: 170, flexShrink: 0, position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <RechartsPie>
                  <Pie data={roleDist} cx="50%" cy="50%" outerRadius={80} innerRadius={50}
                    paddingAngle={5} dataKey="value" startAngle={90} endAngle={-270}
                    strokeWidth={0}>
                    {roleDist.map((entry, index) => (
                      <Cell key={index} fill={entry.color} stroke="var(--color-surface)" strokeWidth={4} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: 16,
                      border: `1px solid ${GOLD_BORDER}`,
                      background: 'var(--color-surface)',
                      fontSize: 13,
                      direction: 'rtl',
                      boxShadow: 'var(--shadow-lg)',
                    }}
                  />
                </RechartsPie>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: GOLD, lineHeight: 1, letterSpacing: '-0.02em' }}>{activeEmployees.length}</div>
                <div style={{ fontSize: 10, color: 'var(--color-text-muted)', fontWeight: 600, marginTop: 2 }}>موظف</div>
              </div>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, minWidth: 200 }}>
              {roleDist.map((item, i) => {
                const pct = activeEmployees.length > 0 ? ((item.value / activeEmployees.length) * 100) : 0;
                return (
                  <div key={i} style={{
                    padding: '12px 16px', borderRadius: 14,
                    background: `${item.color}08`,
                    border: `1.5px solid ${item.color}18`,
                    transition: 'all 0.2s ease',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 3, background: item.color, boxShadow: `0 2px 6px ${item.color}40` }}></div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>{item.name}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                        <span style={{ fontSize: 18, fontWeight: 800, color: item.color }}>{item.value}</span>
                        <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600 }}>({pct.toFixed(0)}%)</span>
                      </div>
                    </div>
                    <div style={{ height: 5, borderRadius: 3, background: `${item.color}12`, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 3,
                        width: `${pct}%`,
                        background: `linear-gradient(90deg, ${item.color}, ${item.color}90)`,
                        boxShadow: `0 0 8px ${item.color}30`,
                        transition: 'width 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* PERFORMANCE LEADERBOARD */}
      {/* ═══════════════════════════════════════════ */}
      <div style={{
        ...premiumCard,
        padding: 0,
        marginBottom: 28,
      }}>
        <div style={{
          padding: '20px 28px',
          borderBottom: `1px solid ${GOLD_BORDER}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 14,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 14,
              background: dm ? 'rgba(201,169,110,0.12)' : 'rgba(201,169,110,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: GOLD,
              border: `1px solid ${GOLD_BORDER}`,
            }}>
              <Star size={20} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>ترتيب الأداء</div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 500 }}>
                {reportsInPeriod.length} تقرير · {perfByEmployee.length} موظف نشط
              </div>
            </div>
          </div>
          <div style={{
            padding: '6px 16px', borderRadius: 20,
            background: `linear-gradient(135deg, ${GOLD}20, ${GOLD}08)`,
            fontSize: 12, fontWeight: 700,
            color: GOLD,
            border: `1px solid ${GOLD_BORDER}`,
          }}>
            {perfByEmployee.length} موظف نشط
          </div>
        </div>

        <div style={{ overflowX: 'auto', padding: '4px 0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', margin: 0 }}>
            <thead>
              <tr>
                <th style={{ width: 48, padding: '14px 16px', fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center', borderBottom: `2px solid ${GOLD_BORDER}` }}>#</th>
                <th style={{ padding: '14px 16px', fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right', borderBottom: `2px solid ${GOLD_BORDER}` }}>الموظف</th>
                <th style={{ padding: '14px 16px', fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right', borderBottom: `2px solid ${GOLD_BORDER}` }}>الدور</th>
                <th style={{ padding: '14px 16px', fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center', borderBottom: `2px solid ${GOLD_BORDER}` }}>تقارير</th>
                <th style={{ padding: '14px 16px', fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center', borderBottom: `2px solid ${GOLD_BORDER}` }}>اعتمادات</th>
                <th style={{ padding: '14px 16px', fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center', borderBottom: `2px solid ${GOLD_BORDER}` }}>الإنجاز</th>
                <th style={{ padding: '14px 16px', fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right', borderBottom: `2px solid ${GOLD_BORDER}` }}>الأتعاب</th>
                <th style={{ padding: '14px 16px', fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center', borderBottom: `2px solid ${GOLD_BORDER}`, minWidth: 120 }}>التقييم</th>
              </tr>
            </thead>
            <tbody>
              {perfByEmployee.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div style={{ textAlign: 'center', padding: 64, color: 'var(--color-text-muted)' }}>
                      <BarChart3 size={48} style={{ marginBottom: 16, opacity: 0.2 }} />
                      <p style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>لا توجد بيانات أداء — قم بإنشاء تقارير لتظهر هنا</p>
                      <p style={{ fontSize: 12, margin: '6px 0 0', opacity: 0.6 }}>يتم احتساب الأداء تلقائياً من التقارير المُنشأة</p>
                    </div>
                  </td>
                </tr>
              ) : perfByEmployee.map((emp, i) => {
                const maxTotal = perfByEmployee[0]?.total || 1;
                const maxFees = perfByEmployee.reduce((s, e) => Math.max(s, e.totalFees), 0) || 1;
                const score = Math.min(100, Math.round(
                  (emp.total / maxTotal) * 50 +
                  ((5 - Math.min(emp.avgCompletionDays, 5)) / 5) * 30 +
                  (emp.totalFees / maxFees) * 20
                ));
                const scoreColor = score >= 80 ? '#22c55e' : score >= 50 ? GOLD : '#f43f5e';
                const scoreBg = score >= 80 ? 'rgba(34,197,94,0.08)' : score >= 50 ? 'rgba(201,169,110,0.08)' : 'rgba(244,63,94,0.08)';
                const rankEmoji = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null;
                const isTopThree = i < 3;
                const roleInfo = EMPLOYEE_ROLES.find(r => r.value === emp.role);

                return (
                  <tr
                    key={emp.id}
                    onClick={() => setSelectedEmployee(emp.id)}
                    style={{
                      cursor: 'pointer',
                      background: isTopThree ? (dm ? 'rgba(201,169,110,0.03)' : 'rgba(201,169,110,0.02)') : 'transparent',
                      transition: 'background 0.2s ease',
                      borderBottom: `1px solid ${isTopThree ? GOLD_BORDER : 'var(--color-border)'}`,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = dm ? 'var(--color-surface-hover)' : '#faf8f3'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = isTopThree ? (dm ? 'rgba(201,169,110,0.03)' : 'rgba(201,169,110,0.02)') : 'transparent'; }}
                  >
                    <td style={{ textAlign: 'center', padding: '16px' }}>
                      {rankEmoji ? (
                        <span style={{ fontSize: 22, lineHeight: 1 }}>{rankEmoji}</span>
                      ) : (
                        <span style={{
                          fontSize: 13, fontWeight: 700,
                          color: dm ? '#4f5d75' : '#94a3b8',
                          width: 28, height: 28, borderRadius: '50%',
                          background: 'var(--color-surface-alt)',
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {i + 1}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 38, height: 38, borderRadius: '50%',
                          background: isTopThree
                            ? 'linear-gradient(135deg, #c9a96e, #e0c080)'
                            : `linear-gradient(135deg, ${getAvatarColor(emp.id)}, ${getAvatarColor(emp.id)}dd)`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'white', fontSize: 13, fontWeight: 700, flexShrink: 0,
                          boxShadow: isTopThree ? '0 4px 12px rgba(201,169,110,0.3)' : undefined,
                        }}>
                          {getInitials(emp.name)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-text)' }}>{emp.name}</div>
                          {isTopThree && (
                            <div style={{ fontSize: 10, color: GOLD, fontWeight: 600, marginTop: 1 }}>
                              {rankEmoji} المركز {i + 1 === 1 ? 'الأول' : i + 1 === 2 ? 'الثاني' : 'الثالث'}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{
                        padding: '4px 12px', borderRadius: 14,
                        background: `${roleInfo?.color}15`,
                        border: `1px solid ${roleInfo?.color}25`,
                        color: roleInfo?.color,
                        fontSize: 12, fontWeight: 700,
                      }}>
                        {roleInfo?.label}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center', padding: '16px' }}>
                      <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--color-text)' }}>{emp.reportsCreated}</span>
                    </td>
                    <td style={{ textAlign: 'center', padding: '16px' }}>
                      <span style={{ fontWeight: 700, fontSize: 15, color: '#22c55e' }}>{emp.reportsApproved}</span>
                    </td>
                    <td style={{ textAlign: 'center', padding: '16px', fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 500 }}>
                      {emp.avgCompletionDays > 0 ? `${emp.avgCompletionDays.toFixed(1)} يوم` : '—'}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: GOLD }}>{formatCurrency(emp.totalFees)}</span>
                    </td>
                    <td style={{ padding: '16px', minWidth: 130 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          flex: 1, height: 8, borderRadius: 5,
                          background: 'var(--color-surface-alt)',
                          overflow: 'hidden',
                        }}>
                          <div style={{
                            height: '100%', borderRadius: 5,
                            width: `${score}%`,
                            background: `linear-gradient(90deg, ${scoreColor}, ${scoreColor}dd)`,
                            boxShadow: `0 0 6px ${scoreColor}30`,
                            transition: 'width 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
                          }}></div>
                        </div>
                        <span style={{
                          fontSize: 14, fontWeight: 800, color: scoreColor,
                          minWidth: 32, textAlign: 'center',
                          padding: '2px 8px', borderRadius: 8,
                          background: scoreBg,
                        }}>
                          {score}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* RECENT LOGIN ACTIVITY */}
      {/* ═══════════════════════════════════════════ */}
      <div style={premiumCard}>
        {sectionHeader(<Clock size={19} />, 'آخر نشاطات الدخول', `${logsInPeriod.length} حدث في ${periodLabel}`)}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 380, overflowY: 'auto' }}>
          {logsInPeriod.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 48, color: 'var(--color-text-muted)' }}>
              <Clock size={36} style={{ marginBottom: 12, opacity: 0.2 }} />
              <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>لا توجد سجلات نشاط</p>
            </div>
          ) : logsInPeriod.slice(0, 20).map(log => {
            const emp = allEmployees.find(e => e.id === log.employeeId);
            const d = new Date(log.timestamp);
            return (
              <div key={log.id} style={{
                display: 'flex', alignItems: 'center', gap: 16,
                padding: '12px 16px',
                background: 'var(--color-bg)',
                borderRadius: 16,
                border: `1px solid ${log.action === 'login' ? 'rgba(34,197,94,0.12)' : 'rgba(244,63,94,0.12)'}`,
                transition: 'all 0.2s ease',
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: emp ? `linear-gradient(135deg, ${getAvatarColor(emp.id)}, ${getAvatarColor(emp.id)}dd)` : 'var(--color-text-secondary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontSize: 13, fontWeight: 700, flexShrink: 0,
                  position: 'relative',
                }}>
                  {emp ? getInitials(emp.fullName) : '?'}
                  <div style={{
                    position: 'absolute', bottom: -1, right: -1,
                    width: 10, height: 10, borderRadius: '50%',
                    background: log.action === 'login' ? '#22c55e' : '#f43f5e',
                    border: '2px solid var(--color-bg)',
                  }}></div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', marginBottom: 2 }}>
                    {log.employeeName}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'monospace', direction: 'ltr', textAlign: 'right', fontWeight: 500 }}>
                    {log.ipAddress}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                  <span style={{
                    padding: '5px 12px', borderRadius: 14,
                    fontSize: 11, fontWeight: 700,
                    background: log.action === 'login' ? 'rgba(34,197,94,0.1)' : 'rgba(244,63,94,0.1)',
                    color: log.action === 'login' ? '#22c55e' : '#f43f5e',
                    border: `1px solid ${log.action === 'login' ? 'rgba(34,197,94,0.2)' : 'rgba(244,63,94,0.2)'}`,
                  }}>
                    {log.action === 'login' ? '● دخول' : '○ خروج'}
                  </span>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                      {d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--color-text-muted)', fontWeight: 500 }}>
                      {d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── Sub-components ─── */

function QuickStat({ icon, label, value, color }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{
        width: 36, height: 36, borderRadius: 12,
        background: 'rgba(255,255,255,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: color,
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 500, marginBottom: 1 }}>{label}</div>
        <div style={{
          fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.9)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {value}
        </div>
      </div>
    </div>
  );
}

function EmptyChart({ h }: { h?: number }) {
  const H = h || 240;
  return (
    <div style={{
      height: H, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      color: 'var(--color-text-muted)', fontSize: 13,
      gap: 8,
    }}>
      <BarChart3 size={32} style={{ opacity: 0.2 }} />
      <span style={{ fontWeight: 600 }}>لا توجد بيانات كافية</span>
      <span style={{ fontSize: 11, opacity: 0.6 }}>قم بإنشاء تقارير لعرض التحليلات</span>
    </div>
  );
}
