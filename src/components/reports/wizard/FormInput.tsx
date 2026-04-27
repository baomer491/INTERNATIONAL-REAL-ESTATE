import React from 'react';
import { AlertCircle } from 'lucide-react';

interface FormInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
  maxW?: string;
  icon?: React.ReactNode;
}

export default function FormInput({
  label,
  value,
  onChange,
  error,
  required,
  type = 'text',
  placeholder,
  maxW,
  icon,
}: FormInputProps) {
  return (
    <div style={maxW ? { maxWidth: maxW } : undefined}>
      <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {icon && <span style={{ color: 'var(--color-text-muted)', display: 'inline-flex' }}>{icon}</span>}
        {label}
        {required && <span style={{ color: 'var(--color-danger)', fontWeight: 700 }}>*</span>}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`form-input${error ? ' form-input-error' : ''}`}
          style={icon ? { paddingRight: 44 } : undefined}
        />
      </div>
      {error && (
        <p className="form-error-message" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <AlertCircle size={13} />
          {error}
        </p>
      )}
    </div>
  );
}
