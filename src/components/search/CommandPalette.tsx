'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, FileText, Users, User, Building2, ListTodo, Bell, X, Loader2, ArrowRight } from 'lucide-react';
import { useSearch } from '@/hooks/useSearch';
import { TYPE_CONFIG, SearchResultType } from '@/lib/search';
import { useTheme } from '@/hooks/useTheme';

const TYPE_ICONS: Record<SearchResultType, React.ReactNode> = {
  report: <FileText size={16} />,
  beneficiary: <Users size={16} />,
  employee: <User size={16} />,
  bank: <Building2 size={16} />,
  task: <ListTodo size={16} />,
  notification: <Bell size={16} />,
};

const RECENT_KEY = 'ireo_recent_searches';

function getRecentSearches(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]').slice(0, 5);
  } catch { return []; }
}

function addRecentSearch(term: string) {
  if (typeof window === 'undefined') return;
  try {
    let recent = getRecentSearches().filter(r => r !== term);
    recent.unshift(term);
    recent = recent.slice(0, 5);
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
  } catch {}
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const { isDark } = useTheme();
  const {
    query, setQuery, results, isSearching, activeType, setActiveType,
    visibleResults, hasResults,
  } = useSearch();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const dm = isDark;

  useEffect(() => {
    if (isOpen) {
      setRecentSearches(getRecentSearches());
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  useEffect(() => {
    if (listRef.current && selectedIndex > -1) {
      const items = listRef.current.querySelectorAll('[data-result-item]');
      items[selectedIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, visibleResults.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        return;
      }
      if (e.key === 'Enter' && visibleResults[selectedIndex]) {
        e.preventDefault();
        const item = visibleResults[selectedIndex];
        addRecentSearch(query);
        router.push(item.href);
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, visibleResults, selectedIndex, query, router, onClose]);

  const handleResultClick = (item: typeof visibleResults[0]) => {
    addRecentSearch(query);
    router.push(item.href);
    onClose();
  };

  const handleRecentClick = (term: string) => {
    setQuery(term);
    inputRef.current?.focus();
  };

  const typeTabs: { type: SearchResultType | null; label: string }[] = [
    { type: null, label: 'الكل' },
    { type: 'report', label: 'التقارير' },
    { type: 'beneficiary', label: 'المستفيدين' },
    { type: 'employee', label: 'الموظفين' },
    { type: 'bank', label: 'البنوك' },
    { type: 'task', label: 'المهام' },
  ];

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      paddingTop: '15vh', padding: 20, direction: 'rtl',
    }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.5)',
          backdropFilter: 'blur(4px)',
          position: 'absolute', inset: 0,
        }}
        onClick={onClose}
      />

      <div style={{
        position: 'relative', zIndex: 1,
        width: '100%', maxWidth: 640,
        background: dm ? 'var(--color-surface)' : 'white', borderRadius: 20,
        boxShadow: dm ? '0 25px 60px rgba(0,0,0,0.5)' : '0 25px 60px rgba(0,0,0,0.3)',
        border: dm ? '1px solid var(--color-border)' : 'none',
        overflow: 'hidden',
        animation: 'cmdSlideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        display: 'flex', flexDirection: 'column',
        maxHeight: '70vh',
      }}>
        {/* Search Input */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '16px 20px',
          borderBottom: `1px solid ${dm ? 'var(--color-border)' : '#e2e8f0'}`,
        }}>
          <Search size={20} color={dm ? '#94a3b8' : '#94a3b8'} style={{ flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث في التقارير، المستفيدين، الموظفين..."
            style={{
              flex: 1, border: 'none', outline: 'none',
              fontSize: 16, fontFamily: 'inherit',
              background: 'transparent', color: dm ? 'var(--color-text)' : '#1e293b',
              direction: 'rtl',
            }}
          />
          {isSearching && <Loader2 size={18} color={dm ? '#60a5fa' : '#3b82f6'} style={{ animation: 'spin 1s linear infinite' }} />}
          {query && (
            <button onClick={() => setQuery('')} style={{
              background: dm ? 'var(--color-surface-alt)' : '#f1f5f9', border: 'none', borderRadius: 8,
              width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: dm ? 'var(--color-text-secondary)' : '#64748b', padding: 0,
            }}>
              <X size={14} />
            </button>
          )}
          <div style={{
            background: dm ? 'var(--color-surface-alt)' : '#f1f5f9', borderRadius: 6,
            padding: '4px 10px', fontSize: 11, color: dm ? 'var(--color-text-muted)' : '#94a3b8',
            fontWeight: 600, whiteSpace: 'nowrap', fontFamily: 'monospace',
          }}>
            ESC
          </div>
        </div>

        {/* Type Tabs */}
          {query.trim().length > 0 && (
          <div style={{
            display: 'flex', gap: 4, padding: '8px 16px',
            borderBottom: `1px solid ${dm ? 'var(--color-border)' : '#f1f5f9'}`, overflowX: 'auto',
          }}>
            {typeTabs.map(tab => {
              let count = 0;
              if (tab.type === 'report') count = results.reports.length;
              else if (tab.type === 'beneficiary') count = results.beneficiaries.length;
              else if (tab.type === 'employee') count = results.employees.length;
              else if (tab.type === 'bank') count = results.banks.length;
              else if (tab.type === 'task') count = results.tasks.length;
              else count = results.total;
              if (tab.type && count === 0) return null;
              const isActive = activeType === tab.type;
              return (
                <button key={tab.label} onClick={() => setActiveType(tab.type)} style={{
                  padding: '6px 14px', borderRadius: 8, border: 'none',
                  background: isActive ? (dm ? '#3b82f6' : '#1e3a5f') : 'transparent',
                  color: isActive ? 'white' : (dm ? 'var(--color-text-secondary)' : '#64748b'),
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'inherit', whiteSpace: 'nowrap',
                  display: 'flex', alignItems: 'center', gap: 6,
                  transition: 'all 0.15s',
                }}>
                  {tab.label}
                  {count > 0 && (
                    <span style={{
                      background: isActive ? 'rgba(255,255,255,0.2)' : (dm ? 'var(--color-surface-alt)' : '#e2e8f0'),
                      padding: '1px 6px', borderRadius: 10, fontSize: 10,
                      color: isActive ? 'white' : (dm ? 'var(--color-text-secondary)' : '#64748b'),
                    }}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Results */}
        <div ref={listRef} style={{ flex: 1, overflow: 'auto', padding: '8px 12px' }}>
          {!query.trim() && recentSearches.length > 0 && (
            <div>
              <div style={{ padding: '8px 12px', fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)' }}>
                بحث سابق
              </div>
              {recentSearches.map(term => (
                <button key={term} onClick={() => handleRecentClick(term)} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  width: '100%', padding: '10px 12px', borderRadius: 10,
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  fontFamily: 'inherit', textAlign: 'right',
                  transition: 'background 0.1s',
                }}
                  onMouseEnter={(e) => e.currentTarget.style.background = dm ? 'var(--color-surface-alt)' : '#f8fafc'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ color: 'var(--color-text-muted)' }}><ArrowRight size={14} style={{ transform: 'rotate(180deg)' }} /></span>
                  <span style={{ fontSize: 13, color: dm ? 'var(--color-text-secondary)' : '#475569' }}>{term}</span>
                </button>
              ))}
            </div>
          )}

          {query.trim() && !isSearching && !hasResults && (
            <div style={{ textAlign: 'center', padding: '32px 20px', color: 'var(--color-text-muted)' }}>
              <Search size={32} style={{ marginBottom: 8, opacity: 0.3 }} />
              <p style={{ fontSize: 14, margin: 0 }}>لا توجد نتائج لـ &quot;{query}&quot;</p>
              <p style={{ fontSize: 12, margin: '4px 0 0', color: 'var(--color-text-muted)' }}>جرب كلمات بحث مختلفة</p>
            </div>
          )}

          {visibleResults.map((item, idx) => {
            const isSelected = idx === selectedIndex;
            const config = TYPE_CONFIG[item.type as SearchResultType];
            const IconComponent = TYPE_ICONS[item.type as SearchResultType];
            return (
              <button
                key={`${item.type}-${item.id}`}
                data-result-item
                onClick={() => handleResultClick(item)}
                onMouseEnter={() => setSelectedIndex(idx)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  width: '100%', padding: '12px 14px', borderRadius: 12,
                  background: isSelected ? (dm ? 'var(--color-surface-alt)' : '#f0f4ff') : 'transparent',
                  border: isSelected ? `1.5px solid ${dm ? 'var(--color-primary)40' : '#3b82f630'}` : '1.5px solid transparent',
                  cursor: 'pointer', fontFamily: 'inherit', textAlign: 'right',
                  transition: 'all 0.1s', marginBottom: 2,
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: `${config.color}12`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: config.color, flexShrink: 0,
                }}>
                  {IconComponent}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: dm ? 'var(--color-text)' : '#1e293b', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: 12, color: dm ? 'var(--color-text-secondary)' : '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.subtitle}
                  </div>
                </div>
                {item.meta && (
                  <span style={{
                    fontSize: 11, color: dm ? 'var(--color-text-muted)' : '#94a3b8', background: dm ? 'var(--color-surface-alt)' : '#f8fafc',
                    padding: '3px 10px', borderRadius: 6, whiteSpace: 'nowrap',
                  }}>
                    {item.meta}
                  </span>
                )}
                <span style={{
                  fontSize: 10, color: dm ? 'var(--color-text-muted)' : '#94a3b8', background: dm ? 'var(--color-surface-alt)' : '#f1f5f9',
                  padding: '2px 8px', borderRadius: 4,
                }}>
                  {config.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        {query.trim() && hasResults && (
          <div style={{
            padding: '10px 20px', borderTop: `1px solid ${dm ? 'var(--color-border)' : '#f1f5f9'}`,
            display: 'flex', alignItems: 'center', gap: 16,
            fontSize: 11, color: 'var(--color-text-muted)',
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <kbd style={{ background: dm ? 'var(--color-surface-alt)' : '#f1f5f9', padding: '1px 5px', borderRadius: 3, fontSize: 10 }}>↑↓</kbd>
              تنقل
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <kbd style={{ background: dm ? 'var(--color-surface-alt)' : '#f1f5f9', padding: '1px 5px', borderRadius: 3, fontSize: 10 }}>↵</kbd>
              فتح
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <kbd style={{ background: dm ? 'var(--color-surface-alt)' : '#f1f5f9', padding: '1px 5px', borderRadius: 3, fontSize: 10 }}>esc</kbd>
              إغلاق
            </span>
            <span style={{ marginRight: 'auto' }}>
              {results.total} نتيجة
            </span>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes cmdSlideIn {
          from { opacity: 0; transform: translateY(-10px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      ` }} />
    </div>
  );
}
