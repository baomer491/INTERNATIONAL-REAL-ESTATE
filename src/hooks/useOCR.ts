'use client';

import { useState, useCallback } from 'react';
import {
  extractPropertyFromImage,
  getConfidenceLabel,
  getStepLabel,
  type OCRExtractionResult,
  type OCRStep,
} from '@/lib/ocr';

export function useOCR(showToast: (msg: string, type?: 'error' | 'success' | 'warning' | 'info' | undefined) => void) {
  const [extracting, setExtracting] = useState(false);
  const [ocrResult, setOcrResult] = useState<OCRExtractionResult | null>(null);
  const [ocrStep, setOcrStep] = useState<OCRStep>('idle');

  const runExtraction = useCallback(
    async (files: File[], onSuccess: (result: OCRExtractionResult) => void) => {
      if (!files.length) {
        showToast('يرجى رفع ملف الملكية أولاً', 'warning');
        return;
      }

      setOcrStep('uploading');
      setOcrResult(null);
      setExtracting(true);

      try {
        const result = await extractPropertyFromImage(files, setOcrStep);
        setOcrResult(result);
        setOcrStep(result.success ? 'done' : 'error');

        if (result.success) {
          const filledCount = Object.values(result.fields).filter(
            (f) => f.value && f.confidence > 0
          ).length;
          showToast(`تم استخراج ${filledCount} حقل بنجاح وتعبئتها تلقائياً`, 'success');
          onSuccess(result);
        } else {
          showToast(result.error || 'فشل استخراج البيانات', 'error');
        }
      } catch {
        setOcrStep('error');
        showToast('حدث خطأ أثناء استخراج البيانات', 'error');
      } finally {
        setExtracting(false);
      }
    },
    [showToast]
  );

  const reset = useCallback(() => {
    setOcrResult(null);
    setOcrStep('idle');
  }, []);

  return {
    extracting,
    ocrResult,
    ocrStep,
    runExtraction,
    reset,
    getStepLabel,
    getConfidenceLabel,
  };
}
