'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  TrendingUp, TrendingDown, Building2, Home, Factory, Trees, Hotel,
  MapPin, Filter, Edit3, X, Save, RotateCcw, Plus, Trash2,
  ChevronLeft, ArrowRight, BarChart3, Layers, Grid3X3, ChevronDown
} from 'lucide-react';
import {
  PROPERTY_TYPES, PropertyTypeKey, Area, MarketData,
  STORAGE_KEY, EMPTY_MARKET_DATA, createEmptyArea,
  normalizeRawData, recalculateSummary, countAreas, countRegions,
  formatNumber, parseNumber, loadMarketData, saveMarketData,
} from '@/lib/market-data-utils';

/* ─── Icons map ─── */
const TYPE_ICONS: Record<PropertyTypeKey, React.ReactNode> = {
  residential: <Home size={18} />,
  residential_commercial: <Building2 size={18} />,
  industrial: <Factory size={18} />,
  agricultural: <Trees size={18} />,
  tourist: <Hotel size={18} />,
};

type PageMode = 'view' | 'add-governorate' | 'add-region' | 'add-area' | 'edit-area';

const EMPTY_FORM = {
  nameAr: '', nameEn: '', areaName: '',
  touristHigh: '', touristLow: '',
  agriculturalHigh: '', agriculturalLow: '',
  industrialHigh: '', industrialLow: '',
  residentialCommercialHigh: '', residentialCommercialLow: '',
  residentialHigh: '', residentialLow: '',
};

const INPUT: React.CSSProperties = {
  width: '100%', padding: '10px 14px',
  border: '1.5px solid var(--color-border)', borderRadius: 10,
  fontSize: 14, fontFamily: 'inherit', direction: 'rtl', textAlign: 'right',
  background: 'var(--color-surface)', color: 'var(--color-text)',
  transition: 'border-color var(--transition-fast)',
};

const LABEL: React.CSSProperties = {
  fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6,
  color: 'var(--color-text-secondary)',
};

export default function MarketPricesPage() {
  const [data, setData] = useState<MarketData>(loadMarketData);
  const [mode, setMode] = useState<PageMode>('view');
  const [selGov, setSelGov] = useState('');
  const [selRegion, setSelRegion] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [editArea, setEditArea] = useState<{ govKey: string; regionKey: string; area: Area } | null>(null);
  const [editPrices, setEditPrices] = useState<Record<string, { high: string; low: string }>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [expandedGov, setExpandedGov] = useState<string | null>(null);

  // Listen for storage changes (from settings page upload)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try { setData(normalizeRawData(JSON.parse(e.newValue))); } catch {}
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Auto-load seed file if no data
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved || saved === '{}') {
      fetch('/data/market-prices.json')
        .then(res => res.json())
        .then(seed => {
          if (seed?.governorates) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
            setData(normalizeRawData(seed));
          }
        })
        .catch(() => {});
    }
  }, []);

  // Poll for same-tab changes
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (JSON.stringify(parsed.governorates || {}) !== JSON.stringify(data.governorates)) {
            setData(normalizeRawData(parsed));
          }
        }
      } catch {}
    }, 2000);
    return () => clearInterval(interval);
  }, [data]);

  /* ─── Derived data ─── */
  const govEntries = useMemo(() => Object.entries(data.governorates), [data]);
  const regions = useMemo(() => {
    if (!selGov || !data.governorates[selGov]?.regions) return [];
    return Object.entries(data.governorates[selGov].regions!);
  }, [data, selGov]);

  const filteredAreas = useMemo(() => {
    if (!selGov) return [];
    const gov = data.governorates[selGov];
    if (!gov) return [];
    if (gov.regions && selRegion) return gov.regions[selRegion]?.areas || [];
    if (gov.regions && !selRegion) {
      const all: Area[] = [];
      Object.values(gov.regions).forEach(r => { if (r.areas) all.push(...r.areas); });
      return all;
    }
    return gov.areas || [];
  }, [data, selGov, selRegion]);

  const totalAreas = useMemo(() => countAreas(data), [data]);
  const totalRegions = useMemo(() => countRegions(data), [data]);

  /* ─── Mutations ─── */
  const update = useCallback((newData: MarketData) => {
    const updated = recalculateSummary(newData);
    setData(updated);
    saveMarketData(updated);
  }, []);

  const handleAddGovernorate = () => {
    if (!form.nameAr.trim()) return;
    const key = form.nameAr.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z_]/g, '');
    const newData = {
      ...data,
      governorates: {
        ...data.governorates,
        [key]: { name_ar: form.nameAr, name_en: form.nameEn, regions: {} },
      },
      statistics: { ...data.statistics, total_governorates: data.statistics.total_governorates + 1 },
    };
    update(newData);
    setForm(EMPTY_FORM);
    setMode('view');
    setExpandedGov(key);
  };

  const handleAddRegion = () => {
    if (!selGov || !form.nameAr.trim()) return;
    const key = form.nameAr.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z_]/g, '');
    const gov = data.governorates[selGov];
    if (!gov.regions) gov.regions = {};
    const newData = {
      ...data,
      governorates: {
        ...data.governorates,
        [selGov]: { ...gov, regions: { ...gov.regions, [key]: { name_ar: form.nameAr, name_en: form.nameEn, areas: [] } } },
      },
      statistics: { ...data.statistics, total_regions: data.statistics.total_regions + 1 },
    };
    update(newData);
    setForm(EMPTY_FORM);
    setMode('view');
  };

  const handleAddArea = () => {
    if (!selGov || !form.areaName.trim()) return;
    const newArea = createEmptyArea(filteredAreas.length + 1, form.areaName);
    newArea.tourist = { high: parseNumber(form.touristHigh), low: parseNumber(form.touristLow) };
    newArea.agricultural = { high: parseNumber(form.agriculturalHigh), low: parseNumber(form.agriculturalLow) };
    newArea.industrial = { high: parseNumber(form.industrialHigh), low: parseNumber(form.industrialLow) };
    newArea.residential_commercial = { high: parseNumber(form.residentialCommercialHigh), low: parseNumber(form.residentialCommercialLow) };
    newArea.residential = { high: parseNumber(form.residentialHigh), low: parseNumber(form.residentialLow) };

    const newData = { ...data };
    const gov = { ...newData.governorates[selGov] };
    if (selRegion && gov.regions?.[selRegion]) {
      gov.regions = { ...gov.regions, [selRegion]: { ...gov.regions[selRegion], areas: [...gov.regions[selRegion].areas, newArea] } };
    } else if (gov.areas) {
      gov.areas = [...gov.areas, newArea];
    } else if (gov.regions && Object.keys(gov.regions).length > 0) {
      const firstKey = Object.keys(gov.regions)[0];
      gov.regions = { ...gov.regions, [firstKey]: { ...gov.regions[firstKey], areas: [...(gov.regions[firstKey].areas || []), newArea] } };
    }
    newData.governorates = { ...newData.governorates, [selGov]: gov };
    newData.statistics = { ...newData.statistics, total_areas: countAreas(newData) + 1 };
    update(newData);
    setForm(EMPTY_FORM);
    setMode('view');
  };

  const openEdit = (area: Area, govKey: string, regionKey: string) => {
    const prices: Record<string, { high: string; low: string }> = {};
    (Object.keys(PROPERTY_TYPES) as PropertyTypeKey[]).forEach(t => {
      const p = area[t];
      prices[t] = { high: p.high != null ? String(p.high) : '', low: p.low != null ? String(p.low) : '' };
    });
    setEditPrices(prices);
    setEditArea({ govKey, regionKey, area: { ...area } });
    setHasChanges(false);
    setMode('edit-area');
  };

  const handleSaveEdit = () => {
    if (!editArea) return;
    const newAreas = filteredAreas.map(a => {
      if (a.id === editArea.area.id && a.name === editArea.area.name) {
        const updated = { ...a };
        (Object.keys(PROPERTY_TYPES) as PropertyTypeKey[]).forEach(t => {
          updated[t] = { high: parseNumber(editPrices[t].high), low: parseNumber(editPrices[t].low) };
        });
        return updated;
      }
      return a;
    });
    const newData = { ...data };
    if (editArea.regionKey && newData.governorates[editArea.govKey]?.regions?.[editArea.regionKey]) {
      newData.governorates[editArea.govKey].regions![editArea.regionKey].areas = newAreas;
    } else if (newData.governorates[editArea.govKey]?.areas) {
      newData.governorates[editArea.govKey].areas = newAreas;
    }
    update(newData);
    setEditArea(null);
    setHasChanges(false);
    setMode('view');
  };

  const handleDeleteGov = (govKey: string) => {
    const gov = data.governorates[govKey];
    if (!gov || !confirm(`هل أنت متأكد من حذف "${gov.name_ar}" وجميع المناطق؟`)) return;
    const newGovs = { ...data.governorates };
    delete newGovs[govKey];
    update({ ...data, governorates: newGovs, statistics: { ...data.statistics, total_governorates: Object.keys(newGovs).length } });
    if (selGov === govKey) { setSelGov(''); setSelRegion(''); }
  };

  const handleDeleteRegion = (govKey: string, regionKey: string) => {
    const region = data.governorates[govKey]?.regions?.[regionKey];
    if (!region || !confirm(`هل أنت متأكد من حذف "${region.name_ar}"؟`)) return;
    const gov = { ...data.governorates[govKey] };
    const newRegions = { ...gov.regions };
    delete newRegions[regionKey];
    gov.regions = newRegions;
    update({ ...data, governorates: { ...data.governorates, [govKey]: gov } });
    if (selRegion === regionKey) setSelRegion('');
  };

  const handleDeleteArea = (govKey: string, regionKey: string, areaId: number) => {
    const gov = { ...data.governorates[govKey] };
    let areaName = '';
    if (regionKey && gov.regions?.[regionKey]) {
      const area = gov.regions[regionKey].areas.find(a => a.id === areaId);
      if (!area) return;
      areaName = area.name;
    } else if (gov.areas) {
      const area = gov.areas.find(a => a.id === areaId);
      if (!area) return;
      areaName = area.name;
    }
    if (!confirm(`هل أنت متأكد من حذف "${areaName}"؟`)) return;

    if (regionKey && gov.regions?.[regionKey]) {
      const region = { ...gov.regions[regionKey], areas: gov.regions[regionKey].areas.filter(a => a.id !== areaId) };
      gov.regions = { ...gov.regions, [regionKey]: region };
    } else if (gov.areas) {
      gov.areas = gov.areas.filter(a => a.id !== areaId);
    }
    const newData = { ...data, governorates: { ...data.governorates, [govKey]: gov } };
    newData.statistics = { ...newData.statistics, total_areas: countAreas(newData) };
    update(newData);
  };

  const handleReset = () => {
    if (confirm('هل أنت متأكد من حذف جميع البيانات؟')) {
      setData(EMPTY_MARKET_DATA);
      saveMarketData(EMPTY_MARKET_DATA);
    }
  };

  /* ─── Stat Card ─── */
  const StatCard = ({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) => (
    <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ background: `${color}12`, padding: 10, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 12, margin: 0, fontWeight: 500 }}>{label}</p>
        <p style={{ fontSize: 22, fontWeight: 800, margin: '2px 0 0', color: 'var(--color-text)' }}>{value}</p>
      </div>
    </div>
  );

  /* ─── Back Button ─── */
  const BackButton = ({ onClick, label }: { onClick: () => void; label?: string }) => (
    <button onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none',
      color: 'var(--color-primary)', fontSize: 14, fontWeight: 600, cursor: 'pointer', padding: '8px 0',
      marginBottom: 16,
    }}>
      <ArrowRight size={16} />
      {label || 'العودة'}
    </button>
  );

  /* ─── Inline Form Wrapper ─── */
  const FormCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="card" style={{ padding: 28, maxWidth: 720 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 24px', color: 'var(--color-text)' }}>{title}</h2>
      {children}
    </div>
  );

  const FormActions = ({ onCancel, onSave, saveLabel, disabled }: { onCancel: () => void; onSave: () => void; saveLabel: string; disabled?: boolean }) => (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--color-border)' }}>
      <button onClick={onCancel} className="btn btn-ghost">إلغاء</button>
      <button onClick={onSave} className="btn btn-primary" disabled={disabled} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Save size={16} />
        {saveLabel}
      </button>
    </div>
  );

  /* ═══════════════════════════════════════════════
     MODE: Add Governorate
     ═══════════════════════════════════════════════ */
  if (mode === 'add-governorate') {
    return (
      <div style={{ direction: 'rtl' }}>
        <BackButton onClick={() => { setMode('view'); setForm(EMPTY_FORM); }} />
        <FormCard title="إضافة محافظة جديدة">
          <div style={{ display: 'grid', gap: 16, maxWidth: 400 }}>
            <div>
              <label style={LABEL}>الاسم بالعربية *</label>
              <input type="text" value={form.nameAr} onChange={e => setForm(p => ({ ...p, nameAr: e.target.value }))} style={INPUT} placeholder="مثال: محافظة الداخلية" />
            </div>
            <div>
              <label style={LABEL}>الاسم بالإنجليزية</label>
              <input type="text" value={form.nameEn} onChange={e => setForm(p => ({ ...p, nameEn: e.target.value }))} style={INPUT} placeholder="Example: Interior" />
            </div>
          </div>
          <FormActions onCancel={() => { setMode('view'); setForm(EMPTY_FORM); }} onSave={handleAddGovernorate} saveLabel="إضافة المحافظة" disabled={!form.nameAr.trim()} />
        </FormCard>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════
     MODE: Add Region
     ═══════════════════════════════════════════════ */
  if (mode === 'add-region') {
    return (
      <div style={{ direction: 'rtl' }}>
        <BackButton onClick={() => { setMode('view'); setForm(EMPTY_FORM); }} />
        <FormCard title="إضافة منطقة جديدة">
          <div style={{ padding: '10px 14px', background: 'var(--color-surface-alt)', borderRadius: 8, fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 20 }}>
            المحافظة: <strong>{data.governorates[selGov]?.name_ar}</strong>
          </div>
          <div style={{ display: 'grid', gap: 16, maxWidth: 400 }}>
            <div>
              <label style={LABEL}>الاسم بالعربية *</label>
              <input type="text" value={form.nameAr} onChange={e => setForm(p => ({ ...p, nameAr: e.target.value }))} style={INPUT} placeholder="مثال: ولاية نزوى" />
            </div>
            <div>
              <label style={LABEL}>الاسم بالإنجليزية</label>
              <input type="text" value={form.nameEn} onChange={e => setForm(p => ({ ...p, nameEn: e.target.value }))} style={INPUT} placeholder="Example: Nizwa" />
            </div>
          </div>
          <FormActions onCancel={() => { setMode('view'); setForm(EMPTY_FORM); }} onSave={handleAddRegion} saveLabel="إضافة المنطقة" disabled={!form.nameAr.trim()} />
        </FormCard>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════
     MODE: Add Area
     ═══════════════════════════════════════════════ */
  if (mode === 'add-area') {
    return (
      <div style={{ direction: 'rtl' }}>
        <BackButton onClick={() => { setMode('view'); setForm(EMPTY_FORM); }} />
        <FormCard title="إضافة مربع جديد">
          <div style={{ padding: '10px 14px', background: 'var(--color-surface-alt)', borderRadius: 8, fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 20 }}>
            {selGov && `المحافظة: ${data.governorates[selGov]?.name_ar}`}
            {selRegion && ` - المنطقة: ${data.governorates[selGov]?.regions?.[selRegion]?.name_ar}`}
          </div>
          <div style={{ display: 'grid', gap: 16 }}>
            <div style={{ maxWidth: 400 }}>
              <label style={LABEL}>اسم المربع *</label>
              <input type="text" value={form.areaName} onChange={e => setForm(p => ({ ...p, areaName: e.target.value }))} style={INPUT} placeholder="مثال: مركز المدينة" />
            </div>
            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 16 }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 16px', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <BarChart3 size={16} />
                الأسعار (OMR/m²)
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
                {(Object.entries(PROPERTY_TYPES) as [PropertyTypeKey, typeof PROPERTY_TYPES[PropertyTypeKey]][]).map(([key, pt]) => (
                  <div key={key} style={{ padding: 14, borderRadius: 10, background: `${pt.color}08`, border: `1px solid ${pt.color}20` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <span style={{ color: pt.color }}>{TYPE_ICONS[key]}</span>
                      <span style={{ fontWeight: 600, fontSize: 13, color: pt.color }}>{pt.label}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <div>
                        <label style={{ ...LABEL, fontSize: 11 }}>أعلى</label>
                        <input type="text" value={(form as any)[`${key}High`]} onChange={e => setForm(p => ({ ...p, [`${key}High`]: e.target.value }))} style={{ ...INPUT, fontSize: 12, padding: '7px 10px' }} placeholder="0.00" />
                      </div>
                      <div>
                        <label style={{ ...LABEL, fontSize: 11 }}>أقل</label>
                        <input type="text" value={(form as any)[`${key}Low`]} onChange={e => setForm(p => ({ ...p, [`${key}Low`]: e.target.value }))} style={{ ...INPUT, fontSize: 12, padding: '7px 10px' }} placeholder="0.00" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <FormActions onCancel={() => { setMode('view'); setForm(EMPTY_FORM); }} onSave={handleAddArea} saveLabel="إضافة المربع" disabled={!form.areaName.trim()} />
        </FormCard>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════
     MODE: Edit Area
     ═══════════════════════════════════════════════ */
  if (mode === 'edit-area' && editArea) {
    return (
      <div style={{ direction: 'rtl' }}>
        <BackButton onClick={() => { setMode('view'); setEditArea(null); }} />
        <FormCard title={`تعديل أسعار: ${editArea.area.name}`}>
          <div style={{ padding: '10px 14px', background: 'var(--color-surface-alt)', borderRadius: 8, fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 20 }}>
            {data.governorates[editArea.govKey]?.name_ar}
            {editArea.regionKey && ` - ${data.governorates[editArea.govKey]?.regions?.[editArea.regionKey]?.name_ar || ''}`}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
            {(Object.keys(PROPERTY_TYPES) as PropertyTypeKey[]).map(type => {
              const pt = PROPERTY_TYPES[type];
              const fd = editPrices[type] || { high: '', low: '' };
              return (
                <div key={type} style={{ padding: 16, borderRadius: 10, background: `${pt.color}08`, border: `1px solid ${pt.color}20` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <div style={{ background: `${pt.color}15`, padding: 7, borderRadius: 8, display: 'flex' }}>
                      <span style={{ color: pt.color }}>{TYPE_ICONS[type]}</span>
                    </div>
                    <span style={{ fontWeight: 700, fontSize: 14, color: pt.color }}>{pt.label}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label style={{ ...LABEL, fontSize: 11 }}>أعلى (OMR/m²)</label>
                      <input type="text" value={fd.high} onChange={e => { setEditPrices(p => ({ ...p, [type]: { ...p[type], high: e.target.value } })); setHasChanges(true); }} style={{ ...INPUT, fontSize: 12, padding: '8px 10px' }} placeholder="0.00" />
                    </div>
                    <div>
                      <label style={{ ...LABEL, fontSize: 11 }}>أقل (OMR/m²)</label>
                      <input type="text" value={fd.low} onChange={e => { setEditPrices(p => ({ ...p, [type]: { ...p[type], low: e.target.value } })); setHasChanges(true); }} style={{ ...INPUT, fontSize: 12, padding: '8px 10px' }} placeholder="0.00" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <FormActions onCancel={() => { setMode('view'); setEditArea(null); }} onSave={handleSaveEdit} saveLabel="حفظ التغييرات" disabled={!hasChanges} />
        </FormCard>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════
     MODE: View (Main Dashboard)
     ═══════════════════════════════════════════════ */
  return (
    <div style={{ direction: 'rtl' }}>
      {/* ─── Header ─── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-text)', margin: '0 0 6px' }}>
              مؤشرات أسعار السوق العقاري
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', margin: 0, fontSize: 14 }}>
              تحليل أسعار العقارات حسب المنطقة والنوع — الريال العماني / متر مربع
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => { setForm(EMPTY_FORM); setMode('add-governorate'); }} className="btn btn-outline btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Plus size={15} /> محافظة
            </button>
            <button onClick={() => { setForm(EMPTY_FORM); setMode('add-region'); }} className="btn btn-outline btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }} disabled={!selGov}>
              <Plus size={15} /> منطقة
            </button>
            <button onClick={() => { setForm(EMPTY_FORM); setMode('add-area'); }} className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Plus size={15} /> مربع
            </button>
            <button onClick={handleReset} className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-danger)' }}>
              <RotateCcw size={15} /> حذف الكل
            </button>
          </div>
        </div>
      </div>

      {/* ─── Stats ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
        <StatCard icon={<MapPin size={20} />} label="المحافظات" value={data.statistics.total_governorates} color="var(--color-info)" />
        <StatCard icon={<Layers size={20} />} label="المناطق" value={totalRegions} color="var(--color-success)" />
        <StatCard icon={<Grid3X3 size={20} />} label="المربعات" value={totalAreas} color="var(--color-primary)" />
        <StatCard icon={<TrendingUp size={20} />} label="أعلى سعر" value={formatNumber(data.price_summary.highest_prices.residential_commercial.value)} color="var(--color-warning)" />
      </div>

      {/* ─── Filters ─── */}
      <div className="card" style={{ padding: 20, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Filter size={18} color="var(--color-primary)" />
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>تصفية البيانات</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
          <div>
            <label className="form-label">المحافظة</label>
            <select className="form-select" value={selGov} onChange={e => { setSelGov(e.target.value); setSelRegion(''); setExpandedGov(e.target.value); }}>
              <option value="">اختر المحافظة</option>
              {govEntries.map(([k, g]) => <option key={k} value={k}>{g.name_ar}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">المنطقة</label>
            <select className="form-select" value={selRegion} onChange={e => setSelRegion(e.target.value)} disabled={!selGov || regions.length === 0}>
              <option value="">جميع المناطق</option>
              {regions.map(([k, r]) => <option key={k} value={k}>{r.name_ar}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* ─── Governorates Tree (when no filter selected) ─── */}
      {!selGov && govEntries.length > 0 && (
        <div className="card" style={{ padding: 20, marginBottom: 24 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>المحافظات والمناطق</h3>
          <div style={{ display: 'grid', gap: 8 }}>
            {govEntries.map(([govKey, gov]) => {
              const isExpanded = expandedGov === govKey;
              const regionEntries = gov.regions ? Object.entries(gov.regions) : [];
              const govAreaCount = gov.regions
                ? Object.values(gov.regions).reduce((s, r) => s + r.areas.length, 0)
                : (gov.areas?.length || 0);

              return (
                <div key={govKey}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => { setExpandedGov(isExpanded ? null : govKey); setSelGov(govKey); setSelRegion(''); }}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpandedGov(isExpanded ? null : govKey); setSelGov(govKey); setSelRegion(''); } }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 16px', background: isExpanded ? 'var(--color-surface-alt)' : 'transparent',
                      border: '1px solid var(--color-border-light)', borderRadius: 10,
                      cursor: 'pointer', transition: 'all var(--transition-fast)',
                      color: 'var(--color-text)', fontSize: 14, fontWeight: 600,
                    }}
                  >
                    <ChevronDown size={16} style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease', flexShrink: 0 }} />
                    <MapPin size={16} color="var(--color-primary)" />
                    <span style={{ flex: 1, textAlign: 'right' }}>{gov.name_ar}</span>
                    <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 400 }}>
                      {regionEntries.length} منطقة · {govAreaCount} مربع
                    </span>
                    <button
                      onClick={e => { e.stopPropagation(); handleDeleteGov(govKey); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', color: 'var(--color-text-muted)' }}
                      title="حذف المحافظة"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  {isExpanded && regionEntries.length > 0 && (
                    <div style={{ paddingRight: 32, paddingTop: 6, paddingBottom: 6, display: 'grid', gap: 4 }}>
                      {regionEntries.map(([regKey, reg]) => (
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => { setSelGov(govKey); setSelRegion(regKey); }}
                          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelGov(govKey); setSelRegion(regKey); } }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '9px 14px', background: selGov === govKey && selRegion === regKey ? 'var(--color-primary-50)' : 'transparent',
                            border: 'none', borderRadius: 8, cursor: 'pointer',
                            color: 'var(--color-text)', fontSize: 13, fontWeight: 500,
                            transition: 'background var(--transition-fast)',
                          }}
                        >
                          <span style={{ flex: 1, textAlign: 'right' }}>{reg.name_ar}</span>
                          <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{reg.areas.length} مربع</span>
                          <button
                            onClick={e => { e.stopPropagation(); handleDeleteRegion(govKey, regKey); }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', color: 'var(--color-text-muted)' }}
                            title="حذف المنطقة"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── Data Table ─── */}
      {selGov && (
        <div className="card" style={{ padding: 20, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>
              {data.governorates[selGov]?.name_ar}
              {selRegion && ` - ${data.governorates[selGov].regions?.[selRegion]?.name_ar || ''}`}
              <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--color-text-muted)', marginRight: 10 }}>
                ({filteredAreas.length} مربع)
              </span>
            </h3>
            {selGov && (
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => handleDeleteRegion(selGov, selRegion)} className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-danger)', fontSize: 12 }} disabled={!selRegion}>
                  <Trash2 size={13} /> حذف المنطقة
                </button>
                <button onClick={() => handleDeleteGov(selGov)} className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-danger)', fontSize: 12 }}>
                  <Trash2 size={13} /> حذف المحافظة
                </button>
              </div>
            )}
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ minWidth: 900 }}>
              <thead>
                <tr>
                  <th rowSpan={2} style={{ verticalAlign: 'middle', minWidth: 130 }}>المربع</th>
                  {(Object.keys(PROPERTY_TYPES) as PropertyTypeKey[]).map(key => (
                    <th key={key} colSpan={2} style={{ textAlign: 'center', minWidth: 130, borderLeft: '2px solid var(--color-border)' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ color: PROPERTY_TYPES[key].color }}>{TYPE_ICONS[key]}</span>
                        {PROPERTY_TYPES[key].label}
                      </span>
                    </th>
                  ))}
                  <th rowSpan={2} style={{ verticalAlign: 'middle', minWidth: 90 }}>إجراءات</th>
                </tr>
                <tr>
                  {(Object.keys(PROPERTY_TYPES) as PropertyTypeKey[]).map(key => (
                    <React.Fragment key={key}>
                      <th style={{ fontSize: 11, padding: '6px 8px', borderLeft: '2px solid var(--color-border)' }}>أعلى</th>
                      <th style={{ fontSize: 11, padding: '6px 8px' }}>أقل</th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredAreas.map((area, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{area.name}</td>
                    {(Object.keys(PROPERTY_TYPES) as PropertyTypeKey[]).map(typeKey => {
                      const price = area[typeKey] as { high: number | null; low: number | null };
                      const pt = PROPERTY_TYPES[typeKey];
                      const hasPrice = price.high != null || price.low != null;
                      return (
                        <React.Fragment key={typeKey}>
                          <td style={{
                            fontWeight: 600, fontSize: 13, textAlign: 'center',
                            borderLeft: '2px solid var(--color-border)',
                            color: price.high != null ? 'var(--color-success)' : 'var(--color-text-muted)',
                            background: hasPrice ? `${pt.color}05` : 'transparent',
                          }}>
                            {price.high != null ? formatNumber(price.high) : '—'}
                          </td>
                          <td style={{
                            fontWeight: 600, fontSize: 13, textAlign: 'center',
                            color: price.low != null ? 'var(--color-danger)' : 'var(--color-text-muted)',
                            background: hasPrice ? `${pt.color}05` : 'transparent',
                          }}>
                            {price.low != null ? formatNumber(price.low) : '—'}
                          </td>
                        </React.Fragment>
                      );
                    })}
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => openEdit(area, selGov, selRegion)} className="btn btn-sm" style={{ background: 'var(--color-info-bg)', color: 'var(--color-info)', padding: '4px 8px', display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11 }}>
                          <Edit3 size={12} /> تعديل
                        </button>
                        <button onClick={() => handleDeleteArea(selGov, selRegion, area.id)} className="btn btn-sm" style={{ background: 'var(--color-danger-bg)', color: 'var(--color-danger)', padding: '4px 8px', display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11 }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredAreas.length === 0 && (
                  <tr>
                    <td colSpan={2 + Object.keys(PROPERTY_TYPES).length * 2 + 1} style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-muted)' }}>
                      لا توجد مربعات في هذا التصنيف
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── Price Summary ─── */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ background: 'var(--color-primary-50)', padding: 8, borderRadius: 10, display: 'flex' }}>
            <BarChart3 size={18} color="var(--color-primary)" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--color-text)' }}>ملخص الأسعار</h3>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-muted)' }}>أعلى وأدنى أسعار لكل نوع عقاري</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
          {(Object.keys(PROPERTY_TYPES) as PropertyTypeKey[]).map(typeKey => {
            const pt = PROPERTY_TYPES[typeKey];
            const hi = data.price_summary.highest_prices[typeKey];
            const lo = data.price_summary.lowest_prices[typeKey];
            const hasData = hi.value > 0 || lo.value > 0;
            const range = hi.value - lo.value;
            const maxVal = Math.max(hi.value, 1);

            return (
              <div key={typeKey} className="card" style={{
                padding: 0, overflow: 'hidden',
                border: `1px solid ${pt.color}18`,
                opacity: hasData ? 1 : 0.5,
              }}>
                {/* Header stripe */}
                <div style={{
                  padding: '12px 16px',
                  background: `linear-gradient(135deg, ${pt.color}10, ${pt.color}05)`,
                  borderBottom: `1px solid ${pt.color}12`,
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: `${pt.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ color: pt.color }}>{TYPE_ICONS[typeKey]}</span>
                  </div>
                  <span style={{ fontWeight: 700, fontSize: 14, color: pt.color }}>{pt.label}</span>
                </div>

                {/* Prices */}
                <div style={{ padding: '14px 16px' }}>
                  {hasData ? (
                    <div style={{ display: 'grid', gap: 12 }}>
                      {/* Highest */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <TrendingUp size={13} color="var(--color-success)" />
                            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-success)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>أعلى</span>
                          </div>
                          <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-text)' }}>
                            {formatNumber(hi.value)}
                            <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--color-text-muted)', marginRight: 4 }}>ر.ع/م²</span>
                          </span>
                        </div>
                        <div style={{ height: 6, background: 'var(--color-surface-alt)', borderRadius: 3, overflow: 'hidden', marginBottom: 4 }}>
                          <div style={{ height: '100%', width: '100%', background: `linear-gradient(90deg, ${pt.color}40, ${pt.color})`, borderRadius: 3, transition: 'width 0.5s ease' }} />
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textAlign: 'left' }}>{hi.location || '—'}</div>
                      </div>

                      {/* Divider */}
                      <div style={{ height: 1, background: 'var(--color-border-light)' }} />

                      {/* Lowest */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <TrendingDown size={13} color="var(--color-danger)" />
                            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-danger)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>أدنى</span>
                          </div>
                          <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-text)' }}>
                            {formatNumber(lo.value)}
                            <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--color-text-muted)', marginRight: 4 }}>ر.ع/م²</span>
                          </span>
                        </div>
                        <div style={{ height: 6, background: 'var(--color-surface-alt)', borderRadius: 3, overflow: 'hidden', marginBottom: 4 }}>
                          <div style={{
                            height: '100%',
                            width: `${maxVal > 0 ? (lo.value / maxVal) * 100 : 0}%`,
                            background: `linear-gradient(90deg, var(--color-danger), var(--color-danger-light))`,
                            borderRadius: 3, transition: 'width 0.5s ease',
                          }} />
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textAlign: 'left' }}>{lo.location || '—'}</div>
                      </div>

                      {/* Range badge */}
                      {range > 0 && (
                        <div style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                          padding: '6px 12px', background: `${pt.color}08`, borderRadius: 8,
                          fontSize: 11, fontWeight: 600, color: pt.color,
                        }}>
                          <span>الفارق: {formatNumber(range)} ر.ع/م²</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--color-text-muted)', fontSize: 13 }}>
                      لا توجد بيانات
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
