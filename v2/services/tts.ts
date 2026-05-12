import { fetchWithTimeout } from './network';
import { retryWithBackoff, NonRetryableError } from './retry';
import { db } from '../db/client';
import type { LangCode } from '../types/index';
import { normalizeLangCode } from '../types/i18n';

export interface TtsResult {
  audio: ArrayBuffer | null;
  success: boolean;
  error?: string;
}

const TTS_TIMEOUT_MS = 10_000;
const TTS_MAX_RETRIES = 2;

async function cacheKey(text: string, lang: string): Promise<string> {
  const data = new TextEncoder().encode(text + '|' + lang);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function getCached(hash: string): Promise<ArrayBuffer | null> {
  try {
    const entry = await db.ttsCache.get(hash);
    return entry?.audio ?? null;
  } catch {
    return null;
  }
}

async function setCache(hash: string, audio: ArrayBuffer): Promise<void> {
  try {
    await db.ttsCache.put({ hash, audio, createdAt: Date.now() });
  } catch {
    // Cache write failed — non-critical
  }
}

export async function synthesize(
  text: string,
  language: LangCode,
  signal?: AbortSignal,
): Promise<TtsResult> {
  if (!text.trim()) {
    return { audio: null, success: false, error: 'Empty text' };
  }

  const langCode = normalizeLangCode(language);
  const hash = await cacheKey(text, langCode);

  const cached = await getCached(hash);
  if (cached) {
    return { audio: cached, success: true };
  }

  try {
    const audio = await retryWithBackoff(
      async () => {
        const response = await fetchWithTimeout('/api/v2/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, language: langCode }),
          timeoutMs: TTS_TIMEOUT_MS,
          signal,
        });

        if (response.status >= 400 && response.status < 500) {
          throw new NonRetryableError('TTS client error', response.status);
        }

        if (!response.ok) {
          throw new Error(`TTS server error: ${response.status}`);
        }

        const contentType = response.headers.get('content-type') ?? '';
        if (contentType.includes('audio')) {
          return response.arrayBuffer();
        }

        const data = await response.json();
        throw new Error(data.error || 'TTS returned non-audio response');
      },
      { maxRetries: TTS_MAX_RETRIES, baseDelayMs: 1_000, signal },
    );

    await setCache(hash, audio);
    return { audio, success: true };
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return { audio: null, success: false, error: 'Aborted' };
    }
    return {
      audio: null,
      success: false,
      error: err instanceof Error ? err.message : 'TTS failed',
    };
  }
}
