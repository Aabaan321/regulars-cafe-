import { NextResponse } from 'next/server';
import { getTablesAt } from '@/lib/db/queries';
import { rateLimit } from '@/lib/utils/rate-limit';
import { isDatabaseConfigured } from '@/lib/db/client';

/**
 * Which tables are free at a given instant, with their plan coordinates.
 *
 * Feeds Tier 3's floor plan. Read-only and public like `/api/availability`,
 * and rate limited for the same reason: it is the endpoint that would let
 * someone map the whole book table by table.
 *
 * It deliberately returns *all* tables rather than only the free ones — the
 * plan has to draw the room, and a floor plan that hides taken tables is a
 * floor plan with holes in it.
 */

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: 'no_database', message: 'This deployment has no database connected.' },
      { status: 503 },
    );
  }

  const url = new URL(request.url);
  const slot = url.searchParams.get('slot') ?? '';
  const partySize = Number(url.searchParams.get('partySize') ?? 0);

  const instant = new Date(slot);
  if (!slot || Number.isNaN(instant.getTime())) {
    return NextResponse.json({ error: 'invalid_request', field: 'slot' }, { status: 400 });
  }
  if (!Number.isInteger(partySize) || partySize < 1 || partySize > 20) {
    return NextResponse.json({ error: 'invalid_request', field: 'partySize' }, { status: 400 });
  }

  const limit = await rateLimit({ bucket: 'tables', limit: 120, windowSeconds: 300 });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'rate_limited', retryAfterSeconds: limit.retryAfterSeconds },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } },
    );
  }

  try {
    const tables = await getTablesAt(instant.toISOString(), partySize);
    return NextResponse.json({ slot: instant.toISOString(), partySize, tables });
  } catch (error) {
    console.error('[tables] failed', error);
    return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  }
}
