import { TZDate } from '@date-fns/tz';
import { brand, type HoursException, type TradingWindow, type Weekday } from '@/lib/config/brand';

/**
 * The trading calendar.
 *
 * One source of truth for "are we open right now", the Visit page's hours
 * table, the JSON-LD `openingHoursSpecification`, and Tier 2's reservation
 * availability engine. Everything resolves in `brand.timezone` (Asia/Dubai)
 * regardless of where the server or the visitor happens to be.
 *
 * Deliberate behaviours:
 *  • A window whose close time is at or before its open time is treated as
 *    running past midnight (18:00–02:00), not as a data error.
 *  • A dated exception replaces the weekday pattern entirely. `windows: []`
 *    means closed, which is different from "no exception for this date".
 *  • Yesterday's overnight window is considered when deciding "open now", so
 *    01:30 on a Saturday is correctly still Friday night's service.
 */

export const WEEKDAYS: readonly Weekday[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export const WEEKDAY_LABELS: Record<Weekday, { en: string; enShort: string; ar: string }> = {
  mon: { en: 'Monday', enShort: 'Mon', ar: 'الاثنين' },
  tue: { en: 'Tuesday', enShort: 'Tue', ar: 'الثلاثاء' },
  wed: { en: 'Wednesday', enShort: 'Wed', ar: 'الأربعاء' },
  thu: { en: 'Thursday', enShort: 'Thu', ar: 'الخميس' },
  fri: { en: 'Friday', enShort: 'Fri', ar: 'الجمعة' },
  sat: { en: 'Saturday', enShort: 'Sat', ar: 'السبت' },
  sun: { en: 'Sunday', enShort: 'Sun', ar: 'الأحد' },
};

/** schema.org day URIs, in our week order. */
const SCHEMA_DAYS: Record<Weekday, string> = {
  mon: 'https://schema.org/Monday',
  tue: 'https://schema.org/Tuesday',
  wed: 'https://schema.org/Wednesday',
  thu: 'https://schema.org/Thursday',
  fri: 'https://schema.org/Friday',
  sat: 'https://schema.org/Saturday',
  sun: 'https://schema.org/Sunday',
};

/* ── Primitives ───────────────────────────────────────────────────────────── */

/** "07:30" → 450 */
export function toMinutes(hhmm: string): number {
  const [h = '0', m = '0'] = hhmm.split(':');
  return Number(h) * 60 + Number(m);
}

/** 450 → "07:30" */
export function toHHMM(minutes: number): string {
  const wrapped = ((minutes % 1440) + 1440) % 1440;
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Now, in the café's timezone. Pass a date to convert an existing instant. */
export function cafeNow(at?: Date): TZDate {
  return new TZDate(at ?? new Date(), brand.timezone);
}

/** "YYYY-MM-DD" for a café-local date. */
export function toISODate(d: TZDate | Date): string {
  const z = d instanceof TZDate ? d : new TZDate(d, brand.timezone);
  return `${z.getFullYear()}-${String(z.getMonth() + 1).padStart(2, '0')}-${String(
    z.getDate(),
  ).padStart(2, '0')}`;
}

/** Parse "YYYY-MM-DD" as a café-local midnight. */
export function fromISODate(iso: string): TZDate {
  const [y = '1970', m = '1', d = '1'] = iso.split('-');
  return new TZDate(Number(y), Number(m) - 1, Number(d), 0, 0, 0, 0, brand.timezone);
}

export function weekdayOf(date: TZDate | string): Weekday {
  const d = typeof date === 'string' ? fromISODate(date) : date;
  // JS getDay(): 0 = Sunday. Our array starts on Monday.
  const idx = (d.getDay() + 6) % 7;
  return WEEKDAYS[idx] as Weekday;
}

export function addDaysISO(iso: string, days: number): string {
  const d = fromISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

/* ── Calendar resolution ─────────────────────────────────────────────────── */

export interface ResolvedDay {
  readonly date: string;
  readonly weekday: Weekday;
  readonly windows: readonly TradingWindow[];
  /** Present when a dated override applied. */
  readonly exception?: HoursException;
  readonly isClosed: boolean;
}

const exceptionIndex: ReadonlyMap<string, HoursException> = new Map(
  brand.hoursExceptions.map((e) => [e.date, e]),
);

/** The trading windows that apply on a given café-local date. */
export function resolveDay(iso: string): ResolvedDay {
  const weekday = weekdayOf(iso);
  const exception = exceptionIndex.get(iso);

  if (exception) {
    return {
      date: iso,
      weekday,
      windows: exception.windows,
      exception,
      isClosed: exception.windows.length === 0,
    };
  }

  const pattern = brand.hours.find((h) => h.day === weekday);
  const windows = pattern?.windows ?? [];
  return { date: iso, weekday, windows, isClosed: windows.length === 0 };
}

/** Absolute minute offsets for a window, relative to that date's midnight. */
function windowBounds(w: TradingWindow): { start: number; end: number } {
  const start = toMinutes(w.open);
  const rawEnd = toMinutes(w.close);
  // 18:00–02:00 runs into the following day.
  const end = rawEnd <= start ? rawEnd + 1440 : rawEnd;
  return { start, end };
}

/* ── "Are we open?" ──────────────────────────────────────────────────────── */

export type OpenStatus = 'open' | 'closing-soon' | 'closed' | 'opening-soon';

export interface OpenState {
  readonly status: OpenStatus;
  readonly isOpen: boolean;
  /** Short pill text, e.g. "Open now" / "Closed". */
  readonly label: string;
  /** Supporting line, e.g. "Closes 22:00" / "Opens Saturday 08:00". */
  readonly detail: string;
  /** "22:00" when open, undefined when closed. */
  readonly closesAt?: string;
  /** "07:00" when closed and we know the next opening. */
  readonly opensAt?: string;
  /** Set when today or the next opening day is governed by an exception. */
  readonly exceptionLabel?: string;
  readonly today: ResolvedDay;
  /** Minutes until the state changes — used to schedule the next re-render. */
  readonly minutesUntilChange: number;
}

const CLOSING_SOON_MINUTES = 30;
const OPENING_SOON_MINUTES = 60;

/** Human time, café-local. `18:30` → "6:30pm". */
export function formatTime(hhmm: string, locale: 'en' | 'ar' = 'en'): string {
  const mins = toMinutes(hhmm) % 1440;
  const h24 = Math.floor(mins / 60);
  const m = mins % 60;

  if (locale === 'ar') {
    const period = h24 < 12 ? 'ص' : 'م';
    const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
    const num = new Intl.NumberFormat('ar-AE').format(h12);
    const mm = m === 0 ? '' : `:${new Intl.NumberFormat('ar-AE').format(m).padStart(2, '٠')}`;
    return `${num}${mm} ${period}`;
  }

  const period = h24 < 12 ? 'am' : 'pm';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return m === 0 ? `${h12}${period}` : `${h12}:${String(m).padStart(2, '0')}${period}`;
}

/**
 * The current open/closed state. Pass `at` to evaluate a different instant —
 * the demo seed and the tests both rely on that.
 */
export function getOpenState(at?: Date, locale: 'en' | 'ar' = 'en'): OpenState {
  const now = cafeNow(at);
  const todayISO = toISODate(now);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const today = resolveDay(todayISO);
  const yesterday = resolveDay(addDaysISO(todayISO, -1));

  // Yesterday's overnight window may still be running.
  for (const w of yesterday.windows) {
    const { end } = windowBounds(w);
    if (end > 1440 && nowMinutes < end - 1440) {
      const closes = toHHMM(end);
      const until = end - 1440 - nowMinutes;
      return {
        status: until <= CLOSING_SOON_MINUTES ? 'closing-soon' : 'open',
        isOpen: true,
        label: until <= CLOSING_SOON_MINUTES ? 'Closing soon' : 'Open now',
        detail: `Closes ${formatTime(closes, locale)}`,
        closesAt: closes,
        today,
        minutesUntilChange: until,
      };
    }
  }

  for (const w of today.windows) {
    const { start, end } = windowBounds(w);
    if (nowMinutes >= start && nowMinutes < end) {
      const until = end - nowMinutes;
      const closes = toHHMM(end);
      return {
        status: until <= CLOSING_SOON_MINUTES ? 'closing-soon' : 'open',
        isOpen: true,
        label: until <= CLOSING_SOON_MINUTES ? 'Closing soon' : 'Open now',
        detail:
          until <= CLOSING_SOON_MINUTES
            ? `Closes in ${until} min`
            : `Closes ${formatTime(closes, locale)}`,
        closesAt: closes,
        exceptionLabel: today.exception?.label,
        today,
        minutesUntilChange: until,
      };
    }
  }

  // Closed. Find the next opening within the next fortnight.
  const next = findNextOpening(todayISO, nowMinutes);
  if (!next) {
    return {
      status: 'closed',
      isOpen: false,
      label: 'Closed',
      detail: 'Please check back — see our hours below',
      exceptionLabel: today.exception?.label,
      today,
      minutesUntilChange: 60,
    };
  }

  const sameDay = next.date === todayISO;
  const tomorrow = next.date === addDaysISO(todayISO, 1);
  const dayName = WEEKDAY_LABELS[weekdayOf(next.date)][locale === 'ar' ? 'ar' : 'en'];
  const when = sameDay ? 'today' : tomorrow ? 'tomorrow' : dayName;
  const minutesAway = next.absoluteMinutesFromNow;

  return {
    status: minutesAway <= OPENING_SOON_MINUTES ? 'opening-soon' : 'closed',
    isOpen: false,
    label: minutesAway <= OPENING_SOON_MINUTES ? 'Opening soon' : 'Closed',
    detail:
      minutesAway <= OPENING_SOON_MINUTES
        ? `Opens in ${minutesAway} min`
        : `Opens ${when} ${formatTime(next.open, locale)}`,
    opensAt: next.open,
    exceptionLabel: today.exception?.label ?? next.exceptionLabel,
    today,
    minutesUntilChange: minutesAway,
  };
}

interface NextOpening {
  readonly date: string;
  readonly open: string;
  readonly absoluteMinutesFromNow: number;
  readonly exceptionLabel?: string;
}

/** The next time the doors open, scanning up to 14 days ahead. */
export function findNextOpening(fromISO: string, fromMinutes: number): NextOpening | null {
  for (let offset = 0; offset < 14; offset += 1) {
    const iso = addDaysISO(fromISO, offset);
    const day = resolveDay(iso);
    for (const w of day.windows) {
      const { start } = windowBounds(w);
      const absolute = offset * 1440 + start;
      const fromAbsolute = fromMinutes;
      if (absolute > fromAbsolute) {
        return {
          date: iso,
          open: w.open,
          absoluteMinutesFromNow: absolute - fromAbsolute,
          exceptionLabel: day.exception?.label,
        };
      }
    }
  }
  return null;
}

/* ── Display helpers ─────────────────────────────────────────────────────── */

export interface HoursRow {
  readonly days: readonly Weekday[];
  readonly label: string;
  readonly labelAr: string;
  readonly windows: readonly TradingWindow[];
  readonly display: string;
}

/**
 * The weekly pattern, collapsing runs of identical days into one row
 * ("Mon–Wed 7am–10pm") the way a shopfront sign would.
 */
export function weeklyHoursRows(locale: 'en' | 'ar' = 'en'): readonly HoursRow[] {
  const rows: HoursRow[] = [];
  let run: Weekday[] = [];
  let runWindows: readonly TradingWindow[] = [];

  const key = (ws: readonly TradingWindow[]) =>
    ws.map((w) => `${w.open}-${w.close}`).join('|') || 'closed';

  const flush = () => {
    if (run.length === 0) return;
    const first = run[0] as Weekday;
    const last = run[run.length - 1] as Weekday;
    const shortOf = (d: Weekday) =>
      locale === 'ar' ? WEEKDAY_LABELS[d].ar : WEEKDAY_LABELS[d].enShort;
    const label = run.length === 1 ? shortOf(first) : `${shortOf(first)}–${shortOf(last)}`;
    const labelAr =
      run.length === 1
        ? WEEKDAY_LABELS[first].ar
        : `${WEEKDAY_LABELS[first].ar} – ${WEEKDAY_LABELS[last].ar}`;
    rows.push({
      days: [...run],
      label,
      labelAr,
      windows: runWindows,
      display:
        runWindows.length === 0
          ? locale === 'ar'
            ? 'مغلق'
            : 'Closed'
          : runWindows
              .map((w) => `${formatTime(w.open, locale)} – ${formatTime(w.close, locale)}`)
              .join(', '),
    });
    run = [];
  };

  for (const day of WEEKDAYS) {
    const windows = brand.hours.find((h) => h.day === day)?.windows ?? [];
    if (run.length > 0 && key(windows) === key(runWindows)) {
      run.push(day);
    } else {
      flush();
      run = [day];
      runWindows = windows;
    }
  }
  flush();
  return rows;
}

/** Upcoming dated exceptions, for the "Holiday hours" panel. */
export function upcomingExceptions(fromISO?: string, limit = 4): readonly HoursException[] {
  const from = fromISO ?? toISODate(cafeNow());
  return brand.hoursExceptions
    .filter((e) => e.date >= from)
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, limit);
}

/** schema.org OpeningHoursSpecification[] for the weekly pattern. */
export function openingHoursSpecification() {
  return brand.hours
    .filter((h) => h.windows.length > 0)
    .flatMap((h) =>
      h.windows.map((w) => ({
        '@type': 'OpeningHoursSpecification' as const,
        dayOfWeek: SCHEMA_DAYS[h.day],
        opens: w.open,
        closes: w.close,
      })),
    );
}

/** schema.org specialOpeningHoursSpecification[] for dated exceptions. */
export function specialOpeningHoursSpecification(fromISO?: string) {
  const from = fromISO ?? toISODate(cafeNow());
  return brand.hoursExceptions
    .filter((e) => e.date >= from)
    .map((e) =>
      e.windows.length === 0
        ? {
            '@type': 'OpeningHoursSpecification' as const,
            validFrom: e.date,
            validThrough: e.date,
            opens: '00:00',
            closes: '00:00',
          }
        : {
            '@type': 'OpeningHoursSpecification' as const,
            validFrom: e.date,
            validThrough: e.date,
            opens: e.windows[0]?.open ?? '00:00',
            closes: e.windows[e.windows.length - 1]?.close ?? '00:00',
          },
    );
}
