import { NextResponse } from 'next/server';
import { asService } from '@/lib/db/client';
import { sendEmailDetached } from '@/lib/email/send';
import { subscribeWelcomeEmail } from '@/lib/email/templates';
import { issueToken, parseToken } from '@/lib/utils/tokens';
import { siteUrl } from '@/lib/config/brand';

/**
 * Double opt-in confirmation.
 *
 * The link in the confirmation email lands here. The token is HMAC-verified,
 * then looked up by hash — a structurally valid token for a row that has been
 * deleted, already confirmed or unsubscribed is not honoured.
 *
 * Always redirects to a human-readable page rather than returning JSON: this
 * URL is opened by a person in a mail client, not by a script.
 */

export const dynamic = 'force-dynamic';

function outcome(status: string): NextResponse {
  return NextResponse.redirect(`${siteUrl}/essential/newsletter?status=${status}`, { status: 303 });
}

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get('token');
  if (!token) return outcome('invalid');

  const parsed = parseToken(token, 'confirm-subscription');
  if (!parsed) return outcome('invalid');

  const rows = await asService(
    async (tx) => tx<{ id: string; email: string; status: string }[]>`
      select id, email::text, status::text as status
        from subscribers
       where confirm_token_hash = ${parsed.hash}
       limit 1
    `,
  );

  const row = rows[0];
  if (!row) return outcome('invalid');
  if (row.status === 'confirmed') return outcome('already');

  // The unsubscribe token is issued now and lives for the life of the
  // subscription, so every future newsletter can carry a one-click opt-out.
  const unsubscribe = issueToken('unsubscribe', row.id);

  await asService(
    async (tx) => tx`
      update subscribers
         set status = 'confirmed',
             confirmed_at = now(),
             confirm_token_hash = null,
             unsubscribe_token_hash = ${unsubscribe.hash}
       where id = ${row.id}
    `,
  );

  const email = subscribeWelcomeEmail({
    unsubscribeUrl: `${siteUrl}/api/subscribe/unsubscribe?token=${encodeURIComponent(unsubscribe.token)}`,
  });
  sendEmailDetached({
    to: row.email,
    subject: email.subject,
    html: email.html,
    template: 'subscribe-welcome',
  });

  return outcome('confirmed');
}
