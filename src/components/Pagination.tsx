'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function Pagination({ currentPage, totalPages, onPageChange, hasNext, hasPrev }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages: (number | string)[] = [];
  const maxVisible = 5;
  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages, start + maxVisible - 1);
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }

  if (start > 1) {
    pages.push(1);
    if (start > 2) pages.push('...');
  }
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < totalPages) {
    if (end < totalPages - 1) pages.push('...');
    pages.push(totalPages);
  }

  return (
    <nav
      aria-label="Pagination"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        direction: 'ltr',
      }}
    >
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!hasPrev}
        aria-label="Previous page"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 38,
          height: 38,
          borderRadius: 'var(--radius-sm)',
          border: '1.5px solid var(--color-border)',
          background: 'var(--color-surface)',
          color: hasPrev ? 'var(--color-text)' : 'var(--color-text-muted)',
          cursor: hasPrev ? 'pointer' : 'not-allowed',
          transition: 'all var(--transition-base)',
          opacity: hasPrev ? 1 : 0.5,
        }}
        onMouseEnter={(e) => {
          if (hasPrev) {
            e.currentTarget.style.borderColor = 'var(--color-primary)';
            e.currentTarget.style.color = 'var(--color-primary)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-border)';
          e.currentTarget.style.color = hasPrev ? 'var(--color-text)' : 'var(--color-text-muted)';
        }}
      >
        <ChevronRight size={18} />
      </button>

      {pages.map((p, idx) => {
        if (p === '...') {
          return (
            <span
              key={`ellipsis-${idx}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 38,
                height: 38,
                fontSize: 13,
                color: 'var(--color-text-muted)',
                fontWeight: 600,
                userSelect: 'none',
              }}
            >
              ...
            </span>
          );
        }

        const active = p === currentPage;
        return (
          <button
            key={p}
            onClick={() => onPageChange(p as number)}
            aria-current={active ? 'page' : undefined}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 38,
              height: 38,
              padding: '0 10px',
              borderRadius: 'var(--radius-sm)',
              border: active ? 'none' : '1.5px solid var(--color-border)',
              background: active
                ? 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%)'
                : 'var(--color-surface)',
              color: active ? 'white' : 'var(--color-text-secondary)',
              fontSize: 13,
              fontWeight: active ? 700 : 500,
              cursor: 'pointer',
              boxShadow: active ? '0 4px 10px rgba(15, 29, 51, 0.25)' : 'none',
              transition: 'all var(--transition-base)',
            }}
            onMouseEnter={(e) => {
              if (!active) {
                e.currentTarget.style.borderColor = 'var(--color-primary)';
                e.currentTarget.style.color = 'var(--color-primary)';
              }
            }}
            onMouseLeave={(e) => {
              if (!active) {
                e.currentTarget.style.borderColor = 'var(--color-border)';
                e.currentTarget.style.color = 'var(--color-text-secondary)';
              }
            }}
          >
            {p}
          </button>
        );
      })}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!hasNext}
        aria-label="Next page"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 38,
          height: 38,
          borderRadius: 'var(--radius-sm)',
          border: '1.5px solid var(--color-border)',
          background: 'var(--color-surface)',
          color: hasNext ? 'var(--color-text)' : 'var(--color-text-muted)',
          cursor: hasNext ? 'pointer' : 'not-allowed',
          transition: 'all var(--transition-base)',
          opacity: hasNext ? 1 : 0.5,
        }}
        onMouseEnter={(e) => {
          if (hasNext) {
            e.currentTarget.style.borderColor = 'var(--color-primary)';
            e.currentTarget.style.color = 'var(--color-primary)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-border)';
          e.currentTarget.style.color = hasNext ? 'var(--color-text)' : 'var(--color-text-muted)';
        }}
      >
        <ChevronLeft size={18} />
      </button>
    </nav>
  );
}
