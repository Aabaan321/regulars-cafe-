import { brand } from '@/lib/config/brand';
import { addDaysISO, cafeNow, toISODate } from '@/lib/utils/hours';
import type { Locale } from '@/lib/i18n/dictionaries';

export interface BookableDate {
  readonly iso: string;
  readonly weekday: string;
  readonly day: string;
  readonly month: string;
}

/**
 * The dates the booking flow may offer, rendered in café time on the server.
 *
 * Built server-side so the list is identical for a guest in Dubai and one in
 * London, and so the first render already has real dates in it rather than a
 * skeleton that fills in after hydration.
 */
export function bookableDates(days = 21, locale: Locale = 'en'): readonly BookableDate[] {
  const today = toISODate(cafeNow());
  const tag = locale === 'ar' ? 'ar-AE' : 'en-AE';

  const weekdayFormat = new Intl.DateTimeFormat(tag, { timeZone: brand.timezone, weekday: 'short' });
  const dayFormat = new Intl.DateTimeFormat(tag, { timeZone: brand.timezone, day: 'numeric' });
  const monthFormat = new Intl.DateTimeFormat(tag, { timeZone: brand.timezone, month: 'short' });

  return Array.from({ length: days }, (_, offset) => {
    const iso = addDaysISO(today, offset);
    // Midday avoids any chance of a date rolling over a zone boundary.
    const at = new Date(`${iso}T12:00:00Z`);
    return {
      iso,
      weekday: weekdayFormat.format(at),
      day: dayFormat.format(at),
      month: monthFormat.format(at),
    };
  });
}
