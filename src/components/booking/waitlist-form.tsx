'use client';

import { useState, useTransition } from 'react';
import { joinWaitlist } from '@/lib/actions/booking';
import { BotFields, Field, FormResult } from '@/components/forms/form-parts';
import { bookableDates } from '@/lib/utils/booking-dates';
import { formatNumber, type Dictionary, type Locale } from '@/lib/i18n/dictionaries';

/** Waitlist sign-up, shown under the booking flow and when a day is full. */
export function WaitlistForm({
  dict,
  locale,
  maxPartySize,
}: {
  dict: Dictionary;
  locale: Locale;
  maxPartySize: number;
}) {
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<{
    ok: boolean;
    message: string;
    fieldErrors?: Record<string, string | undefined>;
  } | null>(null);

  const dates = bookableDates(21, locale);

  function submit(formData: FormData) {
    startTransition(async () => {
      const outcome = await joinWaitlist({
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        partySize: formData.get('partySize'),
        date: formData.get('date'),
        windowStart: formData.get('windowStart'),
        windowEnd: formData.get('windowEnd'),
        locale,
        website: formData.get('website') ?? '',
        renderedAt: formData.get('renderedAt') ?? undefined,
      });
      setState(outcome);
    });
  }

  if (state?.ok) {
    return <FormResult status="success" title={dict.booking.waitlistTitle} body={state.message} />;
  }

  return (
    <form action={submit} noValidate className="flex flex-col gap-5">
      <BotFields />

      {state && !state.ok && !state.fieldErrors ? (
        <FormResult status="error" title={dict.forms.errorTitle} body={state.message} />
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={dict.forms.name} name="name" required error={state?.fieldErrors?.name}>
          {(p) => <input {...p} type="text" required autoComplete="name" className="field-input" />}
        </Field>
        <Field label={dict.forms.email} name="email" required error={state?.fieldErrors?.email}>
          {(p) => (
            <input {...p} type="email" required autoComplete="email" className="field-input" />
          )}
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={dict.forms.phone} name="phone" required error={state?.fieldErrors?.phone}>
          {(p) => <input {...p} type="tel" required autoComplete="tel" className="field-input" />}
        </Field>
        <Field
          label={dict.booking.stepParty}
          name="partySize"
          required
          error={state?.fieldErrors?.partySize}
        >
          {(p) => (
            <select {...p} defaultValue="2" className="field-input">
              {Array.from({ length: maxPartySize }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {formatNumber(n, locale)}
                </option>
              ))}
            </select>
          )}
        </Field>
      </div>

      <Field label={dict.booking.stepDate} name="date" required error={state?.fieldErrors?.date}>
        {(p) => (
          <select {...p} defaultValue={dates[1]?.iso} className="field-input">
            {dates.map((d) => (
              <option key={d.iso} value={d.iso}>
                {d.weekday} {d.day} {d.month}
              </option>
            ))}
          </select>
        )}
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={locale === 'ar' ? 'من' : 'Earliest'} name="windowStart" required>
          {(p) => (
            <input
              {...p}
              type="time"
              required
              defaultValue="11:00"
              step={900}
              className="field-input"
            />
          )}
        </Field>
        <Field
          label={locale === 'ar' ? 'إلى' : 'Latest'}
          name="windowEnd"
          required
          error={state?.fieldErrors?.windowEnd}
        >
          {(p) => (
            <input
              {...p}
              type="time"
              required
              defaultValue="14:00"
              step={900}
              className="field-input"
            />
          )}
        </Field>
      </div>

      <button type="submit" className="btn self-start" disabled={pending} data-loading={pending}>
        <span>{pending ? dict.forms.sending : dict.booking.joinWaitlist}</span>
      </button>
    </form>
  );
}
