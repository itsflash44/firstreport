import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/db/sessions';

/**
 * GET /api/sessions/[id] — Return full session with all relations.
 * Used by /classify and /documents pages to restore state from DB.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getSession(params.id);
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, session });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 });
  }
}
