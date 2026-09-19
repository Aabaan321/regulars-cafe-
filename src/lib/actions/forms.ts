'use server';

import { revalidatePath } from 'next/cache';
import { asService } from '@/lib/db/client';
import { sendEmail, sendEmailDetached } from '@/lib/email/send';
import {
  enquiryAckEmail,
  enquiryAlertEmail,
  subscribeConfirmEmail,
} from '@/lib/email/templates';
import { brand, siteUrl } from '@/lib/config/brand';
import { issueToken } from '@/lib/utils/tokens';
import { looksAutomated, rateLimit } from '@/lib/utils/rate-limit';
import { enquirySchema, subscribeSchema, toFieldErrors } from '@/lib/validation/schemas';
import { getDictionary, type Locale } from '@/lib/i18n/dictionaries';
import type { FormState } from '@/lib/actions/form-state';

/**
 * Server actions for the public forms.
 *
 * These are actions rather than fetch-to-an-API-route so the forms work with
 * JavaScript disabled: the browser posts the form, the action runs, the page
 * re-renders with the result. With JS on, `useActionState` upgrades the same
 * code path to an inline, non-navigating submit.
 *
 * Order of operations on every public write, without exception:
 *   1. bot check (honeypot + time-to-submit)   — cheapest, no DB
 *   2. Zod parse                               — no DB write on malformed input
 *   3. rate limit                              — one atomic counter
 *   4. write, as service_role
 *   5. email, detached, so a mail failure never fails the write
 */

function values(formData: FormData, keys: readonly string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of keys) {
    const value = formData.get(key);
    if (typeof value === 'string') out[key] = value;
  }
  return out;
}

/* ── Contact ──────────────────────────────────────────────────────────────── */

const ENQUIRY_FIELDS = ['name', 'email', 'phone', 'topic', 'message'] as const;

export async function submitEnquiry(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const locale = (formData.get('locale') as Locale) ?? 'en';
  const dict = getDictionary(locale);
  const echoed = values(formData, ENQUIRY_FIELDS);

  if (
    looksAutomated({
      honeypot: formData.get('website') as string | null,
      renderedAt: Number(formData.get('renderedAt')) || null,
    })
  ) {
    // Indistinguishable from success: a bot that learns it was caught adapts.
    return { status: 'success', message: dict.forms.successBody };
  }

  const parsed = enquirySchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    phone: formData.get('phone') ?? '',
    topic: formData.get('topic') ?? 'general',
    message: formData.get('message'),
    locale,
    sourceTier: formData.get('sourceTier') ?? 'essential',
    website: formData.get('website') ?? '',
    renderedAt: formData.get('renderedAt') ?? undefined,
  });

  if (!parsed.success) {
    return {
      status: 'error',
      message: dict.forms.fixErrors,
      fieldErrors: toFieldErrors(parsed.error),
      values: echoed,
    };
  }

  const limit = await rateLimit({
    bucket: 'enquiry',
    limit: 5,
    windowSeconds: 3600,
    extraIdentity: parsed.data.email,
  });
  if (!limit.allowed) {
    return { status: 'error', message: dict.forms.rateLimited, values: echoed };
  }

  const data = parsed.data;

  try {
    await asService(
      async (tx) => tx`
        insert into enquiries (name, email, phone, topic, message, source_tier, locale)
        values (
          ${data.name}, ${data.email}, ${data.phone || null}, ${data.topic},
          ${data.message}, ${data.sourceTier}, ${data.locale}
        )
      `,
    );
  } catch (error) {
    console.error('[enquiry] insert failed', error);
    return { status: 'error', message: dict.forms.errorBody, values: echoed };
  }

  const alert = enquiryAlertEmail({
    name: data.name,
    email: data.email,
    phone: data.phone || undefined,
    topic: data.topic,
    message: data.message,
    tier: data.sourceTier,
  });
  sendEmailDetached({
    to: brand.contact.email,
    replyTo: data.email,
    subject: alert.subject,
    html: alert.html,
    template: 'enquiry-alert',
    tier: data.sourceTier,
    meta: { topic: data.topic },
  });

  const ack = enquiryAckEmail({ name: data.name });
  sendEmailDetached({
    to: data.email,
    subject: ack.subject,
    html: ack.html,
    template: 'enquiry-acknowledgement',
    tier: data.sourceTier,
  });

  return { status: 'success', message: dict.forms.successBody };
}

/* ── Newsletter ───────────────────────────────────────────────────────────── */

export async function subscribeToNewsletter(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const locale = (formData.get('locale') as Locale) ?? 'en';
  const dict = getDictionary(locale);
  const echoed = values(formData, ['email', 'name']);

  if (
    looksAutomated({
      honeypot: formData.get('website') as string | null,
      renderedAt: Number(formData.get('renderedAt')) || null,
      // The footer form is a single field; a fast human is plausible here.
      minimumMs: 800,
    })
  ) {
    return { status: 'success', message: dict.newsletter.pendingBody };
  }

  const parsed = subscribeSchema.safeParse({
    email: formData.get('email'),
    name: formData.get('name') ?? '',
    source: formData.get('source') ?? 'footer',
    locale,
    sourceTier: formData.get('sourceTier') ?? 'essential',
    website: formData.get('website') ?? '',
    renderedAt: formData.get('renderedAt') ?? undefined,
  });

  if (!parsed.success) {
    return {
      status: 'error',
      message: dict.forms.fixErrors,
      fieldErrors: toFieldErrors(parsed.error),
      values: echoed,
    };
  }

  const limit = await rateLimit({
    bucket: 'subscribe',
    limit: 4,
    windowSeconds: 3600,
    extraIdentity: parsed.data.email,
  });
  if (!limit.allowed) {
    return { status: 'error', message: dict.forms.rateLimited, values: echoed };
  }

  const data = parsed.data;

  try {
    // Upsert, so re-subscribing after an unsubscribe works and a double submit
    // does not create a second row. An already-confirmed address is a no-op
    // that still reports success — we must not disclose who is subscribed.
    const rows = await asService(
      async (tx) => tx<{ id: string; status: string }[]>`
        insert into subscribers (email, name, source, source_tier, locale, status)
        values (${data.email}, ${data.name || null}, ${data.source}, ${data.sourceTier}, ${data.locale}, 'pending')
        on conflict (email) do update
          set name        = coalesce(excluded.name, subscribers.name),
              source      = excluded.source,
              source_tier = excluded.source_tier,
              locale      = excluded.locale,
              status      = case
                              when subscribers.status = 'confirmed' then 'confirmed'::subscriber_status
                              else 'pending'::subscriber_status
                            end
        returning id, status::text as status
      `,
    );

    const row = rows[0];
    if (!row) return { status: 'error', message: dict.forms.errorBody, values: echoed };

    if (row.status === 'confirmed') {
      return { status: 'success', message: dict.newsletter.alreadyTitle };
    }

    const confirm = issueToken('confirm-subscription', row.id);
    await asService(
      async (tx) => tx`
        update subscribers
           set confirm_token_hash = ${confirm.hash}, confirm_sent_at = now()
         where id = ${row.id}
      `,
    );

    const email = subscribeConfirmEmail({
      confirmUrl: `${siteUrl}/api/subscribe/confirm?token=${encodeURIComponent(confirm.token)}`,
    });
    await sendEmail({
      to: data.email,
      subject: email.subject,
      html: email.html,
      template: 'subscribe-confirm',
      tier: data.sourceTier,
    });
  } catch (error) {
    console.error('[subscribe] failed', error);
    return { status: 'error', message: dict.forms.errorBody, values: echoed };
  }

  revalidatePath('/');
  return { status: 'success', message: dict.newsletter.pendingBody };
}
