import React from 'react';

export default function EmployeesLoading() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      gap: 16,
    }}>
      <div style={{
        width: 44,
        height: 44,
        border: '4px solid var(--color-border)',
        borderTopColor: 'var(--color-primary)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-secondary)', margin: 0 }}>
        جاري تحميل الموظفين...
      </p>
      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { to { transform: rotate(360deg); } }` }} />
    </div>
  );
}
