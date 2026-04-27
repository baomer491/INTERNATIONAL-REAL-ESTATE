'use client';

import React from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useApp } from './AppContext';
import { ErrorBoundary } from '../ErrorBoundary';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { sidebarOpen, sidebarCollapsed, isMobile } = useApp();

  // Build the grid class based on sidebar state
  let shellClass = 'app-shell';
  if (!isMobile) {
    if (sidebarCollapsed) {
      shellClass += ' app-shell--sidebar-collapsed';
    } else if (sidebarOpen) {
      shellClass += ' app-shell--sidebar-open';
    }
  }

  // On mobile, sidebar is an overlay — visibility controlled by sidebarOpen
  const sidebarVisible = isMobile ? sidebarOpen : true;

  return (
    <div className={shellClass} style={{ background: 'var(--color-bg)' }}>
      {/* Sidebar — grid area or overlay depending on breakpoint */}
      <div className={`app-shell__sidebar ${sidebarVisible ? 'app-shell__sidebar--visible' : ''}`}>
        <Sidebar />
      </div>

      {/* Topbar — always visible in grid */}
      <Topbar />

      {/* Main content — scrollable area */}
      <main className="app-shell__main">
        <ErrorBoundary>
          <div className="animate-fade-in" style={{ maxWidth: 'var(--content-max-width)', margin: '0 auto' }}>
            {children}
          </div>
        </ErrorBoundary>
      </main>
    </div>
  );
}
