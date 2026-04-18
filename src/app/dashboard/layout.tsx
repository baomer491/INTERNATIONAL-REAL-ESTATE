'use client';

import React from 'react';
import { useApp } from '@/components/layout/AppContext';
import AppShell from '@/components/layout/AppShell';

function AppRouter({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useApp();

  if (!isLoggedIn) {
    const LoginPage = React.lazy(() => import('../login/LoginPage'));
    return (
      <React.Suspense fallback={<LoadingScreen />}>
        <LoginPage />
      </React.Suspense>
    );
  }

  return <AppShell>{children}</AppShell>;
}

function LoadingScreen() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', direction: 'rtl',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 48, height: 48, border: '4px solid #e2e8f0',
          borderTopColor: '#1e3a5f', borderRadius: '50%',
          animation: 'spin 1s linear infinite', margin: '0 auto 16px',
        }} />
        <p style={{ color: '#64748b' }}>جاري التحميل...</p>
      </div>
      <style dangerouslySetInnerHTML={{
        __html: `@keyframes spin { to { transform: rotate(360deg); } }`
      }} />
    </div>
  );
}

export default function PageLayout({ children }: { children: React.ReactNode }) {
  return <AppRouter>{children}</AppRouter>;
}
