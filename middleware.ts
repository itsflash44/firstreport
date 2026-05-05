import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * FirstReport — Route Protection Middleware
 * ==========================================
 * Protects all (app) group routes. Redirects unauthenticated users to /login.
 * Uses Supabase SSR client (anon key + cookies) — safe for Edge Runtime.
 * DOES NOT import Prisma — Prisma cannot run in Edge Runtime.
 */
export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => req.cookies.get(name)?.value,
        set: (name: string, value: string, options: Record<string, unknown>) => {
          res.cookies.set({ name, value, ...options });
        },
        remove: (name: string, options: Record<string, unknown>) => {
          res.cookies.set({ name, value: '', ...options });
        },
      },
    },
  );

  // Refresh session token (updates cookies on the response)
  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = req.nextUrl;

  // Protected routes — require login
  const protectedPaths = ['/home', '/chat', '/classify', '/documents', '/history'];
  const isProtected = protectedPaths.some(
    (p) => pathname === p || pathname.startsWith(p + '/'),
  );

  if (isProtected && !user) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return res;
}

export const config = {
  matcher: [
    '/home/:path*',
    '/chat/:path*',
    '/classify/:path*',
    '/documents/:path*',
    '/history/:path*',
  ],
};
