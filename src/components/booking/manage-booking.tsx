'use client';

import { useState, useTransition } from 'react';
import { cancelBooking, type ManagedBooking } from '@/lib/actions/booking';
import { FormResult } from '@/components/forms/form-parts';
import { brand, telHref, whatsappHref } from '@/lib/config/brand';
import { formatNumber, type Dictionary, type Locale } from '@/lib/i18n/dictionaries';

/**
 * Self-service manage-booking.
 *
 * Reached from a signed link in the confirmation email — no account, no
 * password. Cancelling asks for confirmation inline rather than with a
 * `confirm()` dialog, because a mis-tap that releases somebody's Saturday
 * table is not recoverable.
 */
export function ManageBooking({
  booking,
  token,
  dict,
  locale,
  bookHref,
}: {
  booking: ManagedBooking;
  token: string;
  dict: Dictionary;
  locale: Locale;
  bookHref: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [outcome, setOutcome] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const ar = locale === 'ar';

  const when = new Intl.DateTimeFormat(ar ? 'ar-AE' : 'en-AE', {
    timeZone: brand.timezone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(booking.startsAt));

  if (outcome) {
    return (
      <div className="flex flex-col gap-6">
        <FormResult
          status={outcome.ok ? 'success' : 'error'}
          title={outcome.ok ? (ar ? 'تم الإلغاء' : 'Cancelled') : dict.forms.errorTitle}
          body={outcome.message}
        />
        <a href={bookHref} className="btn self-start">
          {dict.common.bookTable}
        </a>
      </div>
    );
  }

  const cancelled = booking.status === 'cancelled';

  return (
    <div>
      <dl className="border-line bg-surface grid gap-4 rounded-[var(--radius-lg)] border p-6 sm:grid-cols-2">
        <Row label={dict.booking.reference} value={booking.reference} mono />
        <Row label={ar ? 'الحالة' : 'Status'} value={statusLabel(booking.status, ar)} />
        <Row label={ar ? 'الموعد' : 'When'} value={when} />
        <Row
          label={dict.booking.stepParty}
          value={`${formatNumber(booking.partySize, locale)} ${
            booking.partySize === 1 ? dict.booking.guest : dict.booking.guests
          }`}
        />
        {booking.tableLabel ? (
          <Row label={ar ? 'الطاولة' : 'Table'} value={booking.tableLabel} />
        ) : null}
        <Row label={ar ? 'الاسم' : 'Name'} value={booking.guestName} />
        {booking.specialRequests ? (
          <div className="sm:col-span-2">
            <dt className="text-faint text-2xs font-bold tracking-wider uppercase">
              {dict.booking.specialRequests}
            </dt>
            <dd className="text-muted mt-1 text-xs">{booking.specialRequests}</dd>
          </div>
        ) : null}
      </dl>

      {cancelled ? (
        <p className="text-muted mt-6 text-xs">
          {ar
            ? 'هذا الحجز ملغى. يسعدنا استقبالك في وقت آخر.'
            : 'This booking is cancelled. We would love to see you another time.'}
        </p>
      ) : !booking.canModify ? (
        <div className="border-line bg-bg-subtle mt-6 rounded-[var(--radius-md)] border p-5">
          <p className="text-xs leading-relaxed">
            {ar
              ? 'لم يعد بالإمكان التعديل عبر الموقع — بقي أقل من ساعتين. اتصل بنا وسنرتّب الأمر.'
              : 'This can no longer be changed online — it is within two hours. Call us and we will sort it out.'}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a href={telHref} className="btn btn-sm">
              {brand.contact.phoneDisplay}
            </a>
            <a
              href={whatsappHref()}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-sm"
            >
              WhatsApp
            </a>
          </div>
        </div>
      ) : (
        <div className="mt-8">
          {confirming ? (
            <div className="rounded-[var(--radius-md)] border border-[color-mix(in_oklab,var(--c-danger)_45%,transparent)] bg-[color-mix(in_oklab,var(--c-danger)_8%,transparent)] p-5">
              <p className="font-bold">{ar ? 'إلغاء هذا الحجز؟' : 'Cancel this booking?'}</p>
              <p className="text-muted mt-1 text-xs">
                {ar
                  ? 'سنحرّر الطاولة فوراً لشخص على قائمة الانتظار. لا يمكن التراجع.'
                  : 'We will release the table to somebody on the waitlist straight away. This cannot be undone.'}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn"
                  disabled={pending}
                  data-loading={pending}
                  onClick={() =>
                    startTransition(async () => {
                      setOutcome(await cancelBooking(token));
                    })
                  }
                >
                  <span>{ar ? 'نعم، ألغِ الحجز' : 'Yes, cancel it'}</span>
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setConfirming(false)}
                >
                  {ar ? 'احتفظ بالحجز' : 'Keep my booking'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <a href={`${bookHref}?party=${booking.partySize}`} className="btn btn-secondary">
                {ar ? 'احجز وقتاً آخر' : 'Book a different time'}
              </a>
              <button type="button" className="btn btn-ghost" onClick={() => setConfirming(true)}>
                {dict.common.cancel}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-faint text-2xs font-bold tracking-wider uppercase">{label}</dt>
      <dd
        className={`text-ink mt-1 text-xs font-semibold ${mono ? 'font-mono tracking-wider' : ''}`}
      >
        {value}
      </dd>
    </div>
  );
}

function statusLabel(status: string, ar: boolean): string {
  const map: Record<string, [string, string]> = {
    confirmed: ['Confirmed', 'مؤكّد'],
    pending: ['Pending', 'قيد الانتظار'],
    seated: ['Seated', 'جالس'],
    completed: ['Completed', 'مكتمل'],
    cancelled: ['Cancelled', 'ملغى'],
    no_show: ['No show', 'لم يحضر'],
  };
  const pair = map[status] ?? [status, status];
  return ar ? pair[1] : pair[0];
}
