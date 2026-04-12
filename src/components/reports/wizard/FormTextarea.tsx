import React from 'react';

interface FormTextareaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
  minHeight?: number;
}

export default function FormTextarea({
  label,
  value,
  onChange,
  error,
  required,
  placeholder,
  minHeight = 80,
}: FormTextareaProps) {
  return (
    <div>
      <label className="form-label">
        {label}
        {required && <span style={{ color: 'var(--color-danger)' }}> *</span>}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`form-textarea${error ? ' form-input-error' : ''}`}
        style={{ minHeight, resize: 'vertical' }}
      />
      {error && <p className="form-error-message">{error}</p>}
    </div>
  );
}
