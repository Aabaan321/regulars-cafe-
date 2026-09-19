import { brand, siteUrl, directionsHref } from '@/lib/config/brand';
import { formatPrice } from '@/lib/content/menu-display';
import { escapeHtml, renderEmail } from '@/lib/email/layout';
import type { Locale } from '@/lib/i18n/dictionaries';

/**
 * Every transactional email the site sends.
 *
 * Each builder returns `{ subject, html }`; the plain-text alternative is
 * derived in `send.ts`. Copy is written the way the café would write it —
 * short, specific, and with the one thing the reader needs in the first line.
 */

export interface BuiltEmail {
  readonly subject: string;
  readonly html: string;
}

function dubaiDateTime(instant: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-AE' : 'en-AE', {
    timeZone: brand.timezone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(instant);
}

function dubaiTime(instant: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-AE' : 'en-AE', {
    timeZone: brand.timezone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(instant);
}

/** A definition list rendered as an email-safe table. */
function detailTable(rows: readonly (readonly [string, string])[]): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:18px 0;border-collapse:collapse;">
    ${rows
      .map(
        ([label, value]) => `<tr>
          <td style="padding:7px 0;font-size:13px;color:${brand.colors.light.textFaint};width:42%;vertical-align:top;">${escapeHtml(label)}</td>
          <td style="padding:7px 0;font-size:14px;color:${brand.colors.light.text};font-weight:600;">${value}</td>
        </tr>`,
      )
      .join('')}
  </table>`;
}

/* ── Contact ──────────────────────────────────────────────────────────────── */

export function enquiryAlertEmail(input: {
  name: string;
  email: string;
  phone?: string;
  topic: string;
  message: string;
  tier: string;
}): BuiltEmail {
  return {
    subject: `New enquiry — ${input.topic.replace(/_/g, ' ')} — ${input.name}`,
    html: renderEmail({
      preheader: `${input.name}: ${input.message.slice(0, 90)}`,
      heading: 'New enquiry from the website',
      bodyHtml:
        detailTable([
          ['From', escapeHtml(input.name)],
          ['Email', `<a href="mailto:${escapeHtml(input.email)}">${escapeHtml(input.email)}</a>`],
          ...(input.phone ? ([['Phone', escapeHtml(input.phone)]] as const) : []),
          ['Topic', escapeHtml(input.topic.replace(/_/g, ' '))],
          ['Came from', escapeHtml(input.tier)],
        ]) +
        `<div style="background:${brand.colors.light.bgSubtle};border-radius:10px;padding:16px;white-space:pre-wrap;font-size:14px;line-height:1.6;">${escapeHtml(input.message)}</div>`,
      button: { label: 'Reply to this guest', href: `mailto:${input.email}` },
      footnote: 'Sent by the website contact form.',
    }),
  };
}

export function enquiryAckEmail(input: { name: string }): BuiltEmail {
  return {
    subject: `We got your message — ${brand.name}`,
    html: renderEmail({
      preheader: 'A real person will read this and reply within one working day.',
      heading: `Thanks, ${escapeHtml(input.name.split(' ')[0] ?? input.name)}.`,
      bodyHtml: `<p style="margin:0 0 12px;">Your message reached us. One of us reads every one, so you will hear back within a working day — usually sooner.</p>
        <p style="margin:0;">If it is urgent, the fastest way to us is the phone.</p>`,
      button: { label: 'Call the café', href: `tel:${brand.contact.phone}` },
      secondary: { label: 'See this week’s hours', href: `${siteUrl}/essential/visit` },
    }),
  };
}

/* ── Newsletter ───────────────────────────────────────────────────────────── */

export function subscribeConfirmEmail(input: { confirmUrl: string }): BuiltEmail {
  return {
    subject: `Confirm your subscription — ${brand.name}`,
    html: renderEmail({
      preheader: 'One click and you are on the list.',
      heading: 'Just confirming it is you',
      bodyHtml: `<p style="margin:0 0 12px;">Somebody — hopefully you — asked for the Regulars letter. One email a month: what we are roasting, what is new on the menu, and first refusal on events.</p>
        <p style="margin:0;">If it was not you, ignore this and nothing happens.</p>`,
      button: { label: 'Yes, subscribe me', href: input.confirmUrl },
      footnote: 'This link works once and expires in seven days.',
    }),
  };
}

export function subscribeWelcomeEmail(input: { unsubscribeUrl: string }): BuiltEmail {
  return {
    subject: `You’re on the list — ${brand.name}`,
    html: renderEmail({
      preheader: 'Next letter goes out at the start of the month.',
      heading: 'You’re on the list',
      bodyHtml: `<p style="margin:0 0 12px;">Thank you. The next letter goes out at the start of the month and we will not send you anything else.</p>
        <p style="margin:0;">In the meantime: the Guji Uraga is on filter, and the kunafa french toast is only on at weekends.</p>`,
      button: { label: 'See the menu', href: `${siteUrl}/essential/menu` },
      secondary: { label: 'Unsubscribe', href: input.unsubscribeUrl },
    }),
  };
}

/* ── Reservations ─────────────────────────────────────────────────────────── */

export function bookingConfirmationEmail(input: {
  guestName: string;
  reference: string;
  startsAt: Date;
  partySize: number;
  tableLabel?: string;
  occasion?: string;
  specialRequests?: string | null;
  manageUrl: string;
  locale: Locale;
}): BuiltEmail {
  const when = dubaiDateTime(input.startsAt, input.locale);
  return {
    subject: `Table booked — ${when} — ${brand.name}`,
    html: renderEmail({
      dir: input.locale === 'ar' ? 'rtl' : 'ltr',
      preheader: `${input.partySize} ${input.partySize === 1 ? 'guest' : 'guests'}, ${when}. Reference ${input.reference}.`,
      heading: 'Your table is booked',
      bodyHtml:
        `<p style="margin:0 0 4px;">See you soon, ${escapeHtml(input.guestName.split(' ')[0] ?? input.guestName)}.</p>` +
        detailTable([
          ['When', escapeHtml(when)],
          ['Party', `${input.partySize} ${input.partySize === 1 ? 'guest' : 'guests'}`],
          ...(input.tableLabel ? ([['Table', escapeHtml(input.tableLabel)]] as const) : []),
          ...(input.occasion && input.occasion !== 'none'
            ? ([['Occasion', escapeHtml(input.occasion.replace(/_/g, ' '))]] as const)
            : []),
          ...(input.specialRequests
            ? ([['Your note', escapeHtml(input.specialRequests)]] as const)
            : []),
          ['Reference', `<code style="font-family:ui-monospace,monospace;letter-spacing:0.06em;">${escapeHtml(input.reference)}</code>`],
          ['Where', `<a href="${directionsHref}">${escapeHtml(brand.address.formatted)}</a>`],
        ]) +
        `<p style="margin:0;font-size:13px;">We hold the table for 15 minutes. If you are running late, WhatsApp us on ${escapeHtml(brand.contact.whatsappDisplay)} and we will keep it.</p>`,
      button: { label: 'Change or cancel', href: input.manageUrl },
      secondary: { label: 'Get directions', href: directionsHref },
      footnote: 'A calendar invite is attached to this email.',
    }),
  };
}

export function bookingReminderEmail(input: {
  guestName: string;
  reference: string;
  startsAt: Date;
  partySize: number;
  manageUrl: string;
  locale: Locale;
}): BuiltEmail {
  return {
    subject: `Tomorrow at ${dubaiTime(input.startsAt, input.locale)} — ${brand.name}`,
    html: renderEmail({
      dir: input.locale === 'ar' ? 'rtl' : 'ltr',
      preheader: `Your table for ${input.partySize} is tomorrow.`,
      heading: 'See you tomorrow',
      bodyHtml:
        `<p style="margin:0 0 4px;">A quick reminder, ${escapeHtml(input.guestName.split(' ')[0] ?? input.guestName)}.</p>` +
        detailTable([
          ['When', escapeHtml(dubaiDateTime(input.startsAt, input.locale))],
          ['Party', `${input.partySize}`],
          ['Reference', escapeHtml(input.reference)],
          ['Parking', escapeHtml(brand.service.parking)],
        ]) +
        `<p style="margin:0;font-size:13px;">Plans changed? Cancelling frees the table for someone on the waitlist — it genuinely helps.</p>`,
      button: { label: 'Change or cancel', href: input.manageUrl },
      secondary: { label: 'Get directions', href: directionsHref },
    }),
  };
}

export function bookingCancelledEmail(input: {
  guestName: string;
  reference: string;
  startsAt: Date;
  locale: Locale;
}): BuiltEmail {
  return {
    subject: `Booking cancelled — ${input.reference} — ${brand.name}`,
    html: renderEmail({
      dir: input.locale === 'ar' ? 'rtl' : 'ltr',
      preheader: 'Your table has been released.',
      heading: 'That booking is cancelled',
      bodyHtml: `<p style="margin:0 0 12px;">We have released your table for ${escapeHtml(dubaiDateTime(input.startsAt, input.locale))}. Nothing else to do.</p>
        <p style="margin:0;">Come see us another time — the door is usually open by seven.</p>`,
      button: { label: 'Book another time', href: `${siteUrl}/signature/book` },
    }),
  };
}

export function bookingModifiedEmail(input: {
  guestName: string;
  reference: string;
  startsAt: Date;
  partySize: number;
  manageUrl: string;
  locale: Locale;
}): BuiltEmail {
  return {
    subject: `Booking moved to ${dubaiDateTime(input.startsAt, input.locale)} — ${brand.name}`,
    html: renderEmail({
      dir: input.locale === 'ar' ? 'rtl' : 'ltr',
      preheader: 'Your new time is confirmed.',
      heading: 'Your booking has moved',
      bodyHtml:
        `<p style="margin:0 0 4px;">All set — here is the new booking.</p>` +
        detailTable([
          ['When', escapeHtml(dubaiDateTime(input.startsAt, input.locale))],
          ['Party', `${input.partySize}`],
          ['Reference', escapeHtml(input.reference)],
        ]),
      button: { label: 'Change or cancel', href: input.manageUrl },
    }),
  };
}

export function waitlistJoinedEmail(input: {
  guestName: string;
  date: string;
  windowStart: string;
  windowEnd: string;
}): BuiltEmail {
  return {
    subject: `You’re on the waitlist — ${input.date} — ${brand.name}`,
    html: renderEmail({
      preheader: 'We will email the moment something frees up.',
      heading: 'You’re on the waitlist',
      bodyHtml:
        `<p style="margin:0 0 4px;">Thanks ${escapeHtml(input.guestName.split(' ')[0] ?? input.guestName)} — we have you down.</p>` +
        detailTable([
          ['Date', escapeHtml(input.date)],
          ['Between', `${escapeHtml(input.windowStart)} and ${escapeHtml(input.windowEnd)}`],
        ]) +
        `<p style="margin:0;font-size:13px;">Cancellations usually happen the day before. If one lands in your window you get the first email, and the slot is held for two hours.</p>`,
    }),
  };
}

export function waitlistOfferEmail(input: {
  guestName: string;
  slot: Date;
  bookUrl: string;
  locale: Locale;
}): BuiltEmail {
  return {
    subject: `A table just opened — ${dubaiDateTime(input.slot, input.locale)}`,
    html: renderEmail({
      preheader: 'Held for you for the next two hours.',
      heading: 'A table just opened up',
      bodyHtml: `<p style="margin:0 0 12px;">Someone cancelled, and you were next on the list for ${escapeHtml(dubaiDateTime(input.slot, input.locale))}.</p>
        <p style="margin:0;">It is yours if you want it — we will hold it for two hours, then release it to the next person.</p>`,
      button: { label: 'Take this table', href: input.bookUrl },
    }),
  };
}

/* ── Orders ───────────────────────────────────────────────────────────────── */

export interface OrderLineSummary {
  readonly name: string;
  readonly quantity: number;
  readonly lineTotalFils: number;
  readonly modifiers: readonly string[];
}

function orderLinesHtml(lines: readonly OrderLineSummary[]): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:16px 0;border-collapse:collapse;">
    ${lines
      .map(
        (line) => `<tr>
          <td style="padding:8px 0;border-bottom:1px solid ${brand.colors.light.border};font-size:14px;">
            <strong>${line.quantity}×</strong> ${escapeHtml(line.name)}
            ${
              line.modifiers.length > 0
                ? `<br><span style="font-size:12px;color:${brand.colors.light.textFaint};">${escapeHtml(line.modifiers.join(' · '))}</span>`
                : ''
            }
          </td>
          <td style="padding:8px 0;border-bottom:1px solid ${brand.colors.light.border};font-size:14px;text-align:right;white-space:nowrap;font-weight:600;">
            ${escapeHtml(formatPrice(line.lineTotalFils))}
          </td>
        </tr>`,
      )
      .join('')}
  </table>`;
}

export function orderConfirmationEmail(input: {
  guestName: string;
  reference: string;
  pickupAt: Date;
  lines: readonly OrderLineSummary[];
  subtotalFils: number;
  vatFils: number;
  totalFils: number;
  locale: Locale;
}): BuiltEmail {
  return {
    subject: `Order ${input.reference} — ready ${dubaiTime(input.pickupAt, input.locale)}`,
    html: renderEmail({
      dir: input.locale === 'ar' ? 'rtl' : 'ltr',
      preheader: `We are making it now. Collect at ${dubaiTime(input.pickupAt, input.locale)}.`,
      heading: 'Order confirmed',
      bodyHtml:
        `<p style="margin:0 0 4px;">Thanks ${escapeHtml(input.guestName.split(' ')[0] ?? input.guestName)} — the kitchen has it.</p>` +
        detailTable([
          ['Collect at', escapeHtml(dubaiDateTime(input.pickupAt, input.locale))],
          ['Order', `<code style="font-family:ui-monospace,monospace;">${escapeHtml(input.reference)}</code>`],
          ['From', escapeHtml(brand.address.formatted)],
        ]) +
        orderLinesHtml(input.lines) +
        detailTable([
          ['Subtotal', escapeHtml(formatPrice(input.subtotalFils))],
          ['VAT (5%)', escapeHtml(formatPrice(input.vatFils))],
          ['Total paid', `<strong>${escapeHtml(formatPrice(input.totalFils))}</strong>`],
        ]) +
        `<p style="margin:0;font-size:13px;">Give the counter your order number. If you are running late it will keep — just tell us.</p>`,
      button: { label: 'Get directions', href: directionsHref },
    }),
  };
}

export function kitchenOrderEmail(input: {
  reference: string;
  guestName: string;
  phone: string;
  pickupAt: Date;
  lines: readonly OrderLineSummary[];
  notes?: string | null;
}): BuiltEmail {
  return {
    subject: `🔔 ${input.reference} — collect ${dubaiTime(input.pickupAt, 'en')} — ${input.lines.length} line(s)`,
    html: renderEmail({
      preheader: `${input.guestName} · ${dubaiTime(input.pickupAt, 'en')}`,
      heading: `Order ${input.reference}`,
      bodyHtml:
        detailTable([
          ['Collect at', `<strong style="font-size:17px;">${escapeHtml(dubaiDateTime(input.pickupAt, 'en'))}</strong>`],
          ['Guest', escapeHtml(input.guestName)],
          ['Phone', `<a href="tel:${escapeHtml(input.phone)}">${escapeHtml(input.phone)}</a>`],
        ]) +
        orderLinesHtml(input.lines) +
        (input.notes
          ? `<div style="background:${brand.colors.light.bgSubtle};border-radius:10px;padding:14px;font-size:14px;"><strong>Note:</strong> ${escapeHtml(input.notes)}</div>`
          : ''),
      button: { label: 'Open the order queue', href: `${siteUrl}/signature/admin/orders` },
    }),
  };
}

export function orderReadyEmail(input: {
  guestName: string;
  reference: string;
  locale: Locale;
}): BuiltEmail {
  return {
    subject: `Ready to collect — ${input.reference}`,
    html: renderEmail({
      dir: input.locale === 'ar' ? 'rtl' : 'ltr',
      preheader: 'It is on the counter with your name on it.',
      heading: 'Your order is ready',
      bodyHtml: `<p style="margin:0 0 12px;">${escapeHtml(input.reference)} is on the collection counter. Coffee is best in the next few minutes — no pressure.</p>`,
      button: { label: 'Get directions', href: directionsHref },
    }),
  };
}

/* ── Gift cards & loyalty ─────────────────────────────────────────────────── */

export function giftCardEmail(input: {
  recipientName?: string | null;
  purchaserName: string;
  code: string;
  amountFils: number;
  message?: string | null;
  balanceUrl: string;
}): BuiltEmail {
  return {
    subject: `A gift card for ${brand.name} — ${formatPrice(input.amountFils)}`,
    html: renderEmail({
      preheader: `${input.purchaserName} sent you ${formatPrice(input.amountFils)} to spend at ${brand.name}.`,
      heading: `${escapeHtml(input.purchaserName)} bought you coffee`,
      bodyHtml:
        (input.message
          ? `<div style="background:${brand.colors.light.bgSubtle};border-radius:10px;padding:16px;margin:0 0 18px;font-style:italic;font-size:14px;">“${escapeHtml(input.message)}”</div>`
          : '') +
        `<div style="text-align:center;border:2px dashed ${brand.colors.light.borderStrong};border-radius:14px;padding:22px;margin:0 0 18px;">
           <div style="font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:${brand.colors.light.textFaint};">Gift card</div>
           <div style="font-size:30px;font-weight:800;letter-spacing:-0.02em;color:${brand.colors.light.text};margin:6px 0;">${escapeHtml(formatPrice(input.amountFils))}</div>
           <div style="font-family:ui-monospace,monospace;font-size:20px;letter-spacing:0.14em;color:${brand.colors.light.accent};">${escapeHtml(input.code)}</div>
         </div>
         <p style="margin:0;font-size:13px;">Show the code at the counter. It works on anything — including the beans — and lasts a year.</p>`,
      button: { label: 'Check the balance', href: input.balanceUrl },
    }),
  };
}

export function loyaltyCardEmail(input: {
  name?: string | null;
  stamps: number;
  cardUrl: string;
}): BuiltEmail {
  const remaining = 9 - input.stamps;
  return {
    subject: `Your stamp card — ${input.stamps}/9 — ${brand.name}`,
    html: renderEmail({
      preheader:
        remaining === 0 ? 'Your free coffee is waiting.' : `${remaining} more and the next one is on us.`,
      heading: remaining === 0 ? 'Your free coffee is waiting' : `${input.stamps} of 9`,
      bodyHtml: `<p style="margin:0 0 12px;">${
        remaining === 0
          ? 'Show this at the counter and the next one is ours.'
          : `${remaining} more ${remaining === 1 ? 'coffee' : 'coffees'} and the tenth is on us.`
      }</p>
      <p style="margin:0;font-size:13px;">Bookmark the link below — it is your card. No app, no plastic.</p>`,
      button: { label: 'Open my card', href: input.cardUrl },
    }),
  };
}

export function eventEnquiryAlertEmail(input: {
  name: string;
  email: string;
  phone: string;
  eventDate: string;
  headcount: number;
  budgetFils?: number | null;
  eventType: string;
  message: string;
  routedTo: string;
  routingReason: string;
}): BuiltEmail {
  return {
    subject: `Private hire — ${input.headcount} guests on ${input.eventDate} — ${input.name}`,
    html: renderEmail({
      preheader: `${input.routedTo}: ${input.routingReason}`,
      heading: 'New private hire enquiry',
      bodyHtml:
        detailTable([
          ['Routed to', `<strong>${escapeHtml(input.routedTo.replace(/_/g, ' '))}</strong> — ${escapeHtml(input.routingReason)}`],
          ['Name', escapeHtml(input.name)],
          ['Email', `<a href="mailto:${escapeHtml(input.email)}">${escapeHtml(input.email)}</a>`],
          ['Phone', escapeHtml(input.phone)],
          ['Date', escapeHtml(input.eventDate)],
          ['Headcount', String(input.headcount)],
          ['Type', escapeHtml(input.eventType.replace(/_/g, ' '))],
          ...(input.budgetFils
            ? ([['Budget', escapeHtml(formatPrice(input.budgetFils))]] as const)
            : []),
        ]) +
        `<div style="background:${brand.colors.light.bgSubtle};border-radius:10px;padding:16px;white-space:pre-wrap;font-size:14px;">${escapeHtml(input.message)}</div>`,
      button: { label: 'Reply', href: `mailto:${input.email}` },
    }),
  };
}
