'use client';

import React from 'react';
import { LandPlot, MapPin, FileCheck, Building2, CheckCircle2, AlertCircle } from 'lucide-react';
import WizardStepLayout from '../WizardStepLayout';
import FormInput from '../FormInput';
import FormSelect from '../FormSelect';
import { governorates, wilayatData, zonedOptions, allowableFloorsOptions } from '@/data/mock';

interface SectionProps {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  accentColor: string;
  children: React.ReactNode;
}

function InfoSection({ title, subtitle, icon, accentColor, children }: SectionProps) {
  return (
    <div style={{
      border: '1.5px solid var(--color-border)',
      borderRadius: 12,
      background: 'var(--color-surface)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 20px',
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-surface-alt)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <div style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: `${accentColor}14`,
          border: `1px solid ${accentColor}30`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          {React.cloneElement(icon as React.ReactElement<{size?: number; color?: string}>, { size: 16, color: accentColor })}
        </div>
        <div>
          <div style={{
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--color-text-primary)',
          }}>
            {title}
          </div>
          {subtitle && (
            <div style={{
              fontSize: 11,
              color: 'var(--color-text-muted)',
              marginTop: 1,
            }}>
              {subtitle}
            </div>
          )}
        </div>
      </div>
      {/* Content */}
      <div style={{ padding: '20px' }}>
        {children}
      </div>
    </div>
  );
}

interface LandPlotStepProps {
  data: {
    governorate: string;
    wilayat: string;
    village: string;
    plotNumber: string;
    blockNumber: string;
    wayNumber: string;
    krookiNumber: string;
    registrationNumber: string;
    registrationDate: string;
    area: string;
    zoned: string;
    allowableBuildUp: string;
    allowableFloors: string;
    possibleFutureExtension: string;
  };
  errors: Record<string, string>;
  onChange: (field: string, value: string) => void;
}

export default function LandPlotStep({ data, errors, onChange }: LandPlotStepProps) {

  const wilayatOptions = (wilayatData[data.governorate] || []).map((w) => ({ value: w, label: w }));
  const selectedWilayat = wilayatOptions.find((w) => w.value === data.wilayat);
  const selectedZoned = zonedOptions.find((z) => z.value === data.zoned);
  const selectedFloors = allowableFloorsOptions.find((f) => f.value === data.allowableFloors);

  // Track completion
  const locationComplete = !!(data.governorate && data.wilayat);
  const plotComplete = !!(data.plotNumber && data.area);
  const zoningComplete = !!data.zoned;

  return (
    <WizardStepLayout
      icon={<LandPlot size={22} color="var(--color-primary)" />}
      title="بيانات القطعة (Documentation Details)"
      subtitle="أدخل بيانات القطعة العقارية كما هي مسجلة في صك الملكية"
    >
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        maxWidth: 920,
        margin: '0 auto',
        width: '100%',
      }}>

        {/* ── Section 1: Location ── */}
        <InfoSection
          title="الموقع الجغرافي"
          subtitle="LOCATION"
          icon={<MapPin size={16} />}
          accentColor="var(--color-primary)"
        >
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 16,
          }}>
            <div>
              <FormSelect
                label="المحافظة"
                value={data.governorate}
                onChange={(v) => { onChange('governorate', v); onChange('wilayat', ''); }}
                options={governorates.map((g) => ({ value: g, label: g }))}
                error={errors.governorate}
                required
                placeholder="اختر المحافظة"
              />
            </div>
            <div>
              <FormSelect
                label="الولاية"
                value={data.wilayat}
                onChange={(v) => onChange('wilayat', v)}
                options={wilayatOptions}
                error={errors.wilayat}
                required
                placeholder="اختر الولاية"
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <FormInput
                label="القرية / المنطقة"
                value={data.village}
                onChange={(v) => onChange('village', v)}
                placeholder="مثال: حي المطرح، صلالة"
              />
            </div>
          </div>

          {/* Location status pill */}
          {locationComplete && (
            <div style={{
              marginTop: 14,
              padding: '8px 14px',
              borderRadius: 8,
              background: 'var(--color-primary-50)',
              border: '1px solid rgba(30, 58, 95, 0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <CheckCircle2 size={13} color="var(--color-primary)" />
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-primary)' }}>
                {data.governorate} / {selectedWilayat?.label || data.wilayat}
              </span>
              {data.village && (
                <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                  — {data.village}
                </span>
              )}
            </div>
          )}
          {!locationComplete && data.governorate && (
            <div style={{
              marginTop: 14,
              padding: '8px 14px',
              borderRadius: 8,
              background: 'var(--color-warning-bg)',
              border: '1px solid rgba(217, 119, 6, 0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <AlertCircle size={13} color="var(--color-warning)" />
              <span style={{ fontSize: 12, color: 'var(--color-warning)' }}>
                يرجى إكمال تحديد الولاية
              </span>
            </div>
          )}
        </InfoSection>

        {/* ── Section 2: Plot Documentation ── */}
        <InfoSection
          title="توثيق القطعة"
          subtitle="DOCUMENTATION"
          icon={<FileCheck size={16} />}
          accentColor="var(--color-secondary)"
        >
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 16,
          }}>
            <FormInput
              label="رقم القطعة (Plot No.)"
              value={data.plotNumber}
              onChange={(v) => onChange('plotNumber', v)}
              error={errors.plotNumber}
              required
              placeholder="مثال: 125"
            />
            <FormInput
              label="رقم المربع (Block No.)"
              value={data.blockNumber}
              onChange={(v) => onChange('blockNumber', v)}
              placeholder="مثال: 18"
            />
            <FormInput
              label="رقم الطريق (Way No.)"
              value={data.wayNumber}
              onChange={(v) => onChange('wayNumber', v)}
              placeholder="N/A"
            />
            <FormInput
              label="رقم الكروكي (Krooki No.)"
              value={data.krookiNumber}
              onChange={(v) => onChange('krookiNumber', v)}
              placeholder="مثال: KR-2024-001"
            />
            <FormInput
              label="رقم التسجيل (Reg. No.)"
              value={data.registrationNumber}
              onChange={(v) => onChange('registrationNumber', v)}
              placeholder="مثال: 12345"
            />
            <FormInput
              label="تاريخ التسجيل (Reg. Date)"
              value={data.registrationDate}
              onChange={(v) => onChange('registrationDate', v)}
              placeholder="DD-MM-YYYY"
            />
          </div>

          {plotComplete && (
            <div style={{
              marginTop: 14,
              padding: '8px 14px',
              borderRadius: 8,
              background: 'var(--color-secondary-50)',
              border: '1px solid rgba(124, 58, 237, 0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <CheckCircle2 size={13} color="var(--color-secondary)" />
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-secondary)' }}>
                قطعة رقم {data.plotNumber}
              </span>
              {data.blockNumber && (
                <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                  — مربع {data.blockNumber}
                </span>
              )}
              {data.krookiNumber && (
                <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                  — كروكي {data.krookiNumber}
                </span>
              )}
            </div>
          )}
        </InfoSection>

        {/* ── Section 3: Area & Zoning ── */}
        <InfoSection
          title="المساحة والتصنيف"
          subtitle="AREA & ZONING"
          icon={<Building2 size={16} />}
          accentColor="var(--color-accent-dark)"
        >
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 16,
          }}>
            <div>
              <FormInput
                label="المساحة (SQM)"
                value={data.area}
                onChange={(v) => onChange('area', v)}
                error={errors.area}
                required
                type="number"
                placeholder="مثال: 500"
              />
              {data.area && (
                <div style={{
                  marginTop: 8,
                  padding: '6px 12px',
                  borderRadius: 6,
                  background: 'var(--color-accent-light)',
                  border: '1px solid rgba(6, 78, 59, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}>
                  <CheckCircle2 size={11} color="var(--color-accent-dark)" />
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-accent-dark)' }}>
                    {Number(data.area).toLocaleString()} م²
                  </span>
                </div>
              )}
            </div>
            <FormSelect
              label="المنطقة المخططة (Zoned)"
              value={data.zoned}
              onChange={(v) => onChange('zoned', v)}
              options={zonedOptions.map((z) => ({ value: z.value, label: z.label }))}
            />
            <FormInput
              label="البناء المسموح (Build Up)"
              value={data.allowableBuildUp}
              onChange={(v) => onChange('allowableBuildUp', v)}
              placeholder="مثال: 60%"
            />
            <FormSelect
              label="الأدوار المسموحة (Floors)"
              value={data.allowableFloors}
              onChange={(v) => onChange('allowableFloors', v)}
              options={allowableFloorsOptions.map((f) => ({ value: f.value, label: f.label }))}
            />
            <div style={{ gridColumn: '1 / -1' }}>
              <FormInput
                label="التوسعة المستقبلية (Future Extension)"
                value={data.possibleFutureExtension}
                onChange={(v) => onChange('possibleFutureExtension', v)}
                placeholder="مثال: متاحةowards الجنوب"
              />
            </div>
          </div>

          {zoningComplete && (
            <div style={{
              marginTop: 14,
              padding: '8px 14px',
              borderRadius: 8,
              background: 'var(--color-accent-light)',
              border: '1px solid rgba(6, 78, 59, 0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <CheckCircle2 size={13} color="var(--color-accent-dark)" />
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-accent-dark)' }}>
                {selectedZoned?.label || data.zoned}
              </span>
              {selectedFloors && (
                <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                  — {selectedFloors.label}
                </span>
              )}
              {data.allowableBuildUp && (
                <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                  — نسبة البناء {data.allowableBuildUp}
                </span>
              )}
            </div>
          )}
        </InfoSection>

        {/* ── Summary Footer ── */}
        <div style={{
          padding: '14px 20px',
          borderRadius: 10,
          background: 'var(--color-surface-alt)',
          border: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
        }}>
          <div style={{
            width: 4,
            height: 40,
            borderRadius: 2,
            background: 'var(--color-primary)',
            flexShrink: 0,
            marginTop: 2,
          }} />
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              marginBottom: 6,
            }}>
              ملخص بيانات القطعة
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 8,
            }}>
              {locationComplete && (
                <div style={{
                  padding: '6px 10px',
                  borderRadius: 6,
                  background: 'var(--color-primary-50)',
                  border: '1px solid rgba(30, 58, 95, 0.12)',
                }}>
                  <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginBottom: 2 }}>الموقع</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-primary)' }}>
                    {data.governorate} / {selectedWilayat?.label || data.wilayat}
                  </div>
                </div>
              )}
              {plotComplete && (
                <div style={{
                  padding: '6px 10px',
                  borderRadius: 6,
                  background: 'var(--color-secondary-50)',
                  border: '1px solid rgba(124, 58, 237, 0.12)',
                }}>
                  <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginBottom: 2 }}>القطعة</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-secondary)' }}>
                    #{data.plotNumber} {data.blockNumber ? `/ ${data.blockNumber}` : ''}
                  </div>
                </div>
              )}
              {data.area && (
                <div style={{
                  padding: '6px 10px',
                  borderRadius: 6,
                  background: 'var(--color-accent-light)',
                  border: '1px solid rgba(6, 78, 59, 0.12)',
                }}>
                  <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginBottom: 2 }}>المساحة</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-accent-dark)' }}>
                    {Number(data.area).toLocaleString()} م²
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </WizardStepLayout>
  );
}
