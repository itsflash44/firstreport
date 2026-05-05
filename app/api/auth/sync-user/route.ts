import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { upsertUser } from '@/lib/db/upsertUser';

/**
 * POST /api/auth/sync-user
 * Called after OTP verification to create/update the Prisma User row
 * that mirrors the Supabase Auth user.
 */
export async function POST(_req: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name: string) => cookieStore.get(name)?.value,
          set: () => {},
          remove: () => {},
        },
      },
    );

    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const dbUser = await upsertUser({
      id: user.id,
      phone: user.phone,
      email: user.email,
      user_metadata: user.user_metadata,
    });

    return NextResponse.json({ success: true, userId: dbUser?.id ?? user.id });
  } catch (err) {
    console.error('[auth/sync-user]', err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
