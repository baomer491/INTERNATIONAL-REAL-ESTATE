'use client';

import React from 'react';
import { FileText, Sparkles, Loader2, AlertCircle, RotateCcw, CreditCard, Camera, Upload, ScanText, MapPinned } from 'lucide-react';
import WizardStepLayout from '../WizardStepLayout';
import FileUploadZone from '../FileUploadZone';
import type { OCRExtractionResult, OCRStep } from '@/lib/ocr';
import { getStepLabel, getConfidenceLabel } from '@/lib/ocr';
import { useTheme } from '@/hooks/useTheme';

interface DocumentsStepProps {
  isLand: boolean;
  ownershipFile: File | null;
  mapFile: File | null;
  idFile: File | null;
  propertyPhoto: File | null;
  ownershipPreview: string;
  mapPreview: string;
  idPreview: string;
  photoPreview: string;
  extracting: boolean;
  ocrResult: OCRExtractionResult | null;
  ocrStep: OCRStep;
  extractedData: Record<string, string>;
  dataFields: Record<string, string>;
  // Individual extraction state
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
}

export default function DocumentsStep({
  isLand,
  ownershipFile,
  mapFile,
  idFile,
  propertyPhoto,
  ownershipPreview,
  mapPreview,
  idPreview,
  photoPreview,
  extracting,
  ocrResult,
  ocrStep,
  extractedData,
  dataFields,
  ownershipExtracting,
  sketchExtracting,
  ownershipExtracted,
  sketchExtracted,
  onFileUpload,
  onFileRemove,
  onRunOCR,
  onExtractOwnership,
  onExtractSketch,
  onPreview,
  onUpdateExtracted,
}: DocumentsStepProps) {
  const { isDark } = useTheme();
  const dm = isDark;

  const anyIndividualExtracting = ownershipExtracting || sketchExtracting;

  return (
    <WizardStepLayout
      icon={<FileText size={22} color="var(--color-primary)" />}
      title={isLand ? 'رفع المستندات' : 'رفع المستندات والكروكي'}
      subtitle={
        isLand
          ? 'ارفع المستندات المطلوبة لاستخراج بيانات العقار تلقائياً بالذكاء الاصطناعي'
          : 'ارفع صك الملكية والكروكي لاستخراج بيانات العقار تلقائياً بالذكاء الاصطناعي'
      }
    >
      <div className="wizard-form-grid-2" style={{ marginBottom: 20 }}>
        <div>
          <FileUploadZone
            field="ownershipFile"
            label="صك الملكية (Mulkiya)"
            accept=".pdf,.jpg,.jpeg,.png"
            preview={ownershipPreview}
            file={ownershipFile}
            icon={<Upload size={22} color="var(--color-primary)" />}
            onUpload={onFileUpload}
            onRemove={onFileRemove}
            onPreview={onPreview}
          />
          {/* Individual ownership extraction button */}
          {ownershipFile && (
            <button
              onClick={onExtractOwnership}
              disabled={ownershipExtracting || extracting || anyIndividualExtracting}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                width: '100%',
                marginTop: 8,
                padding: '8px 12px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                border: `1px solid ${ownershipExtracted ? (dm ? 'rgba(34,197,94,0.4)' : '#86efac') : 'var(--color-primary)'}`,
                background: ownershipExtracted
                  ? (dm ? 'rgba(34,197,94,0.1)' : '#f0fdf4')
                  : 'transparent',
                color: ownershipExtracted ? '#22c55e' : 'var(--color-primary)',
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
              {ownershipExtracting ? 'جاري استخراج الملكية...' : ownershipExtracted ? 'تم استخراج الملكية' : 'استخراج بيانات الملكية'}
            </button>
          )}
        </div>

        <div>
          <FileUploadZone
            field="mapFile"
            label="الكروكي (Krookie)"
            accept=".pdf,.jpg,.jpeg,.png"
            preview={mapPreview}
            file={mapFile}
            icon={<Upload size={22} color="var(--color-primary)" />}
            onUpload={onFileUpload}
            onRemove={onFileRemove}
            onPreview={onPreview}
          />
          {/* Individual sketch extraction button */}
          {mapFile && (
            <button
              onClick={onExtractSketch}
              disabled={sketchExtracting || extracting || anyIndividualExtracting}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                width: '100%',
                marginTop: 8,
                padding: '8px 12px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                border: `1px solid ${sketchExtracted ? (dm ? 'rgba(34,197,94,0.4)' : '#86efac') : 'var(--color-primary)'}`,
                background: sketchExtracted
                  ? (dm ? 'rgba(34,197,94,0.1)' : '#f0fdf4')
                  : 'transparent',
                color: sketchExtracted ? '#22c55e' : 'var(--color-primary)',
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
              {sketchExtracting ? 'جاري استخراج الكروكي...' : sketchExtracted ? 'تم استخراج الكروكي' : 'استخراج بيانات الكروكي'}
            </button>
          )}
        </div>
      </div>

      {isLand && (
        <div className="wizard-form-grid-2" style={{ marginBottom: 20 }}>
          <FileUploadZone
            field="idFile"
            label="صورة الهوية"
            accept=".pdf,.jpg,.jpeg,.png"
            preview={idPreview}
            file={idFile}
            icon={<CreditCard size={22} color="var(--color-primary)" />}
            onUpload={onFileUpload}
            onRemove={onFileRemove}
            onPreview={onPreview}
          />
          <FileUploadZone
            field="propertyPhoto"
            label="صورة العقار"
            accept=".jpg,.jpeg,.png"
            preview={photoPreview}
            file={propertyPhoto}
            icon={<Camera size={22} color="var(--color-primary)" />}
            onUpload={onFileUpload}
            onRemove={onFileRemove}
            onPreview={onPreview}
          />
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <button
          onClick={onRunOCR}
          disabled={extracting || !ownershipFile || anyIndividualExtracting}
          className={extracting ? 'btn btn-primary' : 'btn btn-outline'}
          style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: (!ownershipFile || anyIndividualExtracting) ? 0.5 : 1 }}
        >
          {extracting ? <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Sparkles size={16} />}
          {extracting ? getStepLabel(ocrStep) : `استخراج الكل${mapFile ? ' (صك + كروكي)' : ''}`}
        </button>
        {!ownershipFile && (
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>يرجى رفع صك الملكية أولاً</span>
        )}
        {(ownershipFile || mapFile) && (
          <span style={{ fontSize: 11, color: dm ? 'var(--color-text-secondary)' : '#94a3b8' }}>
            أو استخدم الأزرار الفردية فوق كل مستند
          </span>
        )}
      </div>

      {extracting && (
        <div
          style={{
            background: dm ? 'var(--color-info-bg)' : '#f0f7ff',
            borderRadius: 12,
            padding: 16,
            border: `1px solid ${dm ? 'rgba(59,130,246,0.3)' : '#bfdbfe'}`,
            marginBottom: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--color-primary), #3b82f6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Loader2 size={16} color="white" style={{ animation: 'spin 0.8s linear infinite' }} />
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, margin: 0, color: 'var(--color-primary)' }}>
                {getStepLabel(ocrStep)}
              </p>
              <p style={{ fontSize: 11, color: dm ? 'var(--color-text-secondary)' : '#64748b', margin: '2px 0 0' }}>
                جاري تحسين الصور وتحليل المستندات واستخراج بيانات العقار
              </p>
            </div>
          </div>
          <div className="wizard-progress-track">
            <div
              className="wizard-progress-fill"
              style={{
                width:
                  ocrStep === 'uploading'
                    ? '30%'
                    : ocrStep === 'processing'
                    ? '60%'
                    : ocrStep === 'parsing'
                    ? '90%'
                    : '100%',
              }}
            />
          </div>
        </div>
      )}

      {ocrStep === 'error' && ocrResult?.error && (
        <div
          style={{
            background: dm ? 'var(--color-danger-bg)' : '#fef2f2',
            borderRadius: 12,
            padding: 16,
            border: `1px solid ${dm ? 'rgba(239,68,68,0.3)' : '#fecaca'}`,
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: dm ? 'var(--color-danger-bg)' : '#fee2e2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <AlertCircle size={18} color="#ef4444" />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 600, margin: 0, color: '#b91c1c' }}>فشل استخراج البيانات</p>
            <p style={{ fontSize: 12, color: '#dc2626', margin: '2px 0 0' }}>{ocrResult.error}</p>
          </div>
          <button
            onClick={onRunOCR}
            className="btn btn-ghost"
            style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, flexShrink: 0 }}
          >
            <RotateCcw size={14} /> إعادة المحاولة
          </button>
        </div>
      )}

      {ocrStep === 'done' && ocrResult && (
        <div
          style={{
            background: dm ? 'var(--color-surface-alt)' : 'var(--color-surface)',
            borderRadius: 12,
            padding: 20,
            border: `1px solid ${dm ? 'rgba(34,197,94,0.3)' : '#dcfce7'}`,
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: -10,
              right: 16,
              background: 'var(--color-primary)',
              color: 'white',
              padding: '2px 10px',
              borderRadius: 6,
              fontSize: 10,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Sparkles size={10} /> AI Extracted
          </div>
          <h3
            style={{
              fontSize: 15,
              fontWeight: 700,
              margin: '0 0 4px',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            البيانات المستخرجة تلقائياً
          </h3>
          <p style={{ fontSize: 12, color: dm ? 'var(--color-text-secondary)' : '#64748b', margin: '0 0 16px' }}>
            تم تعبئة الحقول تلقائياً. يمكنك تعديل أي حقل في الخطوات التالية.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
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
                <div
                  key={f.key}
                  style={{
                    background: dm ? 'var(--color-surface)' : 'var(--color-surface)',
                    borderRadius: 8,
                    padding: '10px 12px',
                    border: `1px solid ${fieldValue?.value ? (dm ? 'rgba(34,197,94,0.3)' : '#dcfce7') : 'var(--color-border)'}`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <label style={{ fontSize: 11, color: dm ? 'var(--color-text-secondary)' : '#64748b', fontWeight: 500 }}>
                      {f.label}
                    </label>
                    {conf && (
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: 4,
                          background: conf.bg,
                          color: conf.color,
                        }}
                      >
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
                      fontSize: 13,
                      fontWeight: 600,
                      background: fieldValue?.value ? (dm ? 'var(--color-success-bg)' : '#f0fdf4') : undefined,
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
              <pre
                style={{
                  marginTop: 8,
                  padding: 12,
                  background: '#1e293b',
                  color: '#e2e8f0',
                  borderRadius: 8,
                  fontSize: 11,
                  overflow: 'auto',
                  maxHeight: 200,
                  direction: 'ltr',
                  textAlign: 'left',
                  lineHeight: 1.6,
                }}
              >
                {ocrResult.rawText}
              </pre>
            </details>
          )}
        </div>
      )}
    </WizardStepLayout>
  );
}
