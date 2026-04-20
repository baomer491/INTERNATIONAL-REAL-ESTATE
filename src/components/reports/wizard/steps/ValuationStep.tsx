'use client';

import React from 'react';
import { DollarSign } from 'lucide-react';
import WizardStepLayout from '../WizardStepLayout';
import FormInput from '../FormInput';
import FormSelect from '../FormSelect';
import FormTextarea from '../FormTextarea';
import { valuationMethods, riskLevels, purposeOfValuationOptions } from '@/data/mock';
import MarketCompsPanel from '@/components/reports/MarketCompsPanel';
import { store } from '@/lib/store';
import type { FeesRanges, PropertyType } from '@/types';

function generateFeesOptions(range: { min: number; max: number }) {
  const opts: { value: string; label: string }[] = [];
  for (let v = range.min; v <= range.max; v += 5) {
    opts.push({ value: String(v), label: `${v} ر.ع` });
  }
  return opts;
}

interface ValuationStepProps {
  data: {
    totalMarketValue: string;
    quickSaleValue: string;
    valuationMethod: string;
    riskLevel: string;
    confidencePercentage: string;
    purposeOfValuation: string;
    appraiserNotes: string;
    finalRecommendation: string;
    wilayat: string;
    propertyType: string;
    area: string;
    propertyUsage: string;
    landValue: string;
    valuationFees: string;
  };
  errors: Record<string, string>;
  onChange: (field: string, value: string) => void;
  useUnitArea?: boolean;
  unitArea?: string;
}

export default function ValuationStep({ data, errors, onChange, useUnitArea, unitArea }: ValuationStepProps) {
  return (
    <WizardStepLayout
      icon={<DollarSign size={22} color="var(--color-primary)" />}
      title="التثمين (Valuation)"
    >
      <div className="wizard-form-grid" style={{ marginBottom: 20 }}>
        <FormInput
          label="القيمة السوقية (ر.ع)"
          value={data.totalMarketValue}
          onChange={(v) => onChange('totalMarketValue', v)}
          error={errors.totalMarketValue}
          required
          type="number"
        />
        <FormInput
          label="قيمة البيع القسري (ر.ع)"
          value={data.quickSaleValue}
          onChange={(v) => onChange('quickSaleValue', v)}
          type="number"
        />
        <FormSelect
          label="طريقة التقييم"
          value={data.valuationMethod}
          onChange={(v) => onChange('valuationMethod', v)}
          options={valuationMethods.map((m) => ({ value: m, label: m }))}
        />
        <FormSelect
          label="مستوى المخاطر"
          value={data.riskLevel}
          onChange={(v) => onChange('riskLevel', v)}
          options={riskLevels.map((r) => ({ value: r.value, label: r.label }))}
        />
        <FormInput
          label="نسبة الثقة (%)"
          value={data.confidencePercentage}
          onChange={(v) => onChange('confidencePercentage', v)}
          type="number"
        />
        <FormSelect
          label="غرض التثمين"
          value={data.purposeOfValuation}
          onChange={(v) => onChange('purposeOfValuation', v)}
          options={purposeOfValuationOptions.map((o) => ({ value: o.value, label: o.label }))}
        />
        <FormSelect
          label="أتعاب التثمين (ر.ع)"
          value={data.valuationFees}
          onChange={(v) => onChange('valuationFees', v)}
          options={generateFeesOptions(
            store.getSettings().feesRanges[data.propertyType as PropertyType] || { min: 50, max: 500 }
          )}
        />
      </div>
      <div className="wizard-form-grid-2">
        <FormTextarea label="ملاحظات المقيم" value={data.appraiserNotes} onChange={(v) => onChange('appraiserNotes', v)} />
        <FormTextarea label="التوصية النهائية" value={data.finalRecommendation} onChange={(v) => onChange('finalRecommendation', v)} />
      </div>
      <div style={{ marginTop: 24 }}>
        <MarketCompsPanel
          wilayat={data.wilayat}
          propertyType={data.propertyType}
          area={useUnitArea ? parseFloat(unitArea || '0') || 0 : parseFloat(data.area) || 0}
          usage={data.propertyUsage}
          onApplyValue={(totalValue, pricePerSqm) => {
            onChange('totalMarketValue', String(totalValue));
            if (!useUnitArea) onChange('landValue', String(totalValue));
            onChange('appraiserNotes', `قيمة مقترحة بناءً على ${pricePerSqm.toLocaleString()} ر.ع/م² من مقارنات سوقية`);
          }}
        />
      </div>
    </WizardStepLayout>
  );
}
