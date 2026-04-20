'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { store } from '@/lib/store';
import { formatRelative } from '@/lib/utils';
import { useApp } from '@/components/layout/AppContext';
import { useRealtime } from '@/hooks/useRealtime';
import { broadcastChange } from '@/lib/realtime-engine';
import {
  Bell, CheckCircle2, FileText, AlertCircle, Settings, Clock,
  CheckCheck, Eye, Trash2, Filter
} from 'lucide-react';

const iconMap: Record<string, React.ReactNode> = {
  approval: <CheckCircle2 size={20} />,
  report: <FileText size={20} />,
  task: <AlertCircle size={20} />,
  system: <Settings size={20} />,
  reminder: <Clock size={20} />,
};

const colorMap: Record<string, { bg: string; color: string }> = {
  approval: { bg: 'var(--color-success-bg, #dcfce7)', color: 'var(--color-success)' },
  report: { bg: 'var(--color-info-bg, #dbeafe)', color: 'var(--color-info)' },
  task: { bg: 'var(--color-warning-bg, #fef3c7)', color: 'var(--color-warning)' },
  system: { bg: 'var(--color-surface-alt)', color: 'var(--color-text-secondary)' },
  reminder: { bg: 'var(--color-danger-bg, #fee2e2)', color: 'var(--color-danger)' },
};

type FilterTab = 'all' | 'approval' | 'report' | 'system';

const tabs: { value: FilterTab; label: string }[] = [
  { value: 'all', label: 'الكل' },
  { value: 'approval', label: 'الاعتمادات' },
  { value: 'report', label: 'التقارير' },
  { value: 'system', label: 'النظام' },
];

export default function NotificationsPage() {
  const { refreshNotifications, showToast } = useApp();
  const { data: notifications, refresh: refreshNotificationsLocal } = useRealtime('notifications', () => store.getNotifications());
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const filtered = activeTab === 'all' ? notifications : notifications.filter(n => n.type === activeTab);
  const unread = notifications.filter(n => !n.isRead).length;

  const markRead = (id: string) => {
    store.markAsRead(id);
    broadcastChange('notifications');
    refreshNotifications();
  };

  const markAll = () => {
    store.markAllAsRead();
    broadcastChange('notifications');
    refreshNotifications();
    showToast('تم تحديد الكل كمقروء', 'success');
  };

  const deleteNotification = (id: string) => {
    store.deleteNotification(id);
    broadcastChange('notifications');
    refreshNotifications();
  };

  const clearRead = () => {
    store.clearReadNotifications();
    broadcastChange('notifications');
    refreshNotifications();
    showToast('تم حذف التنبيهات المقروءة', 'success');
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px' }}>التنبيهات</h1>
          <p style={{ fontSize: 14, color: 'var(--color-text-muted)', margin: 0 }}>
            {unread} تنبيه غير مقروء من أصل {notifications.length}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {unread > 0 && (
            <button onClick={markAll} className="btn btn-outline btn-sm">
              <CheckCheck size={16} /> تحديد الكل كمقروء
            </button>
          )}
          {notifications.some(n => n.isRead) && (
            <button onClick={clearRead} className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger)' }}>
              <Trash2 size={16} /> مسح المقروءة
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
        {tabs.map(tab => {
          const count = tab.value === 'all' ? filtered.length : filtered.filter(n => n.type === tab.value).length;
          const isActive = activeTab === tab.value;
          return (
            <button key={tab.value} onClick={() => setActiveTab(tab.value)} style={{
              padding: '8px 18px', borderRadius: 8, border: 'none',
              background: isActive ? 'var(--color-primary)' : 'var(--color-surface-alt)',
              color: isActive ? 'white' : 'var(--color-text-secondary)',
              fontWeight: 600, fontSize: 13, fontFamily: 'inherit',
              cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s',
            }}>
              {tab.label}
              <span style={{
                marginLeft: 6, fontSize: 11, fontWeight: 700,
                color: isActive ? 'rgba(255,255,255,0.8)' : 'var(--color-text-muted)',
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div style={{ display: 'grid', gap: 10 }}>
        {filtered.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 48 }}>
            <Bell size={48} style={{ color: 'var(--color-text-muted)', marginBottom: 12, opacity: 0.4 }} />
            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-muted)' }}>لا توجد تنبيهات</p>
          </div>
        ) : filtered.map(n => {
          const colors = colorMap[n.type] || colorMap.system;
          return (
            <div key={n.id} className="card" style={{
              padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14,
              background: n.isRead ? 'var(--color-surface)' : 'var(--color-surface-alt)',
              borderRight: n.isRead ? 'none' : '4px solid var(--color-primary)',
              flexWrap: 'wrap',
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, background: colors.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.color,
              }}>
                {iconMap[n.type]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <span style={{ fontSize: 14, fontWeight: n.isRead ? 500 : 700 }}>{n.title}</span>
                  {n.priority === 'high' && <span className="badge badge-red" style={{ fontSize: 10, padding: '2px 8px' }}>عاجل</span>}
                </div>
                <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: 0 }}>{n.message}</p>
                <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{formatRelative(n.createdAt)}</span>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {n.relatedReportId && (
                  <Link href={`/reports/${n.relatedReportId}`}
                    style={{ padding: 6, borderRadius: 6, color: 'var(--color-info)', background: 'var(--color-info-bg, #dbeafe)', display: 'flex', textDecoration: 'none' }}>
                    <Eye size={16} />
                  </Link>
                )}
                {!n.isRead && (
                  <button onClick={() => markRead(n.id)}
                    style={{ padding: 6, borderRadius: 6, color: 'var(--color-success)', background: 'var(--color-success-bg, #dcfce7)', border: 'none', cursor: 'pointer', display: 'flex' }}>
                    <CheckCircle2 size={16} />
                  </button>
                )}
                <button onClick={() => deleteNotification(n.id)}
                  style={{ padding: 6, borderRadius: 6, color: 'var(--color-danger)', background: 'var(--color-danger-bg, #fee2e2)', border: 'none', cursor: 'pointer', display: 'flex' }}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
