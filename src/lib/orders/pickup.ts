import { TZDate } from '@date-fns/tz';
import { brand } from '@/lib/config/brand';
import {
  addDaysISO,
  cafeNow,
  formatTime,
  resolveDay,
  toHHMM,
  toISODate,
  toMinutes,
} from '@/lib/utils/hours';

/**
 * When a pickup order can actually be collected.
 *
 * Derived from the same trading hours everything else on the site reads, so
 * a holiday closure in `brand.hoursExceptions` removes the slots without
 * anyone remembering to. The rules are the ones a bar actually works to:
 *
 *  • Nothing sooner than the kitchen's lead time — a drink is not ready the
 *    moment you tap pay, and promising otherwise is how you get an angry
 *    person at the counter at minute eight.
 *  • Nothing in the last half hour before close, because the machine is
 *    being stripped and the grinder is already off.
 *  • Only today and tomorrow. A pickup order for Thursday is a catering
 *    enquiry, and it belongs on the events form where a human reads it.
 */

/** Minutes between placing an order and the earliest it can be collected. */
export const LEAD_MINUTES = 12;
/** Orders stop this long before close. */
export const LAST_ORDER_BUFFER_MINUTES = 30;
/** Slots are offered on this grid. */
export const SLOT_STEP_MINUTES = 5;

export interface PickupSlot {
  /** `2026-09-19T14:35` in café-local time, which is what the form posts. */
  readonly value: string;
  readonly date: string;
  readonly time: string;
  readonly label: string;
  /** "Today" / "Tomorrow", already localised. */
  readonly dayLabel: string;
}

function dayLabel(iso: string, todayISO: string, locale: 'en' | 'ar'): string {
  if (iso === todayISO) return locale === 'ar' ? 'اليوم' : 'Today';
  return locale === 'ar' ? 'غداً' : 'Tomorrow';
}

/**
 * Every collectable slot in the next two trading days.
 *
 * Returns `[]` when the café is shut and stays shut — the caller shows a
 * closed state rather than an empty select, because an empty dropdown reads
 * as broken while "we are closed" reads as information.
 */
export function pickupSlots(at?: Date, locale: 'en' | 'ar' = 'en'): readonly PickupSlot[] {
  const now = cafeNow(at);
  const todayISO = toISODate(now);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const slots: PickupSlot[] = [];

  for (const offset of [0, 1]) {
    const iso = addDaysISO(todayISO, offset);
    const day = resolveDay(iso);
    if (day.isClosed) continue;

    for (const window of day.windows) {
      const open = toMinutes(window.open);
      const rawClose = toMinutes(window.close);
      const close = rawClose <= open ? rawClose + 1440 : rawClose;

      // Today's earliest slot is bounded by the lead time; tomorrow's by open.
      const earliest = offset === 0 ? Math.max(open, nowMinutes + LEAD_MINUTES) : open;
      const latest = close - LAST_ORDER_BUFFER_MINUTES;

      // Round up onto the slot grid so the times read as times rather than as
      // "14:37", which looks like a bug even when it is only arithmetic.
      let minute = Math.ceil(earliest / SLOT_STEP_MINUTES) * SLOT_STEP_MINUTES;
      for (; minute <= latest; minute += SLOT_STEP_MINUTES) {
        // A window crossing midnight would land the slot on the next date.
        // The café shuts at 22:00 at the latest, so clamp rather than model it.
        if (minute >= 1440) break;
        const hhmm = toHHMM(minute);
        slots.push({
          value: `${iso}T${hhmm}`,
          date: iso,
          time: hhmm,
          label: formatTime(hhmm, locale),
          dayLabel: dayLabel(iso, todayISO, locale),
        });
      }
    }
  }

  return slots;
}

/** Is this exactly one of the slots we are currently offering? */
export function isOfferedSlot(value: string, at?: Date): boolean {
  return pickupSlots(at).some((slot) => slot.value === value);
}

/**
 * `2026-09-19T14:35` in café-local time → a real instant.
 *
 * Built through `TZDate` rather than by pasting an offset on the string:
 * the Gulf does not observe DST today, but hard-coding +04:00 is the kind of
 * assumption that silently rots, and the rest of the codebase already goes
 * through the café timezone for exactly this reason.
 */
export function slotToInstant(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const [, y, mo, d, hh, mm] = match;
  if (!y || !mo || !d || !hh || !mm) return null;

  const local = new TZDate(
    Number(y),
    Number(mo) - 1,
    Number(d),
    Number(hh),
    Number(mm),
    0,
    0,
    brand.timezone,
  );
  const instant = new Date(local.getTime());
  return Number.isNaN(instant.getTime()) ? null : instant;
}

/* ── Money ──────────────────────────────────────────────────────────────── */

/** UAE VAT, in basis points, so the arithmetic stays in integers. */
export const VAT_BASIS_POINTS = 500;

export interface OrderTotals {
  readonly subtotalFils: number;
  readonly vatFils: number;
  readonly totalFils: number;
}

/**
 * Menu prices on this site are VAT-inclusive — that is what the menu page
 * says and what the café charges — so VAT is *extracted* from the total
 * rather than added to it. Getting this backwards overcharges every guest by
 * 5%, so it is one function that both the cart and the server call.
 */
export function orderTotals(grossFils: number): OrderTotals {
  const vatFils = Math.round((grossFils * VAT_BASIS_POINTS) / (10_000 + VAT_BASIS_POINTS));
  return { subtotalFils: grossFils - vatFils, vatFils, totalFils: grossFils };
}
