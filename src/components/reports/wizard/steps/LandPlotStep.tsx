'use client';

import React from 'react';
import { LandPlot, FileCheck } from 'lucide-react';
import WizardStepLayout from '../WizardStepLayout';
import FormInput from '../FormInput';
import FormSelect from '../FormSelect';
import SectionCard from '../SectionCard';
import { governorates, wilayatData, zonedOptions, allowableFloorsOptions } from '@/data/mock';

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
  return (
    <WizardStepLayout
      icon={<LandPlot size={22} color="var(--color-primary)" />}
      title="بيانات القطعة (Documentation Details)"
      subtitle="أدخل بيانات القطعة كما هي مسجلة في صك الملكية"
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
        <FormInput
          label="القرية / المنطقة"
          value={data.village}
          onChange={(v) => onChange('village', v)}
        />
      </div>

      <SectionCard titleIcon={<FileCheck size={18} color="var(--color-primary)" />} title="تفاصيل القطعة">
        <div className="wizard-form-grid">
          <FormInput label="رقم القطعة (Plot No.)" value={data.plotNumber} onChange={(v) => onChange('plotNumber', v)} error={errors.plotNumber} required />
          <FormInput label="رقم المربع (Block No.)" value={data.blockNumber} onChange={(v) => onChange('blockNumber', v)} />
          <FormInput label="رقم الطريق (Way No.)" value={data.wayNumber} onChange={(v) => onChange('wayNumber', v)} placeholder="N/A" />
          <FormInput label="رقم الكروكي (Krookie No.)" value={data.krookiNumber} onChange={(v) => onChange('krookiNumber', v)} />
          <FormInput label="رقم التسجيل (Reg. No.)" value={data.registrationNumber} onChange={(v) => onChange('registrationNumber', v)} />
          <FormInput label="تاريخ التسجيل (Reg. Date)" value={data.registrationDate} onChange={(v) => onChange('registrationDate', v)} placeholder="DD-MM-YYYY" />
          <FormInput label="المساحة (SQM)" value={data.area} onChange={(v) => onChange('area', v)} error={errors.area} required type="number" placeholder="متر مربع" />
          <FormSelect label="المنطقة المخططة (Zoned)" value={data.zoned} onChange={(v) => onChange('zoned', v)} options={zonedOptions.map((z) => ({ value: z.value, label: z.label }))} />
          <FormInput label="البناء المسموح (Allowable Build Up)" value={data.allowableBuildUp} onChange={(v) => onChange('allowableBuildUp', v)} placeholder="N/A" />
          <FormSelect label="الأدوار المسموحة" value={data.allowableFloors} onChange={(v) => onChange('allowableFloors', v)} options={allowableFloorsOptions.map((f) => ({ value: f.value, label: f.label }))} />
          <FormInput label="التوسعة المستقبلية (Future Extension)" value={data.possibleFutureExtension} onChange={(v) => onChange('possibleFutureExtension', v)} placeholder="N/A" />
        </div>
      </SectionCard>
    </WizardStepLayout>
  );
}
