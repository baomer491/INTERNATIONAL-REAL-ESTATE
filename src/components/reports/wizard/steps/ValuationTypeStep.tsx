'use client';

import React from 'react';
import { Building2, UserCircle, CheckCircle2 } from 'lucide-react';
import WizardStepLayout from '../WizardStepLayout';

interface ValuationTypeStepProps {
  value: 'bank' | 'personal';
  onChange: (val: 'bank' | 'personal') => void;
}

const options: { val: 'bank' | 'personal'; title: string; desc: string; Icon: typeof Building2 }[] = [
  { val: 'bank', title: 'تثمين للبنوك', desc: 'تقرير تثمين مطلوب من جهة بنكية', Icon: Building2 },
  { val: 'personal', title: 'تثمين شخصي', desc: 'تقرير تثمين لغرض شخصي', Icon: UserCircle },
];

export default function ValuationTypeStep({ value, onChange }: ValuationTypeStepProps) {
  return (
    <WizardStepLayout
      icon={<Building2 size={22} color="var(--color-primary)" />}
      title="نوع التثمين"
      subtitle="اختر نوع التثمين لتحديد مسار إنشاء التقرير"
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 560 }}>
        {options.map(({ val, title, desc, Icon }) => {
          const isSelected = value === val;
          return (
            <button
              key={val}
              onClick={() => onChange(val)}
              className={`wizard-big-card${isSelected ? ' selected' : ''}`}
            >
              <div className="card-icon">
                <Icon size={28} />
              </div>
              <div>
                <div className="card-title" style={{ color: 'var(--color-text)' }}>{title}</div>
                <div className="card-desc">{desc}</div>
              </div>
              {isSelected && <CheckCircle2 size={20} color="var(--color-primary)" />}
            </button>
          );
        })}
      </div>
    </WizardStepLayout>
  );
}
