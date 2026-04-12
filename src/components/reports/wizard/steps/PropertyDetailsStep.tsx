'use client';

import React from 'react';
import { MapPin } from 'lucide-react';
import WizardStepLayout from '../WizardStepLayout';
import FormInput from '../FormInput';
import FormSelect from '../FormSelect';
import FormTextarea from '../FormTextarea';
import { governorates, wilayatData, finishingLevels, services as allServices } from '@/data/mock';

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

  return (
    <WizardStepLayout
      icon={<MapPin size={22} color="var(--color-primary)" />}
      title="تفاصيل العقار"
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
          { key: 'village', label: 'القرية / المنطقة' },
          { key: 'blockNumber', label: 'رقم المربع' },
          { key: 'plotNumber', label: 'رقم القطعة', required: true },
          { key: 'area', label: 'المساحة (م²)', required: true, type: 'number' },
          { key: 'street', label: 'الشارع' },
          { key: 'frontage', label: 'الواجهة (م)', type: 'number' },
          { key: 'floors', label: 'عدد الأدوار', type: 'number' },
          { key: 'rooms', label: 'عدد الغرف', type: 'number' },
          { key: 'bathrooms', label: 'عدد دورات المياه', type: 'number' },
          { key: 'buildingAge', label: 'عمر البناء (سنة)', type: 'number' },
        ].map((f) => (
          <FormInput
            key={f.key}
            label={f.label + (f.required ? ' *' : '')}
            value={(data as any)[f.key] || ''}
            onChange={(v) => onChange(f.key, v)}
            error={errors[f.key]}
            type={f.type || 'text'}
          />
        ))}
        <FormSelect
          label="حالة التشطيب"
          value={data.finishingLevel}
          onChange={(v) => onChange('finishingLevel', v)}
          options={finishingLevels.map((f) => ({ value: f.value, label: f.label }))}
        />
      </div>

      <div style={{ marginBottom: 20 }}>
        <label className="form-label" style={{ marginBottom: 10 }}>الخدمات المتوفرة</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {allServices.map((svc) => (
            <button
              key={svc}
              onClick={() => toggleService(svc)}
              className={`wizard-service-chip${data.selectedServices.includes(svc) ? ' selected' : ''}`}
            >
              {svc}
            </button>
          ))}
        </div>
      </div>

      <div className="wizard-form-grid-2">
        <FormTextarea label="ملاحظات الموقع" value={data.locationNotes} onChange={(v) => onChange('locationNotes', v)} />
        <FormTextarea label="وصف تفصيلي" value={data.detailedDescription} onChange={(v) => onChange('detailedDescription', v)} />
      </div>
    </WizardStepLayout>
  );
}
