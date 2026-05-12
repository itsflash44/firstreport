import { fetchWithTimeout } from './network';
import { retryWithBackoff, NonRetryableError } from './retry';
import type { LangCode, PersonaId, ChatTurn, Classification } from '../types/index';

const AI_TIMEOUT_MS = 10_000;
const AI_MAX_RETRIES = 2;

export const MIN_TURNS_BEFORE_COMPLETE = 2;
export const MAX_TURNS = 6;

export interface ClarifyResult {
  question: string | null;
  isComplete: boolean;
  summary: string;
}

export interface ClassifyResult {
  success: boolean;
  classification: Classification | null;
  crimeInput: Record<string, unknown> | null;
  error?: string;
}

export async function clarify(
  transcript: string,
  history: Array<{ role: string; content: string }>,
  language: LangCode,
  persona: PersonaId,
  signal?: AbortSignal,
): Promise<ClarifyResult> {
  try {
    const result = await retryWithBackoff(
      async () => {
        const response = await fetchWithTimeout('/api/v2/clarify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript, history, language, persona }),
          timeoutMs: AI_TIMEOUT_MS,
          signal,
        });

        if (response.status >= 400 && response.status < 500) {
          throw new NonRetryableError('Clarify client error', response.status);
        }
        if (!response.ok) {
          throw new Error(`Clarify server error: ${response.status}`);
        }

        return response.json() as Promise<ClarifyResult>;
      },
      { maxRetries: AI_MAX_RETRIES, baseDelayMs: 1_000, signal },
    );

    return result;
  } catch {
    return { question: null, isComplete: false, summary: '' };
  }
}

export async function classify(
  summary: string,
  language: LangCode,
  persona: PersonaId,
  signal?: AbortSignal,
): Promise<ClassifyResult> {
  try {
    const result = await retryWithBackoff(
      async () => {
        const response = await fetchWithTimeout('/api/v2/classify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ summary, language, persona }),
          timeoutMs: AI_TIMEOUT_MS,
          signal,
        });

        if (response.status >= 400 && response.status < 500) {
          throw new NonRetryableError('Classify client error', response.status);
        }
        if (!response.ok) {
          throw new Error(`Classify server error: ${response.status}`);
        }

        return response.json() as Promise<ClassifyResult>;
      },
      { maxRetries: AI_MAX_RETRIES, baseDelayMs: 1_000, signal },
    );

    return result;
  } catch {
    return { success: false, classification: null, crimeInput: null, error: 'Classification failed' };
  }
}

export function shouldComplete(turnCount: number, aiSaysComplete: boolean): boolean {
  if (turnCount >= MAX_TURNS) return true;
  if (turnCount >= MIN_TURNS_BEFORE_COMPLETE && aiSaysComplete) return true;
  return false;
}

export function historyFromTranscript(
  transcript: ChatTurn[],
): Array<{ role: string; content: string }> {
  return transcript.map((t) => ({ role: t.role, content: t.text }));
}
