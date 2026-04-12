'use client';

import React from 'react';
import { MapPin } from 'lucide-react';
import WizardStepLayout from '../WizardStepLayout';
import FormInput from '../FormInput';
import FormSelect from '../FormSelect';
import FormTextarea from '../FormTextarea';
import SectionCard from '../SectionCard';
import { krookiMatchOptions, topographyOptions, qualityOfSurroundingOptions, returnOnSaleRentOptions } from '@/data/mock';

interface LandDescriptionStepProps {
  data: {
    krookiMatch: string;
    topography: string;
    qualityOfSurrounding: string;
    returnOnSaleRent: string;
    locationAccess: string;
    surroundingNorth: string;
    surroundingEast: string;
    surroundingSouth: string;
    surroundingWest: string;
    locationNotes: string;
  };
  onChange: (field: string, value: string) => void;
}

export default function LandDescriptionStep({ data, onChange }: LandDescriptionStepProps) {
  return (
    <WizardStepLayout
      icon={<MapPin size={22} color="var(--color-primary)" />}
      title="وصف الأرض (Description & Details)"
      subtitle="وصف تفصيلي للأرض والمنطقة المحيطة بها"
    >
      <SectionCard title="بيانات أساسية">
        <div className="wizard-form-grid">
          <FormSelect label="مطابقة الكروكي (Krooki Match)" value={data.krookiMatch} onChange={(v) => onChange('krookiMatch', v)} options={krookiMatchOptions.map((o) => ({ value: o.value, label: o.label }))} />
          <FormSelect label="طبوغرافية الأرض (Topography)" value={data.topography} onChange={(v) => onChange('topography', v)} options={topographyOptions.map((o) => ({ value: o.value, label: o.label }))} />
          <FormSelect label="جودة العقارات المحيطة" value={data.qualityOfSurrounding} onChange={(v) => onChange('qualityOfSurrounding', v)} options={qualityOfSurroundingOptions.map((o) => ({ value: o.value, label: o.label }))} />
          <FormSelect label="العائد على البيع / الإيجار" value={data.returnOnSaleRent} onChange={(v) => onChange('returnOnSaleRent', v)} options={returnOnSaleRentOptions.map((o) => ({ value: o.value, label: o.label }))} />
        </div>
      </SectionCard>

      <SectionCard title="الموقع والوصول (Location / Access)">
        <FormTextarea
          label="وصف الموقع والوصول"
          value={data.locationAccess}
          onChange={(v) => onChange('locationAccess', v)}
          placeholder="مثال: تقع الأرض في شمال الأوقاد، صلالة الحضرية، على بعد حوالي 1 كم من الشارع الرئيسي..."
        />
      </SectionCard>

      <SectionCard title="الجوار المحيط (Surrounding Plots)">
        <div className="wizard-form-grid-2">
          <FormInput label="شمال (North)" value={data.surroundingNorth} onChange={(v) => onChange('surroundingNorth', v)} placeholder="مثال: أرض" />
          <FormInput label="شرق (East)" value={data.surroundingEast} onChange={(v) => onChange('surroundingEast', v)} placeholder="مثال: ممر [3م عرض]" />
          <FormInput label="جنوب (South)" value={data.surroundingSouth} onChange={(v) => onChange('surroundingSouth', v)} placeholder="مثال: طريق رئيسي [15م عرض]" />
          <FormInput label="غرب (West)" value={data.surroundingWest} onChange={(v) => onChange('surroundingWest', v)} placeholder="مثال: منزل" />
        </div>
      </SectionCard>

      <FormTextarea
        label="ملاحظات إضافية (Additional Remarks)"
        value={data.locationNotes}
        onChange={(v) => onChange('locationNotes', v)}
        placeholder="N/A"
      />
    </WizardStepLayout>
  );
}
