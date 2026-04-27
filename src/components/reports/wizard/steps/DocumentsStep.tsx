'use client';

import React from 'react';
import {
  FileText, Sparkles, Loader2, AlertCircle, RotateCcw,
  CreditCard, Upload, ScanText, MapPinned, CheckCircle2,
  Image, Info
} from 'lucide-react';
import WizardStepLayout from '../WizardStepLayout';
import FileUploadZone from '../FileUploadZone';
import PhotosUpload from '../PhotosUpload';
import type { OCRExtractionResult, OCRStep } from '@/lib/ocr';
import { getStepLabel, getConfidenceLabel } from '@/lib/ocr';
import { useTheme } from '@/hooks/useTheme';

interface DocumentsStepProps {
  isLand: boolean;
  ownershipFile: File | null;
  mapFile: File | null;
  idFile: File | null;
  propertyPhotos: File[];
  ownershipPreview: string;
  mapPreview: string;
  idPreview: string;
  photoPreview: string;
  photoPreviews: string[];
  extracting: boolean;
  ocrResult: OCRExtractionResult | null;
  ocrStep: OCRStep;
  extractedData: Record<string, string>;
  dataFields: Record<string, string>;
  ownershipExtracting: boolean;
  sketchExtracting: boolean;
  ownershipExtracted: boolean;
  sketchExtracted: boolean;
  onFileUpload: (field: string, file: File) => void;
  onFileRemove: (field: string) => void;
  onRunOCR: () => void;
  onExtractOwnership: () => void;
  onExtractSketch: () => void;
  onPreview: (url: string, type: string, name: string, label: string) => void;
  onUpdateExtracted: (field: string, value: string) => void;
  onPhotosAdd: (files: File[]) => void;
  onPhotoRemove: (index: number) => void;
}

interface SectionProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  accentColor: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

function DocSection({ title, subtitle, icon, accentColor, children, footer }: SectionProps) {
  return (
    <div style={{
      border: '1.5px solid var(--color-border)',
      borderRadius: 12,
      background: 'var(--color-surface)',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '14px 20px',
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-surface-alt)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        <div style={{
          width: 34,
          height: 34,
          borderRadius: 8,
          background: `${accentColor}12`,
          border: `1px solid ${accentColor}25`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {icon}
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)' }}>{title}</div>
          <div style={{ fontSize: 10, color: 'var(--color-text-muted)', letterSpacing: 0.5, textTransform: 'uppercase', fontWeight: 600 }}>{subtitle}</div>
        </div>
      </div>
      <div style={{ padding: 20 }}>
        {children}
      </div>
      {footer && (
        <div style={{
          padding: '10px 20px',
          borderTop: '1px solid var(--color-border)',
          background: 'var(--color-surface-alt)',
        }}>
          {footer}
        </div>
      )}
    </div>
  );
}

interface StatusPillProps {
  state: 'idle' | 'loading' | 'done' | 'error';
  label: string;
}

function StatusPill({ state, label }: StatusPillProps) {
  const configs = {
    idle: { bg: 'var(--color-surface-alt)', border: 'var(--color-border)', color: 'var(--color-text-muted)' },
    loading: { bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.25)', color: 'var(--color-primary)' },
    done: { bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.25)', color: 'var(--color-success)' },
    error: { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)', color: 'var(--color-danger)' },
  };
  const c = configs[state];
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '3px 10px',
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 600,
      background: c.bg,
      border: `1px solid ${c.border}`,
      color: c.color,
    }}>
      {state === 'loading' && <Loader2 size={10} style={{ animation: 'spin 0.8s linear infinite' }} />}
      {state === 'done' && <CheckCircle2 size={10} />}
      {state === 'error' && <AlertCircle size={10} />}
      {label}
    </span>
  );
}

export default function DocumentsStep({
  isLand, ownershipFile, mapFile, idFile, propertyPhotos,
  ownershipPreview, mapPreview, idPreview, photoPreviews,
  extracting, ocrResult, ocrStep, extractedData, dataFields,
  ownershipExtracting, sketchExtracting, ownershipExtracted, sketchExtracted,
  onFileUpload, onFileRemove, onRunOCR, onExtractOwnership, onExtractSketch,
  onPreview, onUpdateExtracted, onPhotosAdd, onPhotoRemove,
}: DocumentsStepProps) {
  const { isDark } = useTheme();
  const dm = isDark;
  const anyIndividualExtracting = ownershipExtracting || sketchExtracting;

  const allDocsUploaded = ownershipFile && mapFile && idFile;
  const hasPhotos = propertyPhotos.length > 0;

  return (
    <WizardStepLayout
      icon={<FileText size={22} color="var(--color-primary)" />}
      title={isLand ? 'المستندات والصور' : 'المستندات والكروكي والصور'}
      subtitle="ارفع المستندات المطلوبة — يتم استخراج بيانات العقار تلقائياً بالذكاء الاصطناعي"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 900, margin: '0 auto', width: '100%' }}>

        {/* ── Ownership & Sketch ── */}
        <DocSection
          title="صك الملكية والكروكي"
          subtitle="OWNERSHIP & SKETCH DOCUMENTS"
          icon={<FileText size={16} color="var(--color-primary)" />}
          accentColor="var(--color-primary)"
          footer={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <StatusPill state={ownershipFile ? (ownershipExtracting ? 'loading' : ownershipExtracted ? 'done' : 'idle') : 'idle'} label={ownershipFile ? (ownershipExtracting ? 'جاري الاستخراج' : ownershipExtracted ? 'تم الاستخراج' : 'مرفوع') : 'غير مرفوع'} />
                <StatusPill state={mapFile ? (sketchExtracting ? 'loading' : sketchExtracted ? 'done' : 'idle') : 'idle'} label={mapFile ? (sketchExtracting ? 'جاري الاستخراج' : sketchExtracted ? 'تم الاستخراج' : 'مرفوع') : 'غير مرفوع'} />
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                صيغ مدعومة: PDF, JPG, PNG
              </div>
            </div>
          }
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Ownership */}
            <div>
              <FileUploadZone
                field="ownershipFile"
                label="صك الملكية"
                accept=".pdf,.jpg,.jpeg,.png"
                preview={ownershipPreview}
                file={ownershipFile}
                icon={<Upload size={20} color="var(--color-primary)" />}
                onUpload={onFileUpload}
                onRemove={onFileRemove}
                onPreview={onPreview}
              />
              {ownershipFile && (
                <button
                  onClick={onExtractOwnership}
                  disabled={ownershipExtracting || extracting || anyIndividualExtracting}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    width: '100%', marginTop: 8, padding: '8px 12px', borderRadius: 8,
                    fontSize: 12, fontWeight: 600,
                    border: `1px solid ${ownershipExtracted ? 'rgba(34,197,94,0.4)' : 'var(--color-primary)'}`,
                    background: ownershipExtracted ? 'rgba(34,197,94,0.08)' : 'transparent',
                    color: ownershipExtracted ? 'var(--color-success)' : 'var(--color-primary)',
                    cursor: (ownershipExtracting || extracting || anyIndividualExtracting) ? 'not-allowed' : 'pointer',
                    opacity: (ownershipExtracting || extracting || anyIndividualExtracting) ? 0.6 : 1,
                    transition: 'all 0.2s',
                  }}
                >
                  {ownershipExtracting ? (
                    <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} />
                  ) : (
                    <ScanText size={14} />
                  )}
                  {ownershipExtracting ? 'جاري الاستخراج...' : ownershipExtracted ? 'إعادة استخراج الملكية' : 'استخراج بيانات الملكية'}
                </button>
              )}
            </div>

            {/* Sketch */}
            <div>
              <FileUploadZone
                field="mapFile"
                label="الكروكي"
                accept=".pdf,.jpg,.jpeg,.png"
                preview={mapPreview}
                file={mapFile}
                icon={<MapPinned size={20} color="var(--color-primary)" />}
                onUpload={onFileUpload}
                onRemove={onFileRemove}
                onPreview={onPreview}
              />
              {mapFile && (
                <button
                  onClick={onExtractSketch}
                  disabled={sketchExtracting || extracting || anyIndividualExtracting}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    width: '100%', marginTop: 8, padding: '8px 12px', borderRadius: 8,
                    fontSize: 12, fontWeight: 600,
                    border: `1px solid ${sketchExtracted ? 'rgba(34,197,94,0.4)' : 'var(--color-primary)'}`,
                    background: sketchExtracted ? 'rgba(34,197,94,0.08)' : 'transparent',
                    color: sketchExtracted ? 'var(--color-success)' : 'var(--color-primary)',
                    cursor: (sketchExtracting || extracting || anyIndividualExtracting) ? 'not-allowed' : 'pointer',
                    opacity: (sketchExtracting || extracting || anyIndividualExtracting) ? 0.6 : 1,
                    transition: 'all 0.2s',
                  }}
                >
                  {sketchExtracting ? (
                    <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} />
                  ) : (
                    <MapPinned size={14} />
                  )}
                  {sketchExtracting ? 'جاري الاستخراج...' : sketchExtracted ? 'إعادة استخراج الكروكي' : 'استخراج بيانات الكروكي'}
                </button>
              )}
            </div>
          </div>
        </DocSection>

        {/* ── ID & Photos ── */}
        <DocSection
          title="صورة الهوية وصور العقار"
          subtitle="IDENTITY DOCUMENT & PROPERTY PHOTOS"
          icon={<CreditCard size={16} color="var(--color-secondary)" />}
          accentColor="var(--color-secondary)"
          footer={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <StatusPill state={idFile ? 'done' : 'idle'} label={idFile ? 'صورة الهوية مرفوعة' : 'لم ترفع صورة الهوية'} />
              <StatusPill state={hasPhotos ? 'done' : 'idle'} label={hasPhotos ? `${propertyPhotos.length} صورة مرفوعة` : 'لم ترفع صور'} />
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>حتى 10 صور</div>
            </div>
          }
        >
          {isLand ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <FileUploadZone
                field="idFile"
                label="صورة الهوية"
                accept=".pdf,.jpg,.jpeg,.png"
                preview={idPreview}
                file={idFile}
                icon={<CreditCard size={20} color="var(--color-secondary)" />}
                onUpload={onFileUpload}
                onRemove={onFileRemove}
                onPreview={onPreview}
              />
              <PhotosUpload
                photos={propertyPhotos}
                previews={photoPreviews}
                onAdd={onPhotosAdd}
                onRemove={onPhotoRemove}
                onPreview={onPreview}
                maxPhotos={10}
              />
            </div>
          ) : (
            <PhotosUpload
              photos={propertyPhotos}
              previews={photoPreviews}
              onAdd={onPhotosAdd}
              onRemove={onPhotoRemove}
              onPreview={onPreview}
              maxPhotos={10}
            />
          )}
        </DocSection>

        {/* ── OCR Action ── */}
        <div style={{
          background: 'var(--color-surface)',
          border: '1.5px solid var(--color-border)',
          borderRadius: 12,
          padding: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'linear-gradient(135deg, var(--color-secondary), var(--color-secondary-dark))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Sparkles size={18} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                استخراج البيانات بالذكاء الاصطناعي
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                {ownershipFile
                  ? mapFile
                    ? 'صك الملكية والكروكي جاهزان — اضغط لاستخراج كل البيانات'
                    : 'صك الملكية جاهز — اضغط لاستخراج البيانات'
                  : 'ارفع صك الملكية أولاً ثم اضغط استخراج الكل'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {!ownershipFile && (
              <span style={{ fontSize: 11, color: dm ? 'var(--color-text-secondary)' : 'var(--color-text-muted)' }}>
                <Info size={12} style={{ display: 'inline', verticalAlign: 'middle' }} />
                {' '}يرجى رفع صك الملكية أولاً
              </span>
            )}
            <button
              onClick={onRunOCR}
              disabled={extracting || !ownershipFile || anyIndividualExtracting}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 20px', borderRadius: 10,
                fontSize: 13, fontWeight: 700,
                background: extracting || !ownershipFile || anyIndividualExtracting
                  ? 'var(--color-surface-alt)'
                  : 'linear-gradient(135deg, var(--color-secondary), var(--color-secondary-dark))',
                color: extracting || !ownershipFile || anyIndividualExtracting
                  ? 'var(--color-text-muted)'
                  : '#fff',
                border: 'none',
                cursor: (extracting || !ownershipFile || anyIndividualExtracting) ? 'not-allowed' : 'pointer',
                opacity: (extracting || !ownershipFile || anyIndividualExtracting) ? 0.6 : 1,
                transition: 'all 0.2s',
                boxShadow: (extracting || !ownershipFile || anyIndividualExtracting) ? 'none' : 'var(--shadow-md)',
              }}
            >
              {extracting ? <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Sparkles size={16} />}
              {extracting ? getStepLabel(ocrStep) : `استخراج الكل${mapFile ? ' (صك + كروكي)' : ''}`}
            </button>
          </div>
        </div>

        {/* ── Extraction Progress ── */}
        {extracting && (
          <div style={{
            background: dm ? 'rgba(59,130,246,0.08)' : 'var(--color-info-bg)',
            borderRadius: 12, padding: 16,
            border: `1px solid ${dm ? 'rgba(59,130,246,0.3)' : 'var(--color-primary-100)'}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--color-secondary), var(--color-secondary-dark))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Loader2 size={18} color="#fff" style={{ animation: 'spin 0.8s linear infinite' }} />
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, margin: 0, color: 'var(--color-secondary)' }}>
                  {getStepLabel(ocrStep)}
                </p>
                <p style={{ fontSize: 11, color: dm ? 'var(--color-text-secondary)' : 'var(--color-text-secondary)', margin: '2px 0 0' }}>
                  جاري تحسين الصور وتحليل المستندات واستخراج بيانات العقار
                </p>
              </div>
            </div>
            <div style={{
              height: 6, borderRadius: 3,
              background: dm ? 'var(--color-surface-alt)' : 'var(--color-primary-50)',
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', borderRadius: 3,
                background: 'linear-gradient(90deg, var(--color-secondary), var(--color-secondary-light))',
                width: ocrStep === 'uploading' ? '30%' : ocrStep === 'processing' ? '60%' : ocrStep === 'parsing' ? '90%' : '100%',
                transition: 'width 0.4s ease',
              }} />
            </div>
          </div>
        )}

        {/* ── Error State ── */}
        {ocrStep === 'error' && ocrResult?.error && (
          <div style={{
            background: dm ? 'var(--color-danger-bg)' : 'var(--color-danger-bg)',
            borderRadius: 12, padding: 16,
            border: `1px solid ${dm ? 'rgba(239,68,68,0.3)' : 'var(--color-danger-light)'}`,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: dm ? 'var(--color-danger-bg)' : 'var(--color-danger-bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <AlertCircle size={18} color="var(--color-danger)" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 700, margin: 0, color: 'var(--color-danger)' }}>فشل استخراج البيانات</p>
              <p style={{ fontSize: 12, color: 'var(--color-danger)', margin: '2px 0 0' }}>{ocrResult.error}</p>
            </div>
            <button
              onClick={onRunOCR}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
                borderRadius: 8, fontSize: 12, fontWeight: 600,
                background: 'transparent', color: 'var(--color-danger)',
                border: '1px solid var(--color-danger-light)', cursor: 'pointer',
              }}
            >
              <RotateCcw size={14} /> إعادة المحاولة
            </button>
          </div>
        )}

        {/* ── Extracted Data ── */}
        {ocrStep === 'done' && ocrResult && (
          <div style={{
            background: 'var(--color-surface)',
            border: '1.5px solid rgba(124,58,237,0.3)',
            borderRadius: 12, padding: 20,
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute', top: -10, right: 16,
              background: 'linear-gradient(135deg, var(--color-secondary), var(--color-secondary-dark))',
              color: '#fff', padding: '2px 12px', borderRadius: 6,
              fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <Sparkles size={10} /> AI EXTRACTED DATA
            </div>
            <h3 style={{
              fontSize: 15, fontWeight: 700, margin: '8px 0 4px',
              color: 'var(--color-secondary)', display: 'flex', alignItems: 'center', gap: 8,
            }}>
              البيانات المستخرجة تلقائياً
            </h3>
            <p style={{ fontSize: 12, color: dm ? 'var(--color-text-secondary)' : 'var(--color-text-secondary)', margin: '0 0 16px' }}>
              تم تعبئة الحقول تلقائياً من المستندات. يمكنك تعديل أي حقل في الخطوات التالية.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
              {[
                { key: 'plotNumber', label: 'رقم القطعة' },
                { key: 'drawingNumber', label: 'رقم الكروكي' },
                { key: 'area', label: 'المساحة' },
                { key: 'wilayat', label: 'الولاية' },
                { key: 'governorate', label: 'المحافظة' },
                { key: 'usageType', label: 'نوع الاستخدام' },
                { key: 'owner', label: 'المالك' },
                { key: 'blockNumber', label: 'رقم المربع' },
                { key: 'street', label: 'الشارع' },
                { key: 'village', label: 'القرية' },
                { key: 'frontage', label: 'الواجهة' },
                { key: 'floors', label: 'الأدوار' },
                { key: 'buildingAge', label: 'عمر البناء' },
              ].map((f) => {
                const fieldValue = (ocrResult.fields as any)[f.key];
                const conf = fieldValue?.value ? getConfidenceLabel(fieldValue.confidence) : null;
                return (
                  <div key={f.key} style={{
                    background: 'var(--color-surface-alt)',
                    borderRadius: 8, padding: '10px 12px',
                    border: `1px solid ${fieldValue?.value ? 'rgba(124,58,237,0.2)' : 'var(--color-border)'}`,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <label style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 500 }}>{f.label}</label>
                      {conf && (
                        <span style={{
                          fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 4,
                          background: conf.bg, color: conf.color,
                        }}>
                          {conf.label}
                        </span>
                      )}
                    </div>
                    <input
                      value={extractedData[f.key] || dataFields[f.key] || ''}
                      onChange={(e) => onUpdateExtracted(f.key, e.target.value)}
                      placeholder="--"
                      className="form-input"
                      style={{
                        fontSize: 13, fontWeight: 600,
                        background: fieldValue?.value ? (dm ? 'rgba(124,58,237,0.08)' : 'var(--color-secondary-50)') : undefined,
                        borderColor: fieldValue?.value ? 'rgba(124,58,237,0.3)' : undefined,
                      }}
                    />
                  </div>
                );
              })}
            </div>
            {ocrResult.rawText && (
              <details style={{ marginTop: 16 }}>
                <summary style={{ fontSize: 12, color: 'var(--color-text-muted)', cursor: 'pointer', fontWeight: 500 }}>
                  عرض النص المستخرج خام
                </summary>
                <pre style={{
                  marginTop: 8, padding: 12, background: 'var(--color-text)', color: 'var(--color-border)',
                  borderRadius: 8, fontSize: 11, overflow: 'auto', maxHeight: 200,
                  direction: 'ltr', textAlign: 'left', lineHeight: 1.6,
                }}>
                  {ocrResult.rawText}
                </pre>
              </details>
            )}
          </div>
        )}

      </div>
    </WizardStepLayout>
  );
}
