export interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  signal?: AbortSignal;
}

const DEFAULT_CONFIG: RetryConfig = {
  maxRetries: 2,
  baseDelayMs: 1_000,
};

export class NonRetryableError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'NonRetryableError';
  }
}

function jitteredDelay(baseMs: number, attempt: number): number {
  const exponential = baseMs * Math.pow(2, attempt);
  const jitter = exponential * (0.8 + Math.random() * 0.4);
  return Math.min(jitter, 30_000);
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason ?? new DOMException('Aborted', 'AbortError'));
      return;
    }
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(signal.reason ?? new DOMException('Aborted', 'AbortError'));
    }, { once: true });
  });
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {},
): Promise<T> {
  const { maxRetries, baseDelayMs, signal } = { ...DEFAULT_CONFIG, ...config };

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (signal?.aborted) {
      throw signal.reason ?? new DOMException('Aborted', 'AbortError');
    }

    try {
      return await fn();
    } catch (err) {
      lastError = err;

      if (err instanceof NonRetryableError) throw err;
      if (err instanceof DOMException && err.name === 'AbortError') throw err;

      if (attempt < maxRetries) {
        const delay = jitteredDelay(baseDelayMs, attempt);
        await sleep(delay, signal);
      }
    }
  }

  throw lastError;
}
