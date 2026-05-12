/**
 * FirstReport — Connectivity Ping Endpoint
 * Used by sync engine to verify actual internet connectivity.
 */
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Cache-Control': 'no-cache, no-store',
      'X-FirstReport-Ping': 'ok',
    },
  });
}

export function GET() {
  return NextResponse.json({ ok: true, ts: Date.now() }, {
    headers: { 'Cache-Control': 'no-cache, no-store' },
  });
}
