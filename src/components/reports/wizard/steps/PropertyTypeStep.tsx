'use client';

import React from 'react';
import { Home, Building2, Store, Factory, TreePine, Banknote, Warehouse, Layers, Map, CheckCircle2 } from 'lucide-react';
import WizardStepLayout from '../WizardStepLayout';
import SelectionGrid from '../SelectionGrid';
import FormSelect from '../FormSelect';
import { propertyTypes, propertyUsages, propertyConditions } from '@/data/mock';

// Icons per property type
const propertyTypeIcons: Record<string, React.ReactNode> = {
  land: <Map size={18} />,
  villa: <Home size={18} />,
  apartment: <Building2 size={18} />,
  residential_building: <Building2 size={18} />,
  commercial_building: <Building2 size={18} />,
  mixed_use: <Layers size={18} />,
  farm: <TreePine size={18} />,
  warehouse: <Warehouse size={18} />,
  shop: <Store size={18} />,
};

// Icons per usage type
const propertyUsageIcons: Record<string, React.ReactNode> = {
  residential: <Home size={18} />,
  commercial: <Store size={18} />,
  industrial: <Factory size={18} />,
  agricultural: <TreePine size={18} />,
  investment: <Banknote size={18} />,
};

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
          background: `${accentColor}14`,
          border: `1px solid ${accentColor}30`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          {React.cloneElement(icon as React.ReactElement<{size?: number; color?: string}>, { size: 16, color: accentColor })}
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
      {/* Content */}
      <div style={{ padding: '20px' }}>
        {children}
      </div>
    </div>
  );
}

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

  const typeItems = propertyTypes.map((pt) => ({
    value: pt.value,
    label: pt.label,
    icon: propertyTypeIcons[pt.value] || <Home size={18} />,
  }));

  const usageItems = propertyUsages.map((pu) => ({
    value: pu.value,
    label: pu.label,
    icon: propertyUsageIcons[pu.value] || <Home size={18} />,
  }));

  const selectedType = propertyTypes.find((pt) => pt.value === propertyType);
  const selectedUsage = propertyUsages.find((pu) => pu.value === propertyUsage);
  const selectedCondition = propertyConditions.find((pc) => pc.value === propertyCondition);

  return (
    <WizardStepLayout
      icon={<Home size={22} color="var(--color-primary)" />}
      title="نوع العقار ونوع الاستخدام"
      subtitle="حدد الخصائص الأساسية للعقار المراد تثمينه"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 900, margin: '0 auto', width: '100%' }}>

        {/* ── Section 1: Property Type ── */}
        <InfoSection
          title="نوع العقار"
          subtitle="PROPERTY TYPE"
          icon={<Home size={16} />}
          accentColor="var(--color-primary)"
        >
          <SelectionGrid
            items={typeItems}
            selected={propertyType}
            onSelect={(v) => onChange('propertyType', v)}
            minItemWidth={145}
          />
          {selectedType && (
            <div style={{
              marginTop: 12,
              padding: '8px 14px',
              borderRadius: 8,
              background: 'var(--color-primary-50)',
              border: '1px solid rgba(30, 58, 95, 0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <CheckCircle2 size={13} color="var(--color-primary)" />
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-primary)' }}>
                {selectedType.label}
              </span>
              <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                — تم الاختيار
              </span>
            </div>
          )}
        </InfoSection>

        {/* ── Section 2: Usage Type ── */}
        <InfoSection
          title="نوع الاستخدام"
          subtitle="USAGE TYPE"
          icon={<Layers size={16} />}
          accentColor="var(--color-accent-dark)"
        >
          <SelectionGrid
            items={usageItems}
            selected={propertyUsage}
            onSelect={(v) => onChange('propertyUsage', v)}
            minItemWidth={145}
          />
          {selectedUsage && (
            <div style={{
              marginTop: 12,
              padding: '8px 14px',
              borderRadius: 8,
              background: 'var(--color-accent-light)',
              border: '1px solid rgba(6, 78, 59, 0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <CheckCircle2 size={13} color="var(--color-accent-dark)" />
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-accent-dark)' }}>
                {selectedUsage.label}
              </span>
              <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                — تم الاختيار
              </span>
            </div>
          )}
        </InfoSection>

        {/* ── Section 3: Condition & Development Status ── */}
        <InfoSection
          title="حالة العقار"
          subtitle="CONDITION & STATUS"
          icon={<Building2 size={16} />}
          accentColor="var(--color-secondary)"
        >
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 16,
          }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--color-text-secondary)',
                marginBottom: 8,
              }}>
                حالة العقار
              </label>
              <FormSelect
                label=""
                value={propertyCondition}
                onChange={(v) => onChange('propertyCondition', v)}
                options={propertyConditions.map((c) => ({ value: c.value, label: c.label }))}
              />
              {selectedCondition && (
                <div style={{
                  marginTop: 8,
                  padding: '6px 12px',
                  borderRadius: 6,
                  background: 'var(--color-secondary-50)',
                  border: '1px solid rgba(124, 58, 237, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}>
                  <CheckCircle2 size={11} color="var(--color-secondary)" />
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-secondary)' }}>
                    {selectedCondition.label}
                  </span>
                </div>
              )}
            </div>
            <div>
              <label style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--color-text-secondary)',
                marginBottom: 8,
              }}>
                حالة التطوير
              </label>
              <FormSelect
                label=""
                value={isDeveloped}
                onChange={(v) => onChange('isDeveloped', v)}
                options={[
                  { value: 'developed', label: 'مطور (مبني)' },
                  { value: 'vacant_land', label: 'أرض فضاء' },
                ]}
              />
              <div style={{
                marginTop: 8,
                padding: '6px 12px',
                borderRadius: 6,
                background: isDeveloped === 'developed'
                  ? 'var(--color-accent-light)'
                  : 'var(--color-warning-bg)',
                border: isDeveloped === 'developed'
                  ? '1px solid rgba(6, 78, 59, 0.15)'
                  : '1px solid rgba(217, 119, 6, 0.15)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}>
                <CheckCircle2
                  size={11}
                  color={isDeveloped === 'developed' ? 'var(--color-accent-dark)' : 'var(--color-warning)'}
                />
                <span style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: isDeveloped === 'developed' ? 'var(--color-accent-dark)' : 'var(--color-warning)',
                }}>
                  {isDeveloped === 'developed' ? 'مطور (مبني)' : 'أرض فضاء'}
                </span>
              </div>
            </div>
          </div>
        </InfoSection>

        {/* ── Summary Footer ── */}
        <div style={{
          padding: '12px 18px',
          borderRadius: 10,
          background: 'var(--color-surface-alt)',
          border: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontSize: 12,
          color: 'var(--color-text-muted)',
        }}>
          <div style={{
            width: 4,
            height: 36,
            borderRadius: 2,
            background: 'var(--color-primary)',
            flexShrink: 0,
          }} />
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {selectedType && (
              <span>
                <strong style={{ color: 'var(--color-text-primary)' }}>العقار:</strong>{' '}
                {selectedType.label}
              </span>
            )}
            {selectedUsage && (
              <span>
                <strong style={{ color: 'var(--color-text-primary)' }}>الاستخدام:</strong>{' '}
                {selectedUsage.label}
              </span>
            )}
            {selectedCondition && (
              <span>
                <strong style={{ color: 'var(--color-text-primary)' }}>الحالة:</strong>{' '}
                {selectedCondition.label}
              </span>
            )}
          </div>
        </div>

      </div>
    </WizardStepLayout>
  );
}
