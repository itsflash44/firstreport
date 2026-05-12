const DEFAULT_TIMEOUT_MS = 10_000;

export interface FetchOptions extends Omit<RequestInit, 'signal'> {
  timeoutMs?: number;
  signal?: AbortSignal;
}

export async function fetchWithTimeout(
  url: string,
  options: FetchOptions = {},
): Promise<Response> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, signal: externalSignal, ...init } = options;

  const timeoutController = new AbortController();
  const timer = setTimeout(() => timeoutController.abort(), timeoutMs);

  const combinedSignal = externalSignal
    ? AbortSignal.any([timeoutController.signal, externalSignal])
    : timeoutController.signal;

  try {
    const response = await fetch(url, { ...init, signal: combinedSignal });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

export async function checkOnline(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return false;
  try {
    const res = await fetchWithTimeout('/api/v2/health', {
      method: 'HEAD',
      timeoutMs: 3_000,
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function isOffline(): boolean {
  return typeof navigator !== 'undefined' && !navigator.onLine;
}
