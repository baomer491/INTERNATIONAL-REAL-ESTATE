'use client';

import React from 'react';
import { useApp } from '@/components/layout/AppContext';
import AppShell from '@/components/layout/AppShell';

function AppRouter({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, isLoading } = useApp();

  if (isLoading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', direction: 'rtl',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 48, height: 48, border: '4px solid var(--color-border)',
            borderTopColor: 'var(--color-primary)', borderRadius: '50%',
            animation: 'spin 1s linear infinite', margin: '0 auto 16px',
          }} />
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>جاري التحميل...</p>
        </div>
        <style dangerouslySetInnerHTML={{
          __html: `@keyframes spin { to { transform: rotate(360deg); } }`
        }} />
      </div>
    );
  }

  if (!isLoggedIn) return null;
  return <AppShell>{children}</AppShell>;
}

export default function PageLayout({ children }: { children: React.ReactNode }) {
  return <AppRouter>{children}</AppRouter>;
}
