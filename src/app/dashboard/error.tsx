'use client';

import React from 'react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      background: 'var(--color-bg)',
      color: 'var(--color-text)',
      padding: 40,
      textAlign: 'center',
      fontFamily: 'inherit',
    }}>
      <div style={{
        width: 64,
        height: 64,
        borderRadius: 16,
        background: 'var(--color-danger-bg, #fee2e2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
      }}>
        <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="var(--color-danger)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 8px' }}>خطأ في لوحة التحكم</h2>
      <p style={{ fontSize: 14, color: 'var(--color-text-muted)', margin: '0 0 20px', maxWidth: 400 }}>
        حدث خطأ أثناء تحميل لوحة التحكم. يرجى المحاولة مرة أخرى.
      </p>
      <button
        onClick={reset}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 24px',
          borderRadius: 10,
          background: 'var(--color-primary)',
          color: 'white',
          border: 'none',
          fontSize: 14,
          fontWeight: 700,
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
        </svg>
        إعادة المحاولة
      </button>
    </div>
  );
}
