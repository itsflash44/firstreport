/**
 * FirstReport — Service Worker (Production-Hardened v2)
 *
 * Offline-first PWA for Jio 4G intermittent connectivity (Sunita Devi constraint).
 *
 * Fixes applied vs v1:
 * - Removed /home + /history from PRECACHE_ASSETS — they require auth.
 *   When cached, they would be served stale by SW, then middleware would
 *   redirect to /login, which is NOT cached → network error offline.
 * - /offline is precached → guaranteed fallback without auth requirement.
 * - CACHE_VERSION bumped to v2 → old v1 caches are deleted on activate.
 * - X-SW-Bypass header respected: bypasses cache for ping/sync/upload.
 * - Tesseract WASM + langdata from CDN are cached with 7-day TTL.
 * - HTML pages use stale-while-revalidate so returning users see content fast.
 * - API calls use network-first with 8s timeout + offline JSON fallback.
 * - AbortSignal.timeout used for reliable network timeouts on slow Jio.
 */

const CACHE_VERSION = 'firstReport-v2.0';
const STATIC_CACHE  = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const API_CACHE     = `${CACHE_VERSION}-api`;
const TESSDATA_CACHE = `${CACHE_VERSION}-tessdata`;

// ── Pre-cached on install (must NOT require authentication) ──────────────────
// /home and /history are NOT here — they redirect to /login when unauthenticated,
// which means caching them offline produces a blank/redirect loop.
const PRECACHE_ASSETS = [
  '/offline',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// ── Always bypass cache (write operations, ping, sync) ──────────────────────
const NEVER_CACHE_PATTERNS = [
  '/api/documents/upload',
  '/api/sync',
  '/api/ping',
  '/api/legal-journey',
  '/api/stt',
  '/api/tts',
];

// ── Network-first (must be fresh) ────────────────────────────────────────────
const NETWORK_FIRST_PATTERNS = [
  '/api/',
  '/auth/',
];

// ── Tesseract CDN origins (cache with long TTL) ──────────────────────────────
const TESSDATA_ORIGINS = [
  'tessdata.projectnaptha.com',
  'cdn.jsdelivr.net',
  'unpkg.com',
];

// ─────────────────────────────────────────────────────────────────────────────
// INSTALL
// ─────────────────────────────────────────────────────────────────────────────

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_ASSETS).catch((err) => {
        // Non-fatal — app still works without pre-cache
        console.warn('[SW] Precache partial failure:', err);
      }))
      .then(() => self.skipWaiting()),
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// ACTIVATE — delete old version caches
// ─────────────────────────────────────────────────────────────────────────────

self.addEventListener('activate', (event) => {
  const CURRENT_CACHES = new Set([STATIC_CACHE, DYNAMIC_CACHE, API_CACHE, TESSDATA_CACHE]);
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(
        names
          .filter((n) => n.startsWith('firstReport-') && !CURRENT_CACHES.has(n))
          .map((n) => {
            console.log('[SW] Deleting old cache:', n);
            return caches.delete(n);
          }),
      ))
      .then(() => self.clients.claim()),
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// FETCH — intelligent routing
// ─────────────────────────────────────────────────────────────────────────────

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only intercept GET (POST/PUT go straight to network)
  if (request.method !== 'GET') return;

  // SW bypass header (set by sync engine / ping route)
  if (request.headers.get('X-SW-Bypass') === 'true') return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return; // malformed URL — pass through
  }

  // Skip non-http(s) protocols
  if (!url.protocol.startsWith('http')) return;

  // Never-cache: write operations, sync endpoints
  if (NEVER_CACHE_PATTERNS.some((p) => url.pathname.startsWith(p))) return;

  // Tesseract CDN data — long-lived cache (language data is ~35MB, expensive to re-download on Jio)
  if (TESSDATA_ORIGINS.some((origin) => url.hostname.includes(origin))) {
    event.respondWith(cacheFirst(request, TESSDATA_CACHE, { maxAge: 7 * 24 * 60 * 60 }));
    return;
  }

  // API routes — network first with cache fallback
  if (NETWORK_FIRST_PATTERNS.some((p) => url.pathname.startsWith(p))) {
    event.respondWith(networkFirst(request, API_CACHE));
    return;
  }

  // Next.js static assets (hashed filenames) — cache forever
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Static files by extension
  if (/\.(js|css|woff2?|png|jpg|jpeg|svg|ico|webp|ttf|otf)$/.test(url.pathname)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE, { maxAge: 7 * 24 * 60 * 60 }));
    return;
  }

  // HTML pages — stale-while-revalidate for fast load + background freshness
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
    return;
  }

  // Default: network, cache on success, fallback offline
  event.respondWith(networkWithCacheFallback(request, DYNAMIC_CACHE));
});

// ─────────────────────────────────────────────────────────────────────────────
// CACHING STRATEGIES
// ─────────────────────────────────────────────────────────────────────────────

async function cacheFirst(request, cacheName, options = {}) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) {
    if (options.maxAge) {
      const fetchedAt = parseInt(cached.headers.get('sw-fetched-at') ?? '0');
      if (fetchedAt && Date.now() - fetchedAt > options.maxAge * 1000) {
        // Background revalidation (stale but usable)
        fetch(request.clone()).then((res) => {
          if (res.ok) cache.put(request, stampResponse(res));
        }).catch(() => {});
      }
    }
    return cached;
  }

  try {
    const response = await fetch(request.clone());
    if (response.ok) cache.put(request, stampResponse(response.clone()));
    return response;
  } catch {
    return offlineFallback(request);
  }
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request.clone(), {
      signal: AbortSignal.timeout(8000),
    });
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    if (cached) return cached;
    // Offline JSON response for API calls
    if (request.headers.get('accept')?.includes('application/json') ||
        new URL(request.url).pathname.startsWith('/api/')) {
      return new Response(
        JSON.stringify({ offline: true, error: 'No network connection' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } },
      );
    }
    return offlineFallback(request);
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  // Revalidate in background regardless
  const fetchPromise = fetch(request.clone())
    .then((res) => { if (res.ok) cache.put(request, res.clone()); return res; })
    .catch(() => null);

  // Return cached immediately if available, else wait for network
  if (cached) return cached;
  const fresh = await fetchPromise;
  return fresh ?? offlineFallback(request);
}

async function networkWithCacheFallback(request, cacheName) {
  try {
    const response = await fetch(request.clone());
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cache = await caches.open(cacheName);
    return (await cache.match(request)) ?? offlineFallback(request);
  }
}

/** Stamp response with fetch timestamp for max-age checking */
function stampResponse(response) {
  const headers = new Headers(response.headers);
  headers.set('sw-fetched-at', String(Date.now()));
  return new Response(response.body, {
    status:     response.status,
    statusText: response.statusText,
    headers,
  });
}

async function offlineFallback(request) {
  if (request.headers.get('accept')?.includes('text/html')) {
    const cache = await caches.open(STATIC_CACHE);
    const offline = await cache.match('/offline');
    if (offline) return offline;
    // Inline minimal offline page (last resort if /offline not cached)
    return new Response(
      `<!DOCTYPE html><html lang="hi"><head><meta charset="utf-8">
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <title>FirstReport — ऑफलाइन</title>
      <style>body{margin:0;font-family:sans-serif;background:#0F1F3D;color:white;
      display:flex;flex-direction:column;align-items:center;justify-content:center;
      min-height:100vh;text-align:center;padding:2rem}
      h1{font-size:1.5rem;margin-bottom:1rem}p{color:#9ca3af;margin-bottom:2rem}
      a{color:#5FA8A0;text-decoration:none}
      .nalsa{display:inline-block;background:#D9534F;color:white;padding:.75rem 1.5rem;
      border-radius:.25rem;font-weight:700;font-size:1.1rem}</style></head>
      <body><h1>📡 इंटरनेट नहीं है</h1>
      <p>आपका डेटा सुरक्षित है। इंटरनेट वापस आने पर अपने आप सिंक होगा।</p>
      <p>Your data is safe and will sync automatically when connectivity returns.</p>
      <a href="tel:15100" class="nalsa">📞 NALSA हेल्पलाइन · 15100</a></body></html>`,
      { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
    );
  }
  return new Response('Offline', { status: 503 });
}

// ─────────────────────────────────────────────────────────────────────────────
// BACKGROUND SYNC — notify app to run sync cycle
// ─────────────────────────────────────────────────────────────────────────────

self.addEventListener('sync', (event) => {
  if (event.tag === 'firstReport-sync') {
    event.waitUntil(
      self.clients.matchAll({ includeUncontrolled: true }).then((clients) => {
        clients.forEach((client) =>
          client.postMessage({ type: 'BACKGROUND_SYNC_TRIGGER' }),
        );
      }),
    );
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// MESSAGES — from app to SW
// ─────────────────────────────────────────────────────────────────────────────

self.addEventListener('message', (event) => {
  switch (event.data?.type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
    case 'CACHE_URLS': {
      const urls = event.data.urls ?? [];
      caches.open(STATIC_CACHE).then((cache) => cache.addAll(urls)).catch(() => {});
      break;
    }
    case 'CLEAR_API_CACHE':
      caches.delete(API_CACHE).catch(() => {});
      break;
  }
});
