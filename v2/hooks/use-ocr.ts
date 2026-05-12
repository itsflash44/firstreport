'use client';

import { useState, useCallback } from 'react';
import { resizeImage, detectBlur, performOcr } from '../services/ocr';
import type { OcrResult } from '../services/ocr';

export type OcrPhase = 'idle' | 'checking' | 'processing' | 'done' | 'error';

export interface UseOcrReturn {
  phase: OcrPhase;
  result: OcrResult | null;
  blurWarning: boolean;
  error: string | null;
  processImage: (dataUrl: string) => Promise<void>;
  reset: () => void;
}

export function useOcr(): UseOcrReturn {
  const [phase, setPhase] = useState<OcrPhase>('idle');
  const [result, setResult] = useState<OcrResult | null>(null);
  const [blurWarning, setBlurWarning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processImage = useCallback(async (dataUrl: string) => {
    setPhase('checking');
    setError(null);
    setBlurWarning(false);
    setResult(null);

    try {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = dataUrl;
      });

      const canvas = document.createElement('canvas');
      resizeImage(canvas, img);

      const blur = detectBlur(canvas);
      if (blur.isBlurry) {
        setBlurWarning(true);
      }

      setPhase('processing');
      const ocrResult = await performOcr(canvas.toDataURL('image/jpeg', 0.9));

      if (ocrResult.success) {
        setResult(ocrResult);
        setPhase('done');
      } else {
        setError(ocrResult.error ?? 'OCR failed');
        setPhase('error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Processing failed');
      setPhase('error');
    }
  }, []);

  const reset = useCallback(() => {
    setPhase('idle');
    setResult(null);
    setBlurWarning(false);
    setError(null);
  }, []);

  return { phase, result, blurWarning, error, processImage, reset };
}
