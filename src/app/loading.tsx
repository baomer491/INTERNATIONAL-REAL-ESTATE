import React from 'react';

export default function RootLoading() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'var(--color-bg)',
      gap: 20,
    }}>
      <div style={{
        width: 48,
        height: 48,
        border: '4px solid var(--color-border)',
        borderTopColor: 'var(--color-primary)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <p style={{
        fontSize: 16,
        fontWeight: 600,
        color: 'var(--color-text-secondary)',
        margin: 0,
      }}>
        جاري التحميل...
      </p>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}} />
    </div>
  );
}
