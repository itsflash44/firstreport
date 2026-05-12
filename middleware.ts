import { NextRequest, NextResponse } from 'next/server';
import type { CookieOptions } from '@supabase/ssr';

/**
 * FirstReport — Route Protection Middleware (Production-Hardened v2)
 *
 * Fixes applied vs v1:
 * - Removed ! assertions — no crash when env vars are absent
 * - Offline-first: Supabase unavailable → allow access (offline PWA must work)
 * - Fast cookie path: skips network round-trip when session cookie is present
 * - Network/SDK failure → allow through (don't strand a citizen mid-crisis)
 * - /offline, /login, /verify, /api, static assets — always public
 * - Redirect preserves full destination path for post-auth return
 *
 * WHY OFFLINE-FIRST MATTERS:
 * Target user (Sunita Devi) has intermittent Jio 4G.
 * If Supabase auth is unreachable, she must still access her case.
 * All sensitive data is in localStorage/IndexedDB — she owns it locally.
 */

const SUPABASE_URL     = process.env.NEXT_PUBLIC_SUPABASE_URL     ?? '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

// Always-public — never require auth
const PUBLIC_PREFIXES = [
  '/login',
  '/verify',
  '/offline',
  '/api/',
  '/_next/',
  '/icons/',
  '/sw.js',
  '/manifest.json',
  '/screenshots/',
];

// Routes that ideally require auth
const PROTECTED_PREFIXES = ['/home', '/case', '/history'];

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const { pathname } = req.nextUrl;

  // ── Always allow public paths ─────────────────────────────────────────────
  if (PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p))) {
    return res;
  }

  // ── Only guard protected routes ───────────────────────────────────────────
  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + '/'),
  );
  if (!isProtected) return res;

  // ── Offline-only mode (no Supabase configured) ────────────────────────────
  // App is fully functional offline via localStorage + IndexedDB.
  // Allow access — auth is opt-in, not a hard gate.
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return res;
  }

  // ── Fast cookie presence check ────────────────────────────────────────────
  // Supabase SSR sets sb-{project-ref}-auth-token. If it's present, skip the
  // full network round-trip — Supabase validates it lazily on API calls.
  const projectRef = SUPABASE_URL.split('//')[1]?.split('.')[0] ?? '';
  const hasSessionCookie =
    req.cookies.has(`sb-${projectRef}-auth-token`) ||
    req.cookies.has('sb-access-token') ||
    req.cookies.has('supabase-auth-token');

  if (hasSessionCookie) return res;

  // ── Full Supabase verification (no cookie found) ──────────────────────────
  // Uses @supabase/ssr v0.5.x getAll/setAll API.
  // The supabaseResponse reference is captured so setAll can mutate it.
  try {
    const { createServerClient } = await import('@supabase/ssr');

    // Start with a passthrough response; setAll may recreate it with cookies.
    let supabaseResponse = NextResponse.next({ request: req });

    const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookiesToSet: { name: string; value: string; options: CookieOptions }[]) => {
          // Forward cookies to both the request and the response (SSR v0.5 pattern).
          cookiesToSet.forEach(({ name, value }: { name: string; value: string }) =>
            req.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request: req });
          cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options: CookieOptions }) =>
            supabaseResponse.cookies.set(name, value, options as Parameters<typeof supabaseResponse.cookies.set>[2]),
          );
        },
      },
    });

    const { data: { user }, error } = await supabase.auth.getUser();

    // Supabase network/service error — allow through (offline resilience)
    // "Auth session missing!" is the normal unauthenticated state — not an error.
    if (error && error.message !== 'Auth session missing!') {
      console.warn('[Middleware] Auth service error — offline resilience active:', error.message);
      return supabaseResponse;
    }

    // Authenticated — return supabaseResponse which may carry refreshed cookies
    if (user) return supabaseResponse;

    // Authenticated user required but not present — redirect to login
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);

  } catch (err) {
    // SDK import failure, network timeout, etc. — do not strand the citizen
    console.warn('[Middleware] Auth check threw — offline resilience active:', err);
    return res;
  }
}

export const config = {
  matcher: [
    /*
     * Match all requests EXCEPT:
     *   - _next/static   (Next.js build assets)
     *   - _next/image    (Next.js image optimisation)
     *   - favicon.ico    (browser default request)
     */
    '/((?!_next/static|_next/image|favicon\\.ico).*)',
  ],
};
