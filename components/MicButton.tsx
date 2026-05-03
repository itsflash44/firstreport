'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { t, type LangCode } from '@/lib/i18n';

interface MicButtonProps {
  onTranscript: (text: string) => void;
  language: LangCode | string;
  disabled?: boolean;
}

/**
 * Microphone button — push-to-talk, hard-stops the media stream the moment
 * the user releases. NEVER requests `getUserMedia` until the user actually
 * presses the button (so no permission prompt on page load), and ALWAYS
 * tears down all tracks in finally{} so the macOS / iOS recording indicator
 * doesn't stay pinned.
 *
 * Lifecycle:
 *   1. user pointerdown   → request mic, start MediaRecorder
 *   2. user pointerup     → stop MediaRecorder
 *   3. recorder.onstop    → POST blob to /api/stt, then stop all tracks
 *   4. unmount or cancel  → kill any open stream
 */
export default function MicButton({
  onTranscript,
  language,
  disabled = false,
}: MicButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [permError, setPermError] = useState(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef<number>(0);

  const lang = (language as LangCode) || 'hi-IN';

  /** Hard-cut the audio stream — call this from EVERY exit path. */
  const releaseStream = useCallback(() => {
    const stream = streamRef.current;
    if (stream) {
      stream.getTracks().forEach((tr) => {
        try { tr.stop(); } catch { /* noop */ }
      });
    }
    streamRef.current = null;
    recorderRef.current = null;
    chunksRef.current = [];
  }, []);

  // Unmount safety: never leave a stream open when the component goes away
  // (e.g. user navigates from /chat to /home while still holding the mic).
  useEffect(() => {
    return () => releaseStream();
  }, [releaseStream]);

  const startRecording = useCallback(async () => {
    if (disabled || isProcessing || isRecording) return;

    try {
      // ⚠️ getUserMedia is intentionally only called here — never on mount,
      // never on a re-render, never speculatively. macOS will only show the
      // mic indicator while we hold a track open.
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';

      const recorder = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        // Whatever happens below, we MUST release the mic before returning.
        try {
          // Reject < 200ms button-taps as accidental
          const elapsed = Date.now() - startedAtRef.current;
          if (elapsed < 200 || chunksRef.current.length === 0) return;

          setIsProcessing(true);
          const blob = new Blob(chunksRef.current, { type: mime });
          const formData = new FormData();
          formData.append('audio', blob, 'recording.webm');
          formData.append('language', lang);
          formData.append('lang_code', lang); // backend reads lang_code

          try {
            const res = await fetch('/api/stt', { method: 'POST', body: formData });
            const data = await res.json();
            if (data.transcript) onTranscript(data.transcript);
          } catch (err) {
            console.error('STT request failed', err);
          }
        } finally {
          setIsProcessing(false);
          releaseStream(); // belt-and-braces — release no matter what
        }
      };

      startedAtRef.current = Date.now();
      recorder.start();
      recorderRef.current = recorder;
      setIsRecording(true);
      setPermError(false);
    } catch (err) {
      console.error('mic permission denied', err);
      releaseStream();
      setPermError(true);
      setTimeout(() => setPermError(false), 3000);
    }
  }, [disabled, isProcessing, isRecording, lang, onTranscript, releaseStream]);

  const stopRecording = useCallback(() => {
    const r = recorderRef.current;
    if (r && r.state !== 'inactive') {
      try { r.stop(); } catch { /* noop */ }
    } else {
      // Recorder never started — release stream anyway.
      releaseStream();
    }
    setIsRecording(false);
  }, [releaseStream]);

  // Status copy in user's language
  const statusText = isProcessing
    ? '⋯'
    : isRecording
    ? t('listening', lang)
    : t('speak', lang);

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onPointerDown={startRecording}
        onPointerUp={stopRecording}
        onPointerLeave={isRecording ? stopRecording : undefined}
        onPointerCancel={isRecording ? stopRecording : undefined}
        disabled={disabled || isProcessing}
        aria-label={t('speak', lang)}
        aria-pressed={isRecording}
        className={`
          relative w-20 h-20 sm:w-24 sm:h-24 rounded-full
          flex items-center justify-center
          transition-all duration-150 ease-out
          disabled:opacity-50 disabled:cursor-not-allowed
          ${isRecording
            ? 'bg-error text-white scale-105 ring-4 ring-error/30 shadow-lg'
            : isProcessing
            ? 'bg-cool-gray text-muted cursor-wait animate-pulse shadow-sm'
            : 'bg-navy text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95'}`}
      >
        {isRecording && (
          <>
            <span className="absolute inset-3 rounded-full border-2 border-white/60 animate-rec" />
            <span className="absolute flex gap-1 items-end h-10">
              {[0, 1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  className="w-1.5 bg-white animate-wave"
                  style={{ height: '100%', animationDelay: `${i * 100}ms` }}
                />
              ))}
            </span>
          </>
        )}
        {!isRecording && !isProcessing && (
          <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
            <rect x="9" y="3" width="6" height="11" rx="3" />
            <path d="M5 11a7 7 0 0014 0h-2a5 5 0 01-10 0H5z" />
            <rect x="11" y="18" width="2" height="3" />
          </svg>
        )}
        {isProcessing && (
          <svg className="w-10 h-10 animate-spin-slow text-ink" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" strokeDasharray="40 60" />
          </svg>
        )}
      </button>

      <p className="text-xs sm:text-sm font-semibold text-secondary">
        {statusText}
      </p>

      {permError && (
        <p className="text-[11px] font-medium text-error max-w-[14rem] text-center leading-snug">
          Mic permission denied — please allow in browser settings
        </p>
      )}
    </div>
  );
}
