import { NextResponse } from 'next/server';
import { asService } from '@/lib/db/client';
import { parseToken } from '@/lib/utils/tokens';
import { siteUrl } from '@/lib/config/brand';

/**
 * One-click unsubscribe.
 *
 * Idempotent: unsubscribing twice is a success, not an error. The row is kept
 * with `status = 'unsubscribed'` rather than deleted, so a later re-subscribe
 * does not silently resurrect somebody who asked to be left alone.
 */

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get('token');
  const redirectTo = (status: string) =>
    NextResponse.redirect(`${siteUrl}/essential/newsletter?status=${status}`, { status: 303 });

  if (!token) return redirectTo('invalid');

  const parsed = parseToken(token, 'unsubscribe');
  if (!parsed) return redirectTo('invalid');

  const rows = await asService(
    async (tx) => tx<{ id: string }[]>`
      update subscribers
         set status = 'unsubscribed', unsubscribed_at = now()
       where unsubscribe_token_hash = ${parsed.hash}
       returning id
    `,
  );

  return redirectTo(rows.length > 0 ? 'unsubscribed' : 'invalid');
}

/** RFC 8058 one-click unsubscribe, for mail clients that POST instead. */
export async function POST(request: Request) {
  return GET(request);
}
