'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppProvider, useApp } from '@/components/layout/AppContext';
import LoginPage from './login/LoginPage';

function RootRedirect() {
  const { isLoggedIn } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (isLoggedIn) {
      router.replace('/dashboard');
    }
  }, [isLoggedIn, router]);

  if (!isLoggedIn) {
    return <LoginPage />;
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', direction: 'rtl',
    }}>
      <div style={{
        width: 48, height: 48, border: '4px solid #e2e8f0',
        borderTopColor: '#1e3a5f', borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }} />
      <style dangerouslySetInnerHTML={{
        __html: `@keyframes spin { to { transform: rotate(360deg); } }`
      }} />
    </div>
  );
}

export default function RootPage() {
  return (
    <AppProvider>
      <RootRedirect />
    </AppProvider>
  );
}
