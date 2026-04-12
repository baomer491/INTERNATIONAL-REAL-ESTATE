'use client';

import React from 'react';
import { AppProvider, useApp } from '@/components/layout/AppContext';
import AppShell from '@/components/layout/AppShell';

function AppRouter({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useApp();
  if (!isLoggedIn) {
    const LoginPage = React.lazy(() => import('../login/LoginPage'));
    return (
      <React.Suspense fallback={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
          <div style={{ width: 48, height: 48, border: '4px solid var(--color-border)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { to { transform: rotate(360deg); } }` }} />
        </div>
      }>
        <LoginPage />
      </React.Suspense>
    );
  }
  return <AppShell>{children}</AppShell>;
}

export default function PageLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <AppRouter>{children}</AppRouter>
    </AppProvider>
  );
}
