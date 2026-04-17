'use client';

import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  hasNext: boolean;
  hasPrev: boolean;
  isDark?: boolean;
}

export default function Pagination({ currentPage, totalPages, onPageChange, hasNext, hasPrev, isDark }: PaginationProps) {
  if (totalPages <= 1) return null;

  const dm = isDark;

  const btnStyle = (active?: boolean): React.CSSProperties => ({
    padding: '6px 12px',
    border: `1px solid ${active ? 'var(--color-primary)' : dm ? '#374151' : '#d1d5db'}`,
    borderRadius: 6,
    background: active ? 'var(--color-primary)' : dm ? '#1f2937' : '#fff',
    color: active ? 'white' : 'var(--color-text)',
    fontSize: 13,
    fontWeight: active ? 700 : 400,
    cursor: 'pointer',
    minWidth: 36,
    textAlign: 'center' as const,
    transition: 'all 0.15s',
  });

  // Generate page numbers to show
  const pages: number[] = [];
  const maxVisible = 5;
  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages, start + maxVisible - 1);
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: 4, padding: '16px 0', direction: 'ltr',
    }}>
      <button onClick={() => onPageChange(currentPage - 1)} disabled={!hasPrev}
        style={{ ...btnStyle(), opacity: hasPrev ? 1 : 0.4, cursor: hasPrev ? 'pointer' : 'not-allowed' }}>
        &rarr;
      </button>
      {pages.map(p => (
        <button key={p} onClick={() => onPageChange(p)} style={btnStyle(p === currentPage)}>
          {p}
        </button>
      ))}
      <button onClick={() => onPageChange(currentPage + 1)} disabled={!hasNext}
        style={{ ...btnStyle(), opacity: hasNext ? 1 : 0.4, cursor: hasNext ? 'pointer' : 'not-allowed' }}>
        &larr;
      </button>
      <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginRight: 8 }}>
        صفحة {currentPage} من {totalPages}
      </span>
    </div>
  );
}
