import { NextRequest, NextResponse } from 'next/server';
import { getPendingQueueItems } from '@/lib/db/sessions';

/**
 * GET /api/queue/status
 * Returns count and list of pending offline queue items.
 * Polled by OfflineQueueCard every 30 seconds.
 */
export async function GET(_req: NextRequest) {
  try {
    const items = await getPendingQueueItems();
    return NextResponse.json({
      pending: items.length,
      items: items.map((i) => ({
        id: i.id,
        sessionId: i.sessionId,
        retryCount: i.retryCount,
        createdAt: i.createdAt,
      })),
      statusHindi:
        items.length > 0
          ? `${items.length} दस्तावेज़ भेजने बाकी — नेटवर्क आने पर भेजे जाएंगे`
          : '',
      showCard: items.length > 0,
    });
  } catch {
    return NextResponse.json({ pending: 0, items: [], showCard: false }, { status: 500 });
  }
}
