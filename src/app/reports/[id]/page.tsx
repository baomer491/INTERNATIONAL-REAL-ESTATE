'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { store } from '@/lib/store';
import { formatDate, formatCurrency, getStatusInfo, getPropertyTypeLabel, getPropertyUsageLabel, formatFileSize } from '@/lib/utils';
import { exportReportToDocx, exportReportPDF } from '@/lib/report-export';
import { useApp } from '@/components/layout/AppContext';
import { useTheme } from '@/hooks/useTheme';
import { useRealtimeEntity } from '@/hooks/useRealtime';
import { broadcastChange } from '@/lib/realtime-engine';
import type { ReportStatus } from '@/types';
import { buildingMatchOptions } from '@/data/mock';
import {
  ArrowRight, Printer, Send, CheckCircle2, FileText, MapPin, DollarSign,
  User, Building2, Home, Calendar, History, LandPlot, Info, FileEdit, AlertTriangle,
  Archive, ArchiveRestore, ChevronDown, Shield, Camera, Image as ImageIcon, X, Download, Eye
} from 'lucide-react';

const topographyLabels: Record<string, string> = { leveled: 'مستوية', sloped: 'مائلة', elevated: 'مرتفعة', low_lying: 'منخفضة', mixed: 'ممزوجة' };
const qualityLabels: Record<string, string> = { excellent: 'ممتاز', good: 'جيد', average: 'متوسط', poor: 'ضعيف' };
const krookiMatchLabels: Record<string, string> = { yes: 'نعم', no: 'لا', partial: 'جزئياً' };
const zonedLabels: Record<string, string> = { residential: 'سكني', commercial: 'تجاري', industrial: 'صناعي', agricultural: 'زراعي', mixed: 'مختلط' };
const allowableFloorsLabels: Record<string, string> = { one: 'طابق واحد', two: 'طابقان', three: 'ثلاثة طوابق', four_plus: 'أربعة طوابق أو أكثر', na: 'غير محدد' };
const purposeLabels: Record<string, string> = { loan: 'قرض', mortgage: 'رهن', sale: 'بيع', purchase: 'شراء', investment: 'استثمار', rental: 'تأجير', other: 'أخرى' };

const allStatuses: { value: ReportStatus; label: string }[] = [
  { value: 'draft', label: 'مسودة' },
  { value: 'in_progress', label: 'قيد الإنجاز' },
  { value: 'pending_approval', label: 'بانتظار الاعتماد' },
  { value: 'approved', label: 'معتمد' },
  { value: 'rejected', label: 'مرفوض' },
  { value: 'needs_revision', label: 'يحتاج تعديل' },
  { value: 'archived', label: 'مؤرشف' },
];

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { currentUser, showToast } = useApp();
  const { isDark } = useTheme();
  const dm = isDark;
  const { entity: report, refresh: refreshReport } = useRealtimeEntity(
    'reports',
    () => params.id as string,
    (id) => store.getReport(id)
  );
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const closeDropdown = useCallback(() => setStatusDropdownOpen(false), []);

  useEffect(() => {
    if (!statusDropdownOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        closeDropdown();
      }
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') closeDropdown();
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [statusDropdownOpen, closeDropdown]);

  if (!report) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <FileText size={48} style={{ color: 'var(--color-text-muted)', marginBottom: 16, opacity: 0.4 }} />
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 8px' }}>التقرير غير موجود</h2>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: 20 }}>لم يتم العثور على التقرير المطلوب</p>
        <Link href="/reports" className="btn btn-primary" style={{ textDecoration: 'none' }}>
          <ArrowRight size={18} style={{ transform: 'scaleX(-1)' }} /> العودة للتقارير
        </Link>
      </div>
    );
  }

  const status = getStatusInfo(report.status);
  const isLand = report.propertyType === 'land';
  const isApartment = report.propertyType === 'apartment';
  const pd = report.propertyDetails;
  const apt = report.apartmentDetails;

  const isAdmin = currentUser?.role === 'admin';
  const isAppraiser = currentUser?.role === 'appraiser';
  const isReviewer = currentUser?.role === 'reviewer';
  const isDataEntry = currentUser?.role === 'data_entry';

  const canSendForApproval = isAdmin || isAppraiser || isDataEntry;
  const canReview = isAdmin || isReviewer;
  const canArchive = isAdmin;
  const canRestore = isAdmin;
  const canEdit = isAdmin || isAppraiser || isDataEntry;

  const handleStatusChange = async (newStatus: ReportStatus) => {
    try {
      const updateData: Record<string, unknown> = { status: newStatus };
      if (newStatus === 'pending_approval') {
        updateData.approval = {
          ...report.approval,
          status: 'pending',
          submittedAt: new Date().toISOString(),
          reviewedBy: '',
        };
      }
      await store.updateReport(report.id, updateData);
      showToast('تم تحديث حالة التقرير', 'success');
      refreshReport();
      broadcastChange('reports');
    } catch (err) {
      console.error('Failed to update report status:', err);
      showToast('حدث خطأ أثناء تحديث حالة التقرير', 'error');
    }
  };

  const handleResubmit = async () => {
    try {
      await store.updateReport(report.id, {
        status: 'pending_approval',
        approval: {
          ...report.approval,
          status: 'pending',
          submittedAt: new Date().toISOString(),
          reviewedBy: '',
        },
      });
      showToast('تم إعادة إرسال التقرير للاعتماد', 'success');
      broadcastChange('reports');
      router.push('/reports');
    } catch (err) {
      console.error('Failed to resubmit report:', err);
      showToast('حدث خطأ أثناء إعادة إرسال التقرير', 'error');
    }
  };

  const handleArchive = async () => {
    try {
      await store.updateReport(report.id, { status: 'archived' });
      showToast('تم أرشفة التقرير', 'success');
      refreshReport();
      broadcastChange('reports');
    } catch (err) {
      console.error('Failed to archive report:', err);
      showToast('حدث خطأ أثناء أرشفة التقرير', 'error');
    }
  };

  const handleRestore = async () => {
    try {
      await store.updateReport(report.id, { status: 'approved' });
      showToast('تم استرجاع التقرير من الأرشيف', 'success');
      refreshReport();
      broadcastChange('reports');
    } catch (err) {
      console.error('Failed to restore report:', err);
      showToast('حدث خطأ أثناء استرجاع التقرير', 'error');
    }
  };

  const handleAdminStatusChange = async (newStatus: ReportStatus) => {
    try {
      await store.updateReport(report.id, { status: newStatus });
      setStatusDropdownOpen(false);
      showToast('تم تحديث حالة التقرير', 'success');
      refreshReport();
      broadcastChange('reports');
    } catch (err) {
      console.error('Failed to update report status:', err);
      showToast('حدث خطأ أثناء تحديث حالة التقرير', 'error');
    }
  };

  const needsRevision = report.status === 'rejected' || report.status === 'needs_revision';

  const renderWorkflowButtons = () => {
    const buttons: React.ReactNode[] = [];

    if (report.status === 'draft' && canSendForApproval) {
      buttons.push(
        <button key="send-approval" onClick={() => handleStatusChange('pending_approval')} className="btn btn-primary btn-sm">
          <Send size={16} /> إرسال للاعتماد
        </button>
      );
    }

    if (report.status === 'in_progress' && canEdit) {
      buttons.push(
        <button key="to-draft" onClick={() => handleStatusChange('draft')} className="btn btn-ghost btn-sm">
          <FileEdit size={16} /> تحويل لمسودة
        </button>
      );
      if (canSendForApproval) {
        buttons.push(
          <button key="send-from-progress" onClick={() => handleStatusChange('pending_approval')} className="btn btn-primary btn-sm">
            <Send size={16} /> إرسال للاعتماد
          </button>
        );
      }
    }

    if (report.status === 'pending_approval' && canReview) {
      buttons.push(
        <Link key="review" href="/approvals" className="btn btn-primary btn-sm" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <CheckCircle2 size={16} /> مراجعة
        </Link>
      );
    }

    if (report.status === 'approved' && canArchive) {
      buttons.push(
        <button key="archive" onClick={handleArchive} className="btn btn-ghost btn-sm" style={{ color: '#7c3aed', border: '1.5px solid #7c3aed' }}>
          <Archive size={16} /> أرشفة
        </button>
      );
    }

    if (needsRevision && canEdit) {
      buttons.push(
        <Link key="edit" href={`/reports/new?edit=${report.id}`} className="btn btn-primary btn-sm" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <FileEdit size={16} /> تعديل التقرير
        </Link>
      );
    }

    if (needsRevision && canSendForApproval) {
      buttons.push(
        <button key="resubmit" onClick={handleResubmit} className="btn btn-ghost btn-sm" style={{ color: 'var(--color-success)', border: '1.5px solid var(--color-success)' }}>
          <Send size={16} /> إعادة الإرسال
        </button>
      );
    }

    if (report.status === 'archived' && canRestore) {
      buttons.push(
        <button key="restore" onClick={handleRestore} className="btn btn-ghost btn-sm" style={{ color: '#7c3aed', border: '1.5px solid #7c3aed' }}>
          <ArchiveRestore size={16} /> استرجاع
        </button>
      );
    }

    return buttons;
  };

  const workflowButtons = renderWorkflowButtons();

  const Section = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
    <div style={{ marginBottom: 24 }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', padding: '0 0 10px', borderBottom: '2px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: 'var(--color-primary)' }}>{icon}</span>{title}
      </h3>
      {children}
    </div>
  );

  const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div style={{ marginBottom: 12 }}>
      <span style={{ fontSize: 12, color: 'var(--color-text-muted)', display: 'block', marginBottom: 2 }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 600 }}>{value || '—'}</span>
    </div>
  );

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/reports" style={{ padding: 8, borderRadius: 8, color: 'var(--color-text-secondary)', background: 'var(--color-surface-alt)', display: 'flex', textDecoration: 'none' }}>
            <ArrowRight size={20} style={{ transform: 'scaleX(-1)' }} />
          </Link>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>{report.reportNumber}</h1>
            <span className={`badge badge-${status.color}`}>{status.label}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={() => exportReportToDocx(report, store.getSettings())} className="btn btn-ghost btn-sm"><Printer size={16} /> تصدير تقرير</button>
          <button onClick={() => exportReportPDF(report, store.getSettings())} className="btn btn-ghost btn-sm"><FileText size={16} /> تصدير PDF</button>
          {workflowButtons}
          {isAdmin && (
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                className="btn btn-ghost btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: 4, border: `1px solid ${dm ? '#475569' : '#cbd5e1'}` }}
              >
                <Shield size={16} />
                <span>تغيير الحالة</span>
                <ChevronDown size={14} />
              </button>
              {statusDropdownOpen && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, zIndex: 50,
                  background: dm ? '#1e293b' : 'white',
                  border: `1px solid ${dm ? '#334155' : '#e2e8f0'}`,
                  borderRadius: 10, padding: 6, minWidth: 'min(200px, calc(100vw - 48px))',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                  marginTop: 4,
                }}>
                  {allStatuses.map(s => {
                    const sInfo = getStatusInfo(s.value);
                    const isActive = report.status === s.value;
                    return (
                      <button
                        key={s.value}
                        onClick={() => handleAdminStatusChange(s.value)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          width: '100%', padding: '10px 14px', border: 'none',
                          background: isActive ? (dm ? '#334155' : '#f1f5f9') : 'transparent',
                          borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                          color: isActive ? (dm ? '#fbbf24' : '#1e3a5f') : (dm ? '#e2e8f0' : '#1e293b'),
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = dm ? '#334155' : '#f8fafc'; }}
                        onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                      >
                        <span style={{
                          width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                          background: sInfo.color === 'gray' ? '#6b7280'
                            : sInfo.color === 'blue' ? '#3b82f6'
                            : sInfo.color === 'amber' ? '#f59e0b'
                            : sInfo.color === 'green' ? '#22c55e'
                            : sInfo.color === 'red' ? '#ef4444'
                            : sInfo.color === 'orange' ? '#f97316'
                            : sInfo.color === 'purple' ? '#8b5cf6'
                            : '#6b7280',
                        }} />
                        <span>{s.label}</span>
                        {isActive && (
                          <span style={{ marginRight: 'auto', fontSize: 11, color: dm ? '#fbbf24' : '#1e3a5f' }}>الحالية</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {needsRevision && report.approval.notes && (
        <div style={{
          background: dm ? 'rgba(234, 179, 8, 0.1)' : '#fffbeb',
          border: `1.5px solid ${dm ? 'rgba(234, 179, 8, 0.3)' : '#fde68a'}`,
          borderRadius: 12, padding: '16px 20px', marginBottom: 24,
          display: 'flex', gap: 14, alignItems: 'flex-start',
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, flexShrink: 0,
            background: dm ? 'rgba(234, 179, 8, 0.2)' : '#fef3c7',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <AlertTriangle size={22} color={dm ? '#fbbf24' : '#d97706'} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: dm ? '#fbbf24' : '#92400e', marginBottom: 4 }}>
              ملاحظات المراجع — {report.approval.reviewedBy}
            </div>
            <div style={{ fontSize: 14, color: dm ? 'var(--color-text-secondary)' : '#78350f', lineHeight: 1.7 }}>
              {report.approval.notes}
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
        <div className="card">
          <Section title={report.bankId ? 'البنك' : 'نوع التثمين'} icon={<Building2 size={20} />}>
            <Field label={report.bankId ? 'اسم البنك' : 'النوع'} value={report.bankId ? report.bankName : 'تثمين شخصي'} />
          </Section>
          <Section title={isLand ? 'المالك والمتقدم' : 'المستفيد'} icon={<User size={20} />}>
            <Field label={isLand ? 'اسم المالك' : 'الاسم الكامل'} value={report.beneficiaryName} />
            <Field label="الرقم المدني" value={report.beneficiaryCivilId} />
            <Field label="الهاتف" value={report.beneficiaryPhone} />
            <Field label="البريد" value={report.beneficiaryEmail} />
            <Field label="العنوان" value={report.beneficiaryAddress} />
            <Field label="الصفة" value={report.beneficiaryRelation === 'owner' ? 'مالك' : report.beneficiaryRelation === 'buyer' ? 'مشتري' : report.beneficiaryRelation === 'bank_client' ? 'عميل البنك' : 'ممثل قانوني'} />
            {isLand && report.applicantName && <Field label="اسم المتقدم" value={report.applicantName} />}
          </Section>
        </div>

        <div className="card">
          <Section title="نوع العقار" icon={<Home size={20} />}>
            <Field label="النوع" value={getPropertyTypeLabel(report.propertyType)} />
            <Field label="الاستخدام" value={getPropertyUsageLabel(report.propertyUsage)} />
            <Field label="الحالة" value={report.propertyCondition === 'excellent' ? 'ممتاز' : report.propertyCondition === 'good' ? 'جيد' : report.propertyCondition === 'average' ? 'مقبول' : 'غير محدد'} />
            {isLand && report.purposeOfValuation && <Field label="غرض التثمين" value={purposeLabels[report.purposeOfValuation] || report.purposeOfValuation} />}
          </Section>

          {isLand ? (
            <>
              <Section title="بيانات القطعة" icon={<LandPlot size={20} />}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
                  <Field label="المحافظة" value={pd.governorate} />
                  <Field label="الولاية" value={pd.wilayat} />
                  <Field label="المنطقة" value={pd.village} />
                  <Field label="رقم القطعة" value={pd.plotNumber} />
                  <Field label="رقم المربع" value={pd.blockNumber} />
                  <Field label="المساحة" value={`${pd.area} م²`} />
                  <Field label="رقم الطريق" value={pd.wayNumber} />
                  <Field label="رقم الكروكي" value={pd.krookiNumber} />
                  <Field label="رقم التسجيل" value={pd.registrationNumber} />
                  <Field label="تاريخ التسجيل" value={pd.registrationDate} />
                  <Field label="المنطقة المخططة" value={zonedLabels[pd.zoned || ''] || pd.zoned} />
                  <Field label="البناء المسموح" value={pd.allowableBuildUp} />
                  <Field label="الأدوار المسموحة" value={allowableFloorsLabels[pd.allowableFloors || ''] || pd.allowableFloors} />
                  <Field label="التوسعة المستقبلية" value={pd.possibleFutureExtension} />
                </div>
              </Section>
              <Section title="وصف الأرض" icon={<MapPin size={20} />}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
                  <Field label="مطابقة الكروكي" value={krookiMatchLabels[pd.krookiMatch || ''] || pd.krookiMatch} />
                  <Field label="طبوغرافية الأرض" value={topographyLabels[pd.topography || ''] || pd.topography} />
                  <Field label="جودة المحيط" value={qualityLabels[pd.qualityOfSurrounding || ''] || pd.qualityOfSurrounding} />
                  <Field label="العائد على البيع/الإيجار" value={qualityLabels[pd.returnOnSaleRent || ''] || pd.returnOnSaleRent} />
                </div>
                {pd.locationAccess && (
                  <div style={{ marginTop: 12, padding: 12, background: dm ? 'var(--color-surface-alt)' : 'var(--color-surface)', borderRadius: 8 }}>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 4 }}>الموقع والوصول:</div>
                    <div style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.7 }}>{pd.locationAccess}</div>
                  </div>
                )}
                {(pd.surroundingNorth || pd.surroundingEast || pd.surroundingSouth || pd.surroundingWest) && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 6 }}>الجوار المحيط:</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 4 }}>
                      {pd.surroundingNorth && <span style={{ fontSize: 13 }}>شمال: <strong>{pd.surroundingNorth}</strong></span>}
                      {pd.surroundingEast && <span style={{ fontSize: 13 }}>شرق: <strong>{pd.surroundingEast}</strong></span>}
                      {pd.surroundingSouth && <span style={{ fontSize: 13 }}>جنوب: <strong>{pd.surroundingSouth}</strong></span>}
                      {pd.surroundingWest && <span style={{ fontSize: 13 }}>غرب: <strong>{pd.surroundingWest}</strong></span>}
                    </div>
                  </div>
                )}
                {pd.locationNotes && <Field label="ملاحظات إضافية" value={pd.locationNotes} />}
              </Section>
            </>
          ) : isApartment && apt ? (
            <>
              <Section title="بيانات التوثيق" icon={<LandPlot size={20} />}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
                  <Field label="المحافظة" value={pd.governorate} />
                  <Field label="الولاية" value={pd.wilayat} />
                  <Field label="المنطقة" value={pd.village} />
                  <Field label="رقم القطعة" value={pd.plotNumber} />
                  <Field label="رقم المربع" value={pd.blockNumber} />
                  <Field label="مساحة الأرض الأم" value={`${pd.area} م²`} />
                  <Field label="رقم الطريق" value={pd.wayNumber} />
                  <Field label="رقم الكروكي" value={pd.krookiNumber} />
                  <Field label="رقم التسجيل" value={pd.registrationNumber} />
                  <Field label="تاريخ التسجيل" value={pd.registrationDate} />
                  <Field label="رقم رخصة البناء" value={apt.bldgPermitNumber} />
                  <Field label="تاريخ رخصة البناء" value={apt.bldgPermitDate} />
                  <Field label="المساحة المشتركة" value={apt.sharedAreaFromMotherPlot} />
                  <Field label="مساحة الوحدة" value={apt.unitArea} />
                  <Field label="المساحة المبنية الفعلية" value={apt.actualBuiltUp} />
                  <Field label="مواقف السيارات" value={apt.parking} />
                  <Field label="عدد الأدوار الكلي" value={apt.numberOfFloors} />
                  <Field label="دور الشقة" value={apt.apartmentOfFloors} />
                  <Field label="العدد الفعلي للأدوار" value={apt.actualNumberOfFloors} />
                  <Field label="تاريخ المخطط المعتمد" value={apt.approvedDrawingDate} />
                </div>
              </Section>
              <Section title="وصف الموقع" icon={<MapPin size={20} />}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
                  <Field label="مطابقة الكروكي" value={krookiMatchLabels[pd.krookiMatch || ''] || pd.krookiMatch} />
                  <Field label="طبوغرافية الأرض" value={topographyLabels[pd.topography || ''] || pd.topography} />
                  <Field label="جودة المحيط" value={qualityLabels[pd.qualityOfSurrounding || ''] || pd.qualityOfSurrounding} />
                  <Field label="العائد على البيع/الإيجار" value={qualityLabels[pd.returnOnSaleRent || ''] || pd.returnOnSaleRent} />
                </div>
                {(pd.surroundingNorth || pd.surroundingEast || pd.surroundingSouth || pd.surroundingWest) && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 6 }}>الجوار المحيط:</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 4 }}>
                      {pd.surroundingNorth && <span style={{ fontSize: 13 }}>شمال: <strong>{pd.surroundingNorth}</strong></span>}
                      {pd.surroundingEast && <span style={{ fontSize: 13 }}>شرق: <strong>{pd.surroundingEast}</strong></span>}
                      {pd.surroundingSouth && <span style={{ fontSize: 13 }}>جنوب: <strong>{pd.surroundingSouth}</strong></span>}
                      {pd.surroundingWest && <span style={{ fontSize: 13 }}>غرب: <strong>{pd.surroundingWest}</strong></span>}
                    </div>
                  </div>
                )}
                {pd.locationAccess && <Field label="الموقع والوصول" value={pd.locationAccess} />}
              </Section>
              <Section title="تفاصيل الشقة" icon={<Home size={20} />}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
                  <Field label="رقم الشقة" value={apt.apartmentNo} />
                  <Field label="رقم المنزل" value={apt.houseNo} />
                  <Field label="تاريخ إتمام البناء" value={apt.completionDate} />
                  <Field label="مطابقة المبنى للمخطط" value={buildingMatchOptions.find(b => b.value === apt.buildingMatchApprovedDrawing)?.label || apt.buildingMatchApprovedDrawing} />
                  <Field label="اسم الاستشاري" value={apt.consultantName} />
                </div>
                {apt.components.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>مكونات الشقة</div>
                    <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                          <th style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700 }}>المكون</th>
                          <th style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 700 }}>F.F</th>
                          <th style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 700 }}>P.H</th>
                        </tr>
                      </thead>
                      <tbody>
                        {apt.components.map((c, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                            <td style={{ padding: '6px 8px', fontWeight: 600 }}>{c.name}</td>
                            <td style={{ padding: '6px 8px', textAlign: 'center' }}>{c.ff || '—'}</td>
                            <td style={{ padding: '6px 8px', textAlign: 'center' }}>{c.ph || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    </div>
                  </div>
                )}
              </Section>
              <Section title="المواصفات والتشطيبات" icon={<Info size={20} />}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
                  <Field label="الأساس والهيكل" value={apt.foundationAndStructure} />
                  <Field label="الجدران" value={apt.walls} />
                  <Field label="السقف" value={apt.roof} />
                  <Field label="الأرضيات" value={apt.floorType} />
                  <Field label="التكييف" value={apt.airConditioning} />
                </div>
                {apt.internalFinishing.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>التشطيبات الداخلية</div>
                    <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                          <th style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700 }}>البند</th>
                          <th style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700 }}>النوع</th>
                          <th style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700 }}>الحالة</th>
                        </tr>
                      </thead>
                      <tbody>
                        {apt.internalFinishing.map((item, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                            <td style={{ padding: '6px 8px', fontWeight: 600 }}>{item.description}</td>
                            <td style={{ padding: '6px 8px' }}>{item.typeOfItem || '—'}</td>
                            <td style={{ padding: '6px 8px' }}>{item.condition || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    </div>
                  </div>
                )}
                {apt.estimatedPerMonth && <Field label="الإيجار الشهري المتوقع" value={apt.estimatedPerMonth} />}
              </Section>
            </>
          ) : (
            <Section title="تفاصيل الموقع" icon={<MapPin size={20} />}>
              <Field label="المحافظة" value={pd.governorate} />
              <Field label="الولاية" value={pd.wilayat} />
              <Field label="المنطقة" value={pd.village} />
              <Field label="رقم القطعة" value={pd.plotNumber} />
              <Field label="المساحة" value={`${pd.area} م²`} />
              <Field label="الشارع" value={pd.street} />
              <Field label="الواجهة" value={pd.frontage ? `${pd.frontage} م` : '—'} />
              {pd.floors > 0 && <Field label="الأدوار" value={pd.floors} />}
              {pd.rooms > 0 && <Field label="الغرف" value={pd.rooms} />}
              {pd.bathrooms > 0 && <Field label="دورات المياه" value={pd.bathrooms} />}
              {pd.buildingAge > 0 && <Field label="عمر البناء" value={`${pd.buildingAge} سنة`} />}
              {pd.services.length > 0 && <Field label="الخدمات" value={pd.services.join('، ')} />}
              {pd.locationNotes && <Field label="ملاحظات الموقع" value={pd.locationNotes} />}
              {pd.detailedDescription && <Field label="وصف تفصيلي" value={pd.detailedDescription} />}
            </Section>
          )}
        </div>

        <div className="card">
          <Section title="القيمة السوقية" icon={<DollarSign size={20} />}>
            {isLand ? (
              <>
                <Field label="القيمة السوقية" value={formatCurrency(report.valuation.totalMarketValue)} />
                <Field label="قيمة البيع القسري" value={formatCurrency(report.valuation.quickSaleValue)} />
              </>
            ) : isApartment ? (
              <>
                <Field label="القيمة السوقية" value={formatCurrency(report.valuation.totalMarketValue)} />
                <Field label="قيمة البيع القسري" value={formatCurrency(report.valuation.quickSaleValue)} />
                {apt?.estimatedPerMonth && <Field label="الإيجار الشهري المتوقع" value={apt.estimatedPerMonth} />}
              </>
            ) : (
              <>
                <Field label="قيمة الأرض" value={formatCurrency(report.valuation.landValue)} />
                <Field label="قيمة البناء" value={formatCurrency(report.valuation.buildingValue)} />
                <Field label="القيمة السوقية الإجمالية" value={formatCurrency(report.valuation.totalMarketValue)} />
                <Field label="قيمة البيع السريع" value={formatCurrency(report.valuation.quickSaleValue)} />
                {report.valuation.rentalValue && <Field label="القيمة التأجيرية" value={`${formatCurrency(report.valuation.rentalValue)}/شهر`} />}
              </>
            )}
            <Field label="طريقة التقييم" value={report.valuation.valuationMethod} />
            <Field label="مستوى المخاطر" value={report.valuation.riskLevel === 'low' ? 'منخفض' : report.valuation.riskLevel === 'medium' ? 'متوسط' : 'عالي'} />
            <Field label="نسبة الثقة" value={`${report.valuation.confidencePercentage}%`} />
            <Field label="ملاحظات المقيم" value={report.valuation.appraiserNotes} />
            <Field label="التوصية" value={report.valuation.finalRecommendation} />
            <Field label="أتعاب التثمين" value={formatCurrency(report.fees)} />
          </Section>
        </div>

        <div className="card">
          <Section title="المستندات" icon={<FileText size={20} />}>
            {report.documents.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>لا توجد مستندات مرفقة</p>
            ) : (() => {
              const photos = report.documents.filter(d => d.type === 'photo');
              const otherDocs = report.documents.filter(d => d.type !== 'photo');
              const docTypeLabels: Record<string, string> = { ownership: 'وثيقة الملكية', map: 'مخطط كروكي', id: 'وثيقة هوية' };
              const docTypeIcons: Record<string, React.ReactNode> = {
                ownership: <Shield size={18} color="#3b82f6" />,
                map: <MapPin size={18} color="#8b5cf6" />,
                id: <User size={18} color="#f59e0b" />,
              };
              return (
                <>
                  {/* Photo Gallery */}
                  {photos.length > 0 && (
                    <div style={{ marginBottom: otherDocs.length > 0 ? 20 : 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <Camera size={16} color="var(--color-primary)" />
                        <span style={{ fontSize: 14, fontWeight: 700 }}>صور العقار</span>
                        <span style={{
                          fontSize: 11, fontWeight: 700, background: 'var(--color-primary)', color: 'white',
                          borderRadius: 20, padding: '2px 10px', marginRight: 4,
                        }}>{photos.length}</span>
                      </div>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: 8,
                      }}>
                        {photos.map((photo, idx) => (
                          <div
                            key={photo.id}
                            onClick={() => setLightboxIndex(idx)}
                            style={{
                              position: 'relative',
                              aspectRatio: '4/3',
                              borderRadius: 10,
                              overflow: 'hidden',
                              cursor: 'pointer',
                              border: `1.5px solid ${dm ? '#334155' : '#e2e8f0'}`,
                              background: dm ? '#1e293b' : '#f1f5f9',
                            }}
                          >
                            <img
                              src={photo.url}
                              alt={photo.name}
                              style={{
                                width: '100%', height: '100%', objectFit: 'cover',
                                transition: 'transform 0.25s ease',
                              }}
                              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.06)'; }}
                              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                            />
                            <div style={{
                              position: 'absolute', bottom: 0, left: 0, right: 0,
                              background: 'linear-gradient(transparent, rgba(0,0,0,0.55))',
                              padding: '24px 10px 8px',
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            }}>
                              <span style={{ fontSize: 11, color: '#fff', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>{photo.name}</span>
                              <Eye size={14} color="#fff" style={{ opacity: 0.85 }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Other Documents — rendered as image previews */}
                  {otherDocs.length > 0 && (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <FileText size={16} color="var(--color-primary)" />
                        <span style={{ fontSize: 14, fontWeight: 700 }}>المستندات</span>
                        <span style={{
                          fontSize: 11, fontWeight: 700, background: '#8b5cf6', color: 'white',
                          borderRadius: 20, padding: '2px 10px', marginRight: 4,
                        }}>{otherDocs.length}</span>
                      </div>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                        gap: 12,
                      }}>
                        {otherDocs.map(doc => {
                          const isImage = doc.url && doc.url.startsWith('data:image');
                          return (
                            <div key={doc.id} style={{
                              borderRadius: 12, overflow: 'hidden',
                              border: `1.5px solid ${dm ? '#334155' : '#e2e8f0'}`,
                              background: dm ? 'var(--color-surface-alt)' : 'var(--color-surface)',
                            }}>
                              {isImage ? (
                                <div
                                  onClick={() => {
                                    const allImages = [...photos.map(p => p.url), ...otherDocs.filter(d => d.url?.startsWith('data:image')).map(d => d.url!)];
                                    const globalIdx = photos.length + otherDocs.filter(d => d.url?.startsWith('data:image')).indexOf(doc as any);
                                    setLightboxIndex(globalIdx >= photos.length ? null : globalIdx);
                                    // For otherDocs images, open in new tab as fallback
                                    window.open(doc.url, '_blank');
                                  }}
                                  style={{ cursor: 'pointer', position: 'relative' }}
                                >
                                  <img
                                    src={doc.url}
                                    alt={doc.name}
                                    style={{
                                      width: '100%', aspectRatio: '4/3', objectFit: 'cover',
                                      display: 'block',
                                    }}
                                  />
                                  <div style={{
                                    position: 'absolute', top: 8, right: 8,
                                    background: 'rgba(0,0,0,0.6)', borderRadius: 8,
                                    padding: '3px 10px', display: 'flex', alignItems: 'center', gap: 4,
                                  }}>
                                    {docTypeIcons[doc.type] || <FileText size={12} color="#fff" />}
                                    <span style={{ fontSize: 10, color: '#fff', fontWeight: 600 }}>
                                      {docTypeLabels[doc.type] || 'مستند'}
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <div style={{
                                  height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  background: dm ? '#1e293b' : '#f1f5f9',
                                }}>
                                  <div style={{ textAlign: 'center' }}>
                                    {docTypeIcons[doc.type] || <FileText size={32} color="var(--color-text-muted)" />}
                                    <p style={{ fontSize: 11, color: 'var(--color-text-muted)', margin: '6px 0 0' }}>
                                      {docTypeLabels[doc.type] || 'مستند'}
                                    </p>
                                  </div>
                                </div>
                              )}
                              <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ flex: 1, overflow: 'hidden' }}>
                                  <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.name}</div>
                                  <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{formatFileSize(doc.size)}</div>
                                </div>
                                {doc.url && doc.url !== '#' && (
                                  <a
                                    href={doc.url}
                                    download={doc.name}
                                    style={{
                                      display: 'flex', alignItems: 'center', gap: 3,
                                      fontSize: 10, color: 'var(--color-primary)',
                                      textDecoration: 'none', fontWeight: 600,
                                      padding: '3px 8px', borderRadius: 5,
                                      border: '1px solid var(--color-primary)',
                                      flexShrink: 0,
                                    }}
                                  >
                                    <Download size={10} /> تحميل
                                  </a>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </Section>

          {/* Lightbox Modal */}
          {lightboxIndex !== null && (() => {
            const photos = report.documents.filter(d => d.type === 'photo');
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

          <Section title="سجل الحالة" icon={<History size={20} />}>
            <div style={{ borderRight: '2px solid var(--color-border)', paddingRight: 16 }}>
              {[
                { label: 'تم الإنشاء', date: report.createdAt, icon: <Calendar size={14} /> },
                ...(report.approval.submittedAt ? [{ label: 'تم الإرسال للاعتماد', date: report.approval.submittedAt, icon: <Send size={14} /> }] : []),
                ...(report.approval.reviewedAt ? [{ label: `تم المراجعة بواسطة ${report.approval.reviewedBy}`, date: report.approval.reviewedAt, icon: <CheckCircle2 size={14} /> }] : []),
              ].map((item: any, i) => (
                <div key={i} style={{ marginBottom: 16, position: 'relative', paddingRight: 20 }}>
                  <div style={{ position: 'absolute', right: -25, top: 2, width: 24, height: 24, borderRadius: '50%', background: 'var(--color-surface)', border: '2px solid var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                    {item.icon}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{item.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{formatDate(item.date)}</div>
                </div>
              ))}
            </div>
            {report.approval.notes && (
              <div style={{ background: dm ? 'var(--color-surface-alt)' : 'var(--color-surface)', padding: 12, borderRadius: 8, marginTop: 8 }}>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 4 }}>ملاحظات المراجع:</div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{report.approval.notes}</div>
              </div>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}
