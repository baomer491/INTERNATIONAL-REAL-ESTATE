'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { store } from '@/lib/store';
import { formatDateShort, formatCurrency, getStatusInfo, getPropertyTypeLabel } from '@/lib/utils';
import { useApp } from '@/components/layout/AppContext';
import { useTheme } from '@/hooks/useTheme';
import { reportStatuses, propertyTypes } from '@/data/mock';
import {
  Search, Filter, PlusCircle, Eye, Trash2,
  Printer, FileDown, ChevronLeft, ChevronRight, X, Archive, FileEdit
} from 'lucide-react';

export default function ReportsPage() {
  const { showToast, hasPermission, currentUser } = useApp();
  const { isDark } = useTheme();
  const dm = isDark;
  const [reports, setReports] = useState(() => store.getReports());
  const banks = store.getBanks();

  const [search, setSearch] = useState('');
  const [filterBank, setFilterBank] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPropertyType, setFilterPropertyType] = useState('');
  const [showMineOnly, setShowMineOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [archiveId, setArchiveId] = useState<string | null>(null);
  const perPage = 10;

  const isAdmin = currentUser?.role === 'admin';
  const isViewer = currentUser?.role === 'viewer';

  React.useEffect(() => {
    if (!isAdmin && !isViewer) {
      setShowMineOnly(true);
    }
  }, [isAdmin, isViewer]);

  const refreshReports = () => {
    setReports(store.getReports());
  };

  const filtered = useMemo(() => {
    return reports.filter(r => {
      if (r.status === 'archived' && filterStatus !== 'archived') return false;
      if (showMineOnly && r.appraiserId !== currentUser?.id) return false;
      if (search && !r.reportNumber.includes(search) && !r.beneficiaryName.includes(search) && !r.beneficiaryCivilId.includes(search)) return false;
      if (filterBank === '__personal__' && r.bankId !== '') return false;
      if (filterBank && filterBank !== '__personal__' && r.bankId !== filterBank) return false;
      if (filterStatus && r.status !== filterStatus) return false;
      if (filterPropertyType && r.propertyType !== filterPropertyType) return false;
      return true;
    });
  }, [reports, search, filterBank, filterStatus, filterPropertyType, showMineOnly, currentUser?.id]);

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  const handleDelete = (id: string) => {
    store.deleteReport(id);
    setDeleteId(null);
    refreshReports();
    showToast('تم حذف التقرير', 'success');
  };

  const handleArchive = (id: string) => {
    store.updateReport(id, { status: 'archived' });
    setArchiveId(null);
    refreshReports();
    showToast('تم أرشفة التقرير بنجاح', 'success');
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px' }}>التقارير</h1>
          <p style={{ fontSize: 14, color: 'var(--color-text-muted)', margin: 0 }}>
            {filtered.length} تقرير
          </p>
        </div>
        {hasPermission('reports_create') && (
          <Link href="/reports/new" className="btn btn-primary" style={{ textDecoration: 'none' }}>
            <PlusCircle size={18} />
            إنشاء تقرير جديد
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20, padding: '16px 20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={16} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input type="text" placeholder="بحث برقم التقرير أو اسم المستفيد..."
              value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              style={{ width: '100%', padding: '9px 36px 9px 12px', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', direction: 'rtl' }} />
          </div>
          <select value={filterBank} onChange={(e) => { setFilterBank(e.target.value); setPage(1); }}
            style={{ padding: '9px 12px', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', appearance: 'none', minWidth: 140 }}>
            <option value="">كل البنوك</option>
            <option value="__personal__">تثمين شخصي</option>
            {banks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
            style={{ padding: '9px 12px', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', appearance: 'none', minWidth: 140 }}>
            <option value="">كل الحالات</option>
            {reportStatuses.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <select value={filterPropertyType} onChange={(e) => { setFilterPropertyType(e.target.value); setPage(1); }}
            style={{ padding: '9px 12px', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', appearance: 'none', minWidth: 140 }}>
            <option value="">كل الأنواع</option>
            {propertyTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          {!isViewer && (
            <button onClick={() => { setShowMineOnly(!showMineOnly); setPage(1); }}
              style={{
                padding: '8px 16px', borderRadius: 8, border: `1.5px solid ${showMineOnly ? 'var(--color-primary)' : 'var(--color-border)'}`,
                background: showMineOnly ? 'var(--color-primary)' : 'var(--color-surface)',
                color: showMineOnly ? 'white' : 'var(--color-text-secondary)',
                fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6,
              }}>
              <Eye size={14} />
              {showMineOnly ? 'تقاريري فقط' : 'جميع التقارير'}
            </button>
          )}
          {(filterBank || filterStatus || filterPropertyType || search) && (
            <button onClick={() => { setSearch(''); setFilterBank(''); setFilterStatus(''); setFilterPropertyType(''); setShowMineOnly(false); setPage(1); }}
              className="btn btn-ghost btn-sm">
              <X size={14} /> مسح الفلاتر
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>رقم التقرير</th>
                <th>المستفيد</th>
                <th>البنك</th>
                <th>نوع العقار</th>
                <th>تاريخ الإنشاء</th>
                <th>الحالة</th>
                <th>الأتعاب</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-muted)' }}>
                      <FileDown size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
                      <p style={{ fontSize: 15, fontWeight: 600 }}>لا توجد تقارير</p>
                      <p style={{ fontSize: 13 }}>قم بإنشاء تقرير جديد للبدء</p>
                    </div>
                  </td>
                </tr>
              ) : paginated.map(report => {
                const status = getStatusInfo(report.status);
                return (
                  <tr key={report.id}>
                    <td>
                      <Link href={`/reports/${report.id}`} style={{ color: 'var(--color-primary)', fontWeight: 700, textDecoration: 'none' }}>
                        {report.reportNumber}
                      </Link>
                    </td>
                    <td style={{ fontWeight: 600 }}>{report.beneficiaryName}</td>
                    <td>{report.bankName}</td>
                    <td>{getPropertyTypeLabel(report.propertyType)}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatDateShort(report.createdAt)}</td>
                    <td><span className={`badge badge-${status.color}`}>{status.label}</span></td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(report.fees)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <Link href={`/reports/${report.id}`} title="عرض" style={{ padding: 6, borderRadius: 6, color: '#3b82f6', background: dm ? '#1e3a5f' : '#dbeafe', display: 'flex' }}><Eye size={16} /></Link>
                        {(report.status === 'rejected' || report.status === 'needs_revision') && (
                          <Link href={`/reports/new?edit=${report.id}`} title="تعديل" style={{ padding: 6, borderRadius: 6, color: '#d97706', background: dm ? '#451a03' : '#fef3c7', display: 'flex' }}><FileEdit size={16} /></Link>
                        )}
                        {hasPermission('reports_archive') && report.status === 'approved' && (
                          <button onClick={() => setArchiveId(report.id)} title="أرشف" style={{ padding: 6, borderRadius: 6, color: '#7c3aed', background: dm ? '#2e1065' : '#f3e8ff', border: 'none', cursor: 'pointer', display: 'flex' }}><Archive size={16} /></button>
                        )}
                        {hasPermission('reports_delete') && (
                          <button onClick={() => setDeleteId(report.id)} title="حذف" style={{ padding: 6, borderRadius: 6, color: '#ef4444', background: dm ? '#450a0a' : '#fee2e2', border: 'none', cursor: 'pointer', display: 'flex' }}><Trash2 size={16} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderTop: '1px solid var(--color-border)' }}>
            <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
              عرض {(page - 1) * perPage + 1} - {Math.min(page * perPage, filtered.length)} من {filtered.length}
            </span>
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid var(--color-border)', background: 'var(--color-surface)', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}>
                <ChevronRight size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  style={{
                    padding: '6px 12px', borderRadius: 6,
                    border: p === page ? 'none' : '1px solid var(--color-border)',
                    background: p === page ? 'var(--color-primary)' : 'var(--color-surface)',
                    color: p === page ? 'white' : 'inherit', cursor: 'pointer',
                    fontSize: 13, fontWeight: 600,
                  }}>
                  {p}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid var(--color-border)', background: 'var(--color-surface)', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.5 : 1 }}>
                <ChevronLeft size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      {deleteId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'var(--color-surface)', borderRadius: 16, padding: 32, maxWidth: 400, width: '90%', textAlign: 'center', animation: 'slideInUp 0.3s', border: dm ? '1px solid var(--color-border)' : 'none' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: dm ? '#450a0a' : '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Trash2 size={28} color="#ef4444" />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>حذف التقرير؟</h3>
            <p style={{ fontSize: 14, color: 'var(--color-text-muted)', margin: '0 0 24px' }}>هل أنت متأكد من حذف هذا التقرير؟ لا يمكن التراجع.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setDeleteId(null)} className="btn btn-ghost">إلغاء</button>
              <button onClick={() => handleDelete(deleteId)} className="btn btn-danger">حذف</button>
            </div>
          </div>
        </div>
      )}

      {/* Archive Confirmation */}
      {archiveId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'var(--color-surface)', borderRadius: 16, padding: 32, maxWidth: 400, width: '90%', textAlign: 'center', animation: 'slideInUp 0.3s', border: '1px solid var(--color-border)' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: dm ? '#2e1065' : '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Archive size={28} color="#7c3aed" />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px', color: 'var(--color-text)' }}>أرشفة التقرير؟</h3>
            <p style={{ fontSize: 14, color: 'var(--color-text-muted)', margin: '0 0 24px' }}>سيتم نقل التقرير إلى الأرشيف ويمكنك استعادته لاحقاً.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setArchiveId(null)} className="btn btn-ghost">إلغاء</button>
              <button onClick={() => handleArchive(archiveId)} className="btn btn-primary">أرشف</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
