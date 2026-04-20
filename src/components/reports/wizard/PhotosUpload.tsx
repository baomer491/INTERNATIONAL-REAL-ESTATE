'use client';

import React, { useCallback, useRef, useState } from 'react';
import { Upload, Eye, Trash2, Camera, Plus, Image as ImageIcon } from 'lucide-react';

interface PhotosUploadProps {
  photos: File[];
  previews: string[];
  onAdd: (files: File[]) => void;
  onRemove: (index: number) => void;
  onPreview: (url: string, type: string, name: string, label: string) => void;
  maxPhotos?: number;
}

export default function PhotosUpload({
  photos,
  previews,
  onAdd,
  onRemove,
  onPreview,
  maxPhotos = 10,
}: PhotosUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const canAddMore = photos.length < maxPhotos;

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      if (!canAddMore) return;
      const files = Array.from(e.dataTransfer.files).filter(f =>
        f.type.startsWith('image/')
      );
      if (files.length > 0) {
        const remaining = maxPhotos - photos.length;
        onAdd(files.slice(0, remaining));
      }
    },
    [canAddMore, maxPhotos, onAdd, photos.length]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []).filter(f =>
        f.type.startsWith('image/')
      );
      if (files.length > 0) {
        const remaining = maxPhotos - photos.length;
        onAdd(files.slice(0, remaining));
      }
      // Reset input so same file can be re-selected
      if (inputRef.current) inputRef.current.value = '';
    },
    [maxPhotos, onAdd, photos.length]
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Existing photos grid */}
      {photos.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: 10,
        }}>
          {photos.map((photo, idx) => (
            <div
              key={`photo-${idx}-${photo.name}`}
              style={{
                position: 'relative',
                borderRadius: 10,
                overflow: 'hidden',
                border: '2px solid var(--color-border)',
                background: 'var(--color-surface-alt)',
                aspectRatio: '4/3',
              }}
            >
              {/* Action buttons overlay */}
              <div style={{
                position: 'absolute',
                top: 4,
                left: 4,
                zIndex: 2,
                display: 'flex',
                gap: 3,
              }}>
                <button
                  onClick={() => previews[idx] && onPreview(previews[idx], photo.type, photo.name, `صورة ${idx + 1}`)}
                  style={{
                    padding: 4,
                    borderRadius: 6,
                    border: 'none',
                    background: 'rgba(255,255,255,0.92)',
                    cursor: 'pointer',
                    display: 'flex',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
                  }}
                >
                  <Eye size={12} color="var(--color-primary)" />
                </button>
                <button
                  onClick={() => onRemove(idx)}
                  style={{
                    padding: 4,
                    borderRadius: 6,
                    border: 'none',
                    background: 'rgba(255,255,255,0.92)',
                    cursor: 'pointer',
                    display: 'flex',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
                  }}
                >
                  <Trash2 size={12} color="#ef4444" />
                </button>
              </div>

              {/* Photo number badge */}
              <div style={{
                position: 'absolute',
                top: 4,
                right: 4,
                zIndex: 2,
                background: 'var(--color-primary)',
                color: 'white',
                width: 22,
                height: 22,
                borderRadius: '50%',
                fontSize: 10,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {idx + 1}
              </div>

              {/* Preview image */}
              {previews[idx] ? (
                <img
                  src={previews[idx]}
                  alt={`صورة العقار ${idx + 1}`}
                  onClick={() => onPreview(previews[idx], photo.type, photo.name, `صورة ${idx + 1}`)}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    cursor: 'pointer',
                  }}
                />
              ) : (
                <div style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <ImageIcon size={24} color="var(--color-text-muted)" />
                </div>
              )}

              {/* File name footer */}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                padding: '12px 6px 4px',
                direction: 'ltr',
                textAlign: 'left',
              }}>
                <span style={{
                  fontSize: 9,
                  color: 'rgba(255,255,255,0.85)',
                  fontWeight: 500,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  display: 'block',
                }}>
                  {photo.name} ({(photo.size / 1024).toFixed(0)}KB)
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add more button / drop zone */}
      {canAddMore && (
        <div
          className={`wizard-file-zone${dragActive ? ' drag-active' : ''}`}
          style={{ minHeight: photos.length > 0 ? 80 : 120 }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            multiple
            style={{ display: 'none' }}
            onChange={handleInputChange}
          />
          <label
            htmlFor={undefined as any}
            style={{
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
            }}
            onClick={() => inputRef.current?.click()}
          >
            {photos.length > 0 ? (
              <>
                <Plus size={20} color="var(--color-primary)" />
                <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                  إضافة صور ({photos.length}/{maxPhotos})
                </span>
              </>
            ) : (
              <>
                <div className="file-icon-wrap">
                  <Camera size={22} color="var(--color-primary)" />
                </div>
                <div className="file-label">صور العقار</div>
                <div className="file-hint">
                  اسحب الصور أو انقر لرفع عدة صور (حتى {maxPhotos})
                </div>
              </>
            )}
          </label>
        </div>
      )}

      {/* Count indicator */}
      {photos.length > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 11,
          color: 'var(--color-text-muted)',
        }}>
          <Camera size={12} />
          <span>{photos.length} {photos.length === 1 ? 'صورة' : photos.length <= 10 ? 'صور' : 'صورة'} مرفقة</span>
          {canAddMore && <span>· يمكنك إضافة {maxPhotos - photos.length} أخرى</span>}
        </div>
      )}
    </div>
  );
}
