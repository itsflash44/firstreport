'use client';

import { useRef, useCallback, useEffect } from 'react';
import { synthesize } from '../services/tts';
import { useAppStore } from '../stores/app-store';
import type { LangCode } from '../types/index';

export interface UseTtsPlaybackReturn {
  speak: (text: string, lang?: LangCode) => Promise<void>;
  stop: () => void;
  isPlaying: boolean;
}

export function useTtsPlayback(): UseTtsPlaybackReturn {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const playingRef = useRef(false);

  const stop = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    playingRef.current = false;
  }, []);

  useEffect(() => {
    return stop;
  }, [stop]);

  const speak = useCallback(async (text: string, lang?: LangCode) => {
    stop();

    const language = lang ?? useAppStore.getState().language;
    const autoPlay = useAppStore.getState().settings.autoPlayTts;
    if (!autoPlay) return;

    const controller = new AbortController();
    abortRef.current = controller;

    const result = await synthesize(text, language, controller.signal);
    if (!result.success || !result.audio || controller.signal.aborted) return;

    const blob = new Blob([result.audio], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audioRef.current = audio;
    playingRef.current = true;

    audio.onended = () => {
      URL.revokeObjectURL(url);
      playingRef.current = false;
      audioRef.current = null;
    };

    audio.onerror = () => {
      URL.revokeObjectURL(url);
      playingRef.current = false;
      audioRef.current = null;
    };

    try {
      await audio.play();
    } catch {
      URL.revokeObjectURL(url);
      playingRef.current = false;
      audioRef.current = null;
    }
  }, [stop]);

  return {
    speak,
    stop,
    get isPlaying() { return playingRef.current; },
  };
}
