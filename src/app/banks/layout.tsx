'use client';

import React from 'react';
import { AppProvider, useApp } from '@/components/layout/AppContext';
import AppShell from '@/components/layout/AppShell';

function AppRouter({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useApp();
  if (!isLoggedIn) return null;
  return <AppShell>{children}</AppShell>;
}

export default function PageLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <AppRouter>{children}</AppRouter>
    </AppProvider>
  );
}
