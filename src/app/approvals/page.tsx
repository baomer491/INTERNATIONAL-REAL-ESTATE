'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { store } from '@/lib/store';
import { formatDate, formatCurrency, getStatusInfo, formatFileSize } from '@/lib/utils';
import { useApp } from '@/components/layout/AppContext';
import { useTheme } from '@/hooks/useTheme';
import { useRealtime } from '@/hooks/useRealtime';
import { broadcastChange } from '@/lib/realtime-engine';
import type { ReportStatus } from '@/types';
import {
  CheckCircle2, XCircle, RotateCcw, Eye, FileText,
  Clock, AlertCircle, MessageSquare, Undo2, RefreshCw, Bell,
  Camera, Image as ImageIcon, X, Download, Shield, MapPin, User,
  Building2, Home, DollarSign, Calendar, LandPlot, Info
} from 'lucide-react';

const topographyLabels: Record<string, string> = { leveled: 'مستوية', sloped: 'مائلة', elevated: 'مرتفعة', low_lying: 'منخفضة', mixed: 'ممزوجة' };
const qualityLabels: Record<string, string> = { excellent: 'ممتاز', good: 'جيد', average: 'متوسط', poor: 'ضعيف' };
const krookiMatchLabels: Record<string, string> = { yes: 'نعم', no: 'لا', partial: 'جزئياً' };
const zonedLabels: Record<string, string> = { residential: 'سكني', commercial: 'تجاري', industrial: 'صناعي', agricultural: 'زراعي', mixed: 'مختلط' };
const floorsLabels: Record<string, string> = { one: 'طابق واحد', two: 'طابقان', three: 'ثلاثة', four_plus: 'أربعة+', na: 'غير محدد' };
const purposeLabels: Record<string, string> = { loan: 'قرض', mortgage: 'رهن', sale: 'بيع', purchase: 'شراء', investment: 'استثمار', rental: 'تأجير', other: 'أخرى' };
const conditionLabels: Record<string, string> = { excellent: 'ممتاز', good: 'جيد', average: 'متوسط', below_average: 'دون المتوسط', poor: 'سيء' };
const finishingLabels: Record<string, string> = { luxury: 'فاخر', fully_finished: 'مكتمل', semi_finished: 'نصف تشطيب', not_finished: 'غير مكتمل' };
const buildingMatchLabels: Record<string, string> = { yes: 'نعم', no: 'لا', partial: 'جزئياً', na: 'غير محدد' };

export default function ApprovalsPage() {
  const { showToast, hasPermission, currentUser, notify } = useApp();
  const { isDark } = useTheme();
  const dm = isDark;
  const { data: reports, refresh: refreshReports } = useRealtime('reports', () => store.getReports());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [filter, setFilter] = useState('');
  const [showMineOnly, setShowMineOnly] = useState(false);
  const [pendingPulse, setPendingPulse] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const isAdmin = currentUser?.role === 'admin';
  const isReviewer = currentUser?.role === 'reviewer';

  useEffect(() => {
    if (!isAdmin && !isReviewer) {
      setShowMineOnly(true);
    }
  }, [isAdmin, isReviewer]);

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
      refreshReports();
      broadcastChange('reports');
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
    refreshReports();
    broadcastChange('reports');
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
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
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
                <div style={{ flex: 1, minWidth: 0 }}>
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

      {/* Review Modal — Full detailed report view */}
      {selected && (() => {
        const photos = selected.documents.filter(d => d.type === 'photo');
        const otherDocs = selected.documents.filter(d => d.type !== 'photo');
        const docTypeLabels: Record<string, string> = { ownership: 'وثيقة الملكية', map: 'مخطط كروكي', id: 'وثيقة الهوية' };
        const docTypeIcons: Record<string, React.ReactNode> = {
          ownership: <Shield size={16} color="#3b82f6" />,
          map: <MapPin size={16} color="#8b5cf6" />,
          id: <User size={16} color="#f59e0b" />,
        };
        const pd = selected.propertyDetails;
        const apt = selected.apartmentDetails;
        const val = selected.valuation;
        const isLand = selected.propertyType === 'land';
        const isApartment = selected.propertyType === 'apartment';

        // Reusable field component
        const F = ({ label, value }: { label: string; value?: string | number | null }) => (
          <div style={{ padding: '6px 0' }}>
            <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 500, display: 'block' }}>{label}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>{value || '—'}</span>
          </div>
        );

        const SectionH = ({ title, icon }: { title: string; icon: React.ReactNode }) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0 8px', borderBottom: `2px solid var(--color-primary)`, marginBottom: 8 }}>
            {icon}
            <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-primary)' }}>{title}</span>
          </div>
        );

        return (
        <>
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 100, padding: '16px', overflowY: 'auto' }}>
          <div style={{
            background: dm ? 'var(--color-surface)' : 'white', borderRadius: 16,
            maxWidth: 900, width: '100%', margin: 'auto',
            animation: 'slideInUp 0.3s', border: dm ? '1px solid var(--color-border)' : '1px solid #e2e8f0',
          }}>
            {/* Header bar */}
            <div style={{
              padding: '16px 24px', borderBottom: `1px solid ${dm ? 'var(--color-border)' : '#e2e8f0'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0,
              background: dm ? 'var(--color-surface)' : 'white', borderRadius: '16px 16px 0 0', zIndex: 2,
            }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>مراجعة التقرير</h3>
                <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{selected.reportNumber} — {selected.beneficiaryName}</span>
              </div>
              <button onClick={() => { setSelectedId(null); setLightboxIndex(null); }}
                style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: dm ? 'var(--color-surface-alt)' : '#f1f5f9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text)' }}>
                <X size={18} />
              </button>
            </div>

            {/* Scrollable content */}
            <div style={{ padding: '20px 24px', maxHeight: 'calc(90vh - 180px)', overflowY: 'auto' }}>

              {/* ── Basic Info ── */}
              <SectionH title="معلومات التقرير" icon={<FileText size={18} color="var(--color-primary)" />} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 4, marginBottom: 16 }}>
                <F label="رقم التقرير" value={selected.reportNumber} />
                <F label="نوع العقار" value={selected.propertyType === 'land' ? 'أرض' : selected.propertyType === 'apartment' ? 'شقة' : selected.propertyType === 'villa' ? 'فيلا' : selected.propertyType} />
                <F label="الاستخدام" value={purposeLabels[selected.propertyUsage] || selected.propertyUsage} />
                <F label="الحالة" value={conditionLabels[selected.propertyCondition] || selected.propertyCondition} />
                <F label="تاريخ الإنشاء" value={formatDate(selected.createdAt)} />
                <F label="المقيم" value={selected.appraiserName} />
                {selected.purposeOfValuation && <F label="غرض التقييم" value={purposeLabels[selected.purposeOfValuation] || selected.purposeOfValuation} />}
              </div>

              {/* ── Bank / Client ── */}
              <SectionH title="البنك / العميل" icon={<Building2 size={18} color="var(--color-primary)" />} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 4, marginBottom: 16 }}>
                <F label="البنك" value={selected.bankName || 'تقييم شخصي'} />
                <F label="المستفيد" value={selected.beneficiaryName} />
                <F label="الرقم المدني" value={selected.beneficiaryCivilId} />
                <F label="الهاتف" value={selected.beneficiaryPhone} />
                <F label="البريد" value={selected.beneficiaryEmail} />
                <F label="العنوان" value={selected.beneficiaryAddress} />
                {selected.applicantName && <F label="مقدم الطلب" value={selected.applicantName} />}
              </div>

              {/* ── Property Details ── */}
              <SectionH title={isLand ? 'بيانات الأرض' : isApartment ? 'بيانات الشقة' : 'بيانات العقار'} icon={<LandPlot size={18} color="var(--color-primary)" />} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 4, marginBottom: 16 }}>
                <F label="المحافظة" value={pd.governorate} />
                <F label="الولاية" value={pd.wilayat} />
                <F label="القرية / الحي" value={pd.village} />
                <F label="رقم القطعة" value={pd.plotNumber} />
                <F label="رقم المربع" value={pd.blockNumber} />
                <F label="المساحة" value={pd.area ? `${pd.area} ${pd.areaUnit}` : '—'} />
                <F label="رقم الطريق" value={pd.wayNumber} />
                <F label="رقم الكروكي" value={pd.krookiNumber} />
                <F label="رقم التسجيل" value={pd.registrationNumber} />
                <F label="تاريخ التسجيل" value={pd.registrationDate} />
                {isLand && <F label="المنطقة المخططة" value={zonedLabels[pd.zoned || ''] || pd.zoned} />}
                {isLand && <F label="نسبة البناء المسموحة" value={pd.allowableBuildUp} />}
                {isLand && <F label="الأدوار المسموحة" value={floorsLabels[pd.allowableFloors || ''] || pd.allowableFloors} />}
                {!isLand && !isApartment && pd.street && <F label="الشارع" value={pd.street} />}
                {!isLand && !isApartment && pd.floors > 0 && <F label="عدد الأدوار" value={pd.floors} />}
                {!isLand && !isApartment && pd.rooms > 0 && <F label="الغرف" value={pd.rooms} />}
                {!isLand && !isApartment && pd.buildingAge > 0 && <F label="عمر المبنى" value={`${pd.buildingAge} سنة`} />}
              </div>

              {/* ── Land Description ── */}
              {isLand && (
                <>
                  <SectionH title="وصف الأرض" icon={<MapPin size={18} color="var(--color-primary)" />} />
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 4, marginBottom: 16 }}>
                    <F label="مطابقة الكروكي" value={krookiMatchLabels[pd.krookiMatch || ''] || pd.krookiMatch} />
                    <F label="طبوغرافية الأرض" value={topographyLabels[pd.topography || ''] || pd.topography} />
                    <F label="جودة المحيط" value={qualityLabels[pd.qualityOfSurrounding || ''] || pd.qualityOfSurrounding} />
                    <F label="العائد على البيع/الإيجار" value={qualityLabels[pd.returnOnSaleRent || ''] || pd.returnOnSaleRent} />
                  </div>
                  {(pd.surroundingNorth || pd.surroundingEast || pd.surroundingSouth || pd.surroundingWest) && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 4, marginBottom: 16 }}>
                      {pd.surroundingNorth && <F label="الشمال" value={pd.surroundingNorth} />}
                      {pd.surroundingEast && <F label="الشرق" value={pd.surroundingEast} />}
                      {pd.surroundingSouth && <F label="الجنوب" value={pd.surroundingSouth} />}
                      {pd.surroundingWest && <F label="الغرب" value={pd.surroundingWest} />}
                    </div>
                  )}
                </>
              )}

              {/* ── Apartment Details ── */}
              {isApartment && apt && (
                <>
                  <SectionH title="بيانات الشقة" icon={<Home size={18} color="var(--color-primary)" />} />
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 4, marginBottom: 16 }}>
                    <F label="رقم الشقة" value={apt.apartmentNo} />
                    <F label="رقم المنزل" value={apt.houseNo} />
                    <F label="تاريخ الإنجاز" value={apt.completionDate} />
                    <F label="مطابقة المخطط" value={buildingMatchLabels[apt.buildingMatchApprovedDrawing] || apt.buildingMatchApprovedDrawing} />
                    <F label="اسم الاستشاري" value={apt.consultantName} />
                    <F label="رقم رخصة البناء" value={apt.bldgPermitNumber} />
                    <F label="تاريخ رخصة البناء" value={apt.bldgPermitDate} />
                    <F label="المساحة المشتركة" value={apt.sharedAreaFromMotherPlot} />
                    <F label="مساحة الوحدة" value={apt.unitArea} />
                    <F label="البناء الفعلي" value={apt.actualBuiltUp} />
                    <F label="المواقف" value={apt.parking} />
                    <F label="عدد الأدوار" value={apt.numberOfFloors} />
                  </div>
                  {apt.components.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>مكونات الشقة</div>
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                          <thead>
                            <tr style={{ background: 'var(--color-primary)', color: 'white' }}>
                              <th style={{ padding: '6px 10px', textAlign: 'right' }}>المكون</th>
                              <th style={{ padding: '6px 10px', textAlign: 'center' }}>نصف تشطيب</th>
                              <th style={{ padding: '6px 10px', textAlign: 'center' }}>مكتمل</th>
                              <th style={{ padding: '6px 10px', textAlign: 'center' }}>الإجمالي</th>
                            </tr>
                          </thead>
                          <tbody>
                            {apt.components.map((c, i) => (
                              <tr key={i} style={{ borderBottom: `1px solid ${dm ? 'var(--color-border)' : '#e2e8f0'}` }}>
                                <td style={{ padding: '5px 10px', fontWeight: 600 }}>{c.name}</td>
                                <td style={{ padding: '5px 10px', textAlign: 'center' }}>{c.ph || '—'}</td>
                                <td style={{ padding: '5px 10px', textAlign: 'center' }}>{c.ff || '—'}</td>
                                <td style={{ padding: '5px 10px', textAlign: 'center', fontWeight: 700 }}>{(c.ff || 0) + (c.ph || 0)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  {apt.internalFinishing.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>التشطيبات الداخلية</div>
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                          <thead>
                            <tr style={{ background: 'var(--color-primary)', color: 'white' }}>
                              <th style={{ padding: '6px 10px', textAlign: 'right' }}>البند</th>
                              <th style={{ padding: '6px 10px', textAlign: 'right' }}>النوع/الكمية</th>
                              <th style={{ padding: '6px 10px', textAlign: 'right' }}>الحالة</th>
                            </tr>
                          </thead>
                          <tbody>
                            {apt.internalFinishing.map((item, i) => (
                              <tr key={i} style={{ borderBottom: `1px solid ${dm ? 'var(--color-border)' : '#e2e8f0'}` }}>
                                <td style={{ padding: '5px 10px' }}>{item.description}</td>
                                <td style={{ padding: '5px 10px' }}>{item.typeOfItem || '—'}</td>
                                <td style={{ padding: '5px 10px' }}>{item.condition || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  <SectionH title="المواصفات" icon={<Info size={18} color="var(--color-primary)" />} />
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 4, marginBottom: 16 }}>
                    <F label="الأساس والهيكل" value={apt.foundationAndStructure} />
                    <F label="الجدران" value={apt.walls} />
                    <F label="السقف" value={apt.roof} />
                    <F label="الأرضيات" value={apt.floorType} />
                    <F label="التكييف" value={apt.airConditioning} />
                  </div>
                </>
              )}

              {/* ── Valuation ── */}
              <SectionH title="التقييم المالي" icon={<DollarSign size={18} color="var(--color-primary)" />} />
              <div style={{
                display: 'grid', gridTemplateColumns: isLand ? '1fr 1fr' : 'repeat(auto-fill, minmax(160px, 1fr))',
                gap: 8, marginBottom: 12,
              }}>
                {!isLand && !isApartment && <F label="قيمة الأرض" value={formatCurrency(val.landValue)} />}
                {!isLand && !isApartment && <F label="قيمة المبنى" value={formatCurrency(val.buildingValue)} />}
                <div style={{ padding: '10px 12px', background: dm ? '#14532d22' : '#dcfce7', borderRadius: 8, border: '1px solid #22c55e40' }}>
                  <span style={{ fontSize: 11, color: '#22c55e', fontWeight: 500, display: 'block' }}>القيمة السوقية</span>
                  <span style={{ fontSize: 18, fontWeight: 800, color: '#22c55e' }}>{formatCurrency(val.totalMarketValue)}</span>
                </div>
                <div style={{ padding: '10px 12px', background: dm ? '#451a0322' : '#fef3c7', borderRadius: 8, border: '1px solid #f59e0b40' }}>
                  <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 500, display: 'block' }}>قيمة البيع القسري</span>
                  <span style={{ fontSize: 18, fontWeight: 800, color: '#f59e0b' }}>{formatCurrency(val.quickSaleValue)}</span>
                </div>
                {val.rentalValue && (
                  <div style={{ padding: '10px 12px', background: dm ? '#1e3a5f22' : '#e8eef6', borderRadius: 8, border: '1px solid #3b82f640' }}>
                    <span style={{ fontSize: 11, color: 'var(--color-primary)', fontWeight: 500, display: 'block' }}>القيمة الإيجارية</span>
                    <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-primary)' }}>{formatCurrency(val.rentalValue)}/شهر</span>
                  </div>
                )}
                {apt?.estimatedPerMonth && (
                  <div style={{ padding: '10px 12px', background: dm ? '#7c3aed22' : '#f3e8ff', borderRadius: 8, border: '1px solid #8b5cf640' }}>
                    <span style={{ fontSize: 11, color: '#8b5cf6', fontWeight: 500, display: 'block' }}>التقدير الشهري</span>
                    <span style={{ fontSize: 18, fontWeight: 800, color: '#8b5cf6' }}>{apt.estimatedPerMonth} OMR</span>
                  </div>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 4, marginBottom: 16 }}>
                <F label="طريقة التقييم" value={val.valuationMethod} />
                <F label="مستوى المخاطرة" value={val.riskLevel === 'low' ? 'منخفض' : val.riskLevel === 'medium' ? 'متوسط' : val.riskLevel === 'high' ? 'مرتفع' : val.riskLevel} />
                <F label="نسبة الثقة" value={`${val.confidencePercentage}%`} />
                <F label="أتعاب التثمين" value={formatCurrency(selected.fees)} />
              </div>
              {val.appraiserNotes && (
                <div style={{ padding: '10px 14px', background: dm ? 'var(--color-surface-alt)' : '#f8fafc', borderRadius: 8, marginBottom: 12, border: `1px solid ${dm ? 'var(--color-border)' : '#e2e8f0'}` }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: 4 }}>ملاحظات المقيم</div>
                  <div style={{ fontSize: 13, lineHeight: 1.6 }}>{val.appraiserNotes}</div>
                </div>
              )}
              {val.finalRecommendation && (
                <div style={{ padding: '10px 14px', background: dm ? 'var(--color-surface-alt)' : '#f8fafc', borderRadius: 8, marginBottom: 16, border: `1px solid ${dm ? 'var(--color-border)' : '#e2e8f0'}` }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: 4 }}>التوصية النهائية</div>
                  <div style={{ fontSize: 13, lineHeight: 1.6 }}>{val.finalRecommendation}</div>
                </div>
              )}

              {/* ── Documents & Images ── */}
              {selected.documents.length > 0 && (
                <>
                  <SectionH title="المستندات والصور" icon={<Camera size={18} color="var(--color-primary)" />} />
                  <div style={{ marginBottom: 16 }}>
                    {/* Ownership / Map / ID — image previews */}
                    {otherDocs.length > 0 && (
                      <div style={{ marginBottom: photos.length > 0 ? 16 : 0 }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                          {otherDocs.map(doc => {
                            const isImage = doc.url && doc.url.startsWith('data:image');
                            return (
                              <div key={doc.id} style={{
                                width: isImage ? 'calc(50% - 6px)' : 'auto', minWidth: isImage ? 200 : 160,
                                borderRadius: 10, overflow: 'hidden',
                                border: `1.5px solid ${dm ? '#334155' : '#e2e8f0'}`,
                                background: dm ? 'var(--color-surface-alt)' : 'var(--color-surface)',
                              }}>
                                {isImage ? (
                                  <div style={{ cursor: 'pointer', position: 'relative' }}
                                    onClick={() => window.open(doc.url, '_blank')}>
                                    <img src={doc.url} alt={doc.name}
                                      style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block' }} />
                                    <div style={{
                                      position: 'absolute', top: 6, right: 6,
                                      background: 'rgba(0,0,0,0.65)', borderRadius: 6,
                                      padding: '3px 10px', display: 'flex', alignItems: 'center', gap: 5,
                                    }}>
                                      {docTypeIcons[doc.type] || <FileText size={12} color="#fff" />}
                                      <span style={{ fontSize: 10, color: '#fff', fontWeight: 700 }}>
                                        {docTypeLabels[doc.type] || 'مستند'}
                                      </span>
                                    </div>
                                  </div>
                                ) : (
                                  <div style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    {docTypeIcons[doc.type] || <FileText size={20} color="var(--color-text-muted)" />}
                                    <div>
                                      <div style={{ fontSize: 12, fontWeight: 600 }}>{doc.name}</div>
                                      <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{docTypeLabels[doc.type] || 'مستند'}</div>
                                    </div>
                                  </div>
                                )}
                                <div style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `1px solid ${dm ? '#334155' : '#e2e8f0'}` }}>
                                  <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{formatFileSize(doc.size)}</span>
                                  {doc.url && doc.url !== '#' && (
                                    <a href={doc.url} download={doc.name} onClick={e => e.stopPropagation()} style={{ fontSize: 10, color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}>
                                      <Download size={11} />
                                    </a>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Property Photos */}
                    {photos.length > 0 && (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                          <Camera size={14} color="var(--color-primary)" />
                          <span style={{ fontSize: 12, fontWeight: 700 }}>صور العقار</span>
                          <span style={{ fontSize: 10, fontWeight: 700, background: 'var(--color-primary)', color: 'white', borderRadius: 10, padding: '1px 8px' }}>{photos.length}</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
                          {photos.map((photo, idx) => (
                            <div key={photo.id} onClick={() => setLightboxIndex(idx)}
                              style={{ position: 'relative', aspectRatio: '4/3', borderRadius: 8, overflow: 'hidden', cursor: 'pointer', border: `1px solid ${dm ? '#334155' : '#e2e8f0'}` }}>
                              <img src={photo.url} alt={photo.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.2s' }}
                                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }} />
                              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.5))', padding: '16px 6px 4px' }}>
                                <span style={{ fontSize: 9, color: '#fff', fontWeight: 600 }}>{photo.name}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* ── Reviewer Actions ── */}
              <div style={{
                marginTop: 8, padding: '16px', background: dm ? 'var(--color-surface-alt)' : '#f8fafc',
                borderRadius: 12, border: `1px solid ${dm ? 'var(--color-border)' : '#e2e8f0'}`,
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MessageSquare size={15} /> قرار المراجع
                </div>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                  style={{ width: '100%', padding: 10, border: '1px solid var(--color-border)', borderRadius: 8, minHeight: 70, fontFamily: 'inherit', direction: 'rtl', fontSize: 13, marginBottom: 12, background: dm ? 'var(--color-surface)' : 'white', color: 'var(--color-text)', resize: 'vertical' }}
                  placeholder="أضف ملاحظاتك هنا..." />
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button onClick={() => { setSelectedId(null); setLightboxIndex(null); }} className="btn btn-ghost" disabled={actionLoading}>إلغاء</button>
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
          </div>
        </div>

        {/* Lightbox Modal */}
        {lightboxIndex !== null && (() => {
          const photo = photos[lightboxIndex];
          if (!photo) return null;
          return (
            <div
              style={{
                position: 'fixed', inset: 0, zIndex: 9999,
                background: 'rgba(0,0,0,0.88)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column', padding: 16,
              }}
              onClick={() => setLightboxIndex(null)}
            >
              <div style={{
                position: 'absolute', top: 16, left: 16, right: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                zIndex: 1,
              }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <ImageIcon size={18} color="#fff" />
                  <span style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>
                    {photo.name}
                  </span>
                </div>
                <button
                  onClick={() => setLightboxIndex(null)}
                  style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.15)', border: 'none',
                    color: '#fff', cursor: 'pointer', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.3)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
                >
                  <X size={20} />
                </button>
              </div>
              <img
                src={photo.url}
                alt={photo.name}
                style={{
                  maxWidth: '90vw', maxHeight: '78vh',
                  objectFit: 'contain', borderRadius: 8,
                  boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
                }}
                onClick={e => e.stopPropagation()}
              />
              {/* Navigation arrows */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 16 }} onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => setLightboxIndex(lightboxIndex > 0 ? lightboxIndex - 1 : photos.length - 1)}
                  style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.15)', border: 'none',
                    color: '#fff', cursor: 'pointer', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: 20,
                  }}
                >
                  &#8250;
                </button>
                <span style={{ color: '#fff', fontSize: 13, fontWeight: 600, direction: 'ltr' }}>
                  {lightboxIndex + 1} / {photos.length}
                </span>
                <button
                  onClick={() => setLightboxIndex(lightboxIndex < photos.length - 1 ? lightboxIndex + 1 : 0)}
                  style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.15)', border: 'none',
                    color: '#fff', cursor: 'pointer', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: 20,
                  }}
                >
                  &#8249;
                </button>
              </div>
            </div>
          );
        })()}
        </>
        );
      })()}
    </div>
  );
}
