'use client';

import { useState, useEffect, useRef } from 'react';
import { useSessionStore } from '../stores/session-store';
import { classify } from '../services/ai';
import type { CrimeInput } from '../types/index';

export interface UseClassificationReturn {
  isLoading: boolean;
  error: string | null;
  retry: () => void;
}

export function useClassification(): UseClassificationReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const didRun = useRef(false);

  const run = () => {
    const session = useSessionStore.getState().activeSession;
    if (!session || session.classification) return;
    if (!session.incidentSummary) return;

    didRun.current = true;
    setIsLoading(true);
    setError(null);

    const controller = new AbortController();
    abortRef.current = controller;

    classify(session.incidentSummary, session.language, session.personaId, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;

        if (result.success && result.classification) {
          useSessionStore.getState().setClassification(result.classification);
          if (result.crimeInput) {
            useSessionStore.getState().setCrimeInput(result.crimeInput as unknown as CrimeInput);
          }
        } else {
          setError(result.error ?? 'Classification failed');
        }
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Classification failed');
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
  };

  useEffect(() => {
    if (!didRun.current) run();
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  return { isLoading, error, retry: run };
}
