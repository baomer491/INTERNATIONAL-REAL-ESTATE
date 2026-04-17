'use client';

import React, { useState, useMemo } from 'react';
import { store } from '@/lib/store';
import { formatCurrency } from '@/lib/utils';
import { employees, loginLogs, monthlyPerformance } from '@/data/mock';
import { EMPLOYEE_ROLES } from '@/types';
import type { Employee, EmployeeRole } from '@/types';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, AreaChart, Area, Legend,
  PieChart as RechartsPie, Pie, Cell,
} from 'recharts';
import {
  TrendingUp, Users, Clock, Award, BarChart3, Activity,
  FileText, CheckCircle2, Star, Zap, Calendar, ArrowUp, ArrowDown,
  UserCheck, Target, Timer
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map(w => w.charAt(0)).join('');
}

const AVATAR_COLORS = ['#1e3a5f', '#b45309', '#0891b2', '#7c3aed', '#15803d', '#dc2626', '#475569', '#be185d'];
function getAvatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function calcDaysSince(dateStr: string): number {
  const d = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - d.getTime()) / 86400000);
}

export default function EmployeeAnalyticsPage() {
  const { isDark } = useTheme();
  const dm = isDark;
  const allEmployees = store.getEmployees();
  const allLogs = store.getLoginLogs();
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter'>('month');

  const activeEmployees = allEmployees.filter(e => e.status === 'active');
  const appraisers = activeEmployees.filter(e => e.role === 'appraiser');
  const reviewers = activeEmployees.filter(e => e.role === 'reviewer');

  const totalLoginSessions = allLogs.filter(l => l.action === 'login').length;
  const avgSessionsPerEmployee = activeEmployees.length > 0 ? (totalLoginSessions / activeEmployees.length).toFixed(1) : '0';
  const onlineNow = activeEmployees.filter(e => e.isActiveSession).length;

  const perfByEmployee = useMemo(() => {
    const empMap: Record<string, { reports: number; approvals: number; avgTime: number; fees: number; total: number; name: string; role: EmployeeRole; id: string }> = {};
    allEmployees.forEach(e => {
      empMap[e.id] = { reports: 0, approvals: 0, avgTime: 0, fees: 0, total: 0, name: e.fullName, role: e.role, id: e.id };
    });
    monthlyPerformance.forEach(m => {
      const emp = empMap[m.employeeId];
      if (!emp) return;
      emp.reports += m.reports;
      emp.approvals += m.approvals;
      emp.fees += m.fees;
      emp.total += m.reports + m.approvals;
      if (m.avgTime > 0) emp.avgTime = emp.avgTime > 0 ? (emp.avgTime + m.avgTime) / 2 : m.avgTime;
    });
    return Object.values(empMap).filter(e => e.total > 0).sort((a, b) => b.total - a.total);
  }, []);

  const topPerformer = perfByEmployee[0];

  const monthlyProd = useMemo(() => {
    const months = ['يناير', 'فبراير', 'مارس', 'أبريل'];
    const filtered = monthlyPerformance.filter(m =>
      selectedEmployee === 'all' || m.employeeId === selectedEmployee
    );
    return months.map(month => {
      const monthData = filtered.filter(m => m.month === month);
      return {
        month,
        تقارير: monthData.reduce((s, m) => s + m.reports, 0),
        اعتمادات: monthData.reduce((s, m) => s + m.approvals, 0),
      };
    });
  }, [selectedEmployee]);

  const monthlyAvgTime = useMemo(() => {
    const months = ['يناير', 'فبراير', 'مارس', 'أبريل'];
    const filtered = monthlyPerformance.filter(m =>
      m.avgTime > 0 && (selectedEmployee === 'all' || m.employeeId === selectedEmployee)
    );
    return months.map(month => {
      const monthData = filtered.filter(m => m.month === month);
      const avg = monthData.length > 0 ? +(monthData.reduce((s, m) => s + m.avgTime, 0) / monthData.length).toFixed(1) : 0;
      return { month, متوسط_الأيام: avg };
    });
  }, [selectedEmployee]);

  const loginActivity = useMemo(() => {
    const days: Record<string, { date: string; logins: number; logouts: number }> = {};
    allLogs.forEach(l => {
      const d = new Date(l.timestamp).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' });
      if (!days[d]) days[d] = { date: d, logins: 0, logouts: 0 };
      if (l.action === 'login') days[d].logins++;
      else days[d].logouts++;
    });
    if (selectedEmployee !== 'all') {
      const empLogs = allLogs.filter(l => l.employeeId === selectedEmployee);
      const empDays: Record<string, { date: string; logins: number; logouts: number }> = {};
      empLogs.forEach(l => {
        const d = new Date(l.timestamp).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' });
        if (!empDays[d]) empDays[d] = { date: d, logins: 0, logouts: 0 };
        if (l.action === 'login') empDays[d].logins++;
        else empDays[d].logouts++;
      });
      return Object.values(empDays).slice(-7);
    }
    return Object.values(days).slice(-7);
  }, [selectedEmployee]);

  const radarData = useMemo(() => {
    const top3 = perfByEmployee.slice(0, 3);
    return [
      { metric: 'التقارير', ...Object.fromEntries(top3.map(e => [e.name, e.reports])) },
      { metric: 'الاعتمادات', ...Object.fromEntries(top3.map(e => [e.name, e.approvals])) },
      { metric: 'الأتعاب', ...Object.fromEntries(top3.map(e => [e.name, Math.round(e.fees / 1000)])) },
      { metric: 'السرعة', ...Object.fromEntries(top3.map(e => [e.name, Math.round((5 - Math.min(e.avgTime, 5)) / 5 * 100)])) },
    ];
  }, []);

  const radarColors = ['#1e3a5f', '#b45309', '#7c3aed'];

  const roleDist = useMemo(() => {
    const counts: Record<string, number> = {};
    activeEmployees.forEach(e => { counts[e.role] = (counts[e.role] || 0) + 1; });
    return EMPLOYEE_ROLES.filter(r => counts[r.value]).map(r => ({
      name: r.label, value: counts[r.value], color: r.color,
    }));
  }, []);

  const feesArea = useMemo(() => {
    const months = ['يناير', 'فبراير', 'مارس', 'أبريل'];
    const topEmps = perfByEmployee.filter(e => e.fees > 0).slice(0, 3);
    return months.map(month => {
      const row: Record<string, any> = { month };
      topEmps.forEach(e => {
        const fee = monthlyPerformance
          .filter(m => m.employeeId === e.id && m.month === month)
          .reduce((s, m) => s + m.fees, 0);
        row[e.name] = fee;
      });
      return row;
    });
  }, []);

  const feesColors = ['#1e3a5f', '#b45309', '#0891b2'];

  const selectedData = selectedEmployee !== 'all'
    ? allEmployees.find(e => e.id === selectedEmployee)
    : null;

  const selectedPerf = perfByEmployee.find(e => e.id === selectedEmployee);
  const selectedLogs = selectedEmployee !== 'all'
    ? allLogs.filter(l => l.employeeId === selectedEmployee)
    : allLogs;

  const kpiCards = [
    { title: 'الموظفون النشط', value: activeEmployees.length, icon: <UserCheck size={20} />, color: dm ? '#34d399' : '#15803d', bg: dm ? '#14532d' : '#dcfce7', sub: `من ${allEmployees.length} إجمالي` },
    { title: 'متصل الآن', value: onlineNow, icon: <Activity size={20} />, color: dm ? '#22d3ee' : '#0891b2', bg: dm ? '#164e63' : '#cffafe', sub: `${((onlineNow / activeEmployees.length) * 100).toFixed(0)}% من النشطين` },
    { title: 'إجمالي الجلسات', value: totalLoginSessions, icon: <Calendar size={20} />, color: dm ? '#60a5fa' : '#1e3a5f', bg: dm ? '#1e3a5f' : '#e8eef6', sub: `${String(avgSessionsPerEmployee)} لكل موظف` },
    { title: 'أفضل أداء', value: topPerformer?.name || '—', icon: <Award size={20} />, color: dm ? '#fbbf24' : '#b45309', bg: dm ? '#451a03' : '#fef3c7', sub: `${topPerformer ? String(String(topPerformer.total)) + ' معاملة' : ''}` },
  ];

  const cardStyle = { padding: '20px' };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <TrendingUp size={28} color="var(--color-primary)" />
            تحليل أداء الموظفين
          </h1>
          <p style={{ fontSize: 14, color: 'var(--color-text-muted)', margin: 0 }}>
            تقارير وإحصائيات شاملة عن أداء فريق العمل
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select value={period} onChange={(e) => setPeriod(e.target.value as any)}
            style={{ padding: '9px 14px', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', appearance: 'none' }}>
            <option value="week">آخر أسبوع</option>
            <option value="month">هذا الشهر</option>
            <option value="quarter">هذا الربع</option>
          </select>
          <select value={selectedEmployee} onChange={(e) => setSelectedEmployee(e.target.value)}
            style={{ padding: '9px 14px', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', appearance: 'none', minWidth: 160 }}>
            <option value="all">كل الموظفين</option>
            {activeEmployees.map(e => <option key={e.id} value={e.id}>{e.fullName}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 24 }}>
        {kpiCards.map((kpi, i) => (
          <div key={i} className="card" style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: '0 0 6px', fontWeight: 500 }}>{kpi.title}</p>
                <p style={{ fontSize: typeof kpi.value === 'number' ? 28 : 18, fontWeight: 800, color: kpi.color, margin: 0, lineHeight: 1.3 }}>
                  {typeof kpi.value === 'number' ? String(String(kpi.value)) : kpi.value}
                </p>
                {kpi.sub && <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: '4px 0 0' }}>{kpi.sub}</p>}
              </div>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: kpi.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: kpi.color }}>{kpi.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {selectedData && selectedPerf && (
        <div className="card" style={{ marginBottom: 24, padding: '24px', borderRight: `4px solid ${getAvatarColor(selectedData.id)}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: getAvatarColor(selectedData.id), display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 20, fontWeight: 700, flexShrink: 0 }}>
              {getInitials(selectedData.fullName)}
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 4px' }}>{selectedData.fullName}</h3>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span className="badge" style={{ background: `${EMPLOYEE_ROLES.find(r => r.value === selectedData.role)?.color}15`, color: EMPLOYEE_ROLES.find(r => r.value === selectedData.role)?.color }}>
                  {EMPLOYEE_ROLES.find(r => r.value === selectedData.role)?.label}
                </span>
                <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{selectedData.department}</span>
                <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>انضم: {String(new Date(selectedData.joinDate).toLocaleDateString('en-US'))}</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
            {[
              { label: 'التقارير', value: selectedPerf.reports, icon: <FileText size={16} />, color: dm ? '#60a5fa' : '#1e3a5f' },
              { label: 'الاعتمادات', value: selectedPerf.approvals, icon: <CheckCircle2 size={16} />, color: dm ? '#34d399' : '#15803d' },
              { label: 'متوسط الوقت', value: `${String(selectedPerf.avgTime.toFixed(1))} يوم`, icon: <Timer size={16} />, color: dm ? '#fbbf24' : '#b45309' },
              { label: 'الأتعاب', value: formatCurrency(selectedPerf.fees), icon: <Star size={16} />, color: dm ? '#a78bfa' : '#7c3aed' },
              { label: 'جلسات الدخول', value: selectedLogs.filter(l => l.action === 'login').length, icon: <Calendar size={16} />, color: dm ? '#22d3ee' : '#0891b2' },
              { label: 'الحالة', value: selectedData.isActiveSession ? 'متصل' : 'غير متصل', icon: selectedData.isActiveSession ? <Activity size={16} /> : <Clock size={16} />, color: selectedData.isActiveSession ? '#22c55e' : dm ? 'var(--color-text-muted)' : '#94a3b8' },
            ].map((item, i) => (
              <div key={i} style={{ padding: '14px 16px', background: dm ? 'var(--color-surface-alt)' : '#f8fafc', borderRadius: 10, border: dm ? '1px solid var(--color-border)' : '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <span style={{ color: item.color }}>{item.icon}</span>
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{item.label}</span>
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: item.color }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="card" style={cardStyle}>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart3 size={20} color="var(--color-primary)" />
            الإنتاج الشهري
          </h3>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyProd} style={{ direction: 'ltr' }}>
                <CartesianGrid strokeDasharray="3 3" stroke={dm ? 'var(--color-border)' : '#e2e8f0'} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: dm ? '#94a3b8' : '#64748b' }} />
                <YAxis tick={{ fontSize: 12, fill: dm ? '#94a3b8' : '#64748b' }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: dm ? '1px solid var(--color-border)' : '1px solid #e2e8f0', fontSize: 13 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="تقارير" fill={dm ? '#3b82f6' : '#1e3a5f'} radius={[4, 4, 0, 0]} />
                <Bar dataKey="اعتمادات" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card" style={cardStyle}>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={20} color={dm ? '#a78bfa' : '#7c3aed'} />
            الأتعاب الشهرية
          </h3>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={feesArea} style={{ direction: 'ltr' }}>
                <CartesianGrid strokeDasharray="3 3" stroke={dm ? 'var(--color-border)' : '#e2e8f0'} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: dm ? '#94a3b8' : '#64748b' }} />
                <YAxis tick={{ fontSize: 12, fill: dm ? '#94a3b8' : '#64748b' }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: dm ? '1px solid var(--color-border)' : '1px solid #e2e8f0', fontSize: 13 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {perfByEmployee.filter(e => e.fees > 0).slice(0, 3).map((emp, i) => (
                  <Area key={emp.id} type="monotone" dataKey={emp.name}
                    stroke={feesColors[i]} fill={`${feesColors[i]}20`}
                    strokeWidth={2} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="card" style={cardStyle}>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={20} color={dm ? '#22d3ee' : '#0891b2'} />
            نشاط الدخول
          </h3>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={loginActivity} style={{ direction: 'ltr' }}>
                <CartesianGrid strokeDasharray="3 3" stroke={dm ? 'var(--color-border)' : '#e2e8f0'} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: dm ? '#94a3b8' : '#64748b' }} />
                <YAxis tick={{ fontSize: 12, fill: dm ? '#94a3b8' : '#64748b' }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: dm ? '1px solid var(--color-border)' : '1px solid #e2e8f0', fontSize: 13 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="logins" stroke={dm ? '#60a5fa' : '#1e3a5f'} strokeWidth={2} dot={{ r: 4, fill: dm ? '#60a5fa' : '#1e3a5f' }} />
                <Line type="monotone" dataKey="logouts" stroke="#ef4444" strokeWidth={2} dot={{ r: 4, fill: '#ef4444' }} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card" style={cardStyle}>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Target size={20} color={dm ? '#fbbf24' : '#b45309'} />
            متوسط وقت الإنجاز (أيام)
          </h3>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyAvgTime} style={{ direction: 'ltr' }}>
                <CartesianGrid strokeDasharray="3 3" stroke={dm ? 'var(--color-border)' : '#e2e8f0'} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: dm ? '#94a3b8' : '#64748b' }} />
                <YAxis tick={{ fontSize: 12, fill: dm ? '#94a3b8' : '#64748b' }} domain={[0, 6]} />
                <Tooltip contentStyle={{ borderRadius: 8, border: dm ? '1px solid var(--color-border)' : '1px solid #e2e8f0', fontSize: 13 }} />
                <Line type="monotone" dataKey="متوسط_الأيام" stroke={dm ? '#fbbf24' : '#b45309'} strokeWidth={3} dot={{ r: 6, fill: dm ? '#fbbf24' : '#b45309', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="card" style={cardStyle}>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Award size={20} color={dm ? '#a78bfa' : '#7c3aed'} />
            مقارنة أفضل 3 موظفين
          </h3>
          <div style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} style={{ direction: 'ltr' }}>
                <PolarGrid stroke={dm ? 'var(--color-border)' : '#e2e8f0'} />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12, fill: dm ? 'var(--color-text-secondary)' : '#475569' }} />
                <PolarRadiusAxis tick={{ fontSize: 10, fill: dm ? 'var(--color-text-muted)' : '#94a3b8' }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: dm ? '1px solid var(--color-border)' : '1px solid #e2e8f0', fontSize: 13 }} />
                {perfByEmployee.slice(0, 3).map((emp, i) => (
                  <Radar key={emp.id} name={emp.name} dataKey={emp.name}
                    stroke={radarColors[i]} fill={`${radarColors[i]}25`}
                    strokeWidth={2} />
                ))}
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card" style={cardStyle}>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={20} color="var(--color-primary)" />
            توزيع الأدوار
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-muted)', marginRight: 'auto' }}>
              {String(String(activeEmployees.length))} موظف نشط
            </span>
          </h3>
          <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
            <div style={{ width: 200, height: 200, flexShrink: 0, position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <Pie data={roleDist} cx="50%" cy="50%" outerRadius={90} innerRadius={55}
                    paddingAngle={4} dataKey="value" startAngle={90} endAngle={-270}
                    strokeWidth={0}>
                    {roleDist.map((entry, index) => (
                      <Cell key={index} fill={entry.color}
                        stroke={dm ? 'var(--color-surface)' : 'white'} strokeWidth={3} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8, border: dm ? '1px solid var(--color-border)' : '1px solid #e2e8f0', fontSize: 13, direction: 'rtl' }} />
                </RechartsPie>
              </ResponsiveContainer>
              <div style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)', textAlign: 'center',
              }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-text)', lineHeight: 1 }}>{String(String(activeEmployees.length))}</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 500 }}>موظف نشط</div>
              </div>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {roleDist.map((item, i) => {
                const pct = activeEmployees.length > 0 ? ((item.value / activeEmployees.length) * 100) : 0;
                const empList = activeEmployees.filter(e => e.role === EMPLOYEE_ROLES.find(r => r.label === item.name)?.value);
                return (
                  <div key={i} style={{
                    padding: '12px 16px', borderRadius: 12,
                    background: `${item.color}08`,
                    border: `1px solid ${item.color}20`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 10, height: 10, borderRadius: 3,
                          background: item.color,
                        }} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: item.color }}>{item.name}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                        <span style={{ fontSize: 18, fontWeight: 800, color: item.color }}>{String(String(item.value))}</span>
                        <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 600 }}>
                          ({pct.toFixed(0)}%)
                        </span>
                      </div>
                    </div>
                    <div style={{ height: 5, borderRadius: 3, background: `${item.color}15`, overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 3, width: `${pct}%`, background: item.color, transition: 'width 0.5s ease' }} />
                    </div>
                    <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {empList.map(emp => (
                        <span key={emp.id} style={{
                          fontSize: 11, padding: '2px 8px', borderRadius: 6,
                          background: dm ? 'var(--color-surface)' : 'white', color: dm ? 'var(--color-text-secondary)' : '#475569',
                          border: `1px solid ${item.color}30`,
                        }}>
                          {emp.fullName.split(' ')[0]}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 24 }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Star size={20} color="var(--color-secondary)" />
            ترتيب أداء الموظفين
          </h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>الموظف</th>
                <th>الدور</th>
                <th>التقارير</th>
                <th>الاعتمادات</th>
                <th>متوسط الوقت</th>
                <th>الأتعاب</th>
                <th>التقييم</th>
              </tr>
            </thead>
            <tbody>
              {perfByEmployee.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-muted)' }}>لا توجد بيانات أداء</td></tr>
              ) : perfByEmployee.map((emp, i) => {
                const score = Math.min(100, Math.round(
                  (emp.total / (perfByEmployee[0]?.total || 1)) * 50 +
                  ((5 - Math.min(emp.avgTime, 5)) / 5) * 30 +
                  (emp.fees / (perfByEmployee.reduce((s, e) => Math.max(s, e.fees), 0) || 1)) * 20
                ));
                const scoreColor = score >= 80 ? (dm ? '#34d399' : '#15803d') : score >= 50 ? (dm ? '#fbbf24' : '#b45309') : '#b91c1c';
                const scoreBg = score >= 80 ? (dm ? '#14532d' : '#dcfce7') : score >= 50 ? (dm ? '#451a03' : '#fef3c7') : (dm ? '#450a0a' : '#fee2e2');
                const rankIcon = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`;
                const roleInfo = EMPLOYEE_ROLES.find(r => r.value === emp.role);
                return (
                  <tr key={emp.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedEmployee(emp.id)}>
                    <td style={{ fontWeight: 800, fontSize: 16, textAlign: 'center', width: 40 }}>{rankIcon}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: '50%', background: getAvatarColor(emp.id), display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                          {getInitials(emp.name)}
                        </div>
                        <span style={{ fontWeight: 600 }}>{emp.name}</span>
                      </div>
                    </td>
                    <td><span className="badge" style={{ background: `${roleInfo?.color}15`, color: roleInfo?.color, fontSize: 12 }}>{roleInfo?.label}</span></td>
                    <td style={{ fontWeight: 700 }}>{String(String(emp.reports))}</td>
                    <td style={{ fontWeight: 700 }}>{String(String(emp.approvals))}</td>
                    <td>{emp.avgTime > 0 ? String(emp.avgTime.toFixed(1)) + ' يوم' : '—'}</td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(emp.fees)}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 8, borderRadius: 4, background: dm ? 'var(--color-surface-alt)' : '#f1f5f9', overflow: 'hidden', minWidth: 60 }}>
                          <div style={{ height: '100%', borderRadius: 4, width: `${score}%`, background: scoreColor, transition: 'width 0.5s' }} />
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 800, color: scoreColor, minWidth: 32, textAlign: 'center' }}>
                          {String(String(score))}
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

      <div className="card" style={cardStyle}>
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Activity size={20} color="var(--color-primary)" />
          آخر نشاطات الدخول
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto' }}>
          {allLogs.slice(0, 15).map(log => {
            const emp = allEmployees.find(e => e.id === log.employeeId);
            const d = new Date(log.timestamp);
            return (
              <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: dm ? 'var(--color-surface-alt)' : '#f8fafc', borderRadius: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: emp ? getAvatarColor(emp.id) : (dm ? 'var(--color-text-muted)' : '#94a3b8'),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontSize: 12, fontWeight: 700, flexShrink: 0,
                }}>
                  {emp ? getInitials(emp.fullName) : '?'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{log.employeeName}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'monospace', direction: 'ltr', textAlign: 'right' }}>{log.ipAddress}</div>
                </div>
                <span style={{
                  padding: '4px 12px', borderRadius: 12, fontSize: 11, fontWeight: 700,
                  background: log.action === 'login' ? (dm ? '#14532d' : '#dcfce7') : (dm ? '#450a0a' : '#fee2e2'),
                  color: log.action === 'login' ? (dm ? '#34d399' : '#15803d') : '#b91c1c',
                }}>
                  {log.action === 'login' ? 'دخول' : 'خروج'}
                </span>
                <span style={{ fontSize: 12, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                  {String(d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }))}
                </span>
                <span style={{ fontSize: 12, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                  {String(d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' }))}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
