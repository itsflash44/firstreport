'use client';

import { useState, useRef, useCallback } from 'react';
import { useSessionStore } from '../stores/session-store';
import { useAppStore } from '../stores/app-store';
import { useMicrophone } from './use-microphone';
import { useTtsPlayback } from './use-tts-playback';
import { transcribe } from '../services/stt';
import { clarify } from '../services/ai';
import { shouldComplete, historyFromTranscript } from '../services/ai';
import type { LangCode } from '../types/index';

export type ChatPhase = 'idle' | 'recording' | 'transcribing' | 'thinking' | 'speaking' | 'error';

export interface UseChatEngineReturn {
  phase: ChatPhase;
  error: string | null;
  startRecording: () => Promise<void>;
  stopAndProcess: () => Promise<void>;
  cancelRecording: () => void;
  isProcessing: boolean;
}

export function useChatEngine(): UseChatEngineReturn {
  const [phase, setPhase] = useState<ChatPhase>('idle');
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const mic = useMicrophone();
  const tts = useTtsPlayback();

  const cancelPipeline = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    tts.stop();
  }, [tts]);

  const startRecording = useCallback(async () => {
    cancelPipeline();
    setError(null);
    setPhase('recording');
    await mic.startRecording();
  }, [mic, cancelPipeline]);

  const stopAndProcess = useCallback(async () => {
    const blob = await mic.stopRecording();
    if (!blob || blob.size === 0) {
      setPhase('idle');
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    const session = useSessionStore.getState().activeSession;
    if (!session) {
      setPhase('error');
      setError('No active session');
      return;
    }

    const language: LangCode = session.language;
    const { addTurn, setIncidentSummary } = useSessionStore.getState();

    try {
      setPhase('transcribing');
      const sttResult = await transcribe(blob, language, controller.signal);
      if (controller.signal.aborted) return;

      if (!sttResult.success || !sttResult.transcript) {
        setPhase('error');
        setError(sttResult.error ?? 'Transcription failed');
        return;
      }

      addTurn({ role: 'user', text: sttResult.transcript });

      setPhase('thinking');
      const updatedSession = useSessionStore.getState().activeSession!;
      const history = historyFromTranscript(updatedSession.transcript);
      const turnCount = updatedSession.transcript.filter((t) => t.role === 'user').length;

      const result = await clarify(
        sttResult.transcript,
        history,
        language,
        session.personaId,
        controller.signal,
      );
      if (controller.signal.aborted) return;

      if (shouldComplete(turnCount, result.isComplete)) {
        if (result.summary) {
          setIncidentSummary(result.summary);
        }
        useSessionStore.getState().advanceStatus('classified');
        setPhase('idle');
        return;
      }

      if (result.question) {
        addTurn({ role: 'ai', text: result.question });

        setPhase('speaking');
        await tts.speak(result.question, language);
        if (!controller.signal.aborted) {
          setPhase('idle');
        }
      } else {
        setPhase('idle');
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setPhase('idle');
        return;
      }
      setPhase('error');
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  }, [mic, tts, cancelPipeline]);

  const cancelRecording = useCallback(() => {
    mic.cancelRecording();
    cancelPipeline();
    setPhase('idle');
    setError(null);
  }, [mic, cancelPipeline]);

  return {
    phase,
    error,
    startRecording,
    stopAndProcess,
    cancelRecording,
    isProcessing: phase !== 'idle' && phase !== 'recording' && phase !== 'error',
  };
}
