'use client';

import React from 'react';
import { MapPin } from 'lucide-react';
import WizardStepLayout from '../WizardStepLayout';
import FormInput from '../FormInput';
import FormSelect from '../FormSelect';
import SectionCard from '../SectionCard';
import { buildingMatchOptions, apartmentComponentDefaults, internalFinishingDefaults, conditionOptions } from '@/data/mock';
import type { ApartmentComponent, InternalFinishingItem } from '@/types';
import { useTheme } from '@/hooks/useTheme';

interface ApartmentDetailsStepProps {
  data: {
    aptApartmentNo: string;
    aptHouseNo: string;
    aptCompletionDate: string;
    aptConsultantName: string;
    aptBuildingMatch: string;
    aptComponents: ApartmentComponent[];
    aptFoundation: string;
    aptWalls: string;
    aptRoof: string;
    aptFloorType: string;
    aptAirConditioning: string;
    aptInternalFinishing: InternalFinishingItem[];
    aptEstimatedPerMonth: string;
  };
  onChange: (field: string, value: any) => void;
}

export default function ApartmentDetailsStep({ data, onChange }: ApartmentDetailsStepProps) {
  const { isDark } = useTheme();
  const dm = isDark;

  return (
    <WizardStepLayout
      icon={<MapPin size={22} color="var(--color-primary)" />}
      title="تفاصيل الشقة"
    >
      <div className="wizard-form-grid" style={{ marginBottom: 20 }}>
        <FormInput label="رقم الشقة" value={data.aptApartmentNo} onChange={(v) => onChange('aptApartmentNo', v)} />
        <FormInput label="رقم المنزل" value={data.aptHouseNo} onChange={(v) => onChange('aptHouseNo', v)} />
        <FormInput label="تاريخ إتمام البناء" value={data.aptCompletionDate} onChange={(v) => onChange('aptCompletionDate', v)} type="date" />
        <FormInput label="اسم الاستشاري" value={data.aptConsultantName} onChange={(v) => onChange('aptConsultantName', v)} />
        <FormSelect
          label="مطابقة البناء للمخطط المعتمد"
          value={data.aptBuildingMatch}
          onChange={(v) => onChange('aptBuildingMatch', v)}
          options={buildingMatchOptions.map((b) => ({ value: b.value, label: b.label }))}
        />
      </div>

      <SectionCard title="مكونات الشقة (F.F / P.H)">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, whiteSpace: 'nowrap' }}>المكون</th>
                <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, width: 150 }}>F.F (التشطيبات)</th>
                <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, width: 150 }}>P.H (السباكة)</th>
              </tr>
            </thead>
            <tbody>
              {data.aptComponents.map((comp, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 600 }}>{apartmentComponentDefaults[i]?.name || comp.name}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                    <input
                      type="number"
                      value={comp.ff || ''}
                      onChange={(e) => {
                        const updated = [...data.aptComponents];
                        updated[i] = { ...updated[i], ff: parseFloat(e.target.value) || 0 };
                        onChange('aptComponents', updated);
                      }}
                      className="form-input"
                      style={{ textAlign: 'center', fontSize: 13, padding: '6px 8px' }}
                    />
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                    <input
                      type="number"
                      value={comp.ph || ''}
                      onChange={(e) => {
                        const updated = [...data.aptComponents];
                        updated[i] = { ...updated[i], ph: parseFloat(e.target.value) || 0 };
                        onChange('aptComponents', updated);
                      }}
                      className="form-input"
                      style={{ textAlign: 'center', fontSize: 13, padding: '6px 8px' }}
                    />
                  </td>
                </tr>
              ))}
              <tr style={{ fontWeight: 700, background: dm ? 'rgba(30, 58, 95, 0.3)' : '#e8eef6' }}>
                <td style={{ padding: '10px 12px' }}>المجموع</td>
                <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                  {data.aptComponents.reduce((s, c) => s + (c.ff || 0), 0).toLocaleString()}
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                  {data.aptComponents.reduce((s, c) => s + (c.ph || 0), 0).toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title="مواصفات الشقة">
        <div className="wizard-form-grid-2">
          {[
            { key: 'aptFoundation', label: 'الأساس والهيكل' },
            { key: 'aptWalls', label: 'الجدران' },
            { key: 'aptRoof', label: 'السقف' },
            { key: 'aptFloorType', label: 'الأرضيات' },
            { key: 'aptAirConditioning', label: 'التكييف' },
          ].map((f) => (
            <FormInput key={f.key} label={f.label} value={(data as any)[f.key] || ''} onChange={(v) => onChange(f.key, v)} placeholder={`أدخل ${f.label}`} />
          ))}
        </div>
      </SectionCard>

      <SectionCard title="التشطيبات الداخلية">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700 }}>البند</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700 }}>نوع/كمية</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700 }}>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {data.aptInternalFinishing.map((item, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 600 }}>{internalFinishingDefaults[i]?.description || item.description}</td>
                  <td style={{ padding: '8px 12px' }}>
                    <input
                      type="text"
                      value={item.typeOfItem}
                      onChange={(e) => {
                        const updated = [...data.aptInternalFinishing];
                        updated[i] = { ...updated[i], typeOfItem: e.target.value };
                        onChange('aptInternalFinishing', updated);
                      }}
                      className="form-input"
                      style={{ fontSize: 13, padding: '6px 8px' }}
                      placeholder="النوع"
                    />
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    <select
                      value={item.condition}
                      onChange={(e) => {
                        const updated = [...data.aptInternalFinishing];
                        updated[i] = { ...updated[i], condition: e.target.value };
                        onChange('aptInternalFinishing', updated);
                      }}
                      className="form-select"
                      style={{ fontSize: 13, padding: '6px 8px' }}
                    >
                      <option value="">--</option>
                      {conditionOptions.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <FormInput
        label="الإيجار الشهري المتوقع (ر.ع)"
        value={data.aptEstimatedPerMonth}
        onChange={(v) => onChange('aptEstimatedPerMonth', v)}
        type="number"
        placeholder="0"
        maxW="300px"
      />
    </WizardStepLayout>
  );
}
