'use client';

import { useState, useCallback, useEffect } from 'react';

export function useFileUpload() {
  const [previews, setPreviews] = useState<Record<string, string>>({});

  useEffect(() => {
    const urls = Object.values(previews);
    return () => {
      urls.forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [previews]);

  const createPreview = useCallback((field: string, file: File) => {
    const url = URL.createObjectURL(file);
    setPreviews((prev) => {
      if (prev[field]) URL.revokeObjectURL(prev[field]);
      return { ...prev, [field]: url };
    });
  }, []);

  const removePreview = useCallback((field: string) => {
    setPreviews((prev) => {
      if (prev[field]) URL.revokeObjectURL(prev[field]);
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  return { previews, createPreview, removePreview };
}
