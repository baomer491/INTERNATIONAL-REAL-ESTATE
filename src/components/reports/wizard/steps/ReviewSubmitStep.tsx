'use client';

import React from 'react';
import { Send } from 'lucide-react';
import WizardStepLayout from '../WizardStepLayout';

const enPropertyType: Record<string, string> = {
  land: 'Land', villa: 'Villa', apartment: 'Apartment', residential_building: 'Residential Building',
  commercial_building: 'Commercial Building', mixed_use: 'Mixed Use', farm: 'Farm', warehouse: 'Warehouse', shop: 'Shop',
};
const enUsage: Record<string, string> = { residential: 'Residential', commercial: 'Commercial', industrial: 'Industrial', agricultural: 'Agricultural', investment: 'Investment' };
const enValuationMethod: Record<string, string> = {
  'طريقة السوق': 'Market Approach', 'طريقة التكلفة': 'Cost Approach', 'طريقة الدخل': 'Income Approach',
  'طريقة السوق والتكلفة': 'Market & Cost Approach', 'طريقة الدخل والتكلفة': 'Income & Cost Approach', 'طريقة المقارنة': 'Comparison Approach',
};
const enRisk: Record<string, string> = { low: 'Low', medium: 'Medium', high: 'High' };

interface ReviewSubmitStepProps {
  data: Record<string, any>;
  isLand: boolean;
  isApartment: boolean;
  renderReport: () => React.ReactNode;
}

export default function ReviewSubmitStep({ data, isLand, isApartment, renderReport }: ReviewSubmitStepProps) {
  if (isLand || isApartment) {
    return (
      <WizardStepLayout
        icon={<Send size={22} color="var(--color-primary)" />}
        title="Review & Submit Report"
      >
        <div style={{ maxHeight: '70vh', overflowY: 'auto', borderRadius: 12, border: '1px solid var(--color-border)' }}>
          {renderReport()}
        </div>
      </WizardStepLayout>
    );
  }

  const reviewItems = [
    { title: 'Valuation Type', value: data.valuationType === 'bank' ? 'Bank Valuation' : 'Personal Valuation' },
    ...(data.valuationType === 'bank' ? [{ title: 'Bank', value: data.bankName }] : []),
    { title: 'Beneficiary', value: data.beneficiaryName },
    { title: 'Civil ID', value: data.civilId },
    { title: 'Phone', value: data.phone },
    { title: 'Property Type', value: enPropertyType[data.propertyType] || data.propertyType },
    { title: 'Usage Type', value: enUsage[data.propertyUsage] || data.propertyUsage },
    { title: 'Governorate', value: data.governorate },
    { title: 'Wilayat', value: data.wilayat },
    { title: 'Plot No.', value: data.plotNumber },
    { title: 'Area', value: `${data.area} m²` },
    ...(data.landValue ? [{ title: 'Land Value', value: `${parseFloat(data.landValue).toLocaleString('en-US')} OMR` }] : []),
    ...(data.totalMarketValue ? [{ title: 'Market Value', value: `${parseFloat(data.totalMarketValue).toLocaleString('en-US')} OMR` }] : []),
    ...(data.quickSaleValue ? [{ title: 'Quick Sale Value', value: `${parseFloat(data.quickSaleValue).toLocaleString('en-US')} OMR` }] : []),
    ...(data.rentalValue ? [{ title: 'Rental Value', value: `${parseFloat(data.rentalValue).toLocaleString('en-US')} OMR/month` }] : []),
    ...(data.valuationFees ? [{ title: 'Valuation Fees', value: `${parseFloat(data.valuationFees).toLocaleString('en-US')} OMR` }] : []),
    { title: 'Valuation Method', value: enValuationMethod[data.valuationMethod] || data.valuationMethod },
    ...(data.confidencePercentage ? [{ title: 'Confidence', value: `${data.confidencePercentage}%` }] : []),
    ...(data.finalRecommendation ? [{ title: 'Recommendation', value: data.finalRecommendation }] : []),
  ].filter((item) => item.value);

  return (
    <WizardStepLayout
      icon={<Send size={22} color="var(--color-primary)" />}
      title="Review & Submit Report"
    >
      <div style={{ display: 'grid', gap: 8, marginBottom: 20 }}>
        {reviewItems.map((item, i) => (
          <div key={i} className="wizard-review-row">
            <span className="wizard-review-label">{item.title}</span>
            <span className="wizard-review-value">{item.value}</span>
          </div>
        ))}
      </div>
    </WizardStepLayout>
  );
}
