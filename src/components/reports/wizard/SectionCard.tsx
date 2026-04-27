import React from 'react';
import type { ReactNode } from 'react';

interface SectionCardProps {
  title?: string;
  titleIcon?: ReactNode;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export default function SectionCard({ title, titleIcon, children, className, style }: SectionCardProps) {
  return (
    <div
      className={`wizard-section-card animate-fade-in${className ? ` ${className}` : ''}`}
      style={style}
    >
      {title && (
        <h3 className="wizard-section-title">
          {titleIcon && <span style={{ display: 'inline-flex', color: 'var(--color-secondary)' }}>{titleIcon}</span>}
          {title}
        </h3>
      )}
      <div className="stagger-children" style={{ direction: 'rtl', textAlign: 'right' }}>
        {children}
      </div>
    </div>
  );
}
