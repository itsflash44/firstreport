import { fetchWithTimeout } from './network';
import { retryWithBackoff, NonRetryableError } from './retry';

export interface TelegramRequest {
  sessionId: string;
  pdf: ArrayBuffer;
  filename: string;
  chatId?: string;
}

export interface TelegramResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

const TELEGRAM_TIMEOUT_MS = 15_000;
const TELEGRAM_MAX_RETRIES = 2;

export async function sendDocument(
  request: TelegramRequest,
  signal?: AbortSignal,
): Promise<TelegramResult> {
  try {
    const result = await retryWithBackoff(
      async () => {
        const formData = new FormData();
        formData.append(
          'document',
          new Blob([request.pdf], { type: 'application/pdf' }),
          request.filename,
        );
        formData.append('sessionId', request.sessionId);
        if (request.chatId) {
          formData.append('chatId', request.chatId);
        }

        const response = await fetchWithTimeout('/api/v2/send-telegram', {
          method: 'POST',
          body: formData,
          timeoutMs: TELEGRAM_TIMEOUT_MS,
          signal,
        });

        if (response.status >= 400 && response.status < 500) {
          throw new NonRetryableError('Telegram client error', response.status);
        }
        if (!response.ok) {
          throw new Error(`Telegram server error: ${response.status}`);
        }

        const data = await response.json();
        return {
          success: true,
          messageId: data.messageId ?? data.message_id,
        };
      },
      { maxRetries: TELEGRAM_MAX_RETRIES, baseDelayMs: 1_000, signal },
    );

    return result;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return { success: false, error: 'Aborted' };
    }
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Telegram send failed',
    };
  }
}
