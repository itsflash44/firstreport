'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

export type CameraState = 'closed' | 'opening' | 'active' | 'error';

export interface UseCameraReturn {
  state: CameraState;
  error: string | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  open: () => Promise<void>;
  capture: () => string | null;
  close: () => void;
}

export function useCamera(): UseCameraReturn {
  const [state, setState] = useState<CameraState>('closed');
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const close = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setState('closed');
  }, []);

  useEffect(() => {
    return close;
  }, [close]);

  const open = useCallback(async () => {
    close();
    setError(null);
    setState('opening');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 960 } },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setState('active');
    } catch (err) {
      close();
      setState('error');
      setError(err instanceof Error ? err.message : 'Camera access denied');
    }
  }, [close]);

  const capture = useCallback((): string | null => {
    const video = videoRef.current;
    if (!video || !streamRef.current) return null;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.85);
  }, []);

  return { state, error, videoRef, open, capture, close };
}
