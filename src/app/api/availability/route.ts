import { NextResponse } from 'next/server';
import { brand } from '@/lib/config/brand';
import { getAvailability, getDateAvailabilitySummary } from '@/lib/db/queries';
import { availabilityQuerySchema } from '@/lib/validation/schemas';
import { rateLimit } from '@/lib/utils/rate-limit';
import { isDatabaseConfigured } from '@/lib/db/client';

/**
 * Slot availability for the booking flow.
 *
 * Read-only and public, but still rate limited: it is the one endpoint that
 * does real work per call, and scraping it would map the whole book.
 *
 * `?summary=14` returns per-day open-slot counts instead of slots, which is
 * what the date step needs to grey out days that are full or closed.
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
  const parsed = availabilityQuerySchema.safeParse({
    date: url.searchParams.get('date'),
    partySize: url.searchParams.get('partySize'),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_request', issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const limit = await rateLimit({ bucket: 'availability', limit: 120, windowSeconds: 300 });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'rate_limited', retryAfterSeconds: limit.retryAfterSeconds },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } },
    );
  }

  const { date, partySize } = parsed.data;
  const summaryDays = Number(url.searchParams.get('summary') ?? 0);

  try {
    if (summaryDays > 0) {
      const days = Math.min(Math.max(summaryDays, 1), 60);
      const summary = await getDateAvailabilitySummary(date, days, partySize, brand.timezone);
      return NextResponse.json({ partySize, from: date, days, summary });
    }

    const slots = await getAvailability(date, partySize, brand.timezone);
    return NextResponse.json({
      date,
      partySize,
      slots,
      anyAvailable: slots.some((slot) => slot.available),
    });
  } catch (error) {
    console.error('[availability] failed', error);
    return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  }
}
