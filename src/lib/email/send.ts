import 'server-only';
import { asService } from '@/lib/db/client';
import { htmlToText } from '@/lib/email/layout';

/**
 * Outbound email.
 *
 * Three behaviours, chosen by EMAIL_TRANSPORT:
 *
 *   log     (default) — nothing leaves the building. Every message is written
 *                       to `sent_emails` and shown in the admin Email log, so
 *                       the presenter can open a booking confirmation on stage
 *                       without a real inbox or a real domain.
 *   catchall          — actually sends, but every recipient is rewritten to
 *                       DEMO_EMAIL_CATCH_ALL. The intended recipient is kept
 *                       in `intended_to` and shown in the log.
 *   live              — sends to the real recipient. Production only.
 *
 * In all three cases the message is written to `sent_emails` first, so a
 * provider outage never loses the record of what the site tried to send.
 */

export type EmailTransport = 'log' | 'catchall' | 'live';

export interface EmailAttachment {
  readonly filename: string;
  readonly content: string;
  readonly contentType: string;
}

export interface OutboundEmail {
  readonly to: string;
  readonly subject: string;
  readonly html: string;
  readonly text?: string;
  readonly replyTo?: string;
  /** Identifies the template in the admin log, e.g. 'booking-confirmation'. */
  readonly template: string;
  readonly attachments?: readonly EmailAttachment[];
  readonly meta?: Record<string, unknown>;
  readonly tier?: string;
}

export interface SendResult {
  readonly id: string;
  readonly status: 'logged' | 'sent' | 'failed';
  readonly deliveredTo: string;
  readonly error?: string;
}

function transport(): EmailTransport {
  const raw = (process.env.EMAIL_TRANSPORT ?? 'log').toLowerCase();
  if (raw === 'catchall' || raw === 'live') return raw;
  return 'log';
}

function fromAddress(): string {
  return process.env.EMAIL_FROM ?? 'Regulars <hello@regulars.ae>';
}

/** Where this message should actually go, given the transport. */
function resolveRecipient(intended: string): { to: string; redirected: boolean } {
  const mode = transport();
  if (mode === 'live') return { to: intended, redirected: false };

  const catchAll = process.env.DEMO_EMAIL_CATCH_ALL;
  if (mode === 'catchall' && catchAll) return { to: catchAll, redirected: true };

  return { to: catchAll ?? intended, redirected: Boolean(catchAll) };
}

export async function sendEmail(message: OutboundEmail): Promise<SendResult> {
  const mode = transport();
  const { to, redirected } = resolveRecipient(message.to);
  const text = message.text ?? htmlToText(message.html);

  const [row] = await asService(
    async (tx) => tx<{ id: string }[]>`
      insert into sent_emails (
        to_email, reply_to, subject, template, html_body, text_body,
        status, intended_to, attachments, meta, tier
      ) values (
        ${to},
        ${message.replyTo ?? null},
        ${message.subject},
        ${message.template},
        ${message.html},
        ${text},
        ${'logged'},
        ${redirected ? message.to : null},
        ${JSON.stringify(
          (message.attachments ?? []).map((a) => ({
            filename: a.filename,
            contentType: a.contentType,
            bytes: Buffer.byteLength(a.content, 'utf8'),
          })),
        )},
        ${JSON.stringify(message.meta ?? {})},
        ${message.tier ?? null}
      )
      returning id
    `,
  );

  const id = row?.id ?? 'unknown';

  if (mode === 'log') {
    return { id, status: 'logged', deliveredTo: to };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    await markFailed(id, 'RESEND_API_KEY is not set');
    return { id, status: 'failed', deliveredTo: to, error: 'RESEND_API_KEY is not set' };
  }

  try {
    // Imported lazily so the SDK never lands in a bundle that does not send.
    const { Resend } = await import('resend');
    const resend = new Resend(apiKey);

    const { data, error } = await resend.emails.send({
      from: fromAddress(),
      to: [to],
      subject: message.subject,
      html: message.html,
      text,
      replyTo: message.replyTo,
      attachments: message.attachments?.map((a) => ({
        filename: a.filename,
        content: Buffer.from(a.content, 'utf8').toString('base64'),
        contentType: a.contentType,
      })),
    });

    if (error) {
      await markFailed(id, error.message);
      return { id, status: 'failed', deliveredTo: to, error: error.message };
    }

    await asService(
      async (tx) => tx`
        update sent_emails set status = 'sent', provider_id = ${data?.id ?? null} where id = ${id}
      `,
    );
    return { id, status: 'sent', deliveredTo: to };
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'unknown transport error';
    await markFailed(id, reason);
    return { id, status: 'failed', deliveredTo: to, error: reason };
  }
}

async function markFailed(id: string, reason: string): Promise<void> {
  await asService(
    async (tx) => tx`update sent_emails set status = 'failed', error = ${reason} where id = ${id}`,
  );
}

/**
 * Fire-and-forget. A confirmation email failing must never fail the booking
 * that it confirms — the booking is already in the database and the email is
 * recoverable from the admin log.
 */
export function sendEmailDetached(message: OutboundEmail): void {
  void sendEmail(message).catch((error: unknown) => {
    console.error('[email] send failed', message.template, error);
  });
}

export function describeTransport(): { mode: EmailTransport; catchAll: string | null } {
  return { mode: transport(), catchAll: process.env.DEMO_EMAIL_CATCH_ALL ?? null };
}
