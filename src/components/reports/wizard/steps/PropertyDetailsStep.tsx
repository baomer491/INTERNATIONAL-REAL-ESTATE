'use client';

import React from 'react';
import { MapPin, Building2, Home, CheckCircle2, AlertCircle } from 'lucide-react';
import WizardStepLayout from '../WizardStepLayout';
import FormInput from '../FormInput';
import FormSelect from '../FormSelect';
import FormTextarea from '../FormTextarea';
import { governorates, wilayatData, finishingLevels, services as allServices } from '@/data/mock';

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
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {title}
          </div>
          {subtitle && (
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 1 }}>
              {subtitle}
            </div>
          )}
        </div>
      </div>
      <div style={{ padding: '20px' }}>
        {children}
      </div>
    </div>
  );
}

interface PropertyDetailsStepProps {
  data: {
    governorate: string;
    wilayat: string;
    village: string;
    blockNumber: string;
    plotNumber: string;
    area: string;
    street: string;
    frontage: string;
    floors: string;
    rooms: string;
    bathrooms: string;
    buildingAge: string;
    finishingLevel: string;
    selectedServices: string[];
    locationNotes: string;
    detailedDescription: string;
  };
  errors: Record<string, string>;
  onChange: (field: string, value: any) => void;
}

export default function PropertyDetailsStep({ data, errors, onChange }: PropertyDetailsStepProps) {

  const toggleService = (svc: string) => {
    if (data.selectedServices.includes(svc)) {
      onChange('selectedServices', data.selectedServices.filter((s) => s !== svc));
    } else {
      onChange('selectedServices', [...data.selectedServices, svc]);
    }
  };

  const wilayatOptions = (wilayatData[data.governorate] || []).map((w) => ({ value: w, label: w }));
  const selectedWilayat = wilayatOptions.find((w) => w.value === data.wilayat);
  const selectedFinishing = finishingLevels.find((f) => f.value === data.finishingLevel);

  const locationComplete = !!(data.governorate && data.wilayat);
  const plotComplete = !!(data.plotNumber && data.area);
  const finishingComplete = !!data.finishingLevel;

  const numericFields = [
    { key: 'area', label: 'المساحة (م²)', required: true },
    { key: 'frontage', label: 'الواجهة (م)' },
    { key: 'floors', label: 'عدد الأدوار' },
    { key: 'rooms', label: 'عدد الغرف' },
    { key: 'bathrooms', label: 'دورات المياه' },
    { key: 'buildingAge', label: 'عمر البناء (سنة)' },
  ];

  return (
    <WizardStepLayout
      icon={<MapPin size={22} color="var(--color-primary)" />}
      title="تفاصيل العقار"
      subtitle="أدخل التفاصيل الموثقة للعقار غير المرتبط بأرض"
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            <FormSelect
              label="المحافظة"
              value={data.governorate}
              onChange={(v) => { onChange('governorate', v); onChange('wilayat', ''); }}
              options={governorates.map((g) => ({ value: g, label: g }))}
              error={errors.governorate}
              required
              placeholder="اختر المحافظة"
            />
            <FormSelect
              label="الولاية"
              value={data.wilayat}
              onChange={(v) => onChange('wilayat', v)}
              options={wilayatOptions}
              error={errors.wilayat}
              required
              placeholder="اختر الولاية"
            />
            <div style={{ gridColumn: '1 / -1' }}>
              <FormInput
                label="القرية / المنطقة"
                value={data.village}
                onChange={(v) => onChange('village', v)}
                placeholder="مثال: حي المطرح، صلالة"
              />
            </div>
          </div>

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

        {/* ── Section 2: Property Details ── */}
        <InfoSection
          title="تفاصيل العقار"
          subtitle="PROPERTY DETAILS"
          icon={<Building2 size={16} />}
          accentColor="var(--color-secondary)"
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            <FormInput
              label="رقم المربع (Block No.)"
              value={data.blockNumber}
              onChange={(v) => onChange('blockNumber', v)}
              placeholder="مثال: 18"
            />
            <FormInput
              label="رقم القطعة / الوحدة"
              value={data.plotNumber}
              onChange={(v) => onChange('plotNumber', v)}
              error={errors.plotNumber}
              required
              placeholder="مثال: 125-A"
            />
            <FormInput
              label="الشارع"
              value={data.street}
              onChange={(v) => onChange('street', v)}
              placeholder="مثال: شارع 23"
            />
            {numericFields.map((f) => (
              <FormInput
                key={f.key}
                label={f.label + (f.required ? ' *' : '')}
                value={(data as any)[f.key] || ''}
                onChange={(v) => onChange(f.key, v)}
                error={errors[f.key]}
                type="number"
                placeholder="0"
              />
            ))}
            <div style={{ gridColumn: '1 / -1' }}>
              <FormSelect
                label="حالة التشطيب"
                value={data.finishingLevel}
                onChange={(v) => onChange('finishingLevel', v)}
                options={finishingLevels.map((f) => ({ value: f.value, label: f.label }))}
              />
              {finishingComplete && (
                <div style={{
                  marginTop: 8,
                  padding: '6px 12px',
                  borderRadius: 6,
                  background: 'var(--color-secondary-50)',
                  border: '1px solid rgba(124, 58, 237, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}>
                  <CheckCircle2 size={11} color="var(--color-secondary)" />
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-secondary)' }}>
                    {selectedFinishing?.label}
                  </span>
                </div>
              )}
            </div>
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
                {data.plotNumber}
              </span>
              {data.area && (
                <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                  — {Number(data.area).toLocaleString()} م²
                </span>
              )}
              {data.floors && data.floors !== '0' && (
                <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                  — {data.floors} طابق
                </span>
              )}
            </div>
          )}
        </InfoSection>

        {/* ── Section 3: Services ── */}
        <InfoSection
          title="المرافق والخدمات"
          subtitle="AMENITIES & SERVICES"
          icon={<Home size={16} />}
          accentColor="var(--color-accent-dark)"
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {allServices.map((svc) => {
              const isSelected = data.selectedServices.includes(svc);
              return (
                <button
                  key={svc}
                  onClick={() => toggleService(svc)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 20,
                    border: isSelected
                      ? '1.5px solid var(--color-accent-dark)'
                      : '1.5px solid var(--color-border)',
                    background: isSelected
                      ? 'var(--color-accent-light)'
                      : 'transparent',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: isSelected ? 600 : 400,
                    color: isSelected ? 'var(--color-accent-dark)' : 'var(--color-text-secondary)',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  {isSelected && <CheckCircle2 size={12} color="var(--color-accent-dark)" />}
                  {svc}
                </button>
              );
            })}
          </div>
          {data.selectedServices.length > 0 && (
            <div style={{
              marginTop: 12,
              padding: '8px 14px',
              borderRadius: 8,
              background: 'var(--color-accent-light)',
              border: '1px solid rgba(6, 78, 59, 0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flexWrap: 'wrap',
            }}>
              <CheckCircle2 size={13} color="var(--color-accent-dark)" />
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-accent-dark)' }}>
                {data.selectedServices.length} خدمات مختارة
              </span>
              <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                — {data.selectedServices.join(' · ')}
              </span>
            </div>
          )}
        </InfoSection>

        {/* ── Section 4: Notes ── */}
        <InfoSection
          title="الملاحظات والوصف"
          subtitle="NOTES & DESCRIPTION"
          icon={<MapPin size={16} />}
          accentColor="var(--color-warning)"
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            <FormTextarea
              label="ملاحظات الموقع"
              value={data.locationNotes}
              onChange={(v) => onChange('locationNotes', v)}
              placeholder="مثال: العقار يقع على شارع رئيسي..."
            />
            <FormTextarea
              label="وصف تفصيلي"
              value={data.detailedDescription}
              onChange={(v) => onChange('detailedDescription', v)}
              placeholder="مثال: عقار حديث التشطيب..."
            />
          </div>
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
              ملخص تفاصيل العقار
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
                    {data.plotNumber}
                    {data.area && ` · ${Number(data.area).toLocaleString()} م²`}
                  </div>
                </div>
              )}
              {finishingComplete && (
                <div style={{
                  padding: '6px 10px',
                  borderRadius: 6,
                  background: 'var(--color-accent-light)',
                  border: '1px solid rgba(6, 78, 59, 0.12)',
                }}>
                  <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginBottom: 2 }}>التشطيب</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-accent-dark)' }}>
                    {selectedFinishing?.label}
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
