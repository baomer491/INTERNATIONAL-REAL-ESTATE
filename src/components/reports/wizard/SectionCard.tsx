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
    <div className={`wizard-section-card${className ? ` ${className}` : ''}`} style={style}>
      {title && (
        <h3 className="wizard-section-title">
          {titleIcon}
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}
