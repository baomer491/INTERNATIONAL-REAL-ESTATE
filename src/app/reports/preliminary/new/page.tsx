'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { store } from '@/lib/store';
import { useApp } from '@/components/layout/AppContext';
import {
  Building2, Search, CheckCircle2, ChevronLeft,
  Save, ArrowRight, Home, MapPin, DollarSign, User, Phone,
  Hash, Ruler, StickyNote, Briefcase, FileText, Download, FileCheck, AlertCircle
} from 'lucide-react';
import WizardStepLayout from '@/components/reports/wizard/WizardStepLayout';

import { useSearchParams } from 'next/navigation';
import { propertyTypes } from '@/data/mock';
import type { PropertyType } from '@/types';
import { getGovernorateNames, getWilayatsForGovernorate, getPriceForLocation, getPropertyTypeMarketKey } from '@/lib/market-price-lookup';

export default function NewPreliminaryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useApp();

  const [step, setStep] = useState(1);
  const [bankId, setBankId] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankSearch, setBankSearch] = useState('');
  const [selectedPropertyType, setSelectedPropertyType] = useState<PropertyType>('land');
  const [dynamicValues, setDynamicValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(false);

  // Market price integration
  const [governorateNames] = useState<string[]>(() => getGovernorateNames());
  const availableWilayats = getWilayatsForGovernorate(dynamicValues.governorate || '');
  const marketPrice = getPriceForLocation(
    dynamicValues.governorate || '',
    dynamicValues.wilayat || '',
    selectedPropertyType,
  );
  const marketKeyLabel: Record<string, string> = {
    residential: 'سكني',
    residential_commercial: 'سكني تجاري',
    industrial: 'صناعي',
    agricultural: 'زراعي',
    tourist: 'سياحي',
  };







  const banks = store.getActiveBanks();
  const filteredBanks = banks.filter(
    (b) => b.name.includes(bankSearch) || b.nameEn.toLowerCase().includes(bankSearch.toLowerCase())
  );

  const updateDynamicValue = (key: string, value: string) => {
    setDynamicValues(prev => ({ ...prev, [key]: value }));
    setErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
  };



  const validateStep1 = () => {
    if (!selectedPropertyType) {
      setErrors({ propertyType: 'يرجى اختيار نوع العقار' });
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!bankId) {
      setErrors({ bankId: 'يرجى اختيار البنك' });
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    const errs: Record<string, string> = {};
    // Validation for default fields
    if (!dynamicValues.beneficiary_name?.trim()) errs.beneficiary_name = 'يرجى إدخال اسم المتقدم';
    if (!dynamicValues.governorate?.trim()) errs.governorate = 'يرجى إدخال الموقع';
    if (!dynamicValues.wilayat?.trim()) errs.wilayat = 'يرجى إدخال الولاية';
    if (!dynamicValues.plot_number?.trim()) errs.plot_number = 'يرجى إدخال رقم القطعة';
    if (!dynamicValues.area?.trim()) errs.area = 'يرجى إدخال المساحة';
    if (!dynamicValues.estimated_value?.trim()) errs.estimated_value = 'يرجى إدخال القيمة التقديرية';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const buildValuesWithDefaults = () => {
    const today = new Date();
    const dateStr = today.toLocaleDateString('ar-OM', { year: 'numeric', month: 'long', day: 'numeric' });
    const dateEn = today.toLocaleDateString('en-GB');
    const bankObj = banks.find(b => b.id === bankId);

    return {
      ...dynamicValues,
      bank_name: bankName,
      اسم_البنك: bankName,
      bank_name_en: bankObj?.nameEn || '',
      date: dateEn,
      التاريخ: dateStr,
      report_number: `PV-${today.getFullYear()}-${String(getListCount() + 1).padStart(4, '0')}`,
      رقم_التقرير: `PV-${today.getFullYear()}-${String(getListCount() + 1).padStart(4, '0')}`,
    };
  };

  const getListCount = () => {
    try {
      const raw = localStorage.getItem('ireo_preliminary_valuations');
      if (!raw) return 0;
      return JSON.parse(raw).length;
    } catch { return 0; }
  };

  const getReportNumber = () => `PV-${new Date().getFullYear()}-${String(getListCount() + 1).padStart(4, '0')}`;

  const handleSave = () => {
    if (!validateStep3()) return;
    try {
      store.addPreliminaryValuation({
        bankId,
        bankName,
        beneficiaryName: dynamicValues.beneficiary_name || '',
        civilId: dynamicValues.civil_id || '',
        phone: dynamicValues.phone || '',
        propertyType: selectedPropertyType,
        governorate: dynamicValues.governorate || '',
        wilayat: dynamicValues.wilayat || '',
        plotNumber: dynamicValues.plot_number || '',
        blockNumber: dynamicValues.block_number || '',
        surveyNumber: dynamicValues.survey_number || '',
        area: dynamicValues.area || '',
        estimatedValue: dynamicValues.estimated_value || '',
        notes: dynamicValues.notes || '',
        createdBy: store.getCurrentUserId() || '',
      });
      showToast('تم حفظ التثمين المبدئي بنجاح', 'success');
      router.push('/reports/preliminary');
    } catch {
      showToast('حدث خطأ أثناء الحفظ', 'error');
    }
  };

  const handleSaveAndPrint = async () => {
    if (!validateStep3()) return;

    // Step 1: Save
    try {
      store.addPreliminaryValuation({
        bankId,
        bankName,
        beneficiaryName: dynamicValues.beneficiary_name || '',
        civilId: dynamicValues.civil_id || '',
        phone: dynamicValues.phone || '',
        propertyType: selectedPropertyType,
        governorate: dynamicValues.governorate || '',
        wilayat: dynamicValues.wilayat || '',
        plotNumber: dynamicValues.plot_number || '',
        blockNumber: dynamicValues.block_number || '',
        surveyNumber: dynamicValues.survey_number || '',
        area: dynamicValues.area || '',
        estimatedValue: dynamicValues.estimated_value || '',
        notes: dynamicValues.notes || '',
        createdBy: store.getCurrentUserId() || '',
      });
    } catch {
      showToast('حدث خطأ أثناء الحفظ', 'error');
      return;
    }

    // Step 2: Generate docx
    setGenerating(true);
    try {
      const settings = store.getSettings();
      const bankObj = banks.find(b => b.id === bankId);
      const today = new Date();
      const dateEn = today.toLocaleDateString('en-GB');
      const rptNo = getReportNumber();

      // Generate docx with built-in format
      const { generatePreliminaryDocx, downloadBlob } = await import('@/lib/docx-utils');
      const blob = await generatePreliminaryDocx({
          propertyType: selectedPropertyType,
          date: dateEn,
          surveyNumber: dynamicValues.survey_number || '',
          applicant: dynamicValues.beneficiary_name || '',
          plotNumber: dynamicValues.plot_number || '',
          blockNumber: dynamicValues.block_number || '',
          location: dynamicValues.governorate || '',
          wilayat: dynamicValues.wilayat || '',
          estimatedValue: dynamicValues.estimated_value || '',
          area: dynamicValues.area || '',
          bankNameEn: bankObj?.nameEn || '',
          officeNameEn: settings.officeNameEn || '',
          reportNumber: rptNo,
        });
        const benName = dynamicValues.beneficiary_name || 'جديد';
        downloadBlob(blob, `تثمين_مبدئي_${benName}_${today.toISOString().slice(0, 10)}.docx`);
      showToast('تم حفظ وطباعة التقرير بنجاح', 'success');
    } catch (err) {
      console.error('Print error:', err);
      showToast('تم الحفظ لكن حدث خطأ أثناء طباعة التقرير', 'error');
    } finally {
      setGenerating(false);
    }

    router.push('/reports/preliminary');
  };

  const stepTitles = ['نوع العقار', 'اختيار البنك', 'بيانات التثمين'];



  // Default fields matching the INITIAL VALUATION template
  const renderDefaultFields = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px 20px', width: '100%', maxWidth: 820, margin: '0 auto', padding: '0 16px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>رقم الكروكي (Survey Plan No.)</label>
        <div style={{ position: 'relative' }}>
          <Hash size={16} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input type="text" className="form-input" style={{ paddingRight: 36 }} value={dynamicValues.survey_number || ''} onChange={e => updateDynamicValue('survey_number', e.target.value)} placeholder="7-0-00-000-0000" />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>المتقدم (Applicant) <span style={{ color: 'var(--color-danger)' }}>*</span></label>
        <div style={{ position: 'relative' }}>
          <User size={16} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input type="text" className="form-input" style={{ paddingRight: 36 }} value={dynamicValues.beneficiary_name || ''} onChange={e => updateDynamicValue('beneficiary_name', e.target.value)} placeholder="اسم المتقدم الكامل" />
        </div>
        {errors.beneficiary_name && <span className="form-error-message">{errors.beneficiary_name}</span>}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>الرقم المدني</label>
        <div style={{ position: 'relative' }}>
          <Hash size={16} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input type="text" className="form-input" style={{ paddingRight: 36 }} value={dynamicValues.civil_id || ''} onChange={e => updateDynamicValue('civil_id', e.target.value)} placeholder="8 أرقام" maxLength={8} />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>رقم القطعة (Plot No.) <span style={{ color: 'var(--color-danger)' }}>*</span></label>
        <div style={{ position: 'relative' }}>
          <Hash size={16} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input type="text" className="form-input" style={{ paddingRight: 36 }} value={dynamicValues.plot_number || ''} onChange={e => updateDynamicValue('plot_number', e.target.value)} placeholder="رقم القطعة" />
        </div>
        {errors.plot_number && <span className="form-error-message">{errors.plot_number}</span>}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>رقم الحظر (Block No.)</label>
        <div style={{ position: 'relative' }}>
          <Hash size={16} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input type="text" className="form-input" style={{ paddingRight: 36 }} value={dynamicValues.block_number || ''} onChange={e => updateDynamicValue('block_number', e.target.value)} placeholder="رقم الحظر" />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>الموقع / المحافظة (Location) <span style={{ color: 'var(--color-danger)' }}>*</span></label>
        <div style={{ position: 'relative' }}>
          <MapPin size={16} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none', zIndex: 1 }} />
          {governorateNames.length > 0 ? (
            <select
              className="form-input"
              style={{ paddingRight: 36, appearance: 'none' }}
              value={dynamicValues.governorate || ''}
              onChange={e => { updateDynamicValue('governorate', e.target.value); updateDynamicValue('wilayat', ''); }}
            >
              <option value="">اختر المحافظة</option>
              {governorateNames.map(name => <option key={name} value={name}>{name}</option>)}
            </select>
          ) : (
            <input type="text" className="form-input" style={{ paddingRight: 36 }} value={dynamicValues.governorate || ''} onChange={e => updateDynamicValue('governorate', e.target.value)} placeholder="الموقع / المنطقة" />
          )}
        </div>
        {errors.governorate && <span className="form-error-message">{errors.governorate}</span>}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>الولاية (Williyat) <span style={{ color: 'var(--color-danger)' }}>*</span></label>
        <div style={{ position: 'relative' }}>
          <MapPin size={16} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none', zIndex: 1 }} />
          {availableWilayats.length > 0 ? (
            <select
              className="form-input"
              style={{ paddingRight: 36, appearance: 'none' }}
              value={dynamicValues.wilayat || ''}
              onChange={e => updateDynamicValue('wilayat', e.target.value)}
            >
              <option value="">اختر الولاية</option>
              {availableWilayats.map(name => <option key={name} value={name}>{name}</option>)}
            </select>
          ) : (
            <input type="text" className="form-input" style={{ paddingRight: 36 }} value={dynamicValues.wilayat || ''} onChange={e => updateDynamicValue('wilayat', e.target.value)} placeholder="الولاية" />
          )}
        </div>
        {errors.wilayat && <span className="form-error-message">{errors.wilayat}</span>}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>المساحة (م²) <span style={{ color: 'var(--color-danger)' }}>*</span></label>
        <div style={{ position: 'relative' }}>
          <Ruler size={16} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input type="text" className="form-input" style={{ paddingRight: 36 }} value={dynamicValues.area || ''} onChange={e => updateDynamicValue('area', e.target.value)} placeholder="المساحة بالمتر المربع" />
        </div>
        {errors.area && <span className="form-error-message">{errors.area}</span>}
      </div>

      {/* Market Price Suggestion */}
      {marketPrice.low != null && marketPrice.high != null && (
        <div style={{ gridColumn: '1 / -1', padding: '14px 18px', borderRadius: 12, background: 'var(--color-info-bg)', border: '1px solid var(--color-primary)', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-primary)', fontWeight: 700, fontSize: 13 }}>
            <DollarSign size={16} />
            أسعار السوق ({marketKeyLabel[getPropertyTypeMarketKey(selectedPropertyType)] || selectedPropertyType})
          </div>
          <div style={{ fontSize: 13, color: 'var(--color-text)' }}>
            <span style={{ fontWeight: 600 }}>{marketPrice.low?.toFixed(2)}</span>
            <span style={{ color: 'var(--color-text-muted)', margin: '0 4px' }}>—</span>
            <span style={{ fontWeight: 600 }}>{marketPrice.high?.toFixed(2)}</span>
            <span style={{ color: 'var(--color-text-muted)', fontSize: 12, marginRight: 4 }}>ر.ع / م²</span>
          </div>
          {dynamicValues.area && !isNaN(Number(dynamicValues.area)) && (
            <button
              type="button"
              onClick={() => {
                const area = Number(dynamicValues.area);
                const avg = ((marketPrice.low || 0) + (marketPrice.high || 0)) / 2;
                const total = Math.round(avg * area);
                updateDynamicValue('estimated_value', total.toLocaleString('en-US'));
              }}
              style={{ fontSize: 12, padding: '4px 12px', borderRadius: 8, background: 'var(--color-primary)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }}
            >
              حساب تلقائي ({Math.round(((marketPrice.low || 0) + (marketPrice.high || 0)) / 2).toFixed(2)} × {dynamicValues.area} م²)
            </button>
          )}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>القيمة التقديرية (ر.ع) <span style={{ color: 'var(--color-danger)' }}>*</span></label>
        <div style={{ position: 'relative' }}>
          <DollarSign size={16} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input type="text" className="form-input" style={{ paddingRight: 36 }} value={dynamicValues.estimated_value || ''} onChange={e => updateDynamicValue('estimated_value', e.target.value)} placeholder="القيمة التقديرية بالريال العماني" />
        </div>
        {errors.estimated_value && <span className="form-error-message">{errors.estimated_value}</span>}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>رقم الهاتف</label>
        <div style={{ position: 'relative' }}>
          <Phone size={16} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input type="text" className="form-input" style={{ paddingRight: 36 }} value={dynamicValues.phone || ''} onChange={e => updateDynamicValue('phone', e.target.value)} placeholder="رقم الهاتف" />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>ملاحظات</label>
        <div style={{ position: 'relative' }}>
          <StickyNote size={16} style={{ position: 'absolute', right: 12, top: 14, color: 'var(--color-text-muted)' }} />
          <textarea className="form-input" style={{ paddingRight: 36, minHeight: 80, resize: 'vertical' }} value={dynamicValues.notes || ''} onChange={e => updateDynamicValue('notes', e.target.value)} placeholder="أي ملاحظات إضافية..." />
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 2px', letterSpacing: '-0.02em' }}>إنشاء تثمين مبدئي</h1>
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: 0 }}>تثمين مبدئي سريع للأغراض الداخلية</p>
      </div>

      {/* Step Indicator */}
      <div className="card" style={{ marginBottom: 18, padding: '20px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {[1, 2, 3].map((s, idx) => (
            <React.Fragment key={s}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                opacity: step === s ? 1 : step > s ? 0.8 : 0.5,
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: step >= s ? 'var(--color-primary)' : 'var(--color-surface-alt)',
                  color: step >= s ? '#fff' : 'var(--color-text-muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 13,
                }}>
                  {step > s ? <CheckCircle2 size={16} /> : s}
                </div>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{stepTitles[idx]}</span>
              </div>
              {idx < 2 && <ChevronLeft size={16} color="var(--color-text-muted)" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 0, minHeight: 480, padding: '28px 32px 80px', overflow: 'hidden' }}>
        {/* Step 1: Property Type Selection */}
        {step === 1 && (
          <WizardStepLayout
            icon={<Home size={22} color="var(--color-primary)" />}
            title="اختيار نوع العقار"
          >
            {errors.propertyType && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ef4444', fontSize: 13, marginBottom: 14 }}>
                <AlertCircle size={16} /> {errors.propertyType}
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
              {propertyTypes.map((pt) => {
                const isSelected = selectedPropertyType === pt.value;
                return (
                  <button
                    key={pt.value}
                    onClick={() => setSelectedPropertyType(pt.value)}
                    style={{
                      padding: '20px 16px', borderRadius: 14, textAlign: 'center', fontFamily: 'inherit',
                      border: isSelected ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                      background: isSelected ? 'var(--color-info-bg)' : 'var(--color-surface)',
                      cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                    }}
                  >
                    <div style={{
                      width: 52, height: 52, borderRadius: 14,
                      background: isSelected ? 'var(--color-primary)' : 'var(--color-surface-alt)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: isSelected ? '#fff' : 'var(--color-text-muted)', flexShrink: 0,
                      transition: 'all 0.2s',
                    }}>
                      <Home size={24} />
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: isSelected ? 'var(--color-primary)' : 'var(--color-text)' }}>
                      {pt.label}
                    </div>
                    {isSelected && <CheckCircle2 size={18} color="var(--color-primary)" />}
                  </button>
                );
              })}
            </div>
          </WizardStepLayout>
        )}

        {/* Step 2: Bank Selection */}
        {step === 2 && (
          <WizardStepLayout
            icon={<Building2 size={22} color="var(--color-primary)" />}
            title="اختيار البنك"
          >
            {/* Selected Bank Card */}
            {bankId && (() => {
              const sb = banks.find(b => b.id === bankId);
              return sb ? (
                <div style={{
                  marginBottom: 20, padding: '18px 24px', borderRadius: 16,
                  border: '2px solid var(--color-primary)',
                  background: 'linear-gradient(135deg, var(--color-info-bg) 0%, var(--color-surface) 100%)',
                  display: 'flex', alignItems: 'center', gap: 16, position: 'relative', overflow: 'hidden',
                }}>
                  <div style={{ position: 'absolute', top: 0, right: 0, width: 4, height: '100%', background: 'var(--color-primary)', borderRadius: '0 16px 16px 0' }} />
                  <div style={{
                    width: 64, height: 64, borderRadius: 14, flexShrink: 0, background: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.08)', border: '2px solid var(--color-border)', overflow: 'hidden',
                  }}>
                    {sb.logo ? (
                      <img src={sb.logo} alt={sb.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 6 }} />
                    ) : (
                      <Building2 size={28} color="var(--color-primary)" />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-primary)', marginBottom: 2, letterSpacing: 0.5 }}>البنك المختار</div>
                    <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--color-text)', marginBottom: 2 }}>{sb.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{sb.nameEn}</div>
                  </div>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0, background: 'var(--color-primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
                  }}>
                    <CheckCircle2 size={20} color="white" />
                  </div>
                </div>
              ) : null;
            })()}

            {/* Search */}
            <div style={{ position: 'relative', marginBottom: 20 }}>
              <Search size={18} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              <input
                type="text"
                placeholder="البحث عن بنك..."
                value={bankSearch}
                onChange={(e) => setBankSearch(e.target.value)}
                className="form-input"
                style={{ paddingRight: 44 }}
              />
            </div>

            {errors.bankId && <p className="form-error-message" style={{ marginBottom: 12 }}>{errors.bankId}</p>}

            {/* Bank Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
              {filteredBanks.map((bank) => {
                const isSelected = bankId === bank.id;
                return (
                  <button
                    key={bank.id}
                    onClick={() => { setBankId(bank.id); setBankName(bank.name); }}
                    style={{
                      padding: 0, borderRadius: 14, textAlign: 'center', fontFamily: 'inherit',
                      border: isSelected ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                      background: isSelected ? 'var(--color-info-bg)' : 'var(--color-surface)',
                      cursor: 'pointer', transition: 'all 0.2s', overflow: 'hidden', position: 'relative',
                    }}
                  >
                    {isSelected && (
                      <div style={{
                        position: 'absolute', top: 8, left: 8, width: 22, height: 22, borderRadius: '50%',
                        background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                      }}>
                        <CheckCircle2 size={13} color="white" />
                      </div>
                    )}
                    <div style={{
                      height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px 20px',
                      background: isSelected ? 'rgba(37, 99, 235, 0.03)' : 'var(--color-surface-alt)',
                      borderBottom: `1px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    }}>
                      {bank.logo ? (
                        <img src={bank.logo} alt={bank.name} style={{
                          maxWidth: '100%', maxHeight: 60, objectFit: 'contain',
                          filter: isSelected ? 'none' : 'grayscale(0.1)', transition: 'all 0.2s',
                        }} />
                      ) : (
                        <div style={{
                          width: 52, height: 52, borderRadius: 12,
                          background: isSelected ? 'var(--color-primary)' : 'var(--color-border)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: isSelected ? 'white' : 'var(--color-text-muted)', transition: 'all 0.2s',
                        }}>
                          <Building2 size={24} />
                        </div>
                      )}
                    </div>
                    <div style={{ padding: '10px 14px' }}>
                      <div style={{
                        fontSize: 13, fontWeight: 700,
                        color: isSelected ? 'var(--color-primary)' : 'var(--color-text)',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {bank.name}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </WizardStepLayout>
        )}

        {/* Step 3: Dynamic Data Entry */}
        {step === 3 && (
          <WizardStepLayout
            icon={<Briefcase size={22} color="var(--color-primary)" />}
            title={'بيانات التثمين المبدئي'}
          >
            {renderDefaultFields()}
          </WizardStepLayout>
        )}

        {/* Nav Bar */}
        <div className="wizard-nav-bar" style={{ position: 'relative' }}>
          <div className="wizard-nav-step-context">
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text)' }}>
              {stepTitles[step - 1]}
            </span>
            <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>·</span>
            <span className="wizard-nav-step-pill">{step} / 3</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {step > 1 && (
              <button onClick={() => setStep(step - 1)} className="btn btn-outline" style={{ fontSize: 13, padding: '7px 14px' }}>
                <ArrowRight size={16} style={{ marginLeft: 4 }} /> السابق
              </button>
            )}
            {step < 3 ? (
              <button onClick={() => {
                if (step === 1 && validateStep1()) setStep(2);
                else if (step === 2 && validateStep2()) setStep(3);
              }} className="btn btn-primary" style={{ fontSize: 13, padding: '7px 16px' }}>
                التالي <ChevronLeft size={16} />
              </button>
            ) : (
              <>
                <button onClick={handleSave} className="btn btn-outline" style={{ fontSize: 13, padding: '7px 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Save size={16} /> حفظ فقط
                </button>
                <button onClick={handleSaveAndPrint} disabled={generating} className="btn btn-success" style={{ fontSize: 13, padding: '7px 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FileCheck size={16} /> {generating ? 'جاري الحفظ والطباعة...' : 'حفظ وطباعة التقرير'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
