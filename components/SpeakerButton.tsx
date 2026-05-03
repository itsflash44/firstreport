'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { LANG_BY_CODE, type LangCode, type PersonaId } from '@/lib/i18n';
import { audioManager } from '@/lib/audioManager';
import { getBestVoice, waitForVoices } from '@/lib/speechVoices';

interface SpeakerButtonProps {
  text: string;
  language: LangCode | string;
  persona?: PersonaId;
  variant?: 'floating' | 'inline' | 'mini';
  autoPlay?: boolean;
}

export default function SpeakerButton({
  text,
  language,
  persona = 'standard',
  variant = 'floating',
  autoPlay = false,
}: SpeakerButtonProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isOffline,  setIsOffline]  = useState(false);
  const cancelRef = useRef<null | (() => void)>(null);

  // Track online/offline state
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

  const stop = useCallback(() => {
    cancelRef.current?.();
    cancelRef.current = null;
    setIsSpeaking(false);
  }, []);

  const speak = useCallback(async () => {
    if (isSpeaking) { stop(); return; }
    if (!text) return;

    // ── Stop ALL previous audio first ─────────────────────────────────
    // This cancels any Sarvam HTMLAudioElement AND any browser speechSynthesis
    // that might still be running, preventing simultaneous dual-TTS.
    audioManager.stopAll();

    setIsSpeaking(true);

    const cfg        = LANG_BY_CODE[language as LangCode];
    const sarvamCode = cfg?.sarvamCode ?? (typeof language === 'string' ? language : 'hi-IN');

    // ── Sarvam TTS (online only) ───────────────────────────────────────
    if (navigator.onLine) {
      try {
        const res = await fetch('/api/tts', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ text, language: sarvamCode, persona }),
        });
        if (res.ok) {
          const blob      = await res.blob();
          const objectUrl = URL.createObjectURL(blob);
          const audio     = new Audio(objectUrl);

          audio.onended = () => { setIsSpeaking(false); cancelRef.current = null; };

          // Mid-play error → stop Sarvam audio, then try browser TTS
          audio.onerror = () => {
            audioManager.stopAll();
            void fallback();
          };

          // Register with global manager so route changes stop it
          audioManager.setAudio(audio, objectUrl);

          cancelRef.current = () => {
            audioManager.stopAll();
            setIsSpeaking(false);
          };

          await audio.play();
          return; // ← Sarvam is playing. Do NOT fall through to browser TTS.
        }
        throw new Error(`TTS HTTP ${res.status}`);
      } catch {
        // Sarvam API unavailable → fall through to browser TTS
      }
    }

    // ── Browser TTS fallback (offline OR Sarvam unavailable) ─────────
    await fallback();

    async function fallback() {
      // Defensive: cancel any speech synthesis before starting fresh
      try { window.speechSynthesis?.cancel(); } catch { /* noop */ }

      await waitForVoices();
      const utterance = new SpeechSynthesisUtterance(text);
      const voice = getBestVoice(sarvamCode);
      if (voice) utterance.voice = voice;
      utterance.lang  = cfg?.bcp47 ?? sarvamCode;
      utterance.rate  = 0.85;
      utterance.pitch = 1.0;

      utterance.onend   = () => { setIsSpeaking(false); cancelRef.current = null; };
      utterance.onerror = () => { setIsSpeaking(false); cancelRef.current = null; };

      cancelRef.current = () => {
        try { window.speechSynthesis?.cancel(); } catch { /* noop */ }
        setIsSpeaking(false);
      };

      window.speechSynthesis?.speak(utterance);
    }
  }, [isSpeaking, stop, text, language, persona]);

  // Auto-play on mount (e.g. chat opening line)
  useEffect(() => {
    if (autoPlay && text) {
      const id = setTimeout(() => { void speak(); }, 400);
      return () => { clearTimeout(id); stop(); };
    }
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlay, text]);

  // Size map
  const sizeMap: Record<string, string> = {
    floating: 'fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg',
    inline:   'w-10 h-10 rounded',
    mini:     'w-7 h-7 rounded',
  };

  return (
    <button
      onClick={(e) => { e.stopPropagation(); void speak(); }}
      aria-label={isSpeaking ? 'Stop' : 'Listen'}
      title={isOffline ? 'Offline — using device voice' : (isSpeaking ? 'Stop' : 'Listen')}
      className={`
        ${sizeMap[variant]}
        flex items-center justify-center shrink-0
        border transition-all duration-200 ease-out
        ${isSpeaking
          ? 'bg-teal text-white border-teal'
          : isOffline
          ? 'bg-off-white text-secondary border-cool-gray hover:border-teal hover:text-teal'
          : 'bg-off-white text-secondary border-cool-gray hover:bg-teal/10 hover:border-teal hover:text-teal'}
      `}
    >
      {isSpeaking ? (
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
          <rect x="6" y="5" width="4" height="14" rx="1" />
          <rect x="14" y="5" width="4" height="14" rx="1" />
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3a4.5 4.5 0 00-2.5-4v8a4.5 4.5 0 002.5-4z" />
        </svg>
      )}
    </button>
  );
}
