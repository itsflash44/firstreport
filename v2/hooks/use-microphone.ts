'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

export type MicState = 'idle' | 'requesting' | 'recording' | 'error';

export interface UseMicrophoneReturn {
  state: MicState;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<Blob | null>;
  cancelRecording: () => void;
}

const MIME_TYPE = MediaRecorder.isTypeSupported?.('audio/webm;codecs=opus')
  ? 'audio/webm;codecs=opus'
  : 'audio/webm';

export function useMicrophone(): UseMicrophoneReturn {
  const [state, setState] = useState<MicState>('idle');
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const resolveRef = useRef<((blob: Blob | null) => void) | null>(null);

  const cleanup = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    chunksRef.current = [];
    resolveRef.current = null;
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const startRecording = useCallback(async () => {
    cleanup();
    setError(null);
    setState('requesting');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      streamRef.current = stream;

      const recorder = new MediaRecorder(stream, {
        mimeType: MIME_TYPE,
        audioBitsPerSecond: 32000,
      });

      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = chunksRef.current.length > 0
          ? new Blob(chunksRef.current, { type: MIME_TYPE })
          : null;

        if (resolveRef.current) {
          resolveRef.current(blob);
          resolveRef.current = null;
        }

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start(250);
      setState('recording');
    } catch (err) {
      cleanup();
      setState('error');
      setError(err instanceof Error ? err.message : 'Microphone access denied');
    }
  }, [cleanup]);

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
      setState('idle');
      return null;
    }

    return new Promise<Blob | null>((resolve) => {
      resolveRef.current = resolve;
      mediaRecorderRef.current!.stop();
      setState('idle');
    });
  }, []);

  const cancelRecording = useCallback(() => {
    cleanup();
    setState('idle');
  }, [cleanup]);

  return { state, error, startRecording, stopRecording, cancelRecording };
}
