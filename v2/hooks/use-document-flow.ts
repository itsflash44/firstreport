'use client';

import { useState, useRef, useCallback } from 'react';
import { useSessionStore } from '../stores/session-store';
import { useSyncStore } from '../stores/sync-store';
import { useAppStore } from '../stores/app-store';
import { generatePdf } from '../services/pdf';
import { sendDocument } from '../services/telegram';
import type { PdfRequest } from '../services/pdf';

export type DocFlowState = 'idle' | 'generating' | 'sending' | 'queued' | 'sent' | 'error';

export interface UseDocumentFlowReturn {
  state: DocFlowState;
  error: string | null;
  pdfBlob: Blob | null;
  generate: () => Promise<void>;
  send: () => Promise<void>;
  download: () => void;
}

export function useDocumentFlow(): UseDocumentFlowReturn {
  const [state, setState] = useState<DocFlowState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const pdfDataRef = useRef<{ pdf: ArrayBuffer; filename: string } | null>(null);

  const generate = useCallback(async () => {
    const session = useSessionStore.getState().activeSession;
    if (!session?.classification || !session.incidentSummary) return;

    setError(null);
    setState('generating');

    const controller = new AbortController();
    abortRef.current = controller;

    const request: PdfRequest = {
      summary: session.incidentSummary,
      classification: session.classification,
      crimeInput: session.crimeInput ?? {
        victim_name: '', victim_address: '', incident_date: '',
        incident_location: '', accused_name: '', accused_description: '',
        witnesses: '', evidence: '',
      },
      language: session.language,
      persona: session.personaId,
    };

    const result = await generatePdf(request, controller.signal);

    if (controller.signal.aborted) return;

    if (result.success && result.pdf) {
      pdfDataRef.current = { pdf: result.pdf, filename: result.filename ?? 'firstreport.pdf' };
      setPdfBlob(new Blob([result.pdf], { type: 'application/pdf' }));

      useSessionStore.getState().setDocuments([{
        letterType: 'SP',
        title: 'First Information Report',
        subtitle: result.filename ?? 'firstreport.pdf',
        unlockDays: 0,
        status: 'ready',
        generatedAt: Date.now(),
      }]);

      setState('idle');
    } else {
      setError(result.error ?? 'PDF generation failed');
      setState('error');
    }
  }, []);

  const send = useCallback(async () => {
    const session = useSessionStore.getState().activeSession;
    if (!session || !pdfDataRef.current) return;

    const isOnline = useAppStore.getState().isOnline;

    if (!isOnline) {
      await useSyncStore.getState().enqueue({
        sessionId: session.id,
        action: 'send_telegram',
        payload: {
          pdf: pdfDataRef.current.pdf,
          filename: pdfDataRef.current.filename,
          sessionId: session.id,
        },
      });
      setState('queued');
      return;
    }

    setState('sending');
    const controller = new AbortController();
    abortRef.current = controller;

    const result = await sendDocument(
      {
        sessionId: session.id,
        pdf: pdfDataRef.current.pdf,
        filename: pdfDataRef.current.filename,
      },
      controller.signal,
    );

    if (controller.signal.aborted) return;

    if (result.success) {
      useSessionStore.getState().advanceStatus('sent');
      setState('sent');
    } else {
      await useSyncStore.getState().enqueue({
        sessionId: session.id,
        action: 'send_telegram',
        payload: {
          pdf: pdfDataRef.current.pdf,
          filename: pdfDataRef.current.filename,
          sessionId: session.id,
        },
      });
      setState('queued');
    }
  }, []);

  const download = useCallback(() => {
    if (!pdfBlob || !pdfDataRef.current) return;
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = pdfDataRef.current.filename;
    a.click();
    URL.revokeObjectURL(url);
  }, [pdfBlob]);

  return { state, error, pdfBlob, generate, send, download };
}
