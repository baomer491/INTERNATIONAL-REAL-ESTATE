'use client';

import React from 'react';
import { User } from 'lucide-react';
import WizardStepLayout from '../WizardStepLayout';
import FormInput from '../FormInput';
import FormSelect from '../FormSelect';
import FormTextarea from '../FormTextarea';
import type { BeneficiaryRelation } from '@/types';
import { beneficiaryRelations } from '@/data/mock';

interface BeneficiaryStepProps {
  data: {
    beneficiaryName: string;
    civilId: string;
    phone: string;
    address: string;
    relation: BeneficiaryRelation;
    applicantName: string;
  };
  isLand: boolean;
  errors: Record<string, string>;
  onChange: (field: string, value: string) => void;
}

export default function BeneficiaryStep({ data, isLand, errors, onChange }: BeneficiaryStepProps) {
  return (
    <WizardStepLayout
      icon={<User size={22} color="var(--color-primary)" />}
      title={isLand ? 'بيانات المالك والمتقدم' : 'البيانات الشخصية للمستفيد'}
    >
      <div className="wizard-form-grid">
        <FormInput
          label={isLand ? 'اسم المالك' : 'الاسم الكامل'}
          value={data.beneficiaryName}
          onChange={(v) => onChange('beneficiaryName', v)}
          error={errors.beneficiaryName}
          required
        />
        <FormInput
          label="الرقم المدني"
          value={data.civilId}
          onChange={(v) => onChange('civilId', v)}
          error={errors.civilId}
          required
          placeholder="8 أرقام"
        />
        <FormInput
          label="رقم الهاتف"
          value={data.phone}
          onChange={(v) => onChange('phone', v)}
          error={errors.phone}
          required
          type="tel"
          placeholder="9xxxxxxx"
        />
        <FormSelect
          label="صفة المستفيد"
          value={data.relation}
          onChange={(v) => onChange('relation', v)}
          options={beneficiaryRelations.map((r) => ({ value: r.value, label: r.label }))}
        />
        {isLand && (
          <FormInput
            label="اسم المتقدم"
            value={data.applicantName}
            onChange={(v) => onChange('applicantName', v)}
            placeholder="إذا كان مختلفاً عن المالك"
          />
        )}
        <div style={{ gridColumn: '1 / -1' }}>
          <FormTextarea
            label="العنوان"
            value={data.address}
            onChange={(v) => onChange('address', v)}
          />
        </div>
      </div>
    </WizardStepLayout>
  );
}
