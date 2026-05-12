/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      // ── Service Worker — never cache, must be served fresh ────────────
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
      // ── API routes — no caching, CORS-safe ──────────────────────────
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
      // ── Ping endpoint — must bypass SW cache ─────────────────────────
      {
        source: '/api/ping',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'X-SW-Bypass', value: 'true' },
        ],
      },
      // ── Security headers for all routes ──────────────────────────────
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // NOTE: COEP/COOP deliberately NOT applied globally.
          // They would break Supabase Auth, Sarvam AI, Gemini API cross-origin calls.
          // Tesseract.js uses single-threaded mode (no SharedArrayBuffer required).
        ],
      },
    ];
  },

  // Webpack: exclude Python dirs + handle Tesseract wasm
  webpack: (config) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        '**/backend/**', '**/core/**', '**/legal/**',
        '**/offline/**', '**/output/**', '**/demo/**',
      ],
    };

    // Handle Tesseract.js wasm files in browser-only context
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    };

    return config;
  },
};

module.exports = nextConfig;
