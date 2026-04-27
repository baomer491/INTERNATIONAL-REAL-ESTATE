'use client';

import React from 'react';
import { Building2, UserCircle, CheckCircle2 } from 'lucide-react';
import WizardStepLayout from '../WizardStepLayout';

interface ValuationTypeStepProps {
  value: 'bank' | 'personal';
  onChange: (val: 'bank' | 'personal') => void;
}

const options: {
  val: 'bank' | 'personal';
  title: string;
  subtitle: string;
  desc: string;
  Icon: typeof Building2;
  accentColor: string;
}[] = [
  {
    val: 'bank',
    title: 'تثمين للبنوك',
    subtitle: 'BANK VALUATION',
    desc: 'تقرير تثمين معتمد يصدر وفق المعايير المهنية المطلوبة من الجهات المصرفية والتمويلية. يُستخدم في قرارات التمويل العقاري وتقييم الأصول.',
    Icon: Building2,
    accentColor: 'var(--color-primary)',
  },
  {
    val: 'personal',
    title: 'تثمين شخصي',
    subtitle: 'PERSONAL VALUATION',
    desc: 'تقرير تثمين للأغراض الشخصية كالتثمين الداخلي أو التخطيط العقاري أو الاستشارات المالية. يصدر وفق المعايير المهنية المتبعة.',
    Icon: UserCircle,
    accentColor: 'var(--color-accent-dark)',
  },
];

export default function ValuationTypeStep({ value, onChange }: ValuationTypeStepProps) {
  return (
    <WizardStepLayout
      icon={<Building2 size={22} color="var(--color-primary)" />}
      title="نوع التثمين"
      subtitle="حدد نوع التثمين المطلوب — كل نوع يصدر وفق معايير مهنية محددة"
    >
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 20,
        maxWidth: 820,
        margin: '0 auto',
        width: '100%',
      }}>
        {options.map(({ val, title, subtitle, desc, Icon, accentColor }) => {
          const isSelected = value === val;
          return (
            <button
              key={val}
              onClick={() => onChange(val)}
              style={{
                position: 'relative',
                padding: 0,
                border: 'none',
                borderRadius: 12,
                cursor: 'pointer',
                textAlign: 'inherit',
                fontFamily: 'inherit',
                background: 'none',
                outline: 'none',
              }}
            >
              {/* Card */}
              <div style={{
                borderRadius: 12,
                border: isSelected
                  ? `2px solid ${accentColor}`
                  : '1.5px solid var(--color-border)',
                background: 'var(--color-surface)',
                overflow: 'hidden',
                transition: 'all 0.2s ease',
                boxShadow: isSelected
                  ? `0 4px 20px rgba(0,0,0,0.12), 0 0 0 1px ${accentColor}20`
                  : '0 1px 4px rgba(0,0,0,0.04)',
                transform: isSelected ? 'translateY(-1px)' : 'none',
              }}>

                {/* Top accent bar */}
                <div style={{
                  height: 4,
                  background: isSelected
                    ? `linear-gradient(90deg, ${accentColor}, ${accentColor}cc)`
                    : 'var(--color-border)',
                  transition: 'all 0.2s ease',
                }} />

                {/* Content */}
                <div style={{ padding: '20px 22px 22px' }}>
                  {/* Header row */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 14,
                    marginBottom: 14,
                  }}>
                    {/* Icon */}
                    <div style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      background: isSelected
                        ? `${accentColor}12`
                        : 'var(--color-surface-alt)',
                      border: `1px solid ${isSelected ? `${accentColor}30` : 'var(--color-border)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'all 0.2s ease',
                    }}>
                      <Icon
                        size={22}
                        color={isSelected ? accentColor : 'var(--color-text-muted)'}
                      />
                    </div>

                    {/* Title block */}
                    <div style={{ flex: 1, textAlign: 'right' }}>
                      <div style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: 'var(--color-text-primary)',
                        marginBottom: 2,
                      }}>
                        {title}
                      </div>
                      <div style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: isSelected ? accentColor : 'var(--color-text-muted)',
                        letterSpacing: 0.8,
                        textTransform: 'uppercase',
                        transition: 'color 0.2s ease',
                      }}>
                        {subtitle}
                      </div>
                    </div>

                    {/* Check */}
                    <div style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      border: isSelected
                        ? `2px solid ${accentColor}`
                        : '1.5px solid var(--color-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      background: isSelected ? accentColor : 'transparent',
                      transition: 'all 0.2s ease',
                    }}>
                      {isSelected && (
                        <CheckCircle2 size={14} color="#fff" />
                      )}
                    </div>
                  </div>

                  {/* Divider */}
                  <div style={{
                    height: 1,
                    background: isSelected
                      ? `${accentColor}20`
                      : 'var(--color-border)',
                    marginBottom: 14,
                    transition: 'background 0.2s ease',
                  }} />

                  {/* Description */}
                  <div style={{
                    fontSize: 13,
                    color: 'var(--color-text-secondary)',
                    lineHeight: 1.65,
                    textAlign: 'right',
                  }}>
                    {desc}
                  </div>

                  {/* Selected badge */}
                  {isSelected && (
                    <div style={{
                      marginTop: 14,
                      padding: '6px 12px',
                      borderRadius: 6,
                      background: `${accentColor}10`,
                      border: `1px solid ${accentColor}25`,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}>
                      <CheckCircle2 size={13} color={accentColor} />
                      <span style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: accentColor,
                      }}>
                        تم الاختيار
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer note */}
      <div style={{
        maxWidth: 820,
        margin: '16px auto 0',
        padding: '10px 16px',
        borderRadius: 8,
        background: 'var(--color-surface-alt)',
        border: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 12,
        color: 'var(--color-text-muted)',
        textAlign: 'right',
      }}>
        <div style={{
          width: 4,
          height: 32,
          borderRadius: 2,
          background: 'var(--color-primary)',
          flexShrink: 0,
        }} />
        <span>
          جميع التقارير تصح إصدارها وفق <strong>معايير التثمين الدولية (IVS)</strong> و<strong>معايير الممارسة المهنية</strong> المعتمدة.
          نوع التثمين المحدد يؤثر على المسار والمستندات المطلوبة.
        </span>
      </div>
    </WizardStepLayout>
  );
}
