'use client';

import React from 'react';
import { DollarSign, Receipt } from 'lucide-react';
import WizardStepLayout from '../WizardStepLayout';
import FormInput from '../FormInput';
import FormSelect from '../FormSelect';
import FormTextarea from '../FormTextarea';
import { valuationMethods, riskLevels } from '@/data/mock';
import MarketCompsPanel from '@/components/reports/MarketCompsPanel';
import { store } from '@/lib/store';
import type { PropertyType } from '@/types';

function generateFeesOptions(range: { min: number; max: number }) {
  const opts: { value: string; label: string }[] = [];
  for (let v = range.min; v <= range.max; v += 5) {
    opts.push({ value: String(v), label: `${v} ر.ع` });
  }
  return opts;
}

interface MarketValuationStepProps {
  data: {
    landValue: string;
    buildingValue: string;
    totalMarketValue: string;
    quickSaleValue: string;
    rentalValue: string;
    valuationFees: string;
    confidencePercentage: string;
    valuationMethod: string;
    riskLevel: string;
    appraiserNotes: string;
    finalRecommendation: string;
    wilayat: string;
    propertyType: string;
    area: string;
    propertyUsage: string;
  };
  errors: Record<string, string>;
  onChange: (field: string, value: any) => void;
}

export default function MarketValuationStep({ data, errors, onChange }: MarketValuationStepProps) {
  return (
    <WizardStepLayout
      icon={<DollarSign size={22} color="var(--color-primary)" />}
      title="القيمة السوقية"
    >
      <div className="wizard-form-grid" style={{ marginBottom: 20 }}>
        <FormInput label="قيمة الأرض (ر.ع) *" value={data.landValue} onChange={(v) => onChange('landValue', v)} error={errors.landValue} type="number" />
        <FormInput label="قيمة البناء (ر.ع)" value={data.buildingValue} onChange={(v) => onChange('buildingValue', v)} type="number" />
        <FormInput label="القيمة السوقية الإجمالية (ر.ع) *" value={data.totalMarketValue} onChange={(v) => onChange('totalMarketValue', v)} error={errors.totalMarketValue} type="number" />
        <FormInput label="قيمة البيع السريع (ر.ع)" value={data.quickSaleValue} onChange={(v) => onChange('quickSaleValue', v)} type="number" />
        <FormInput label="القيمة التأجيرية (ر.ع/شهر)" value={data.rentalValue} onChange={(v) => onChange('rentalValue', v)} type="number" />
        <FormSelect label="أتعاب التثمين (ر.ع)" value={data.valuationFees} onChange={(v) => onChange('valuationFees', v)} options={generateFeesOptions(store.getSettings().feesRanges[data.propertyType as PropertyType] || { min: 50, max: 500 })} />
        <FormInput label="نسبة الثقة (%)" value={data.confidencePercentage} onChange={(v) => onChange('confidencePercentage', v)} type="number" />
        <FormSelect label="طريقة التقييم" value={data.valuationMethod} onChange={(v) => onChange('valuationMethod', v)} options={valuationMethods.map((m) => ({ value: m, label: m }))} />
        <FormSelect label="مستوى المخاطر" value={data.riskLevel} onChange={(v) => onChange('riskLevel', v)} options={riskLevels.map((r) => ({ value: r.value, label: r.label }))} />
      </div>
      <div className="wizard-form-grid-2">
        <FormTextarea label="ملاحظات المقيم" value={data.appraiserNotes} onChange={(v) => onChange('appraiserNotes', v)} />
        <FormTextarea label="التوصية النهائية" value={data.finalRecommendation} onChange={(v) => onChange('finalRecommendation', v)} />
      </div>
      <div style={{ marginTop: 24 }}>
        <MarketCompsPanel
          wilayat={data.wilayat}
          propertyType={data.propertyType}
          area={parseFloat(data.area) || 0}
          usage={data.propertyUsage}
          onApplyValue={(totalValue, pricePerSqm) => {
            onChange('totalMarketValue', String(totalValue));
            onChange('landValue', String(totalValue));
            onChange('appraiserNotes', `قيمة مقترحة بناءً على ${pricePerSqm.toLocaleString()} ر.ع/م² من مقارنات سوقية`);
          }}
        />
      </div>
    </WizardStepLayout>
  );
}
