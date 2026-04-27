'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { store } from '@/lib/store';
import { useApp } from '@/components/layout/AppContext';
import { useTheme } from '@/hooks/useTheme';
import type { PreliminaryValuation } from '@/types';
import {
  Plus, Trash2, Building2, MapPin, Ruler, DollarSign,
  Calendar, LayoutTemplate, FileText,
  X, Eye, Printer
} from 'lucide-react';

export default function PreliminaryListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useApp();
  const { isDark } = useTheme();
  const [items, setItems] = useState<PreliminaryValuation[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<PreliminaryValuation | null>(null);

  const loadData = async () => {
    const vals = store.getPreliminaryValuations();
    setItems(vals);
    setLoading(false);
    return vals;
  };

  useEffect(() => {
    loadData().then((vals) => {
      const previewId = searchParams.get('previewId');
      if (previewId) {
        const found = vals.find(v => v.id === previewId);
        if (found) {
          setPreviewItem(found);
        }
      }
    });
  }, [searchParams]);

  const handleDelete = (id: string) => {
    store.deletePreliminaryValuation(id);
    setItems(prev => prev.filter(i => i.id !== id));
    setDeleteId(null);
    showToast('تم حذف التثمين المبدئي', 'success');
  };



  const propertyTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      land: 'أرض', villa: 'فيلا', apartment: 'شقة',
      residential_building: 'مبنى سكني', commercial_building: 'مبنى تجاري',
      mixed_use: 'استخدام مختلط', farm: 'مزرعة',
      warehouse: 'مستودع', shop: 'محل تجاري',
    };
    return map[type] || type;
  };

  const handlePrint = (item: PreliminaryValuation) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<title>تثمين مبدئي - ${item.beneficiaryName}</title>
<style>
@page { size: A4; margin: 20mm; }
body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: #fff;
  color: #1a1a1a;
  padding: 40px;
  max-width: 800px;
  margin: 0 auto;
}
.header {
  text-align: center;
  border-bottom: 3px solid #b45309;
  padding-bottom: 20px;
  margin-bottom: 30px;
}
.header h1 {
  font-size: 28px;
  font-weight: 800;
  margin: 0 0 8px;
  color: #b45309;
}
.header p {
  font-size: 14px;
  color: #666;
  margin: 0;
}
.section {
  margin-bottom: 24px;
}
.section-title {
  font-size: 16px;
  font-weight: 700;
  color: #b45309;
  border-right: 4px solid #b45309;
  padding-right: 12px;
  margin-bottom: 14px;
}
.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 24px;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 14px;
  background: #f8f9fa;
  border-radius: 8px;
}
.field-label {
  font-size: 12px;
  color: #666;
  font-weight: 600;
}
.field-value {
  font-size: 15px;
  font-weight: 700;
  color: #1a1a1a;
}
.full-width {
  grid-column: 1 / -1;
}
.notes-box {
  padding: 14px;
  background: #fffbeb;
  border: 1px solid #fcd34d;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.7;
}
.footer {
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
  text-align: center;
  font-size: 12px;
  color: #999;
}
.signature-area {
  margin-top: 50px;
  display: flex;
  justify-content: space-between;
  gap: 40px;
}
.signature-box {
  flex: 1;
  text-align: center;
}
.signature-line {
  border-top: 1px solid #333;
  margin-top: 50px;
  padding-top: 8px;
  font-size: 13px;
  font-weight: 600;
}
@media print {
  body { padding: 0; }
  .no-print { display: none; }
}
</style>
</head>
<body>
  <div class="header">
    <h1>تقرير تثمين مبدئي</h1>
    <p>مكتب العقارات الدولية — International Real Estate Office</p>
    <p style="margin-top:6px; font-size:12px; color:#999;">رقم التقرير: PV-${item.id.slice(-6).toUpperCase()} | التاريخ: ${new Date(item.createdAt).toLocaleDateString('ar-OM')}</p>
  </div>

  <div class="section">
    <div class="section-title">معلومات المستفيد</div>
    <div class="grid">
      <div class="field">
        <span class="field-label">اسم المستفيد</span>
        <span class="field-value">${item.beneficiaryName}</span>
      </div>
      <div class="field">
        <span class="field-label">الرقم المدني</span>
        <span class="field-value">${item.civilId}</span>
      </div>
      <div class="field">
        <span class="field-label">رقم الهاتف</span>
        <span class="field-value">${item.phone}</span>
      </div>
      <div class="field">
        <span class="field-label">البنك</span>
        <span class="field-value">${item.bankName}</span>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">معلومات العقار</div>
    <div class="grid">
      <div class="field">
        <span class="field-label">نوع العقار</span>
        <span class="field-value">${propertyTypeLabel(item.propertyType)}</span>
      </div>
      <div class="field">
        <span class="field-label">رقم القطعة</span>
        <span class="field-value">${item.plotNumber}</span>
      </div>
      <div class="field">
        <span class="field-label">المحافظة</span>
        <span class="field-value">${item.governorate}</span>
      </div>
      <div class="field">
        <span class="field-label">الولاية</span>
        <span class="field-value">${item.wilayat}</span>
      </div>
      <div class="field">
        <span class="field-label">المساحة</span>
        <span class="field-value">${item.area} م²</span>
      </div>
      <div class="field">
        <span class="field-label">القيمة التقديرية</span>
        <span class="field-value" style="color:#b45309; font-size:18px;">${Number(item.estimatedValue).toLocaleString('ar-OM')} ر.ع</span>
      </div>
    </div>
  </div>

  ${item.notes ? `
  <div class="section">
    <div class="section-title">ملاحظات</div>
    <div class="notes-box">${item.notes}</div>
  </div>
  ` : ''}

  <div class="signature-area">
    <div class="signature-box">
      <div class="signature-line">توقيع المثمن</div>
    </div>
    <div class="signature-box">
      <div class="signature-line">توقيع المراجع</div>
    </div>
  </div>

  <div class="footer">
    تم إنشاء هذا التقرير إلكترونياً من نظام التثمين العقاري — ${new Date().toLocaleDateString('ar-OM')}
  </div>

  <div class="no-print" style="text-align:center; margin-top:30px;">
    <button onclick="window.print()" style="padding:10px 24px; font-size:14px; background:#b45309; color:#fff; border:none; border-radius:8px; cursor:pointer;">
      طباعة التقرير
    </button>
  </div>
</body>
</html>`;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 12
      }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 2px', letterSpacing: '-0.02em' }}>تقارير تثمين مبدئية</h1>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: 0 }}>التثمينات المبدئية المحفوظة</p>
        </div>
      </div>

      {/* Preliminary Valuations Section */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #b45309, #d97706)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'
          }}>
            <LayoutTemplate size={18} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text)' }}>التثمينات المبدئية المحفوظة</div>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>التقارير المبدئية التي تم إنشاؤها</div>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>جاري التحميل...</div>
        ) : items.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{
              width: 72, height: 72, borderRadius: 18,
              background: 'var(--color-surface-alt)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <LayoutTemplate size={32} color="var(--color-text-muted)" />
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 6px' }}>لا توجد تثمينات مبدئية</h3>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: '0 0 20px' }}>لم يتم إنشاء أي تثمين مبدئي بعد. يمكنك إنشاء تقرير جديد من قسم إنشاء تقرير جديد.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 14 }}>
            {items.map((item) => (
              <div
                key={item.id}
                className="card"
                style={{
                  padding: '20px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-primary)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-border)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 10,
                      background: 'linear-gradient(135deg, #b45309, #d97706)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff',
                    }}>
                      <FileText size={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                        {item.beneficiaryName}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Building2 size={12} /> {item.bankName}
                        <span style={{ opacity: 0.4 }}>·</span>
                        <Calendar size={12} /> {new Date(item.createdAt).toLocaleDateString('ar-OM')}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => setPreviewItem(item)}
                      className="btn btn-ghost"
                      style={{ fontSize: 12, padding: '5px 10px' }}
                      title="معاينة"
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      onClick={() => handlePrint(item)}
                      className="btn btn-ghost"
                      style={{ fontSize: 12, padding: '5px 10px' }}
                      title="طباعة"
                    >
                      <Printer size={14} />
                    </button>
                    <button
                      onClick={() => router.push(`/reports/new?type=preliminary&template=${item.id}`)}
                      className="btn btn-ghost"
                      style={{ fontSize: 12, padding: '5px 10px' }}
                      title="استخدام كقالب"
                    >
                      <FileText size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteId(item.id)}
                      className="btn btn-ghost"
                      style={{ fontSize: 12, padding: '5px 10px', color: 'var(--color-danger)' }}
                      title="حذف"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: 12,
                  background: 'var(--color-surface-alt)',
                  borderRadius: 10,
                  padding: '12px 16px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <HomeIcon />
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>نوع العقار</div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{propertyTypeLabel(item.propertyType)}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <MapPin size={16} color="var(--color-text-muted)" />
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>الموقع</div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{item.wilayat} - {item.governorate}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Ruler size={16} color="var(--color-text-muted)" />
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>المساحة</div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{item.area} م²</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <DollarSign size={16} color="var(--color-success)" />
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>القيمة التقديرية</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-success)' }}>{Number(item.estimatedValue).toLocaleString('ar-OM')} ر.ع</div>
                    </div>
                  </div>
                </div>

                {item.notes && (
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.6, padding: '0 4px' }}>
                    {item.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewItem && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.78)',
          backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 200, padding: 24, direction: 'rtl'
        }}>
          <div style={{
            background: 'var(--color-surface)',
            borderRadius: 24,
            width: '100%',
            maxWidth: 640,
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 32px 80px -16px rgba(0, 0, 0, 0.45)',
            border: '1px solid var(--color-border)',
            padding: '28px 32px',
            animation: 'slideInUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: 'linear-gradient(135deg, #b45309, #d97706)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff',
                }}>
                  <FileText size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>معاينة التثمين المبدئي</h3>
                  <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: '4px 0 0' }}>
                    رقم التقرير: PV-{previewItem.id.slice(-6).toUpperCase()}
                  </p>
                </div>
              </div>
              <button onClick={() => setPreviewItem(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 4 }}>
                <X size={22} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Beneficiary Info */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 4, height: 16, background: 'var(--color-primary)', borderRadius: 2 }} />
                  معلومات المستفيد
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 10,
                  background: 'var(--color-surface-alt)',
                  borderRadius: 12,
                  padding: '14px 16px',
                }}>
                  <PreviewField label="اسم المستفيد" value={previewItem.beneficiaryName} />
                  <PreviewField label="الرقم المدني" value={previewItem.civilId} />
                  <PreviewField label="رقم الهاتف" value={previewItem.phone} />
                  <PreviewField label="البنك" value={previewItem.bankName} />
                </div>
              </div>

              {/* Property Info */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 4, height: 16, background: 'var(--color-primary)', borderRadius: 2 }} />
                  معلومات العقار
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 10,
                  background: 'var(--color-surface-alt)',
                  borderRadius: 12,
                  padding: '14px 16px',
                }}>
                  <PreviewField label="نوع العقار" value={propertyTypeLabel(previewItem.propertyType)} />
                  <PreviewField label="رقم القطعة" value={previewItem.plotNumber} />
                  <PreviewField label="المحافظة" value={previewItem.governorate} />
                  <PreviewField label="الولاية" value={previewItem.wilayat} />
                  <PreviewField label="المساحة" value={`${previewItem.area} م²`} />
                  <PreviewField label="القيمة التقديرية" value={`${Number(previewItem.estimatedValue).toLocaleString('ar-OM')} ر.ع`} highlight />
                </div>
              </div>

              {/* Notes */}
              {previewItem.notes && (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 4, height: 16, background: 'var(--color-primary)', borderRadius: 2 }} />
                    ملاحظات
                  </div>
                  <div style={{
                    padding: '14px 16px',
                    background: isDark ? 'rgba(251, 191, 36, 0.08)' : '#fffbeb',
                    border: `1px solid ${isDark ? 'rgba(251, 191, 36, 0.2)' : '#fcd34d'}`,
                    borderRadius: 12,
                    fontSize: 14,
                    lineHeight: 1.7,
                    color: 'var(--color-text)',
                  }}>
                    {previewItem.notes}
                  </div>
                </div>
              )}

              {/* Footer actions */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button onClick={() => setPreviewItem(null)} className="btn btn-ghost" style={{ fontSize: 13, padding: '8px 16px' }}>
                  إغلاق
                </button>
                <button onClick={() => { handlePrint(previewItem); setPreviewItem(null); }} className="btn btn-primary" style={{ fontSize: 13, padding: '8px 18px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Printer size={15} /> طباعة
                </button>
              </div>
            </div>
          </div>

          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes slideInUp {
              from { opacity: 0; transform: translateY(20px) scale(0.98); }
              to { opacity: 1; transform: translateY(0) scale(1); }
            }
          ` }} />
        </div>
      )}

      {/* Delete Preliminary Modal */}
      {deleteId && (
        <div className="wizard-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setDeleteId(null); }}>
          <div className="wizard-modal-content">
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--color-danger-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <Trash2 size={24} color="var(--color-danger)" />
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 6px' }}>حذف التثمين المبدئي؟</h3>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: '0 0 20px' }}>هل أنت متأكد من حذف هذا التثمين المبدئي؟ لا يمكن التراجع عن هذا الإجراء.</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button onClick={() => setDeleteId(null)} className="btn btn-ghost" style={{ fontSize: 13, padding: '8px 16px' }}>إلغاء</button>
              <button onClick={() => handleDelete(deleteId)} className="btn btn-danger" style={{ fontSize: 13, padding: '8px 18px' }}>
                <Trash2 size={14} /> تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function HomeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-text-muted)' }}>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function PreviewField({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600 }}>{label}</span>
      <span style={{
        fontSize: 14,
        fontWeight: highlight ? 800 : 700,
        color: highlight ? 'var(--color-success)' : 'var(--color-text)',
      }}>
        {value || '—'}
      </span>
    </div>
  );
}