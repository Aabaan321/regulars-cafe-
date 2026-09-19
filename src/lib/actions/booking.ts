'use server';

import { brand, siteUrl } from '@/lib/config/brand';
import { asService, isDatabaseConfigured } from '@/lib/db/client';
import { sendEmail, sendEmailDetached } from '@/lib/email/send';
import {
  bookingCancelledEmail,
  bookingConfirmationEmail,
  bookingModifiedEmail,
  waitlistJoinedEmail,
} from '@/lib/email/templates';
import { buildIcs } from '@/lib/email/ics';
import { hashToken, issueToken, parseToken } from '@/lib/utils/tokens';
import { looksAutomated, rateLimit } from '@/lib/utils/rate-limit';
import {
  createReservationSchema,
  toFieldErrors,
  waitlistSchema,
} from '@/lib/validation/schemas';
import { getDictionary, type Locale } from '@/lib/i18n/dictionaries';

/**
 * Booking, rescheduling, cancelling and the waitlist.
 *
 * All the interesting work happens inside `create_reservation()` in Postgres:
 * it picks the best-fitting free table, checks the cover ceiling and inserts,
 * and the exclusion constraint makes a double booking impossible even if two
 * requests race past the availability check. This module's job is to validate,
 * rate limit, translate database errors into something a guest can act on, and
 * send the email.
 */

export interface BookingSuccess {
  readonly ok: true;
  readonly reference: string;
  readonly startsAt: string;
  readonly partySize: number;
  readonly tableLabel: string | null;
  readonly manageUrl: string;
}

export interface BookingFailure {
  readonly ok: false;
  /** Machine-readable, so the UI can react (e.g. re-fetch slots on a clash). */
  readonly code:
    | 'validation'
    | 'slot_taken'
    | 'fully_booked'
    | 'kitchen_at_capacity'
    | 'blackout'
    | 'closed'
    | 'rate_limited'
    | 'no_database'
    | 'error';
  readonly message: string;
  readonly fieldErrors?: Record<string, string | undefined>;
}

export type BookingResult = BookingSuccess | BookingFailure;

/** Postgres raises these as named exceptions; map them to guest-facing copy. */
function mapDatabaseError(error: unknown, locale: Locale): BookingFailure {
  const dict = getDictionary(locale);
  const message = error instanceof Error ? error.message : '';

  if (message.includes('slot_taken') || message.includes('table_taken')) {
    return { ok: false, code: 'slot_taken', message: dict.booking.slotTaken };
  }
  if (message.includes('fully_booked')) {
    return {
      ok: false,
      code: 'fully_booked',
      message:
        locale === 'ar'
          ? 'لم تعد هناك طاولة بهذا الحجم في ذلك الوقت. جرّب وقتاً آخر.'
          : 'There is no longer a table that size at that time. Please pick another slot.',
    };
  }
  if (message.includes('kitchen_at_capacity')) {
    return {
      ok: false,
      code: 'kitchen_at_capacity',
      message:
        locale === 'ar'
          ? 'المطبخ في كامل طاقته في ذلك الوقت. جرّب وقتاً آخر.'
          : 'The kitchen is at capacity for that time. Please pick another slot.',
    };
  }
  if (message.includes('blackout')) {
    return {
      ok: false,
      code: 'blackout',
      message:
        locale === 'ar' ? 'نحن مغلقون في ذلك التاريخ.' : 'We are closed on that date.',
    };
  }
  if (message.includes('closed')) {
    return {
      ok: false,
      code: 'closed',
      message:
        locale === 'ar'
          ? 'لا نقدّم الخدمة في ذلك الوقت.'
          : 'We do not serve at that time.',
    };
  }

  console.error('[booking] unexpected database error', error);
  return { ok: false, code: 'error', message: dict.forms.errorBody };
}

export async function createBooking(raw: unknown): Promise<BookingResult> {
  const parsed = createReservationSchema.safeParse(raw);
  if (!parsed.success) {
    const dict = getDictionary('en');
    return {
      ok: false,
      code: 'validation',
      message: dict.forms.fixErrors,
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  const data = parsed.data;
  const dict = getDictionary(data.locale);

  if (looksAutomated({ honeypot: data.website, renderedAt: data.renderedAt })) {
    // Report the shape of success without writing anything.
    return {
      ok: true,
      reference: 'RG-DEMO00',
      startsAt: data.slot,
      partySize: data.partySize,
      tableLabel: null,
      manageUrl: `${siteUrl}/signature/book/manage`,
    };
  }

  if (!isDatabaseConfigured()) {
    return {
      ok: false,
      code: 'no_database',
      message:
        'This deployment has no database connected, so bookings cannot be saved. Please call us instead.',
    };
  }

  const limit = await rateLimit({
    bucket: 'booking',
    limit: 6,
    windowSeconds: 3600,
    extraIdentity: data.email,
  });
  if (!limit.allowed) {
    return { ok: false, code: 'rate_limited', message: dict.forms.rateLimited };
  }

  // The token is generated before the insert so its hash can go in the same
  // row; the plaintext only ever leaves in the guest's email.
  const token = issueToken('manage-booking', `${data.email}-${data.slot}`);

  try {
    const rows = await asService(
      async (tx) => tx<
        { id: string; reference: string; starts_at: Date; ends_at: Date; table_id: string | null }[]
      >`
        select id, reference, starts_at, ends_at, table_id from create_reservation(
          ${data.name}, ${data.email}, ${data.phone}, ${data.partySize},
          ${data.slot}::timestamptz, ${token.hash},
          ${data.occasion}::reservation_occasion,
          ${data.specialRequests || null}, ${data.highChairs},
          ${data.accessibilityNeeds || null}, ${data.marketingOptIn},
          ${data.locale}, ${data.sourceTier},
          ${data.preferredTableId ?? null}, ${brand.timezone}
        )
      `,
    );

    const row = rows[0];
    if (!row) return { ok: false, code: 'error', message: dict.forms.errorBody };

    const tableLabel = row.table_id
      ? ((
          await asService(
            async (tx) => tx<{ label: string }[]>`
              select label from restaurant_tables where id = ${row.table_id}
            `,
          )
        )[0]?.label ?? null)
      : null;

    const manageUrl = `${siteUrl}/signature/book/manage?token=${encodeURIComponent(token.token)}`;

    const email = bookingConfirmationEmail({
      guestName: data.name,
      reference: row.reference,
      startsAt: row.starts_at,
      partySize: data.partySize,
      tableLabel: tableLabel ?? undefined,
      occasion: data.occasion,
      specialRequests: data.specialRequests || null,
      manageUrl,
      locale: data.locale,
    });

    const ics = buildIcs({
      uid: `${row.reference}@regulars.ae`,
      start: row.starts_at,
      end: row.ends_at,
      summary: `${brand.name} — table for ${data.partySize}`,
      description: `Booking reference ${row.reference}. Manage or cancel: ${manageUrl}`,
      location: brand.address.formatted,
      url: manageUrl,
      attendeeEmail: data.email,
    });

    sendEmailDetached({
      to: data.email,
      subject: email.subject,
      html: email.html,
      template: 'booking-confirmation',
      tier: data.sourceTier,
      meta: { reference: row.reference },
      attachments: [
        { filename: `regulars-${row.reference}.ics`, content: ics, contentType: 'text/calendar; charset=utf-8; method=REQUEST' },
      ],
    });

    return {
      ok: true,
      reference: row.reference,
      startsAt: row.starts_at.toISOString(),
      partySize: data.partySize,
      tableLabel,
      manageUrl,
    };
  } catch (error) {
    return mapDatabaseError(error, data.locale);
  }
}

/* ── Manage an existing booking ───────────────────────────────────────────── */

export interface ManagedBooking {
  readonly reference: string;
  readonly guestName: string;
  readonly partySize: number;
  readonly startsAt: string;
  readonly status: string;
  readonly tableLabel: string | null;
  readonly occasion: string;
  readonly specialRequests: string | null;
  readonly locale: Locale;
  readonly canModify: boolean;
}

/**
 * Looks up a booking from its emailed link.
 *
 * The token is HMAC-verified first, then matched by hash — so a structurally
 * valid token for a cancelled or deleted booking gets nothing, and a database
 * dump does not let anyone cancel a stranger's table.
 */
export async function getBookingByToken(token: string): Promise<ManagedBooking | null> {
  if (!isDatabaseConfigured()) return null;
  const parsed = parseToken(token, 'manage-booking');
  if (!parsed) return null;

  const rows = await asService(
    async (tx) => tx<
      {
        reference: string;
        guest_name: string;
        party_size: number;
        starts_at: Date;
        status: string;
        occasion: string;
        special_requests: string | null;
        locale: string;
        table_label: string | null;
      }[]
    >`
      select r.reference, r.guest_name, r.party_size, r.starts_at, r.status::text as status,
             r.occasion::text as occasion, r.special_requests, r.locale,
             t.label as table_label
        from reservations r
        left join restaurant_tables t on t.id = r.table_id
       where r.manage_token_hash = ${parsed.hash}
       limit 1
    `,
  );

  const row = rows[0];
  if (!row) return null;

  return {
    reference: row.reference,
    guestName: row.guest_name,
    partySize: row.party_size,
    startsAt: row.starts_at.toISOString(),
    status: row.status,
    tableLabel: row.table_label,
    occasion: row.occasion,
    specialRequests: row.special_requests,
    locale: (row.locale === 'ar' ? 'ar' : 'en') as Locale,
    // Only an upcoming booking can be changed, and not in the last two hours.
    canModify:
      (row.status === 'confirmed' || row.status === 'pending') &&
      row.starts_at.getTime() > Date.now() + 2 * 60 * 60 * 1000,
  };
}

export async function cancelBooking(token: string): Promise<{ ok: boolean; message: string }> {
  const booking = await getBookingByToken(token);
  if (!booking) return { ok: false, message: 'That link is not valid any more.' };
  if (!booking.canModify) {
    return {
      ok: false,
      message:
        'This booking can no longer be cancelled online — it is within two hours. Please call us and we will sort it.',
    };
  }

  const parsed = parseToken(token, 'manage-booking');
  if (!parsed) return { ok: false, message: 'That link is not valid any more.' };

  const rows = await asService(
    async (tx) => tx<{ email: string; guest_name: string; starts_at: Date; reference: string }[]>`
      update reservations
         set status = 'cancelled', cancelled_at = now(), cancelled_by = 'guest'
       where manage_token_hash = ${parsed.hash}
         and status in ('pending', 'confirmed')
       returning email::text, guest_name, starts_at, reference
    `,
  );

  const row = rows[0];
  if (!row) return { ok: false, message: 'That booking has already been cancelled.' };

  const email = bookingCancelledEmail({
    guestName: row.guest_name,
    reference: row.reference,
    startsAt: row.starts_at,
    locale: booking.locale,
  });
  sendEmailDetached({
    to: row.email,
    subject: email.subject,
    html: email.html,
    template: 'booking-cancelled',
    meta: { reference: row.reference },
  });

  return { ok: true, message: 'Your booking is cancelled. The table is back in the book.' };
}

export async function rescheduleBooking(
  token: string,
  slotIso: string,
  partySize?: number,
): Promise<{ ok: boolean; message: string; startsAt?: string }> {
  const booking = await getBookingByToken(token);
  if (!booking) return { ok: false, message: 'That link is not valid any more.' };
  if (!booking.canModify) {
    return { ok: false, message: 'This booking can no longer be changed online. Please call us.' };
  }

  const parsed = parseToken(token, 'manage-booking');
  if (!parsed) return { ok: false, message: 'That link is not valid any more.' };

  try {
    const rows = await asService(
      async (tx) => tx<{ id: string; reference: string; starts_at: Date; party_size: number; email: string }[]>`
        with target as (
          select id from reservations where manage_token_hash = ${parsed.hash} limit 1
        )
        select r.id, r.reference, r.starts_at, r.party_size, r.email::text
          from reschedule_reservation(
            (select id from target), ${slotIso}::timestamptz,
            ${partySize ?? null}, ${brand.timezone}
          ) r
      `,
    );

    const row = rows[0];
    if (!row) return { ok: false, message: 'Could not move that booking.' };

    const email = bookingModifiedEmail({
      guestName: booking.guestName,
      reference: row.reference,
      startsAt: row.starts_at,
      partySize: row.party_size,
      manageUrl: `${siteUrl}/signature/book/manage?token=${encodeURIComponent(token)}`,
      locale: booking.locale,
    });
    sendEmailDetached({
      to: row.email,
      subject: email.subject,
      html: email.html,
      template: 'booking-modified',
      meta: { reference: row.reference },
    });

    return {
      ok: true,
      message: 'Your booking has been moved. We have emailed you the new details.',
      startsAt: row.starts_at.toISOString(),
    };
  } catch (error) {
    const mapped = mapDatabaseError(error, booking.locale);
    return { ok: false, message: mapped.message };
  }
}

/* ── Waitlist ─────────────────────────────────────────────────────────────── */

export async function joinWaitlist(
  raw: unknown,
): Promise<{ ok: boolean; message: string; fieldErrors?: Record<string, string | undefined> }> {
  const parsed = waitlistSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Please check the highlighted fields.',
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  const data = parsed.data;
  const dict = getDictionary(data.locale);

  if (looksAutomated({ honeypot: data.website, renderedAt: data.renderedAt })) {
    return { ok: true, message: dict.booking.waitlistBody };
  }
  if (!isDatabaseConfigured()) {
    return { ok: false, message: 'This deployment has no database connected.' };
  }

  const limit = await rateLimit({
    bucket: 'waitlist',
    limit: 5,
    windowSeconds: 3600,
    extraIdentity: data.email,
  });
  if (!limit.allowed) return { ok: false, message: dict.forms.rateLimited };

  const token = issueToken('waitlist-offer', `${data.email}-${data.date}`);

  try {
    await asService(
      async (tx) => tx`
        insert into waitlist_entries (
          guest_name, email, phone, party_size, desired_date,
          window_start, window_end, token_hash, locale
        ) values (
          ${data.name}, ${data.email}, ${data.phone}, ${data.partySize}, ${data.date},
          ${data.windowStart}, ${data.windowEnd}, ${token.hash}, ${data.locale}
        )
      `,
    );
  } catch (error) {
    console.error('[waitlist] insert failed', error);
    return { ok: false, message: dict.forms.errorBody };
  }

  const email = waitlistJoinedEmail({
    guestName: data.name,
    date: data.date,
    windowStart: data.windowStart,
    windowEnd: data.windowEnd,
  });
  await sendEmail({
    to: data.email,
    subject: email.subject,
    html: email.html,
    template: 'waitlist-joined',
  });

  return { ok: true, message: dict.booking.waitlistBody };
}

/** Exported for the token-hash lookup in the manage page's form action. */
export async function hashManageToken(token: string): Promise<string> {
  return hashToken(token);
}
