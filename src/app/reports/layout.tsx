'use client';

import React from 'react';
import { useApp } from '@/components/layout/AppContext';
import AppShell from '@/components/layout/AppShell';

function AppRouter({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useApp();
  if (!isLoggedIn) return null;
  return <AppShell>{children}</AppShell>;
}

export default function PageLayout({ children }: { children: React.ReactNode }) {
  return <AppRouter>{children}</AppRouter>;
}
