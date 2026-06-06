import { NextRequest, NextResponse } from 'next/server';
import {
  recordTelegramDelivery,
  enqueueOfflineItem,
  updateSessionStatus,
} from '@/lib/db/sessions';

const PYTHON_URL = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';

/**
 * POST /api/send-telegram — Proxies to Python for Telegram delivery.
 * Records delivery status and queues failures in Supabase.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const sessionId: string = body.session_id || body.sessionId || '';

    const res = await fetch(`${PYTHON_URL}/api/send-telegram`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    // ── DB: record delivery outcomes ──────────────────────────────────────────
    if (sessionId) {
      const results: Record<string, { success?: boolean; queued?: boolean; error?: string }> =
        data.results || {};

      for (const [key, result] of Object.entries(results)) {
        const status = result.success ? 'SENT' : result.queued ? 'QUEUED' : 'FAILED';
        await recordTelegramDelivery(sessionId, null, status, result.error);

        // Also persist to offline queue as backup if queued/failed
        if (!result.success && sessionId) {
          await enqueueOfflineItem(sessionId, null, {
            filename: `FirstReport_${key}_${sessionId.slice(0, 8)}.pdf`,
            caption: key,
            chatId: TELEGRAM_CHAT_ID,
          });
        }
      }

      // Mark session as SENT if all delivered
      if (data.all_sent) {
        await updateSessionStatus(sessionId, 'SENT');
      }
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { success: false, error: 'Telegram send failed — queued for offline delivery' },
      { status: 503 },
    );
  }
}
