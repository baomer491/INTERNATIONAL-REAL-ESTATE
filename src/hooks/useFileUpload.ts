'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

export function useFileUpload() {
  const [previews, setPreviews] = useState<Record<string, string>>({});
  // Track all active blob URLs so cleanup on unmount revokes everything
  const activeUrlsRef = useRef<Set<string>>(new Set());

  // Only revoke URLs on component unmount, NOT on every previews change
  useEffect(() => {
    return () => {
      activeUrlsRef.current.forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
      activeUrlsRef.current.clear();
    };
  }, []);

  const createPreview = useCallback((field: string, file: File) => {
    const url = URL.createObjectURL(file);
    activeUrlsRef.current.add(url);
    setPreviews((prev) => {
      if (prev[field]) {
        const oldUrl = prev[field];
        activeUrlsRef.current.delete(oldUrl);
        URL.revokeObjectURL(oldUrl);
      }
      return { ...prev, [field]: url };
    });
  }, []);

  const removePreview = useCallback((field: string) => {
    setPreviews((prev) => {
      if (prev[field]) {
        const oldUrl = prev[field];
        activeUrlsRef.current.delete(oldUrl);
        URL.revokeObjectURL(oldUrl);
      }
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  return { previews, createPreview, removePreview };
}
