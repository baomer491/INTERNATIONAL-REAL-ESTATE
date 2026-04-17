'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { saveToCache } from '@/lib/market-comps';
import type { MarketCompsResult, MarketComp } from '@/types';
import { Search, ExternalLink, TrendingUp, AlertCircle, CheckCircle2, Loader2, Database, RefreshCw, BarChart3, X } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

interface MarketCompsPanelProps {
  wilayat: string;
  propertyType: string;
  area: number;
  usage: string;
  onApplyValue?: (totalValue: number, pricePerSqm: number) => void;
}

export default function MarketCompsPanel({ wilayat, propertyType, area, usage, onApplyValue }: MarketCompsPanelProps) {
  const { isDark } = useTheme();
  const dm = isDark;
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MarketCompsResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoTriggered, setAutoTriggered] = useState(false);
  const [searchParams, setSearchParams] = useState({ wilayat: '', propertyType: '', area: 0, usage: '' });
  const autoSearchKey = useRef<string>('');

  const doSearch = useCallback(async (params: { wilayat: string; propertyType: string; area: number; usage: string }, isAuto: boolean) => {
    if (!params.wilayat.trim() || !params.propertyType) return;

    setLoading(true);
    setError(null);
    setResult(null);
    if (isAuto) setAutoTriggered(true);

    try {
      const response = await fetch('/api/market-comps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...params, area: Number(params.area) || 0 }),
      });

      const data: MarketCompsResult = await response.json();

      if (!data.success) {
        setError(data.error || 'فشل في البحث');
        return;
      }

      setResult(data);

      if (data.comparables.length > 0) {
        saveToCache(params.wilayat, params.propertyType, params.usage, data.comparables, data.analysis.avgPricePerSqm);
      }
    } catch (err: any) {
      setError(err.message || 'خطأ في الاتصال');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = useCallback(() => {
    const params = { wilayat, propertyType, area, usage };
    setSearchParams(params);
    autoSearchKey.current = `${wilayat}_${propertyType}_${area}_${usage}`;
    doSearch(params, false);
  }, [wilayat, propertyType, area, usage, doSearch]);

  useEffect(() => {
    const params = { wilayat, propertyType: propertyType || '', area: area || 0, usage: usage || '' };
    const key = `${params.wilayat}_${params.propertyType}_${params.area}_${params.usage}`;
    if (!params.wilayat || !params.propertyType || loading || result || key === autoSearchKey.current) return;
    const timer = setTimeout(() => {
      autoSearchKey.current = key;
      doSearch(params, true);
    }, 800);
    return () => clearTimeout(timer);
  }, [wilayat, propertyType, area, usage, loading, result, doSearch]);

  const confidenceColor = (c: number) => {
    if (c >= 0.7) return dm ? '#34d399' : '#15803d';
    if (c >= 0.4) return dm ? '#fbbf24' : '#b45309';
    return dm ? '#f87171' : '#dc2626';
  };

  const confidenceLabel = (c: number) => {
    if (c >= 0.7) return 'عالية';
    if (c >= 0.4) return 'متوسطة';
    return 'منخفضة';
  };

  return (
    <div style={{
      border: '1.5px solid var(--color-border)',
      borderRadius: 12,
      overflow: 'hidden',
      background: dm ? 'var(--color-surface)' : '#fff',
    }}>
      <div style={{
        padding: '14px 18px',
        background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a8e 100%)',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <BarChart3 size={20} />
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>المقارنات السوقية</div>
            <div style={{ fontSize: 11, opacity: 0.8 }}>البحث عن أسعار مشابهة من omanreal.com</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {wilayat && propertyType && (
            <button
              onClick={handleSearch}
              disabled={loading}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 8,
                background: loading ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.95)',
                color: '#1e3a5f', border: 'none', cursor: loading ? 'wait' : 'pointer',
                fontSize: 13, fontWeight: 600,
                transition: 'all 0.2s',
              }}
            >
              {loading ? <Loader2 size={15} className="spin" /> : <Search size={15} />}
              {loading ? 'جاري البحث...' : 'بحث'}
            </button>
          )}
        </div>
      </div>

      <div style={{
        padding: '10px 18px',
        background: dm ? 'var(--color-surface-alt)' : '#f8fafc',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        gap: 16,
        fontSize: 12,
        color: dm ? 'var(--color-text-secondary)' : '#64748b',
        flexWrap: 'wrap',
      }}>
        <span><strong>الولاية:</strong> {wilayat || '---'}</span>
        <span><strong>النوع:</strong> {propertyType || '---'}</span>
        <span><strong>المساحة:</strong> {area || '---'} م²</span>
        <span><strong>الاستخدام:</strong> {usage || '---'}</span>
      </div>

      <div style={{ padding: 16 }}>
        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: 12, borderRadius: 8,
            background: dm ? 'var(--color-danger-bg)' : '#fef2f2', color: dm ? '#fca5a5' : '#b91c1c',
            marginBottom: 16,
          }}>
            <AlertCircle size={18} />
            <span style={{ fontSize: 13 }}>{error}</span>
          </div>
        )}

        {loading && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '40px 0', gap: 12, color: dm ? 'var(--color-text-secondary)' : '#64748b',
          }}>
            <Loader2 size={32} className="spin" />
            <div style={{ fontSize: 14 }}>جاري البحث في السوق...</div>
            <div style={{ fontSize: 12 }}>يتم تحليل البيانات باستخدام الذكاء الاصطناعي</div>
          </div>
        )}

        {result && !loading && (
          <>
            {result.comparables.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '30px 0',
                color: dm ? 'var(--color-text-secondary)' : '#64748b',
              }}>
                <Database size={32} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
                <div style={{ fontSize: 14 }}>لا توجد نتائج مطابقة</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>جرب تغيير الولاية أو نوع العقار</div>
              </div>
            ) : (
              <>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: 10,
                  marginBottom: 16,
                }}>
                  <div style={{
                    padding: '12px 14px', borderRadius: 8,
                    background: dm ? 'var(--color-success-bg)' : '#f0fdf4', border: dm ? '1px solid #166534' : '1px solid #bbf7d0',
                  }}>
                    <div style={{ fontSize: 11, color: dm ? '#34d399' : '#15803d', fontWeight: 600 }}>المعدل / م²</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: dm ? '#34d399' : '#15803d', marginTop: 2 }}>
                      {result.analysis.avgPricePerSqm.toLocaleString()} <span style={{ fontSize: 11 }}>ر.ع</span>
                    </div>
                  </div>
                  <div style={{
                    padding: '12px 14px', borderRadius: 8,
                    background: dm ? '#1e3a5f' : '#eff6ff', border: dm ? '1px solid #1e3a5f' : '1px solid #bfdbfe',
                  }}>
                    <div style={{ fontSize: 11, color: dm ? '#60a5fa' : '#1d4ed8', fontWeight: 600 }}>القيمة المقدرة</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: dm ? '#60a5fa' : '#1d4ed8', marginTop: 2 }}>
                      {result.analysis.estimatedValue.toLocaleString()} <span style={{ fontSize: 11 }}>ر.ع</span>
                    </div>
                  </div>
                  <div style={{
                    padding: '12px 14px', borderRadius: 8,
                    background: dm ? '#451a03' : '#fefce8', border: dm ? '1px solid #78350f' : '1px solid #fde68a',
                  }}>
                    <div style={{ fontSize: 11, color: dm ? '#fbbf24' : '#b45309', fontWeight: 600 }}>مستوى الثقة</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: confidenceColor(result.analysis.confidence), marginTop: 2 }}>
                      {Math.round(result.analysis.confidence * 100)}%
                    </div>
                    <div style={{ fontSize: 10, color: confidenceColor(result.analysis.confidence) }}>
                      {confidenceLabel(result.analysis.confidence)}
                    </div>
                  </div>
                  <div style={{
                    padding: '12px 14px', borderRadius: 8,
                    background: dm ? 'var(--color-surface-alt)' : '#f8fafc', border: dm ? '1px solid var(--color-border)' : '1px solid #e2e8f0',
                  }}>
                    <div style={{ fontSize: 11, color: dm ? 'var(--color-text-secondary)' : '#64748b', fontWeight: 600 }}>النطاق / م²</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: dm ? 'var(--color-text-secondary)' : '#475569', marginTop: 4 }}>
                      {result.analysis.minPricePerSqm.toLocaleString()} - {result.analysis.maxPricePerSqm.toLocaleString()} ر.ع
                    </div>
                  </div>
                </div>

                {result.analysis.recommendation && (
                  <div style={{
                    padding: '10px 14px', borderRadius: 8,
                    background: dm ? 'var(--color-surface-alt)' : '#f8fafc', marginBottom: 16,
                    fontSize: 13, color: dm ? 'var(--color-text-secondary)' : '#475569',
                    display: 'flex', gap: 8, alignItems: 'flex-start',
                  }}>
                    <TrendingUp size={16} style={{ marginTop: 2, flexShrink: 0, color: dm ? 'var(--color-primary)' : '#1e3a5f' }} />
                    <span>{result.analysis.recommendation}</span>
                  </div>
                )}

                <div style={{
                  borderRadius: 8, overflow: 'hidden',
                  border: '1px solid var(--color-border)',
                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: dm ? 'var(--color-surface-alt)' : '#f8fafc' }}>
                        <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: dm ? 'var(--color-text-secondary)' : '#475569', borderBottom: '1px solid var(--color-border)' }}>#</th>
                        <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: dm ? 'var(--color-text-secondary)' : '#475569', borderBottom: '1px solid var(--color-border)' }}>العقار</th>
                        <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: dm ? 'var(--color-text-secondary)' : '#475569', borderBottom: '1px solid var(--color-border)' }}>المساحة</th>
                        <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: dm ? 'var(--color-text-secondary)' : '#475569', borderBottom: '1px solid var(--color-border)' }}>السعر</th>
                        <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: dm ? 'var(--color-text-secondary)' : '#475569', borderBottom: '1px solid var(--color-border)' }}>ر.ع/م²</th>
                        <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: dm ? 'var(--color-text-secondary)' : '#475569', borderBottom: '1px solid var(--color-border)' }}>رابط</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.comparables.map((comp: MarketComp, idx: number) => (
                        <tr key={comp.id} style={{
                          borderBottom: idx < result.comparables.length - 1 ? '1px solid var(--color-border)' : 'none',
                          background: idx % 2 === 0 ? (dm ? 'var(--color-surface)' : '#fff') : (dm ? 'var(--color-surface-alt)' : '#fafbfc'),
                        }}>
                          <td style={{ padding: '10px 12px', color: dm ? 'var(--color-text-muted)' : '#94a3b8' }}>{idx + 1}</td>
                          <td style={{ padding: '10px 12px', fontWeight: 500, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {comp.title}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>{comp.area.toLocaleString()} م²</td>
                          <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600 }}>{comp.price.toLocaleString()}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'center', color: dm ? 'var(--color-primary)' : '#1e3a5f', fontWeight: 600 }}>{comp.pricePerSqm.toLocaleString()}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                            <a
                              href={comp.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                color: dm ? '#60a5fa' : '#1d4ed8', fontSize: 12, textDecoration: 'none',
                              }}
                            >
                              <ExternalLink size={14} />
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{
                  marginTop: 12, padding: '8px 12px',
                  borderRadius: 6, background: dm ? '#451a03' : '#fffbeb',
                  border: dm ? '1px solid #78350f' : '1px solid #fde68a',
                  fontSize: 11, color: dm ? '#fbbf24' : '#92400e',
                  display: 'flex', gap: 6, alignItems: 'flex-start',
                }}>
                  <AlertCircle size={14} style={{ marginTop: 1, flexShrink: 0 }} />
                  <span>هذه أسعار طلب من السوق وليست معاملات فعلية. يُنصح باستخدامها كمرجع إضافي فقط.</span>
                </div>

                {onApplyValue && result.analysis.estimatedValue > 0 && (
                  <div style={{ marginTop: 14, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => onApplyValue(result.analysis.estimatedValue, result.analysis.avgPricePerSqm)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '8px 18px', borderRadius: 8,
                        background: dm ? '#166534' : '#15803d', color: '#fff',
                        border: 'none', cursor: 'pointer',
                        fontSize: 13, fontWeight: 600,
                        transition: 'all 0.2s',
                      }}
                    >
                      <CheckCircle2 size={16} />
                      استخدام القيمة المقترحة
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {!result && !loading && !error && (
          <div style={{
            textAlign: 'center', padding: '30px 0',
            color: dm ? 'var(--color-text-muted)' : '#94a3b8',
          }}>
            <Search size={28} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
            <div style={{ fontSize: 13 }}>
              {autoTriggered
                ? 'جاري البحث التلقائي...'
                : 'اضغط "بحث" للعثور على أسعار مشابهة'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
