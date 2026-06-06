/**
 * FirstReport — TTS Audio Cache
 * ──────────────────────────────
 * In-memory LRU-style cache for Sarvam TTS audio blobs.
 * Keyed by `${text}::${language}` so the same sentence is never
 * fetched twice in a session — replay is instant.
 *
 * Stores Blob objects (not ObjectURLs) so they survive stopAll()
 * without being revoked. New ObjectURL is created on each play()
 * and revoked when that play ends.
 *
 * Max 30 entries to stay within ~6 MB on mobile.
 */

const MAX_ENTRIES = 30;
const cache = new Map<string, Blob>();

export function ttsCacheKey(text: string, language: string): string {
  // Use first 200 chars to keep key manageable
  return `${language}::${text.slice(0, 200)}`;
}

export function ttsGetCached(key: string): Blob | undefined {
  const blob = cache.get(key);
  if (blob) {
    // Move to end (most recently used)
    cache.delete(key);
    cache.set(key, blob);
  }
  return blob;
}

export function ttsSetCached(key: string, blob: Blob): void {
  if (cache.size >= MAX_ENTRIES) {
    // Evict oldest entry (first key in insertion order)
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  cache.set(key, blob);
}

export function ttsClearCache(): void {
  cache.clear();
}
