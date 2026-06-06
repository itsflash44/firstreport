import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';

/**
 * GET /api/auth/me
 * Returns the current user's Prisma profile + last 5 sessions.
 * Used by (app)/layout.tsx to populate user context.
 */
export async function GET(_req: NextRequest) {
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

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ user: null });
    }

    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        sessions: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: { id: true, incidentSummary: true, status: true, createdAt: true },
        },
      },
    });

    return NextResponse.json({ user: profile ?? { id: user.id, phone: user.phone, email: user.email } });
  } catch {
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
