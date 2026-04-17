import React from 'react';

interface FormInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
  maxW?: string;
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
}: FormInputProps) {
  return (
    <div style={maxW ? { maxWidth: maxW } : undefined}>
      <label className="form-label">
        {label}
        {required && <span style={{ color: 'var(--color-danger)' }}> *</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`form-input${error ? ' form-input-error' : ''}`}
      />
      {error && <p className="form-error-message">{error}</p>}
    </div>
  );
}
