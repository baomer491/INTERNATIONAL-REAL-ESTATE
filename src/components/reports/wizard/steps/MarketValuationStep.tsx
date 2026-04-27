'use client';

import React, { useMemo } from 'react';
import { DollarSign, TrendingUp, Zap, AlertTriangle, CheckCircle, Info, Building2 } from 'lucide-react';
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
  const feesRange = store.getSettings().feesRanges[data.propertyType as PropertyType] || { min: 50, max: 500 };

  const marketValue = parseFloat(data.totalMarketValue) || 0;
  const landValue = parseFloat(data.landValue) || 0;
  const buildingValue = parseFloat(data.buildingValue) || 0;
  const quickSale = parseFloat(data.quickSaleValue) || 0;
  const fees = parseFloat(data.valuationFees) || 0;
  const confidence = parseFloat(data.confidencePercentage) || 0;

  const riskInfo = useMemo(() => {
    return riskLevels.find(r => r.value === data.riskLevel);
  }, [data.riskLevel]);

  const quickSaleRatio = marketValue > 0 && quickSale > 0 ? (quickSale / marketValue) * 100 : null;
  const buildingRatio = marketValue > 0 && buildingValue > 0 ? (buildingValue / marketValue) * 100 : null;

  return (
    <WizardStepLayout
      icon={<DollarSign size={22} color="var(--color-primary)" />}
      title="القيمة السوقية"
    >
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 340px',
        gap: 24,
        alignItems: 'start',
      }}>
        {/* ── Left: Main Form ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ── Land & Building Breakdown ── */}
          <div style={{
            background: 'var(--color-surface)',
            border: '1.5px solid var(--color-border)',
            borderRadius: 14,
            padding: 20,
          }}>
            <div style={{
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--color-primary)',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <Building2 size={16} />
              قيمة الأرض والبناء
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <FormInput
                label="قيمة الأرض (ر.ع)"
                value={data.landValue}
                onChange={(v) => onChange('landValue', v)}
                error={errors.landValue}
                type="number"
              />
              <FormInput
                label="قيمة البناء (ر.ع)"
                value={data.buildingValue}
                onChange={(v) => onChange('buildingValue', v)}
                type="number"
              />
              <FormInput
                label="القيمة السوقية الإجمالية (ر.ع)"
                value={data.totalMarketValue}
                onChange={(v) => onChange('totalMarketValue', v)}
                error={errors.totalMarketValue}
                type="number"
              />
            </div>

            {buildingRatio !== null && buildingValue > 0 && (
              <div style={{
                marginTop: 10,
                padding: '8px 12px',
                borderRadius: 8,
                background: 'var(--color-info-bg)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                fontSize: 12,
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}>
                <Info size={14} />
                نسبة قيمة البناء: <strong>{buildingRatio.toFixed(1)}%</strong> من القيمة السوقية الإجمالية
              </div>
            )}
          </div>

          {/* ── Quick Sale & Rental ── */}
          <div style={{
            background: 'var(--color-surface)',
            border: '1.5px solid var(--color-border)',
            borderRadius: 14,
            padding: 20,
          }}>
            <div style={{
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--color-primary)',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <TrendingUp size={16} />
              القيم补充ية
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <FormInput
                label="قيمة البيع السريع (ر.ع)"
                value={data.quickSaleValue}
                onChange={(v) => onChange('quickSaleValue', v)}
                type="number"
              />
              <FormInput
                label="القيمة التأجيرية (ر.ع/شهر)"
                value={data.rentalValue}
                onChange={(v) => onChange('rentalValue', v)}
                type="number"
              />
            </div>

            {quickSaleRatio !== null && (
              <div style={{
                marginTop: 10,
                padding: '8px 12px',
                borderRadius: 8,
                background: quickSaleRatio >= 70
                  ? 'var(--color-success-bg)'
                  : quickSaleRatio >= 50
                    ? 'var(--color-warning-bg)'
                    : 'var(--color-danger-bg)',
                border: `1px solid ${
                  quickSaleRatio >= 70
                    ? 'var(--color-success-bg)'
                    : quickSaleRatio >= 50
                      ? 'var(--color-warning-bg)'
                      : 'var(--color-danger-bg)'
                }`,
                fontSize: 12,
                color: quickSaleRatio >= 70
                  ? 'var(--color-success)'
                  : quickSaleRatio >= 50
                    ? 'var(--color-warning)'
                    : 'var(--color-danger)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}>
                <Info size={14} />
                نسبة البيع القسري: <strong>{quickSaleRatio.toFixed(1)}%</strong> من القيمة السوقية
              </div>
            )}
          </div>

          {/* ── Method & Risk ── */}
          <div style={{
            background: 'var(--color-surface)',
            border: '1.5px solid var(--color-border)',
            borderRadius: 14,
            padding: 20,
          }}>
            <div style={{
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--color-primary)',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <Zap size={16} />
              طريقة التقييم ومستوى المخاطر
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
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
            </div>

            {riskInfo && (
              <div style={{
                marginTop: 12,
                padding: '10px 14px',
                borderRadius: 8,
                background: riskInfo.value === 'low'
                  ? 'var(--color-success-bg)'
                  : riskInfo.value === 'medium'
                    ? 'var(--color-warning-bg)'
                    : 'var(--color-danger-bg)',
                border: `1px solid ${
                  riskInfo.value === 'low'
                    ? 'var(--color-success-bg)'
                    : riskInfo.value === 'medium'
                      ? 'var(--color-warning-bg)'
                      : 'var(--color-danger-bg)'
                }`,
                fontSize: 12,
                color: riskInfo.value === 'low'
                  ? 'var(--color-success)'
                  : riskInfo.value === 'medium'
                    ? 'var(--color-warning)'
                    : 'var(--color-danger)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}>
                {riskInfo.value === 'low' ? (
                  <CheckCircle size={15} />
                ) : (
                  <AlertTriangle size={15} />
                )}
                <span style={{ fontWeight: 600 }}>{riskInfo.label}</span>
              </div>
            )}
          </div>

          {/* ── Fees ── */}
          <div style={{
            background: 'var(--color-surface)',
            border: '1.5px solid var(--color-border)',
            borderRadius: 14,
            padding: 20,
          }}>
            <div style={{
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--color-primary)',
              marginBottom: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <DollarSign size={16} />
              أتعاب التثمين
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 480 }}>
              <FormSelect
                label="أتعاب التثمين (ر.ع)"
                value={data.valuationFees}
                onChange={(v) => onChange('valuationFees', v)}
                options={generateFeesOptions(feesRange)}
              />
            </div>
            <div style={{
              marginTop: 10,
              fontSize: 11,
              color: 'var(--color-text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}>
              <Info size={12} />
              النطاق المحدد لهذا النوع: {feesRange.min} - {feesRange.max} ر.ع
            </div>
          </div>

          {/* ── Notes ── */}
          <div style={{
            background: 'var(--color-surface)',
            border: '1.5px solid var(--color-border)',
            borderRadius: 14,
            padding: 20,
          }}>
            <div style={{
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--color-primary)',
              marginBottom: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <CheckCircle size={16} />
              الملاحظات والتوصية
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <FormTextarea
                label="ملاحظات المقيم"
                value={data.appraiserNotes}
                onChange={(v) => onChange('appraiserNotes', v)}
              />
              <FormTextarea
                label="التوصية النهائية"
                value={data.finalRecommendation}
                onChange={(v) => onChange('finalRecommendation', v)}
              />
            </div>
          </div>
        </div>

        {/* ── Right: Valuation Summary Sticky Card ── */}
        <div style={{
          position: 'sticky',
          top: 80,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}>
          {/* Main Value Card */}
          <div style={{
            background: 'linear-gradient(145deg, var(--color-accent-dark) 0%, var(--color-accent) 100%)',
            borderRadius: 16,
            padding: 20,
            color: '#fff',
            boxShadow: 'var(--shadow-lg)',
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.8, marginBottom: 6, letterSpacing: 0.5 }}>
              القيمة السوقية الإجمالية
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.1, marginBottom: 4 }}>
              {marketValue > 0 ? marketValue.toLocaleString() : '—'}
            </div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>ريال عماني</div>

            {marketValue > 0 && (
              <div style={{
                marginTop: 14,
                paddingTop: 14,
                borderTop: '1px solid rgba(255,255,255,0.2)',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 10,
              }}>
                <div>
                  <div style={{ fontSize: 10, opacity: 0.7 }}>قيمة الأرض</div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>
                    {landValue > 0 ? landValue.toLocaleString() : '—'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, opacity: 0.7 }}>قيمة البناء</div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>
                    {buildingValue > 0 ? buildingValue.toLocaleString() : '—'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Sale Card */}
          {quickSale > 0 && (
            <div style={{
              background: quickSaleRatio && quickSaleRatio >= 70
                ? 'linear-gradient(145deg, var(--color-warning) 0%, var(--color-warning-light) 100%)'
                : 'linear-gradient(145deg, var(--color-danger) 0%, var(--color-danger-light) 100%)',
              borderRadius: 12,
              padding: 16,
              color: '#fff',
              boxShadow: 'var(--shadow-md)',
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.8, marginBottom: 4 }}>
                قيمة البيع القسري
              </div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>
                {quickSale.toLocaleString()} <span style={{ fontSize: 11, fontWeight: 400, opacity: 0.8 }}>ر.ع</span>
              </div>
              {quickSaleRatio !== null && (
                <div style={{
                  marginTop: 8,
                  fontSize: 11,
                  padding: '4px 8px',
                  borderRadius: 6,
                  background: 'rgba(255,255,255,0.15)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}>
                  {quickSaleRatio.toFixed(1)}% من القيمة السوقية
                </div>
              )}
            </div>
          )}

          {/* Rental Value Card */}
            {data.rentalValue && (
            <div style={{
              background: 'linear-gradient(145deg, var(--color-primary) 0%, var(--color-primary-light) 100%)',
              borderRadius: 12,
              padding: 16,
              color: '#fff',
              boxShadow: 'var(--shadow-md)',
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.8, marginBottom: 4 }}>
                القيمة التأجيرية
              </div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>
                {data.rentalValue.toLocaleString()} <span style={{ fontSize: 11, fontWeight: 400, opacity: 0.8 }}>ر.ع/شهر</span>
              </div>
            </div>
          )}

          {/* Confidence Gauge */}
          {confidence > 0 && (
            <div style={{
              background: 'var(--color-surface)',
              border: '1.5px solid var(--color-border)',
              borderRadius: 12,
              padding: 16,
            }}>
              <div style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--color-text-secondary)',
                marginBottom: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}>
                <Zap size={14} />
                مستوى الثقة
              </div>
              <div style={{
                height: 8,
                borderRadius: 4,
                background: 'var(--color-border)',
                overflow: 'hidden',
                marginBottom: 8,
              }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(confidence, 100)}%`,
                  borderRadius: 4,
                  background: confidence >= 70
                    ? 'linear-gradient(90deg, var(--color-success), var(--color-success-light))'
                    : confidence >= 40
                      ? 'linear-gradient(90deg, var(--color-warning), var(--color-warning-light))'
                      : 'linear-gradient(90deg, var(--color-danger), var(--color-danger-light))',
                  transition: 'width 0.4s ease',
                }} />
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 11,
                color: 'var(--color-text-muted)',
              }}>
                <span>0%</span>
                <span style={{
                  fontWeight: 700,
                  color: confidence >= 70 ? 'var(--color-success)' : confidence >= 40 ? 'var(--color-warning)' : 'var(--color-danger)',
                }}>
                  {confidence}%
                </span>
                <span>100%</span>
              </div>
            </div>
          )}

          {/* Method Card */}
          {data.valuationMethod && (
            <div style={{
              background: 'var(--color-surface)',
              border: '1.5px solid var(--color-border)',
              borderRadius: 12,
              padding: 14,
            }}>
              <div style={{ fontSize: 10, color: 'var(--color-text-muted)', fontWeight: 600, marginBottom: 2 }}>طريقة التقييم</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>{data.valuationMethod}</div>
            </div>
          )}

          {/* Fees */}
          {fees > 0 && (
            <div style={{
              background: 'var(--color-surface)',
              border: '1.5px solid var(--color-border)',
              borderRadius: 12,
              padding: 14,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <div style={{ fontSize: 10, color: 'var(--color-text-muted)', fontWeight: 600 }}>أتعاب التثمين</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-primary)' }}>{fees.toLocaleString()}</div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>ر.ع</div>
            </div>
          )}
        </div>
      </div>

      {/* ── Market Comps ── */}
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
