'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { LANG_BY_CODE, type LangCode, type PersonaId } from '@/lib/i18n';
import { audioManager } from '@/lib/audioManager';
import { AudioQueue } from '@/lib/ttsQueue';
import { getBestVoice, waitForVoices } from '@/lib/speechVoices';
import { ttsCacheKey, ttsGetCached, ttsSetCached } from '@/lib/ttsCache';

interface SpeakerButtonProps {
  text: string;
  language: LangCode | string;
  persona?: PersonaId;
  variant?: 'floating' | 'inline' | 'mini';
  autoPlay?: boolean;
}

/**
 * SpeakerButton — Streaming Play / Stop TTS
 * ──────────────────────────────────────────
 * • Text is split into sentences (~80 chars each)
 * • All sentence TTS fetches start CONCURRENTLY
 * • Playback begins as soon as the FIRST sentence is ready (~300 ms)
 * • Subsequent sentences are decoded & queued via Web Audio API while
 *   the first is already playing → zero gap, no perceptible latency
 * • Sarvam audio is cached per-sentence → instant replay
 * • Falls back to browser Web Speech API when offline or Sarvam fails
 * • audioManager.stopAll() is called before new playback so only one
 *   source is ever active at a time
 */
export default function SpeakerButton({
  text,
  language,
  persona = 'standard',
  variant = 'floating',
  autoPlay = false,
}: SpeakerButtonProps) {
  const [state, setState]     = useState<'idle' | 'loading' | 'playing'>('idle');
  const [isOffline, setIsOffline] = useState(false);

  // Prevents race condition: increment to invalidate any in-flight speak()
  const playIdRef  = useRef(0);
  // Ref to stop function for current playback
  const stopFnRef  = useRef<(() => void) | null>(null);

  // ── Online/offline tracking ──────────────────────────────────────────
  useEffect(() => {
    const update = () => setIsOffline(!navigator.onLine);
    update();
    window.addEventListener('online',  update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online',  update);
      window.removeEventListener('offline', update);
    };
  }, []);

  // ── Stop helper ──────────────────────────────────────────────────────
  const stop = useCallback(() => {
    stopFnRef.current?.();
    stopFnRef.current = null;
    audioManager.stopAll();
    setState('idle');
  }, []);

  // ── Main speak function ──────────────────────────────────────────────
  const speak = useCallback(async () => {
    if (state === 'playing' || state === 'loading') {
      stop();
      return;
    }
    if (!text?.trim()) return;

    audioManager.stopAll();

    const thisPlayId = ++playIdRef.current;
    setState('loading');

    const cfg        = LANG_BY_CODE[language as LangCode];
    const sarvamCode = cfg?.sarvamCode ?? (typeof language === 'string' ? language : 'hi-IN');

    // ── Sarvam TTS — sentence-chunked streaming ──────────────────────
    if (navigator.onLine) {
      const sentences = splitSentences(text);

      // Start ALL fetches concurrently so later chunks are already
      // in-flight while the first one plays.
      const fetchPromises = sentences.map((s) => fetchChunk(s, sarvamCode, persona));

      const queue = new AudioQueue();

      queue.onEnd(() => {
        if (playIdRef.current === thisPlayId) setState('idle');
      });

      stopFnRef.current = () => {
        queue.stop();
      };

      let firstChunkPlayed = false;
      let allFailed        = true;

      for (let i = 0; i < sentences.length; i++) {
        if (thisPlayId !== playIdRef.current) {
          queue.stop();
          return;
        }

        let blob: Blob | null = null;
        try {
          blob = await fetchPromises[i];
        } catch {
          // Network error on this chunk — skip it
        }

        if (thisPlayId !== playIdRef.current) {
          queue.stop();
          return;
        }

        if (blob) {
          allFailed = false;
          if (!firstChunkPlayed) {
            // Register queue BEFORE first enqueue so audioManager
            // can stop it on route change.
            audioManager.setQueue(queue);
          }
          try {
            await queue.enqueue(blob);
          } catch {
            /* decode error — skip chunk */
          }
          if (!firstChunkPlayed && thisPlayId === playIdRef.current) {
            firstChunkPlayed = true;
            setState('playing');
          }
        }
      }

      // If every chunk failed fall through to browser TTS
      if (!allFailed) return;
    }

    // ── Browser TTS fallback ─────────────────────────────────────────
    if (thisPlayId !== playIdRef.current) return;
    await fallback();

    // ── Helpers ──────────────────────────────────────────────────────

    async function fallback() {
      if (typeof window === 'undefined' || !window.speechSynthesis) {
        setState('idle');
        return;
      }
      try { window.speechSynthesis.cancel(); } catch { /* noop */ }

      await waitForVoices();
      const utterance = new SpeechSynthesisUtterance(text);
      const voice     = getBestVoice(sarvamCode);
      if (voice) utterance.voice = voice;
      utterance.lang  = cfg?.bcp47 ?? sarvamCode;
      utterance.rate  = 0.85;
      utterance.pitch = 1.0;

      const cleanup = () => {
        if (playIdRef.current === thisPlayId) setState('idle');
        stopFnRef.current = null;
      };

      utterance.onstart = () => { if (thisPlayId === playIdRef.current) setState('playing'); };
      utterance.onend   = cleanup;
      utterance.onerror = cleanup;

      stopFnRef.current = () => {
        try { window.speechSynthesis.cancel(); } catch { /* noop */ }
        cleanup();
      };

      setState('playing');
      window.speechSynthesis.speak(utterance);
    }
  }, [state, stop, text, language, persona]);

  // ── Auto-play on mount ───────────────────────────────────────────────
  useEffect(() => {
    if (autoPlay && text) {
      const id = setTimeout(() => { void speak(); }, 400);
      return () => { clearTimeout(id); stop(); };
    }
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlay, text]);

  // Cleanup on unmount
  useEffect(() => () => stop(), [stop]);

  // ── Styles ───────────────────────────────────────────────────────────
  const sizeMap: Record<string, string> = {
    floating: 'fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg',
    inline:   'w-10 h-10 rounded',
    mini:     'w-7 h-7 rounded',
  };

  const isActive = state === 'playing' || state === 'loading';

  return (
    <button
      onClick={(e) => { e.stopPropagation(); void speak(); }}
      aria-label={isActive ? 'Stop' : 'Listen'}
      title={
        isOffline
          ? 'Offline — using device voice'
          : state === 'loading'
          ? 'Loading…'
          : isActive
          ? 'Stop'
          : 'Listen'
      }
      className={`
        ${sizeMap[variant]}
        flex items-center justify-center shrink-0
        border transition-all duration-200 ease-out
        ${isActive
          ? 'bg-teal text-white border-teal'
          : isOffline
          ? 'bg-ivory text-secondary border-cool-gray hover:border-teal hover:text-teal'
          : 'bg-ivory text-secondary border-cool-gray hover:bg-teal/10 hover:border-teal hover:text-teal'}
      `}
    >
      {state === 'loading' ? (
        /* Spinner while fetching first chunk */
        <svg
          className={`animate-spin ${variant === 'mini' ? 'w-3 h-3' : 'w-3.5 h-3.5'}`}
          fill="none" viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : state === 'playing' ? (
        /* Pause / Stop icon */
        <svg className={`${variant === 'mini' ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} fill="currentColor" viewBox="0 0 24 24">
          <rect x="6" y="5" width="4" height="14" rx="1" />
          <rect x="14" y="5" width="4" height="14" rx="1" />
        </svg>
      ) : (
        /* Speaker / Play icon */
        <svg className={`${variant === 'mini' ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} fill="currentColor" viewBox="0 0 24 24">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3a4.5 4.5 0 00-2.5-4v8a4.5 4.5 0 002.5-4z" />
        </svg>
      )}
    </button>
  );
}

// ── Sentence splitter ────────────────────────────────────────────────────────
/**
 * Split text into natural TTS chunks.
 * Splits on Hindi danda (।), English sentence-ending punctuation (. ! ?),
 * and line breaks. Combines very short fragments to avoid tiny API calls.
 * Target chunk size: ~80–120 characters.
 */
function splitSentences(text: string): string[] {
  if (!text?.trim()) return [];

  // Split on sentence boundaries, keeping the delimiter attached
  const raw = text
    .replace(/\n+/g, ' ')
    .split(/(?<=[।.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const TARGET = 100;
  const chunks: string[] = [];
  let buf = '';

  for (const part of raw) {
    if (buf.length + part.length + 1 > TARGET && buf) {
      chunks.push(buf);
      buf = part;
    } else {
      buf = buf ? `${buf} ${part}` : part;
    }
  }
  if (buf) chunks.push(buf);

  // Fallback: if nothing was split (no sentence boundaries), just use whole text
  return chunks.length ? chunks : [text.trim()];
}

// ── Per-chunk TTS fetch (cache-first) ────────────────────────────────────────
async function fetchChunk(
  sentence: string,
  sarvamCode: string,
  persona: string,
): Promise<Blob | null> {
  const cacheKey = ttsCacheKey(sentence, sarvamCode);
  const cached   = ttsGetCached(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch('/api/tts', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ text: sentence, language: sarvamCode, persona }),
    });
    if (!res.ok) return null;

    const blob = await res.blob();
    ttsSetCached(cacheKey, blob);
    return blob;
  } catch {
    return null;
  }
}
