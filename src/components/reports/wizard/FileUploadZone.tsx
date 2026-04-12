'use client';

import React, { useCallback, useState } from 'react';
import { Upload, Eye, Trash2, FileText } from 'lucide-react';

interface FileUploadZoneProps {
  field: string;
  label: string;
  accept: string;
  preview: string;
  file: File | null;
  icon: React.ReactNode;
  onUpload: (field: string, file: File) => void;
  onRemove: (field: string) => void;
  onPreview: (url: string, type: string, name: string, label: string) => void;
}

export default function FileUploadZone({
  field,
  label,
  accept,
  preview,
  file,
  icon,
  onUpload,
  onRemove,
  onPreview,
}: FileUploadZoneProps) {
  const [dragActive, setDragActive] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const f = e.dataTransfer.files[0];
      if (f) onUpload(field, f);
    },
    [field, onUpload]
  );

  if (file && preview) {
    return (
      <div className="wizard-file-zone has-file">
        <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 2, display: 'flex', gap: 4 }}>
          <button
            onClick={() => onPreview(preview, file?.type || '', file?.name || '', label)}
            style={{
              padding: 6,
              borderRadius: 8,
              border: 'none',
              background: 'rgba(255,255,255,0.95)',
              cursor: 'pointer',
              display: 'flex',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            <Eye size={14} color="var(--color-primary)" />
          </button>
          <button
            onClick={() => onRemove(field)}
            style={{
              padding: 6,
              borderRadius: 8,
              border: 'none',
              background: 'rgba(255,255,255,0.95)',
              cursor: 'pointer',
              display: 'flex',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            <Trash2 size={14} color="#ef4444" />
          </button>
        </div>
        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 2,
            background: 'var(--color-success)',
            color: 'white',
            padding: '3px 10px',
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          {label}
        </div>
        {file?.type === 'application/pdf' ? (
          <div
            onClick={() => onPreview(preview, file?.type || '', file?.name || '', label)}
            style={{
              height: 160,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--color-surface-alt)',
              flexDirection: 'column',
              gap: 8,
              cursor: 'pointer',
            }}
          >
            <FileText size={36} color="var(--color-text-muted)" />
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{file?.name}</span>
          </div>
        ) : (
          <img
            src={preview}
            alt={label}
            onClick={() => onPreview(preview, file?.type || '', file?.name || '', label)}
            style={{ width: '100%', height: 160, objectFit: 'cover', cursor: 'pointer' }}
          />
        )}
        <div
          style={{
            padding: '8px 12px',
            background: 'var(--color-success-bg)',
            fontSize: 11,
            color: '#15803d',
            fontWeight: 500,
          }}
        >
          {file.name} ({(file.size / 1024).toFixed(0)} KB)
        </div>
      </div>
    );
  }

  return (
    <div
      className={`wizard-file-zone${dragActive ? ' drag-active' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragActive(true);
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={handleDrop}
    >
      <input
        type="file"
        id={field}
        accept={accept}
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onUpload(field, f);
        }}
      />
      <label htmlFor={field} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <div className="file-icon-wrap">{icon || <Upload size={22} color="var(--color-primary)" />}</div>
        <div className="file-label">{label}</div>
        <div className="file-hint">اسحب الملف أو انقر للرفع</div>
      </label>
    </div>
  );
}
