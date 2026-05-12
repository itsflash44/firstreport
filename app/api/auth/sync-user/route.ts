import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { upsertUser } from '@/lib/db/upsertUser';
import type { CookieOptions } from '@supabase/ssr';

/**
 * POST /api/auth/sync-user
 *
 * Called after OTP verification (and on Google OAuth callback) to create
 * or update the Prisma User row that mirrors the Supabase Auth user.
 *
 * Fixes applied:
 * - Updated to @supabase/ssr v0.5 getAll/setAll cookie API (was get/set/remove)
 * - cookies() is now awaited (Next.js 14 requirement)
 * - upsertUser receives full user_metadata so real name is persisted
 * - Returns 200 on all errors so the client never retries in a crash loop
 */
export async function POST(_req: NextRequest) {
  try {
    // Next.js 14: cookies() returns a Promise — must be awaited
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          // @supabase/ssr v0.5: getAll / setAll
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet: { name: string; value: string; options: CookieOptions }[]) => {
            cookiesToSet.forEach(({ name, value, options }) => {
              try {
                cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2]);
              } catch {
                // Read-only context (middleware) — ignore safely
              }
            });
          },
        },
      },
    );

    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const dbUser = await upsertUser({
      id:            user.id,
      phone:         user.phone,
      email:         user.email,
      user_metadata: user.user_metadata as { full_name?: string; name?: string } | undefined,
    });

    return NextResponse.json({ success: true, userId: dbUser?.id ?? user.id });
  } catch (err) {
    console.error('[auth/sync-user]', err);
    // Return 200 so the client does not retry in a crash loop
    return NextResponse.json({ success: false, error: 'sync failed' }, { status: 200 });
  }
}
