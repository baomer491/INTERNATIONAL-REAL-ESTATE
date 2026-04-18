'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { store } from '@/lib/store';
import { formatDate, formatCurrency, getStatusInfo } from '@/lib/utils';
import { useApp } from '@/components/layout/AppContext';
import { useTheme } from '@/hooks/useTheme';
import type { ReportStatus } from '@/types';
import {
  CheckCircle2, XCircle, RotateCcw, Eye, FileText,
  Clock, AlertCircle, MessageSquare, Undo2, RefreshCw, Bell
} from 'lucide-react';

export default function ApprovalsPage() {
  const { showToast, hasPermission, currentUser, notify } = useApp();
  const { isDark } = useTheme();
  const dm = isDark;
  const [reports, setReports] = useState(store.getReports());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [filter, setFilter] = useState('');
  const [showMineOnly, setShowMineOnly] = useState(false);
  const [pendingPulse, setPendingPulse] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const isAdmin = currentUser?.role === 'admin';
  const isReviewer = currentUser?.role === 'reviewer';

  // Auto-refresh: listen for real-time updates
  const refreshReports = useCallback(() => {
    setReports(store.getReports());
    setPendingPulse(true);
    setTimeout(() => setPendingPulse(false), 3000);
  }, []);

  useEffect(() => {
    if (!isAdmin && !isReviewer) {
      setShowMineOnly(true);
    }
  }, [isAdmin, isReviewer]);

  useEffect(() => {
    // Listen for custom events from notification-service
    const handleReportsUpdated = () => {
      refreshReports();
    };
    window.addEventListener('reports-updated', handleReportsUpdated);

    // Also poll every 10 seconds to catch any changes
    const interval = setInterval(() => {
      setReports(store.getReports());
    }, 10000);

    return () => {
      window.removeEventListener('reports-updated', handleReportsUpdated);
      clearInterval(interval);
    };
  }, [refreshReports]);

  const approvalReports = reports.filter(r =>
    ['pending_approval', 'approved', 'rejected', 'needs_revision'].includes(r.status) &&
    (!showMineOnly || r.appraiserId === currentUser?.id)
  );

  const filtered = filter
    ? approvalReports.filter(r => r.status === filter)
    : approvalReports;

  const selected = selectedId ? reports.find(r => r.id === selectedId) : null;

  const handleAction = async (status: ReportStatus) => {
    if (!selected) return;
    setActionLoading(true);
    try {
      await store.updateReport(selected.id, {
        status,
        approval: {
          ...selected.approval,
          status: status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : 'needs_revision',
          reviewedAt: new Date().toISOString(),
          reviewedBy: currentUser?.fullName || store.getSettings().userName,
          notes,
        }
      });
      setReports(store.getReports());
      setSelectedId(null);
      setNotes('');
      if (status === 'approved') {
        notify({
          type: 'approval',
          title: `تم اعتماد التقرير: ${selected.reportNumber}`,
          message: `تم اعتماد تقرير ${selected.reportNumber} بنجاح من قبل ${currentUser?.fullName || 'المراجع'}`,
          priority: 'medium',
          relatedReportId: selected.id,
        });
      } else if (status === 'rejected') {
        notify({
          type: 'approval',
          title: `تم رفض التقرير: ${selected.reportNumber}`,
          message: `تم رفض تقرير ${selected.reportNumber} من قبل ${currentUser?.fullName || 'المراجع'}${notes ? ` - ${notes}` : ''}`,
          priority: 'high',
          relatedReportId: selected.id,
        });
      } else {
        notify({
          type: 'approval',
          title: `تقرير يحتاج مراجعة: ${selected.reportNumber}`,
          message: `تم إرجاع تقرير ${selected.reportNumber} للمراجعة من قبل ${currentUser?.fullName || 'المراجع'}${notes ? ` - ${notes}` : ''}`,
          priority: 'high',
          relatedReportId: selected.id,
        });
      }
      showToast(
        status === 'approved' ? 'تم اعتماد التقرير' : status === 'rejected' ? 'تم رفض التقرير' : 'تم إرجاع التقرير للمراجعة',
        'success'
      );
    } catch (err) {
      console.error('Failed to process approval action:', err);
      showToast('حدث خطأ أثناء معالجة الطلب. يرجى المحاولة مرة أخرى.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetToPending = (reportId: string) => {
    const report = reports.find(r => r.id === reportId);
    if (!report) return;
    store.updateReport(reportId, {
      status: 'pending_approval',
      approval: {
        status: 'pending',
        submittedAt: report.approval.submittedAt || new Date().toISOString(),
        reviewedBy: '',
        notes: '',
      }
    });
    setReports(store.getReports());
    notify({
      type: 'system',
      title: `تم إعادة التقرير للانتظار: ${report.reportNumber}`,
      message: `تم إعادة تقرير ${report.reportNumber} إلى قائمة الانتظار للاعتماد`,
      priority: 'low',
      relatedReportId: reportId,
    });
    showToast('تم إعادة التقرير لقائمة الانتظار', 'info');
  };

  const pendingCount = approvalReports.filter(r => r.status === 'pending_approval').length;

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
            الاعتمادات
            {pendingCount > 0 && (
              <span style={{
                background: pendingPulse ? '#ef4444' : 'var(--color-primary)',
                color: 'white', fontSize: 13, fontWeight: 700,
                padding: '2px 10px', borderRadius: 12,
                animation: pendingPulse ? 'pulse 1s ease-in-out 3' : 'none',
              }}>
                {pendingCount} بانتظار
              </span>
            )}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--color-text-muted)', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
            مراجعة واعتماد التقارير
            <Bell size={14} style={{ color: pendingPulse ? '#ef4444' : 'var(--color-text-muted)' }} />
          </p>
        </div>
        <button onClick={refreshReports} className="btn btn-ghost btn-sm" title="تحديث">
          <RefreshCw size={16} style={{ animation: pendingPulse ? 'spin 0.5s linear' : 'none' }} />
        </button>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.1); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}} />

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { value: '', label: 'الكل', count: approvalReports.length },
          { value: 'pending_approval', label: 'بانتظار الاعتماد', count: approvalReports.filter(r => r.status === 'pending_approval').length },
          { value: 'approved', label: 'معتمد', count: approvalReports.filter(r => r.status === 'approved').length },
          { value: 'rejected', label: 'مرفوض', count: approvalReports.filter(r => r.status === 'rejected').length },
          { value: 'needs_revision', label: 'يحتاج تعديل', count: approvalReports.filter(r => r.status === 'needs_revision').length },
        ].map(tab => (
          <button key={tab.value} onClick={() => setFilter(tab.value)}
            style={{
              padding: '8px 16px', borderRadius: 8, border: 'none',
              background: filter === tab.value ? 'var(--color-primary)' : 'var(--color-surface-alt)',
              color: filter === tab.value ? 'white' : 'var(--color-text-secondary)',
              fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
            {tab.label}
            <span style={{
              background: filter === tab.value ? 'rgba(255,255,255,0.2)' : 'var(--color-border)',
              padding: '2px 8px', borderRadius: 10, fontSize: 11,
            }}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {!isReviewer && !isAdmin && (
        <div style={{ marginBottom: 20 }}>
          <button onClick={() => setShowMineOnly(!showMineOnly)}
            style={{
              padding: '8px 16px', borderRadius: 8, border: `1.5px solid ${showMineOnly ? 'var(--color-primary)' : 'var(--color-border)'}`,
              background: showMineOnly ? 'var(--color-primary)' : 'var(--color-surface)',
              color: showMineOnly ? 'white' : 'var(--color-text-secondary)',
              fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}>
            {showMineOnly ? 'تقاريري فقط' : 'جميع التقارير'}
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
        {filtered.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 48 }}>
            <CheckCircle2 size={48} style={{ color: 'var(--color-text-muted)', marginBottom: 12, opacity: 0.4 }} />
            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-muted)' }}>لا توجد تقارير</p>
          </div>
        ) : filtered.map(report => {
          const status = getStatusInfo(report.status);
          return (
            <div key={report.id} className="card" style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12, background: dm ? '#1e3a5f' : '#e8eef6',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: dm ? '#60a5fa' : '#1e3a5f',
                }}>
                  <FileText size={22} />
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 16, fontWeight: 700 }}>{report.reportNumber}</span>
                    <span className={`badge badge-${status.color}`}>{status.label}</span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                    {report.beneficiaryName} — {report.bankName} — {formatCurrency(report.valuation.totalMarketValue)}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                    {formatDate(report.createdAt)} | المقيم: {report.appraiserName}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Link href={`/reports/${report.id}`} className="btn btn-ghost btn-sm" style={{ textDecoration: 'none' }}>
                    <Eye size={16} /> عرض
                  </Link>
                  {report.status === 'pending_approval' && hasPermission('approvals_approve') && (
                    <button onClick={() => { setSelectedId(report.id); setNotes(report.approval.notes || ''); }}
                      className="btn btn-primary btn-sm">
                      <MessageSquare size={16} /> مراجعة
                    </button>
                  )}
                  {report.status !== 'pending_approval' && (isAdmin || isReviewer) && (
                    <button onClick={() => handleResetToPending(report.id)} className="btn btn-ghost btn-sm" style={{ color: '#f59e0b' }}>
                      <Undo2 size={16} /> إعادة
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Review Modal */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: dm ? 'var(--color-surface)' : 'white', borderRadius: 16, padding: 32, maxWidth: 500, width: '90%', animation: 'slideInUp 0.3s', border: dm ? '1px solid var(--color-border)' : 'none' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>مراجعة التقرير</h3>
            <p style={{ fontSize: 14, color: 'var(--color-text-muted)', margin: '0 0 20px' }}>
              {selected.reportNumber} — {selected.beneficiaryName}
            </p>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 14, fontWeight: 600, display: 'block', marginBottom: 6 }}>ملاحظات المراجع</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                style={{ width: '100%', padding: 12, border: '1px solid var(--color-border)', borderRadius: 8, minHeight: 80, fontFamily: 'inherit', direction: 'rtl', fontSize: 14 }}
                placeholder="أضف ملاحظاتك هنا..." />
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button onClick={() => setSelectedId(null)} className="btn btn-ghost" disabled={actionLoading}>إلغاء</button>
              <button onClick={() => handleAction('needs_revision')} className="btn btn-outline" style={{ color: '#f59e0b', borderColor: '#f59e0b' }} disabled={actionLoading}>
                <RotateCcw size={16} /> إعادة للمراجعة
              </button>
              <button onClick={() => handleAction('rejected')} className="btn btn-danger" disabled={actionLoading}>
                <XCircle size={16} /> رفض
              </button>
              <button onClick={() => handleAction('approved')} className="btn btn-success" disabled={actionLoading}>
                {actionLoading ? <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle2 size={16} />} اعتماد
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
