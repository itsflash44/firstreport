import { NextRequest, NextResponse } from 'next/server';
import { createSession, addClarificationTurn, updateSessionSummary } from '@/lib/db/sessions';

const PYTHON_URL = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';

/**
 * POST /api/clarify — Proxies to Python /api/clarify.
 * Sends chat history, gets AI follow-up question or completion signal.
 * Also persists session + clarification turns to Supabase via Prisma.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // ── DB: get or create session ────────────────────────────────────────────
    let sessionId: string = body.sessionId || '';
    if (!sessionId) {
      sessionId = (await createSession({
        userId: body.userId ?? null,
        language: body.language || 'hi-IN',
        urgencyLevel: body.urgencyLevel ?? 1,
        personaId: body.personaId ?? 'standard',
      })) ?? '';
    }

    // ── DB: save this user turn (if transcript present) ──────────────────────
    const turnCount = (body.history?.length ?? 0);
    if (body.transcript && sessionId) {
      await addClarificationTurn(sessionId, 'USER', body.transcript, turnCount);
    }

    // ── Proxy to Python ───────────────────────────────────────────────────────
    const res = await fetch(`${PYTHON_URL}/api/clarify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transcript: body.transcript,
        history: body.history || [],
        lang_code: body.language || 'hi-IN',
      }),
    });

    const data = await res.json();

    // ── DB: save AI response turn + update summary when complete ─────────────
    if (sessionId) {
      if (data.question) {
        await addClarificationTurn(sessionId, 'AI', data.question, turnCount + 1);
      }
      if (data.isComplete && data.summary) {
        await updateSessionSummary(sessionId, data.summary);
      }
    }

    return NextResponse.json({ ...data, sessionId });
  } catch {
    return NextResponse.json(
      { question: null, isComplete: false, summary: '', sessionId: '' },
      { status: 503 },
    );
  }
}
