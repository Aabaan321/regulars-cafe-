'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import { createBooking, type BookingResult } from '@/lib/actions/booking';
import { BotFields, Field } from '@/components/forms/form-parts';
import { brand } from '@/lib/config/brand';
import { formatNumber, type Dictionary, type Locale } from '@/lib/i18n/dictionaries';
import type { SlotReason, SlotView } from '@/lib/db/queries';
import type { TierId } from '@/lib/config/navigation';

/**
 * The four-step reservation flow.
 *
 * Party size → date → time → details → confirmation.
 *
 * Three things make this more than a form:
 *
 *  1. Unavailable slots are rendered, disabled, WITH the reason. Hiding them
 *     makes the room look closed; showing "fully booked" next to 13:00 makes
 *     the guest pick 13:30.
 *  2. Every step is in the URL (`?party=2&date=…&time=…`), so back works, a
 *     half-finished booking survives a refresh, and the presenter can deep
 *     link straight to a busy Saturday.
 *  3. A slot that goes while the guest is typing is handled: the server
 *     rejects it (via a database constraint, not a check), and the flow drops
 *     back to the time step with the list refreshed.
 */

type Step = 0 | 1 | 2 | 3 | 4;

const STEP_KEYS = ['stepParty', 'stepDate', 'stepTime', 'stepDetails', 'stepConfirm'] as const;

export interface BookingFlowProps {
  readonly dict: Dictionary;
  readonly locale: Locale;
  readonly tier: TierId;
  /** ISO dates the flow may offer, computed on the server in café time. */
  readonly dates: readonly { iso: string; weekday: string; day: string; month: string }[];
  readonly maxPartySize: number;
  readonly privateHireHref: string;
  /** Tier 3 swaps in the interactive floor plan at the time step. */
  readonly renderFloorPlan?: (args: {
    slotIso: string;
    partySize: number;
    selectedTableId: string | null;
    onSelect: (tableId: string | null) => void;
  }) => React.ReactNode;
}

interface AvailabilityState {
  /** Which "date|party" the slots below belong to; null until one loads. */
  readonly key: string | null;
  readonly slots: readonly SlotView[];
  readonly error: string | null;
}

export function BookingFlow({
  dict,
  locale,
  tier,
  dates,
  maxPartySize,
  privateHireHref,
  renderFloorPlan,
}: BookingFlowProps) {
  // Restored from the URL during the first render rather than in an effect:
  // reading it afterwards and calling setState renders the whole flow twice
  // and briefly shows step 1 to someone who deep-linked to step 3.
  const searchParams = useSearchParams();
  const initialParty = (() => {
    const value = Number(searchParams.get('party'));
    return Number.isInteger(value) && value >= 1 && value <= maxPartySize ? value : null;
  })();
  const initialDate = (() => {
    const value = searchParams.get('date');
    return value && dates.some((d) => d.iso === value) ? value : null;
  })();

  const [step, setStep] = useState<Step>(initialParty === null ? 0 : initialDate ? 2 : 1);
  const [partySize, setPartySize] = useState<number | null>(initialParty);
  const [date, setDate] = useState<string | null>(initialDate);
  const [slot, setSlot] = useState<SlotView | null>(null);
  const [tableId, setTableId] = useState<string | null>(null);
  const [availability, setAvailability] = useState<AvailabilityState>({
    key: null,
    slots: [],
    error: null,
  });
  const [dayStatus, setDayStatus] = useState<Record<string, { open: boolean; slots: number }>>({});
  const [result, setResult] = useState<BookingResult | null>(null);
  const [pending, startTransition] = useTransition();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  /* ── URL state, so back and refresh both work ───────────────────────────── */

  const syncUrl = useCallback((next: { party?: number | null; date?: string | null }) => {
    const params = new URLSearchParams(window.location.search);
    if (next.party === null) params.delete('party');
    else if (next.party !== undefined) params.set('party', String(next.party));
    if (next.date === null) params.delete('date');
    else if (next.date !== undefined) params.set('date', next.date);
    const query = params.toString();
    window.history.replaceState(null, '', query ? `?${query}` : window.location.pathname);
  }, []);

  /* ── Move focus to the step heading, so the flow is followable by keyboard */

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  /* ── Which days are worth offering ──────────────────────────────────────── */

  useEffect(() => {
    if (partySize === null || dates.length === 0) return;
    const from = dates[0]?.iso;
    if (!from) return;

    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(
          `/api/availability?date=${from}&partySize=${partySize}&summary=${dates.length}`,
        );
        if (!res.ok) return;
        const body = (await res.json()) as {
          summary: Record<string, { open: boolean; slots: number }>;
        };
        if (!cancelled) setDayStatus(body.summary ?? {});
      } catch {
        /* the date step still works, just without the "full" hints */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [partySize, dates]);

  /* ── Slots for the chosen day ───────────────────────────────────────────── */

  const slotKey = partySize !== null && date ? `${date}|${partySize}` : null;

  // Bumped when a slot is taken mid-form, to force a refetch of the same day.
  const [reloadToken, setReloadToken] = useState(0);

  /**
   * Fetches the day's slots.
   *
   * The request is inlined here with an AbortController rather than hidden in
   * a callback: a guest who clicks through three dates quickly fires three
   * requests, and without the abort the slowest response wins and shows slots
   * for a day they are no longer looking at.
   */
  useEffect(() => {
    if (step !== 2 || partySize === null || !date) return;

    const key = `${date}|${partySize}`;
    const controller = new AbortController();

    void (async () => {
      try {
        const res = await fetch(`/api/availability?date=${date}&partySize=${partySize}`, {
          signal: controller.signal,
        });
        if (!res.ok) {
          setAvailability({ key, slots: [], error: dict.forms.errorBody });
          return;
        }
        const body = (await res.json()) as { slots: SlotView[] };
        setAvailability({ key, slots: body.slots ?? [], error: null });
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error('[booking] availability fetch failed', error);
        setAvailability({ key, slots: [], error: dict.forms.errorBody });
      }
    })();

    return () => controller.abort();
  }, [step, partySize, date, reloadToken, dict.forms.errorBody]);

  // Loading is derived rather than stored, so nothing is set synchronously in
  // the effect and the flow does not render twice on every step change.
  const slotsLoading = step === 2 && slotKey !== null && availability.key !== slotKey;

  const grouped = useMemo(() => {
    const byPeriod = new Map<string, SlotView[]>();
    for (const s of availability.slots) {
      // Slots that have simply passed are noise, not information.
      if (s.reason === 'past') continue;
      const list = byPeriod.get(s.period) ?? [];
      list.push(s);
      byPeriod.set(s.period, list);
    }
    return [...byPeriod.entries()];
  }, [availability.slots]);

  const anyAvailable = availability.slots.some((s) => s.available);

  /* ── Submit ─────────────────────────────────────────────────────────────── */

  function submit(formData: FormData) {
    if (!slot || partySize === null) return;

    startTransition(async () => {
      const payload = {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        partySize,
        slot: slot.at,
        occasion: formData.get('occasion') || 'none',
        specialRequests: formData.get('specialRequests') || '',
        highChairs: formData.get('highChairs') || 0,
        accessibilityNeeds: formData.get('accessibilityNeeds') || '',
        marketingOptIn: formData.get('marketingOptIn') === 'on',
        preferredTableId: tableId ?? undefined,
        locale,
        sourceTier: tier,
        website: formData.get('website') ?? '',
        renderedAt: formData.get('renderedAt') ?? undefined,
      };

      const outcome = await createBooking(payload);
      setResult(outcome);

      if (outcome.ok) {
        setStep(4);
      } else if (
        outcome.code === 'slot_taken' ||
        outcome.code === 'fully_booked' ||
        outcome.code === 'kitchen_at_capacity'
      ) {
        // The slot went while they were typing. Go back and refresh honestly.
        setSlot(null);
        setStep(2);
        setReloadToken((n) => n + 1);
      }
    });
  }

  const stepLabel = dict.booking[STEP_KEYS[step] ?? 'stepParty'];

  return (
    <div className="mx-auto w-full max-w-[44rem]">
      <ol
        className="mb-8 flex items-center gap-1.5"
        aria-label={`${dict.booking.step} ${step + 1}`}
      >
        {STEP_KEYS.map((key, index) => {
          const state = index < step ? 'done' : index === step ? 'current' : 'todo';
          return (
            <li key={key} className="flex flex-1 items-center gap-1.5">
              <button
                type="button"
                disabled={index >= step || step === 4}
                onClick={() => setStep(index as Step)}
                aria-current={state === 'current' ? 'step' : undefined}
                className={[
                  'h-1.5 w-full rounded-full transition-colors',
                  state === 'done'
                    ? 'bg-accent cursor-pointer'
                    : state === 'current'
                      ? 'bg-ink'
                      : 'bg-line',
                ].join(' ')}
              >
                <span className="sr-only">{dict.booking[key]}</span>
              </button>
            </li>
          );
        })}
      </ol>

      <p className="eyebrow mb-2">
        {dict.booking.step} {formatNumber(Math.min(step + 1, 4), locale)} {dict.booking.of}{' '}
        {formatNumber(4, locale)} · {stepLabel}
      </p>

      {/* ── Step 0: party size ─────────────────────────────────────────── */}
      {step === 0 ? (
        <section aria-labelledby="step-heading">
          <h2 id="step-heading" ref={headingRef} tabIndex={-1} className="display-2 outline-none">
            {dict.booking.chooseParty}
          </h2>
          <p className="text-muted mt-3 text-xs">{dict.booking.choosePartyHint}</p>

          <div className="mt-6 grid grid-cols-4 gap-2 sm:grid-cols-8">
            {Array.from({ length: maxPartySize }, (_, i) => i + 1).map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => {
                  setPartySize(size);
                  syncUrl({ party: size });
                  setStep(1);
                }}
                className={[
                  'border-line hover:border-ink flex aspect-square flex-col items-center justify-center rounded-[var(--radius-md)] border-2 font-bold transition-colors',
                  partySize === size ? 'border-ink bg-ink text-bg' : 'bg-surface',
                ].join(' ')}
              >
                <span className="text-xl tabular-nums">{formatNumber(size, locale)}</span>
              </button>
            ))}
          </div>

          <p className="text-faint text-2xs mt-5">
            <a href={privateHireHref} className="text-accent font-semibold underline">
              {locale === 'ar'
                ? `لتسعة أشخاص فأكثر — الحجز الخاص`
                : `${brand.service.privateHireThreshold} or more? Private hire`}
            </a>
          </p>
        </section>
      ) : null}

      {/* ── Step 1: date ───────────────────────────────────────────────── */}
      {step === 1 ? (
        <section aria-labelledby="step-heading">
          <h2 id="step-heading" ref={headingRef} tabIndex={-1} className="display-2 outline-none">
            {dict.booking.chooseDate}
          </h2>
          <p className="text-muted mt-3 text-xs">
            {formatNumber(partySize ?? 2, locale)}{' '}
            {partySize === 1 ? dict.booking.guest : dict.booking.guests}
          </p>

          <div className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-7">
            {dates.map((d) => {
              const status = dayStatus[d.iso];
              const full = status ? !status.open : false;
              return (
                <button
                  key={d.iso}
                  type="button"
                  disabled={full}
                  onClick={() => {
                    setDate(d.iso);
                    syncUrl({ date: d.iso });
                    setSlot(null);
                    setStep(2);
                  }}
                  className={[
                    'border-line flex flex-col items-center rounded-[var(--radius-md)] border-2 px-2 py-3 transition-colors',
                    full
                      ? 'cursor-not-allowed opacity-40'
                      : date === d.iso
                        ? 'border-ink bg-ink text-bg'
                        : 'bg-surface hover:border-ink',
                  ].join(' ')}
                >
                  <span className="text-2xs font-bold tracking-wide uppercase">{d.weekday}</span>
                  <span className="text-lg font-bold tabular-nums">{d.day}</span>
                  <span className="text-2xs">{d.month}</span>
                  {full ? (
                    <span className="text-2xs mt-1 font-bold">
                      {dict.booking.reasons.fully_booked}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          <StepBack dict={dict} onBack={() => setStep(0)} />
        </section>
      ) : null}

      {/* ── Step 2: time ───────────────────────────────────────────────── */}
      {step === 2 ? (
        <section aria-labelledby="step-heading">
          <h2 id="step-heading" ref={headingRef} tabIndex={-1} className="display-2 outline-none">
            {dict.booking.chooseTime}
          </h2>
          <p className="text-muted mt-3 text-xs">
            {dict.booking.chooseTimeHint} {formatNumber(partySize ?? 2, locale)}
          </p>

          {result && !result.ok ? (
            <p role="alert" className="field-error mt-4">
              <span aria-hidden="true">⚠</span>
              {result.message}
            </p>
          ) : null}

          {slotsLoading ? (
            <div className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-5">
              {Array.from({ length: 15 }, (_, i) => (
                <div key={i} className="skeleton h-11 rounded-[var(--radius-sm)]" />
              ))}
            </div>
          ) : availability.error ? (
            <p className="field-error mt-4" role="alert">
              <span aria-hidden="true">⚠</span>
              {availability.error}
            </p>
          ) : !anyAvailable ? (
            <div className="border-line bg-bg-subtle mt-6 rounded-[var(--radius-lg)] border border-dashed p-8 text-center">
              <p className="font-display text-xl">{dict.booking.noSlots}</p>
              <p className="text-muted mx-auto mt-2 max-w-[28rem] text-xs">
                {dict.booking.noSlotsHint}
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setStep(1)}
                >
                  {dict.common.change}
                </button>
                <a href="#waitlist" className="btn btn-sm">
                  {dict.booking.joinWaitlist}
                </a>
              </div>
            </div>
          ) : (
            <div className="mt-6 flex flex-col gap-6">
              {grouped.map(([period, slots]) => (
                <div key={period}>
                  <h3 className="eyebrow mb-2">{period}</h3>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                    {slots.map((s) => (
                      <SlotButton
                        key={s.at}
                        slot={s}
                        dict={dict}
                        selected={slot?.at === s.at}
                        onSelect={() => {
                          setSlot(s);
                          setTableId(null);
                          if (!renderFloorPlan) setStep(3);
                        }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tier 3's interactive floor plan lives here. */}
          {renderFloorPlan && slot ? (
            <div className="mt-8">
              {renderFloorPlan({
                slotIso: slot.at,
                partySize: partySize ?? 2,
                selectedTableId: tableId,
                onSelect: setTableId,
              })}
              <button type="button" className="btn mt-6" onClick={() => setStep(3)}>
                {dict.common.continue}
              </button>
            </div>
          ) : null}

          <StepBack dict={dict} onBack={() => setStep(1)} />
        </section>
      ) : null}

      {/* ── Step 3: details ────────────────────────────────────────────── */}
      {step === 3 && slot ? (
        <section aria-labelledby="step-heading">
          <h2 id="step-heading" ref={headingRef} tabIndex={-1} className="display-2 outline-none">
            {dict.booking.yourDetails}
          </h2>
          <BookingSummary dict={dict} locale={locale} slot={slot} partySize={partySize ?? 2} />

          {result && !result.ok && result.code === 'validation' ? (
            <p role="alert" className="field-error mt-4">
              <span aria-hidden="true">⚠</span>
              {result.message}
            </p>
          ) : null}

          <form action={submit} noValidate className="mt-6 flex flex-col gap-5">
            <BotFields />

            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label={dict.forms.name}
                name="name"
                required
                error={result && !result.ok ? result.fieldErrors?.name : undefined}
              >
                {(p) => (
                  <input {...p} type="text" required autoComplete="name" className="field-input" />
                )}
              </Field>
              <Field
                label={dict.forms.email}
                name="email"
                required
                error={result && !result.ok ? result.fieldErrors?.email : undefined}
              >
                {(p) => (
                  <input
                    {...p}
                    type="email"
                    required
                    inputMode="email"
                    autoComplete="email"
                    className="field-input"
                  />
                )}
              </Field>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label={dict.forms.phone}
                name="phone"
                required
                error={result && !result.ok ? result.fieldErrors?.phone : undefined}
              >
                {(p) => (
                  <input
                    {...p}
                    type="tel"
                    required
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="+971 50 000 0000"
                    className="field-input"
                  />
                )}
              </Field>
              <Field
                label={dict.booking.occasion}
                name="occasion"
                optionalLabel={dict.common.optional}
              >
                {(p) => (
                  <select {...p} defaultValue="none" className="field-input">
                    <option value="none">—</option>
                    <option value="birthday">{locale === 'ar' ? 'عيد ميلاد' : 'Birthday'}</option>
                    <option value="anniversary">
                      {locale === 'ar' ? 'ذكرى سنوية' : 'Anniversary'}
                    </option>
                    <option value="business">{locale === 'ar' ? 'اجتماع عمل' : 'Business'}</option>
                    <option value="date">{locale === 'ar' ? 'موعد' : 'A date'}</option>
                    <option value="celebration">
                      {locale === 'ar' ? 'احتفال' : 'Celebration'}
                    </option>
                    <option value="first_visit">
                      {locale === 'ar' ? 'أول زيارة' : 'First visit'}
                    </option>
                  </select>
                )}
              </Field>
            </div>

            <Field
              label={dict.booking.specialRequests}
              name="specialRequests"
              hint={dict.booking.specialRequestsHint}
              optionalLabel={dict.common.optional}
            >
              {(p) => <textarea {...p} rows={3} maxLength={500} className="field-input resize-y" />}
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label={dict.booking.highChairs}
                name="highChairs"
                optionalLabel={dict.common.optional}
              >
                {(p) => (
                  <select {...p} defaultValue="0" className="field-input">
                    {[0, 1, 2, 3].map((n) => (
                      <option key={n} value={n}>
                        {formatNumber(n, locale)}
                      </option>
                    ))}
                  </select>
                )}
              </Field>
              <Field
                label={dict.booking.accessibility}
                name="accessibilityNeeds"
                optionalLabel={dict.common.optional}
              >
                {(p) => <input {...p} type="text" maxLength={300} className="field-input" />}
              </Field>
            </div>

            <label className="flex items-start gap-2.5 text-xs">
              <input type="checkbox" name="marketingOptIn" className="mt-0.5 size-4" />
              {dict.booking.marketingOptIn}
            </label>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                className="btn btn-lg"
                disabled={pending}
                data-loading={pending}
              >
                <span>{pending ? dict.forms.sending : dict.booking.confirmBooking}</span>
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setStep(2)}>
                {dict.common.back}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {/* ── Step 4: confirmation ───────────────────────────────────────── */}
      {step === 4 && result?.ok ? (
        <section aria-labelledby="step-heading">
          <div className="rounded-[var(--radius-lg)] border border-[color-mix(in_oklab,var(--c-success)_40%,transparent)] bg-[color-mix(in_oklab,var(--c-success)_10%,transparent)] p-6">
            <h2 id="step-heading" ref={headingRef} tabIndex={-1} className="display-3 outline-none">
              {dict.booking.confirmedTitle}
            </h2>
            <p className="text-muted mt-2 text-xs">{dict.booking.confirmedBody}</p>

            <dl className="mt-6 grid gap-3 sm:grid-cols-2">
              <Detail label={dict.booking.reference} value={result.reference} mono />
              <Detail
                label={dict.booking.stepTime}
                value={new Intl.DateTimeFormat(locale === 'ar' ? 'ar-AE' : 'en-AE', {
                  timeZone: brand.timezone,
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  hour: 'numeric',
                  minute: '2-digit',
                }).format(new Date(result.startsAt))}
              />
              <Detail
                label={dict.booking.stepParty}
                value={`${formatNumber(result.partySize, locale)} ${
                  result.partySize === 1 ? dict.booking.guest : dict.booking.guests
                }`}
              />
              {result.tableLabel ? <Detail label="Table" value={result.tableLabel} /> : null}
            </dl>

            <div className="mt-6 flex flex-wrap gap-2">
              <a href={result.manageUrl} className="btn btn-secondary btn-sm">
                {dict.booking.manageBooking}
              </a>
            </div>
          </div>

          <p className="text-faint text-2xs mt-6 leading-relaxed">
            {locale === 'ar'
              ? 'نحتفظ بالطاولة ١٥ دقيقة. إن تأخرت، راسلنا على واتساب وسنبقيها لك.'
              : 'We hold the table for 15 minutes. Running late? WhatsApp us and we will keep it.'}
          </p>
        </section>
      ) : null}
    </div>
  );
}

/* ── Pieces ───────────────────────────────────────────────────────────────── */

function SlotButton({
  slot,
  dict,
  selected,
  onSelect,
}: {
  slot: SlotView;
  dict: Dictionary;
  selected: boolean;
  onSelect: () => void;
}) {
  const reasonLabel = dict.booking.reasons[slot.reason as SlotReason];

  return (
    <button
      type="button"
      disabled={!slot.available}
      onClick={onSelect}
      aria-pressed={selected}
      title={slot.available ? undefined : reasonLabel}
      className={[
        'flex flex-col items-center justify-center rounded-[var(--radius-sm)] border-2 px-2 py-2 transition-colors',
        slot.available
          ? selected
            ? 'border-ink bg-ink text-bg'
            : 'border-line bg-surface hover:border-ink'
          : 'border-line/60 bg-bg-subtle text-faint cursor-not-allowed',
      ].join(' ')}
    >
      <span className="text-xs font-bold tabular-nums">{slot.time}</span>
      {!slot.available ? (
        <span className="text-2xs mt-0.5 leading-tight">{reasonLabel}</span>
      ) : slot.tablesFree <= 2 ? (
        <span className="text-2xs text-accent mt-0.5 leading-tight font-bold">
          {slot.tablesFree} left
        </span>
      ) : null}
    </button>
  );
}

function BookingSummary({
  dict,
  locale,
  slot,
  partySize,
}: {
  dict: Dictionary;
  locale: Locale;
  slot: SlotView;
  partySize: number;
}) {
  const when = new Intl.DateTimeFormat(locale === 'ar' ? 'ar-AE' : 'en-AE', {
    timeZone: brand.timezone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(slot.at));

  return (
    <p className="border-line bg-bg-subtle mt-4 rounded-[var(--radius-md)] border px-4 py-3 text-xs">
      <span className="text-ink font-bold">{when}</span>
      <span className="text-muted">
        {' · '}
        {formatNumber(partySize, locale)}{' '}
        {partySize === 1 ? dict.booking.guest : dict.booking.guests}
      </span>
    </p>
  );
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-faint text-2xs font-bold tracking-wider uppercase">{label}</dt>
      <dd
        className={`text-ink mt-0.5 text-xs font-semibold ${mono ? 'font-mono tracking-wider' : ''}`}
      >
        {value}
      </dd>
    </div>
  );
}

function StepBack({ dict, onBack }: { dict: Dictionary; onBack: () => void }) {
  return (
    <button type="button" className="btn btn-ghost btn-sm mt-8" onClick={onBack}>
      <span aria-hidden="true" className="rtl:rotate-180">
        ←
      </span>
      {dict.common.back}
    </button>
  );
}
