'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { store } from '@/lib/store';
import { formatDate, formatCurrency, getPropertyTypeLabel } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';
import type { ReportStatus } from '@/types';
import { Archive, Search, RotateCcw, Eye, FileText } from 'lucide-react';
import { useApp } from '@/components/layout/AppContext';

export default function ArchivePage() {
  const { showToast } = useApp();
  const { isDark } = useTheme();
  const dm = isDark;
  const [reports, setReports] = useState(store.getReports());
  const [search, setSearch] = useState('');

  const archived = reports.filter(r => r.status === 'archived' || r.status === 'approved');
  const filtered = archived.filter(r =>
    r.reportNumber.includes(search) || r.beneficiaryName.includes(search) || r.bankName.includes(search)
  );

  const handleRestore = (id: string) => {
    store.updateReport(id, { status: 'draft' });
    setReports(store.getReports());
    showToast('تم استرجاع التقرير', 'success');
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px' }}>الأرشيف</h1>
        <p style={{ fontSize: 14, color: 'var(--color-text-muted)', margin: 0 }}>{filtered.length} تقرير مؤرشف</p>
      </div>

      <div className="card" style={{ marginBottom: 20, padding: '16px 20px' }}>
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input type="text" placeholder="بحث في الأرشيف..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '10px 40px 10px 14px', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', direction: 'rtl' }} />
        </div>
      </div>

      <div style={{ display: 'grid', gap: 12 }}>
        {filtered.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 48 }}>
            <Archive size={48} style={{ color: 'var(--color-text-muted)', marginBottom: 12, opacity: 0.4 }} />
            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-muted)' }}>لا توجد تقارير مؤرشفة</p>
          </div>
        ) : filtered.map(report => (
          <div key={report.id} className="card" style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: dm ? '#2e1065' : '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: dm ? '#a78bfa' : '#7c3aed' }}>
                <FileText size={20} />
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>{report.reportNumber}</div>
                <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                  {report.beneficiaryName} — {report.bankName} — {getPropertyTypeLabel(report.propertyType)} — {formatCurrency(report.valuation.totalMarketValue)}
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                  {formatDate(report.createdAt)}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Link href={`/reports/${report.id}`} className="btn btn-ghost btn-sm" style={{ textDecoration: 'none' }}><Eye size={16} /> عرض</Link>
                <button onClick={() => handleRestore(report.id)} className="btn btn-outline btn-sm">
                  <RotateCcw size={16} /> استرجاع
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
