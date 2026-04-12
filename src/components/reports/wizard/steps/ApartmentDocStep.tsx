'use client';

import React from 'react';
import { LandPlot } from 'lucide-react';
import WizardStepLayout from '../WizardStepLayout';
import FormInput from '../FormInput';
import FormSelect from '../FormSelect';
import SectionCard from '../SectionCard';
import { governorates, wilayatData, zonedOptions, krookiMatchOptions, topographyOptions, qualityOfSurroundingOptions, returnOnSaleRentOptions } from '@/data/mock';

interface ApartmentDocStepProps {
  data: Record<string, string>;
  errors: Record<string, string>;
  onChange: (field: string, value: string) => void;
}

export default function ApartmentDocStep({ data, errors, onChange }: ApartmentDocStepProps) {
  return (
    <WizardStepLayout
      icon={<LandPlot size={22} color="var(--color-primary)" />}
      title="بيانات التوثيق والموقع"
    >
      <div className="wizard-form-grid" style={{ marginBottom: 20 }}>
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
          options={(wilayatData[data.governorate] || []).map((w) => ({ value: w, label: w }))}
          error={errors.wilayat}
          required
          placeholder="اختر الولاية"
        />
        {[
          { key: 'village', label: 'المنطقة' },
          { key: 'plotNumber', label: 'رقم القطعة', required: true },
          { key: 'blockNumber', label: 'رقم المربع' },
          { key: 'area', label: 'مساحة الأرض الأم (م²)', required: true, type: 'number' },
          { key: 'wayNumber', label: 'رقم الطريق' },
          { key: 'krookiNumber', label: 'رقم الكروكي' },
          { key: 'registrationNumber', label: 'رقم التسجيل' },
          { key: 'registrationDate', label: 'تاريخ التسجيل', type: 'date' },
        ].map((f) => (
          <FormInput
            key={f.key}
            label={f.label + (f.required ? ' *' : '')}
            value={data[f.key] || ''}
            onChange={(v) => onChange(f.key, v)}
            error={errors[f.key]}
            type={f.type || 'text'}
          />
        ))}
      </div>

      <SectionCard title="بيانات رخصة البناء والمساحات">
        <div className="wizard-form-grid">
          {[
            { key: 'aptBldgPermitNumber', label: 'رقم رخصة البناء' },
            { key: 'aptBldgPermitDate', label: 'تاريخ رخصة البناء', type: 'date' },
            { key: 'aptSharedArea', label: 'المساحة المشتركة من الأرض الأم (م²)' },
            { key: 'aptUnitArea', label: 'مساحة الوحدة (م²)', required: true },
            { key: 'aptActualBuiltUp', label: 'المساحة المبنية الفعلية (م²)' },
            { key: 'aptParking', label: 'مواقف السيارات' },
            { key: 'aptNumberOfFloors', label: 'عدد الأدوار الكلي' },
            { key: 'aptApartmentOfFloors', label: 'دور الشقة' },
            { key: 'aptActualNumberOfFloors', label: 'العدد الفعلي للأدوار' },
            { key: 'aptApprovedDrawingDate', label: 'تاريخ المخطط المعتمد', type: 'date' },
            { key: 'possibleFutureExtension', label: 'التوسعة المستقبلية' },
          ].map((f) => (
            <FormInput
              key={f.key}
              label={f.label + (f.required ? ' *' : '')}
              value={data[f.key] || ''}
              onChange={(v) => onChange(f.key, v)}
              error={errors[f.key]}
              type={f.type || 'text'}
            />
          ))}
          <FormSelect
            label="المنطقة المخططة"
            value={data.zoned || 'residential'}
            onChange={(v) => onChange('zoned', v)}
            options={zonedOptions.map((z) => ({ value: z.value, label: z.label }))}
          />
        </div>
      </SectionCard>

      <SectionCard title="وصف الموقع والجوار">
        <div className="wizard-form-grid" style={{ marginBottom: 16 }}>
          <FormSelect label="مطابقة الكروكي" value={data.krookiMatch || 'yes'} onChange={(v) => onChange('krookiMatch', v)} options={krookiMatchOptions.map((k) => ({ value: k.value, label: k.label }))} />
          <FormSelect label="طبوغرافية الأرض" value={data.topography || 'leveled'} onChange={(v) => onChange('topography', v)} options={topographyOptions.map((t) => ({ value: t.value, label: t.label }))} />
          <FormSelect label="جودة المحيط" value={data.qualityOfSurrounding || 'good'} onChange={(v) => onChange('qualityOfSurrounding', v)} options={qualityOfSurroundingOptions.map((q) => ({ value: q.value, label: q.label }))} />
          <FormSelect label="العائد على البيع/الإيجار" value={data.returnOnSaleRent || 'good'} onChange={(v) => onChange('returnOnSaleRent', v)} options={returnOnSaleRentOptions.map((r) => ({ value: r.value, label: r.label }))} />
        </div>
        <div className="wizard-form-grid-2" style={{ marginBottom: 16 }}>
          {[
            { key: 'surroundingNorth', label: 'شمال' },
            { key: 'surroundingEast', label: 'شرق' },
            { key: 'surroundingSouth', label: 'جنوب' },
            { key: 'surroundingWest', label: 'غرب' },
          ].map((f) => (
            <FormInput key={f.key} label={f.label} value={data[f.key] || ''} onChange={(v) => onChange(f.key, v)} />
          ))}
        </div>
        <textarea
          value={data.locationAccess || ''}
          onChange={(e) => onChange('locationAccess', e.target.value)}
          className="form-textarea"
          placeholder="الموقع والوصول"
        />
      </SectionCard>
    </WizardStepLayout>
  );
}
