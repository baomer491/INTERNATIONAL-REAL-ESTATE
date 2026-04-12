'use client';

import React from 'react';
import { Home } from 'lucide-react';
import WizardStepLayout from '../WizardStepLayout';
import SelectionGrid from '../SelectionGrid';
import FormSelect from '../FormSelect';
import { propertyTypes, propertyUsages, propertyConditions } from '@/data/mock';

interface PropertyTypeStepProps {
  propertyType: string;
  propertyUsage: string;
  propertyCondition: string;
  isDeveloped: string;
  onChange: (field: string, value: string) => void;
}

export default function PropertyTypeStep({
  propertyType,
  propertyUsage,
  propertyCondition,
  isDeveloped,
  onChange,
}: PropertyTypeStepProps) {
  return (
    <WizardStepLayout
      icon={<Home size={22} color="var(--color-primary)" />}
      title="نوع العقار ونوع الاستخدام"
    >
      <div style={{ marginBottom: 24 }}>
        <label className="form-label" style={{ marginBottom: 12 }}>نوع العقار</label>
        <SelectionGrid
          items={propertyTypes.map((pt) => ({ value: pt.value, label: pt.label }))}
          selected={propertyType}
          onSelect={(v) => onChange('propertyType', v)}
        />
      </div>
      <div style={{ marginBottom: 24 }}>
        <label className="form-label" style={{ marginBottom: 12 }}>نوع الاستخدام</label>
        <SelectionGrid
          items={propertyUsages.map((pu) => ({ value: pu.value, label: pu.label }))}
          selected={propertyUsage}
          onSelect={(v) => onChange('propertyUsage', v)}
        />
      </div>
      <div className="wizard-form-grid-2">
        <FormSelect
          label="حالة العقار"
          value={propertyCondition}
          onChange={(v) => onChange('propertyCondition', v)}
          options={propertyConditions.map((c) => ({ value: c.value, label: c.label }))}
        />
        <FormSelect
          label="حالة التطوير"
          value={isDeveloped}
          onChange={(v) => onChange('isDeveloped', v)}
          options={[
            { value: 'developed', label: 'مطور (مبني)' },
            { value: 'vacant_land', label: 'أرض فضاء' },
          ]}
        />
      </div>
    </WizardStepLayout>
  );
}
