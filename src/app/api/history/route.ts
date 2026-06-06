import { NextRequest, NextResponse } from 'next/server';
import { listUserSessions } from '@/lib/db/sessions';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';

/**
 * GET /api/history — Return DB-backed session history for the current user.
 * POST /api/history — Sync a localStorage history entry to the DB.
 */

function getSupabaseServer() {
  const cookieStore = cookies();
  return createServerClient(
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
}

export async function GET(_req: NextRequest) {
  try {
    const supabase = getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ sessions: [] }); // anonymous — return empty
    }

    const sessions = await listUserSessions(user.id, 50);
    return NextResponse.json({ success: true, sessions });
  } catch {
    return NextResponse.json({ sessions: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    // Upsert a minimal session row to represent this history entry
    const sessionId: string = body.id || '';
    if (sessionId) {
      await prisma.session.upsert({
        where: { id: sessionId },
        create: {
          id: sessionId,
          userId: user?.id ?? '',
          language: body.language || 'hi-IN',
          rawTranscriptJson: JSON.stringify([]),
          incidentSummary: body.summary || '',
          status: 'CLASSIFIED',
          consentGiven: false,
        },
        update: {
          incidentSummary: body.summary || '',
          status: 'CLASSIFIED',
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
