'use client';

import React from 'react';
import { AppProvider, useApp } from '@/components/layout/AppContext';
import AppShell from '@/components/layout/AppShell';
import LoginPage from './page';

function AppRouter({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useApp();

  if (!isLoggedIn) {
    return <LoginPage />;
  }

  return <AppShell>{children}</AppShell>;
}

export default function RootPageLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <AppRouter>{children}</AppRouter>
    </AppProvider>
  );
}
