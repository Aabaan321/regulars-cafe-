'use server';

import { revalidatePath } from 'next/cache';
import { asService, isDatabaseConfigured } from '@/lib/db/client';
import { sendEmail, sendEmailDetached } from '@/lib/email/send';
import {
  enquiryAckEmail,
  enquiryAlertEmail,
  eventEnquiryAlertEmail,
  subscribeConfirmEmail,
} from '@/lib/email/templates';
import { brand, siteUrl } from '@/lib/config/brand';
import { issueToken } from '@/lib/utils/tokens';
import { looksAutomated, rateLimit } from '@/lib/utils/rate-limit';
import {
  enquirySchema,
  eventEnquirySchema,
  subscribeSchema,
  toFieldErrors,
} from '@/lib/validation/schemas';
import { getDictionary, type Locale } from '@/lib/i18n/dictionaries';
import type { FormState } from '@/lib/actions/form-state';
import { routeEventEnquiry } from '@/lib/reservations/event-routing';

/**
 * Server actions for the public forms.
 *
 * Server actions rather than fetch-to-an-API-route: validation, rate limiting
 * and persistence all happen server-side, and the client never holds a
 * privileged credential.
 *
 * Note: these forms require JavaScript. Next emits the hidden action fields
 * for no-JS submission, but with `useActionState` in a Client Component the
 * submission does not actually reach the server with scripting disabled —
 * tested, not assumed. Making that work would mean moving the markup into
 * Server Components with a plain `<form action={…}>`.
 *
 * Order of operations on every public write, without exception:
 *   1. bot check (honeypot + time-to-submit)   — cheapest, no DB
 *   2. Zod parse                               — no DB write on malformed input
 *   3. rate limit                              — one atomic counter
 *   4. write, as service_role
 *   5. email, detached, so a mail failure never fails the write
 */

/**
 * Shown when the deployment has no DATABASE_URL — a preview build, typically.
 * Saying so plainly beats a 500, and beats a success message for a write that
 * never happened.
 */
function noDatabaseState(echoed: Record<string, string>): FormState {
  return {
    status: 'error',
    message:
      'This deployment has no database connected, so the form cannot save your message. ' +
      'Please call or WhatsApp us instead — both reach a person.',
    values: echoed,
  };
}

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

export async function submitEnquiry(_previous: FormState, formData: FormData): Promise<FormState> {
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

  if (!isDatabaseConfigured()) return noDatabaseState(echoed);

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

  if (!isDatabaseConfigured()) return noDatabaseState(echoed);

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

/* ── Events & private hire ────────────────────────────────────────────────── */

export async function submitEventEnquiry(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const locale = (formData.get('locale') as Locale) ?? 'en';
  const dict = getDictionary(locale);
  const echoed = values(formData, ['name', 'email', 'phone', 'company', 'eventDate', 'headcount', 'message']);

  if (
    looksAutomated({
      honeypot: formData.get('website') as string | null,
      renderedAt: Number(formData.get('renderedAt')) || null,
    })
  ) {
    return { status: 'success', message: dict.forms.successBody };
  }

  if (!isDatabaseConfigured()) return noDatabaseState(echoed);

  const parsed = eventEnquirySchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    company: formData.get('company') ?? '',
    eventDate: formData.get('eventDate'),
    headcount: formData.get('headcount'),
    budgetFils: formData.get('budgetFils') || undefined,
    eventType: formData.get('eventType') ?? 'private_hire',
    message: formData.get('message'),
    locale,
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
    bucket: 'event-enquiry',
    limit: 4,
    windowSeconds: 3600,
    extraIdentity: parsed.data.email,
  });
  if (!limit.allowed) {
    return { status: 'error', message: dict.forms.rateLimited, values: echoed };
  }

  const data = parsed.data;
  const routing = routeEventEnquiry({
    headcount: data.headcount,
    budgetFils: data.budgetFils,
    eventType: data.eventType,
  });

  try {
    await asService(
      async (tx) => tx`
        insert into event_enquiries (
          name, email, phone, company, event_date, headcount, budget_fils,
          event_type, message, routed_to, routing_reason, locale
        ) values (
          ${data.name}, ${data.email}, ${data.phone}, ${data.company || null},
          ${data.eventDate}, ${data.headcount}, ${data.budgetFils ?? null},
          ${data.eventType}::event_type, ${data.message},
          ${routing.route}::event_enquiry_route, ${routing.reason}, ${data.locale}
        )
      `,
    );
  } catch (error) {
    console.error('[event-enquiry] insert failed', error);
    return { status: 'error', message: dict.forms.errorBody, values: echoed };
  }

  const alert = eventEnquiryAlertEmail({
    name: data.name,
    email: data.email,
    phone: data.phone,
    eventDate: data.eventDate,
    headcount: data.headcount,
    budgetFils: data.budgetFils ?? null,
    eventType: data.eventType,
    message: data.message,
    routedTo: routing.route,
    routingReason: routing.reason,
  });
  sendEmailDetached({
    to: brand.contact.bookingsEmail,
    replyTo: data.email,
    subject: alert.subject,
    html: alert.html,
    template: 'event-enquiry-alert',
    meta: { routedTo: routing.route, headcount: data.headcount },
  });

  return {
    status: 'success',
    message:
      locale === 'ar'
        ? 'وصلنا طلبك. سنعود إليك خلال يوم عمل بأرقام واضحة.'
        : 'That reached us. We will come back within a working day with real numbers.',
  };
}
