'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, FileText, Users, User, Building2, ListTodo, Bell, X, Loader2, ArrowRight } from 'lucide-react';
import { useSearch } from '@/hooks/useSearch';
import { TYPE_CONFIG, SearchResultType } from '@/lib/search';

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
  const {
    query, setQuery, results, isSearching, activeType, setActiveType,
    visibleResults, hasResults,
  } = useSearch();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setRecentSearches(getRecentSearches());
      setTimeout(() => inputRef.current?.focus(), 60);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 250);
      return () => clearTimeout(timer);
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

  if (!isVisible) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: '12vh', padding: 20, direction: 'rtl',
        opacity: isOpen ? 1 : 0,
        transition: 'opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        pointerEvents: isOpen ? 'auto' : 'none',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          position: 'absolute', inset: 0,
          opacity: isOpen ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
        onClick={onClose}
      />

      {/* Main panel */}
      <div style={{
        position: 'relative', zIndex: 1,
        width: '100%', maxWidth: 680,
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-xl), 0 0 0 1px rgba(255,255,255,0.06)',
        border: '1px solid var(--color-border-light)',
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        maxHeight: '72vh',
        opacity: isOpen ? 1 : 0,
        transform: isOpen ? 'translateY(0) scale(1)' : 'translateY(-12px) scale(0.98)',
        transition: 'opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        {/* Search Input */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '18px 22px',
          borderBottom: '1px solid var(--color-border-light)',
        }}>
          <Search size={20} color="var(--color-text-muted)" style={{ flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث في التقارير، المستفيدين، الموظفين..."
            style={{
              flex: 1, border: 'none', outline: 'none',
              fontSize: 16, fontFamily: 'inherit',
              background: 'transparent', color: 'var(--color-text)',
              direction: 'rtl',
            }}
          />
          {isSearching && <Loader2 size={18} color="var(--color-primary)" style={{ animation: 'spin 1s linear infinite' }} />}
          {query && (
            <button
              onClick={() => setQuery('')}
              style={{
                background: 'var(--color-surface-alt)', border: 'none', borderRadius: 'var(--radius-sm)',
                width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'var(--color-text-secondary)', padding: 0,
                transition: 'all var(--transition-fast)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'var(--color-border)';
                e.currentTarget.style.color = 'var(--color-text)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'var(--color-surface-alt)';
                e.currentTarget.style.color = 'var(--color-text-secondary)';
              }}
            >
              <X size={14} />
            </button>
          )}
          <div style={{
            background: 'var(--color-surface-alt)', borderRadius: 'var(--radius-xs)',
            padding: '4px 10px', fontSize: 11, color: 'var(--color-text-muted)',
            fontWeight: 600, whiteSpace: 'nowrap', fontFamily: 'monospace',
            border: '1px solid var(--color-border)',
          }}>
            ESC
          </div>
        </div>

        {/* Type Tabs */}
        {query.trim().length > 0 && (
          <div style={{
            display: 'flex', gap: 6, padding: '10px 18px',
            borderBottom: '1px solid var(--color-border-light)',
            overflowX: 'auto',
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
                <button
                  key={tab.label}
                  onClick={() => setActiveType(tab.type)}
                  style={{
                    padding: '7px 16px', borderRadius: 'var(--radius-sm)', border: 'none',
                    background: isActive
                      ? 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%)'
                      : 'var(--color-surface-alt)',
                    color: isActive ? 'white' : 'var(--color-text-secondary)',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    fontFamily: 'inherit', whiteSpace: 'nowrap',
                    display: 'flex', alignItems: 'center', gap: 6,
                    transition: 'all var(--transition-base)',
                    boxShadow: isActive ? '0 4px 10px rgba(15,29,51,0.2)' : 'none',
                  }}
                  onMouseEnter={e => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'var(--color-surface-hover)';
                      e.currentTarget.style.color = 'var(--color-text)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'var(--color-surface-alt)';
                      e.currentTarget.style.color = 'var(--color-text-secondary)';
                    }
                  }}
                >
                  {tab.label}
                  {count > 0 && (
                    <span style={{
                      background: isActive ? 'rgba(255,255,255,0.2)' : 'var(--color-surface-hover)',
                      padding: '2px 7px', borderRadius: 'var(--radius-full)', fontSize: 10,
                      color: isActive ? 'white' : 'var(--color-text-muted)',
                      fontWeight: 700,
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
        <div ref={listRef} style={{ flex: 1, overflow: 'auto', padding: '10px 14px' }}>
          {!query.trim() && recentSearches.length > 0 && (
            <div>
              <div style={{
                padding: '8px 12px', fontSize: 11, fontWeight: 700,
                color: 'var(--color-text-muted)', letterSpacing: '0.04em',
              }}>
                بحث سابق
              </div>
              {recentSearches.map(term => (
                <button
                  key={term}
                  onClick={() => handleRecentClick(term)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    width: '100%', padding: '11px 14px', borderRadius: 'var(--radius-md)',
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    fontFamily: 'inherit', textAlign: 'right',
                    transition: 'all var(--transition-fast)',
                    color: 'var(--color-text-secondary)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'var(--color-surface-alt)';
                    e.currentTarget.style.color = 'var(--color-text)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--color-text-secondary)';
                  }}
                >
                  <span style={{ color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center' }}>
                    <ArrowRight size={14} style={{ transform: 'rotate(180deg)' }} />
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{term}</span>
                </button>
              ))}
            </div>
          )}

          {query.trim() && !isSearching && !hasResults && (
            <div style={{
              textAlign: 'center', padding: '40px 20px',
              color: 'var(--color-text-muted)',
            }}>
              <div style={{
                width: 64, height: 64, borderRadius: 'var(--radius-lg)',
                background: 'var(--color-surface-alt)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 14px',
              }}>
                <Search size={28} style={{ opacity: 0.35 }} />
              </div>
              <p style={{ fontSize: 15, margin: 0, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                لا توجد نتائج لـ &quot;{query}&quot;
              </p>
              <p style={{ fontSize: 13, margin: '6px 0 0', color: 'var(--color-text-muted)' }}>
                جرب كلمات بحث مختلفة
              </p>
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
                  display: 'flex', alignItems: 'center', gap: 14,
                  width: '100%', padding: '12px 16px', borderRadius: 'var(--radius-md)',
                  background: isSelected ? 'var(--color-primary-50)' : 'transparent',
                  border: isSelected ? '1.5px solid var(--color-primary-200)' : '1.5px solid transparent',
                  cursor: 'pointer', fontFamily: 'inherit', textAlign: 'right',
                  transition: 'all var(--transition-fast)', marginBottom: 4,
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 'var(--radius-sm)',
                  background: `${config.color}14`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: config.color, flexShrink: 0,
                  transition: 'transform var(--transition-fast)',
                }}>
                  {IconComponent}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 14, fontWeight: 700,
                    color: 'var(--color-text)', marginBottom: 3,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {item.title}
                  </div>
                  <div style={{
                    fontSize: 12, color: 'var(--color-text-secondary)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {item.subtitle}
                  </div>
                </div>
                {item.meta && (
                  <span style={{
                    fontSize: 11, color: 'var(--color-text-muted)',
                    background: 'var(--color-surface-alt)',
                    padding: '4px 10px', borderRadius: 'var(--radius-xs)', whiteSpace: 'nowrap',
                    fontWeight: 600,
                  }}>
                    {item.meta}
                  </span>
                )}
                <span style={{
                  fontSize: 10, color: 'var(--color-text-muted)',
                  background: 'var(--color-surface-alt)',
                  padding: '3px 8px', borderRadius: 'var(--radius-xs)',
                  fontWeight: 700, letterSpacing: '0.02em',
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
            padding: '12px 22px', borderTop: '1px solid var(--color-border-light)',
            display: 'flex', alignItems: 'center', gap: 16,
            fontSize: 11, color: 'var(--color-text-muted)',
            background: 'var(--color-surface-alt)',
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <kbd style={{
                background: 'var(--color-surface)', padding: '2px 6px',
                borderRadius: 'var(--radius-xs)', fontSize: 10,
                border: '1px solid var(--color-border)',
                fontFamily: 'monospace',
              }}>↑↓</kbd>
              تنقل
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <kbd style={{
                background: 'var(--color-surface)', padding: '2px 6px',
                borderRadius: 'var(--radius-xs)', fontSize: 10,
                border: '1px solid var(--color-border)',
                fontFamily: 'monospace',
              }}>↵</kbd>
              فتح
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <kbd style={{
                background: 'var(--color-surface)', padding: '2px 6px',
                borderRadius: 'var(--radius-xs)', fontSize: 10,
                border: '1px solid var(--color-border)',
                fontFamily: 'monospace',
              }}>esc</kbd>
              إغلاق
            </span>
            <span style={{ marginRight: 'auto', fontWeight: 700 }}>
              {results.total} نتيجة
            </span>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      ` }} />
    </div>
  );
}
