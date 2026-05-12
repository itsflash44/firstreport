import { fetchWithTimeout } from './network';
import { retryWithBackoff, NonRetryableError } from './retry';
import type { LangCode, PersonaId, Classification, CrimeInput } from '../types/index';

export interface PdfRequest {
  summary: string;
  classification: Classification;
  crimeInput: CrimeInput;
  language: LangCode;
  persona: PersonaId;
}

export interface PdfResult {
  pdf: ArrayBuffer | null;
  filename: string | null;
  success: boolean;
  error?: string;
}

const PDF_TIMEOUT_MS = 20_000;
const PDF_MAX_RETRIES = 2;

export async function generatePdf(
  request: PdfRequest,
  signal?: AbortSignal,
): Promise<PdfResult> {
  try {
    const result = await retryWithBackoff(
      async () => {
        const response = await fetchWithTimeout('/api/v2/generate-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
          timeoutMs: PDF_TIMEOUT_MS,
          signal,
        });

        if (response.status >= 400 && response.status < 500) {
          throw new NonRetryableError('PDF client error', response.status);
        }
        if (!response.ok) {
          throw new Error(`PDF server error: ${response.status}`);
        }

        const contentType = response.headers.get('content-type') ?? '';
        if (contentType.includes('application/pdf')) {
          const disposition = response.headers.get('content-disposition') ?? '';
          const filenameMatch = disposition.match(/filename="?([^";\s]+)"?/);
          const filename = filenameMatch?.[1] ?? 'firstreport.pdf';
          const pdf = await response.arrayBuffer();
          return { pdf, filename, success: true };
        }

        const data = await response.json();
        throw new Error(data.error || 'PDF returned non-PDF response');
      },
      { maxRetries: PDF_MAX_RETRIES, baseDelayMs: 1_000, signal },
    );

    return result;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return { pdf: null, filename: null, success: false, error: 'Aborted' };
    }
    return {
      pdf: null,
      filename: null,
      success: false,
      error: err instanceof Error ? err.message : 'PDF generation failed',
    };
  }
}
