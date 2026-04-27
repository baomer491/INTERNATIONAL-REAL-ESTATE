import React from 'react';
import type { ReactNode } from 'react';

interface WizardStepLayoutProps {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export default function WizardStepLayout({ icon, title, subtitle, children }: WizardStepLayoutProps) {
  return (
    <div className="wizard-step-layout">
      <div className="wizard-step-header">
        <div className="wizard-step-header-icon">{icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 className="wizard-step-title">{title}</h2>
          {subtitle && <p className="wizard-step-subtitle">{subtitle}</p>}
        </div>
      </div>
      <div style={{ marginTop: subtitle ? 4 : 20 }} />
      {children}
    </div>
  );
}
