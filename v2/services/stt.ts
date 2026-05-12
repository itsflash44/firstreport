import { fetchWithTimeout } from './network';
import { retryWithBackoff, NonRetryableError } from './retry';
import type { LangCode } from '../types/index';
import { normalizeLangCode } from '../types/i18n';

export interface SttResult {
  transcript: string;
  success: boolean;
  error?: string;
}

const STT_TIMEOUT_MS = 15_000;
const STT_MAX_RETRIES = 2;

export async function transcribe(
  audioBlob: Blob,
  language: LangCode,
  signal?: AbortSignal,
): Promise<SttResult> {
  const langCode = normalizeLangCode(language);

  return retryWithBackoff(
    async () => {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('language', langCode);
      formData.append('lang_code', langCode);

      const response = await fetchWithTimeout('/api/v2/stt', {
        method: 'POST',
        body: formData,
        timeoutMs: STT_TIMEOUT_MS,
        signal,
      });

      if (response.status >= 400 && response.status < 500) {
        throw new NonRetryableError('STT client error', response.status);
      }

      if (!response.ok) {
        throw new Error(`STT server error: ${response.status}`);
      }

      const data = await response.json();
      return {
        transcript: data.transcript || '',
        success: Boolean(data.transcript),
        error: data.error,
      };
    },
    { maxRetries: STT_MAX_RETRIES, baseDelayMs: 1_000, signal },
  );
}
