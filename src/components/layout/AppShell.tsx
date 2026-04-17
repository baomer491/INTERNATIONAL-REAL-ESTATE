'use client';

import React from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useApp } from './AppContext';
import { ErrorBoundary } from '../ErrorBoundary';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { sidebarOpen, isMobile } = useApp();

  /* Desktop: sidebar pushes content. Mobile: sidebar overlays content. */
  const contentMarginRight = (!isMobile && sidebarOpen) ? 'var(--sidebar-width)' : 0;

  return (
    <div style={{ minHeight: '100vh' }}>
      <Sidebar />
      <Topbar />
      <main style={{
        marginRight: contentMarginRight,
        marginTop: 'var(--topbar-height)',
        minHeight: 'calc(100vh - var(--topbar-height))',
        padding: '24px',
        transition: 'margin-right 0.3s ease',
      }}>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>
    </div>
  );
}
