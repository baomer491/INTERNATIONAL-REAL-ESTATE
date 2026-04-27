'use client';

import React from 'react';
import { User, UserCircle, CreditCard, Phone, MapPin, FileText } from 'lucide-react';
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

interface SectionProps {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  accentColor: string;
  children: React.ReactNode;
}

function InfoSection({ title, subtitle, icon, accentColor, children }: SectionProps) {
  return (
    <div style={{
      border: '1.5px solid var(--color-border)',
      borderRadius: 12,
      background: 'var(--color-surface)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 20px',
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-surface-alt)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <div style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: `${accentColor}12`,
          border: `1px solid ${accentColor}25`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {icon}
        </div>
        <div>
          <div style={{
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--color-text-primary)',
          }}>
            {title}
          </div>
          {subtitle && (
            <div style={{
              fontSize: 11,
              color: 'var(--color-text-muted)',
              marginTop: 1,
            }}>
              {subtitle}
            </div>
          )}
        </div>
      </div>
      {/* Body */}
      <div style={{ padding: 20 }}>
        {children}
      </div>
    </div>
  );
}

export default function BeneficiaryStep({ data, isLand, errors, onChange }: BeneficiaryStepProps) {
  return (
    <WizardStepLayout
      icon={<User size={22} color="var(--color-primary)" />}
      title={isLand ? 'بيانات المالك والمتقدم' : 'البيانات الشخصية للمستفيد'}
    >
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        maxWidth: 900,
        margin: '0 auto',
        width: '100%',
      }}>

        {/* ── Owner Section ── */}
        <InfoSection
          title="بيانات المالك"
          subtitle="OWNER INFORMATION"
          icon={<User size={16} color="var(--color-primary)" />}
          accentColor="var(--color-primary)"
        >
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 16,
          }}>
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
              label="صفة المالك"
              value={data.relation}
              onChange={(v) => onChange('relation', v)}
              options={beneficiaryRelations.map((r) => ({ value: r.value, label: r.label }))}
            />
          </div>
          <div style={{ marginTop: 16 }}>
            <FormTextarea
              label="العنوان"
              value={data.address}
              onChange={(v) => onChange('address', v)}
            />
          </div>
        </InfoSection>

        {/* ── Applicant Section (land only) ── */}
        {isLand && (
          <InfoSection
            title="بيانات المتقدم"
            subtitle="APPLICANT INFORMATION"
            icon={<UserCircle size={16} color="var(--color-accent-dark)" />}
            accentColor="var(--color-accent-dark)"
          >
            <div style={{
              padding: '10px 14px',
              borderRadius: 8,
              background: 'rgba(6, 78, 59, 0.05)',
              border: '1px solid rgba(6, 78, 59, 0.15)',
              fontSize: 12,
              color: 'var(--color-accent-dark)',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
            }}>
              <FileText size={14} style={{ marginTop: 1, flexShrink: 0 }} />
              <span>
                أدخل بيانات المتقدم إذا كان <strong>مختلفاً عن المالك</strong>.
                في حال كان المتقدم هو نفسه المالك، يمكن ترك هذا الحقل فارغاً.
              </span>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 16,
            }}>
              <FormInput
                label="اسم المتقدم"
                value={data.applicantName}
                onChange={(v) => onChange('applicantName', v)}
                placeholder="إذا كان مختلفاً عن المالك"
              />
            </div>
          </InfoSection>
        )}

        {/* ── Identity Document Info ── */}
        <InfoSection
          title="المستندات المطلوبة"
          subtitle="REQUIRED DOCUMENTS"
          icon={<CreditCard size={16} color="var(--color-secondary)" />}
          accentColor="var(--color-secondary)"
        >
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 12,
          }}>
            {[
              { label: 'صورة البطاقة المدنية', desc: 'وجه وظهر' },
              { label: 'ملكية العقار (Mulkiya)', desc: 'صورة واضحة' },
              { label: 'كروكي الموقع', desc: 'إن وُجد' },
            ].map((doc) => (
              <div
                key={doc.label}
                style={{
                  padding: '12px 14px',
                  borderRadius: 8,
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface-alt)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  background: 'var(--color-secondary-50)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <FileText size={15} color="var(--color-secondary)" />
                </div>
                <div>
                  <div style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--color-text-primary)',
                  }}>
                    {doc.label}
                  </div>
                  <div style={{
                    fontSize: 11,
                    color: 'var(--color-text-muted)',
                    marginTop: 1,
                  }}>
                    {doc.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </InfoSection>

      </div>
    </WizardStepLayout>
  );
}
