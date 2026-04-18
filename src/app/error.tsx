'use client';

import React from 'react';

export default function RootError({
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
      minHeight: '100vh',
      background: 'var(--color-bg)',
      color: 'var(--color-text)',
      padding: 40,
      textAlign: 'center',
      fontFamily: 'inherit',
    }}>
      <div style={{
        width: 80,
        height: 80,
        borderRadius: 20,
        background: 'var(--color-danger-bg, #fee2e2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
      }}>
        <svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke="var(--color-danger)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 8px' }}>
        حدث خطأ غير متوقع
      </h1>
      <p style={{ fontSize: 15, color: 'var(--color-text-muted)', margin: '0 0 24px', maxWidth: 400 }}>
        نعتذر عن هذا الخطأ. يرجى المحاولة مرة أخرى أو التواصل مع الدعم الفني إذا استمرت المشكلة.
      </p>
      {error.message && (
        <div style={{
          background: 'var(--color-surface-alt)',
          border: '1px solid var(--color-border)',
          borderRadius: 10,
          padding: '12px 18px',
          marginBottom: 24,
          maxWidth: 500,
          width: '100%',
          fontSize: 13,
          color: 'var(--color-danger)',
          fontFamily: 'monospace',
          direction: 'ltr',
          textAlign: 'left',
          overflow: 'auto',
        }}>
          {error.message}
        </div>
      )}
      <button
        onClick={reset}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '12px 28px',
          borderRadius: 10,
          background: 'var(--color-primary)',
          color: 'white',
          border: 'none',
          fontSize: 15,
          fontWeight: 700,
          cursor: 'pointer',
          fontFamily: 'inherit',
          transition: 'all 0.2s',
        }}
      >
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
        </svg>
        إعادة المحاولة
      </button>
    </div>
  );
}
