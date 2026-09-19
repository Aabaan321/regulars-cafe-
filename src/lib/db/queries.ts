import 'server-only';
import { asAnon, asService } from '@/lib/db/client';
import type { DietaryTag, MenuBadge, ResolvedThumbnail } from '@/lib/content/menu-display';
import { getImage } from '@/lib/content/images';
import type { Locale } from '@/lib/i18n/dictionaries';

/**
 * Read models for Tier 2+.
 *
 * Tier 1 renders `lib/content/menu.ts` directly — it is a brochure and a code
 * deploy is the honest way to change a price. From Tier 2 the café owns the
 * menu, so everything here reads the database instead.
 *
 * Public reads go through `asAnon`, which means the RLS policies decide what
 * comes back. If an item is hidden, it is hidden because Postgres said so, not
 * because a `where` clause remembered to ask.
 */

/* ── Menu ─────────────────────────────────────────────────────────────────── */

export interface MenuItemRow {
  id: string;
  slug: string;
  category_id: string;
  name: string;
  name_ar: string;
  description: string;
  description_ar: string;
  price_fils: number;
  dietary: DietaryTag[];
  allergens: string[];
  badges: MenuBadge[];
  is_available: boolean;
  unavailable_reason: string | null;
  is_orderable: boolean;
  image_key: string | null;
  sort_order: number;
}

export interface MenuCategoryRow {
  id: string;
  slug: string;
  name: string;
  name_ar: string;
  description: string;
  description_ar: string;
  service_note: string | null;
  service_note_ar: string | null;
  sort_order: number;
}

export interface MenuItemView {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  readonly priceFils: number;
  readonly dietary: readonly DietaryTag[];
  readonly allergens: readonly string[];
  readonly badges: readonly MenuBadge[];
  readonly available: boolean;
  readonly unavailableReason: string | null;
  readonly orderable: boolean;
  readonly image: ResolvedThumbnail | null;
}

export interface MenuCategoryView {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  readonly serviceNote: string | null;
  readonly items: readonly MenuItemView[];
}

function thumbnailFor(key: string | null): ResolvedThumbnail | null {
  if (!key) return null;
  const image = getImage(key);
  if (!image) return null;
  return {
    src: image.src,
    width: image.width,
    height: image.height,
    blurDataURL: image.blurDataURL,
    alt: image.alt,
  };
}

/** The whole live menu, grouped, in the requested language. */
export async function getMenu(locale: Locale = 'en'): Promise<readonly MenuCategoryView[]> {
  const { categories, items } = await asAnon(async (tx) => {
    const [categoryRows, itemRows] = await Promise.all([
      tx<MenuCategoryRow[]>`
        select id, slug, name, name_ar, description, description_ar,
               service_note, service_note_ar, sort_order
          from menu_categories
         order by sort_order
      `,
      tx<MenuItemRow[]>`
        select id, slug, category_id, name, name_ar, description, description_ar,
               price_fils, dietary, allergens, badges, is_available,
               unavailable_reason, is_orderable, image_key, sort_order
          from menu_items
         order by sort_order
      `,
    ]);
    return { categories: categoryRows, items: itemRows };
  });

  const ar = locale === 'ar';

  return categories.map((category) => ({
    id: category.id,
    slug: category.slug,
    name: ar && category.name_ar ? category.name_ar : category.name,
    description: ar && category.description_ar ? category.description_ar : category.description,
    serviceNote: ar ? (category.service_note_ar ?? null) : category.service_note,
    items: items
      .filter((item) => item.category_id === category.id)
      .map((item) => ({
        id: item.id,
        slug: item.slug,
        name: ar && item.name_ar ? item.name_ar : item.name,
        description: ar && item.description_ar ? item.description_ar : item.description,
        priceFils: item.price_fils,
        dietary: item.dietary ?? [],
        allergens: item.allergens ?? [],
        badges: item.badges ?? [],
        available: item.is_available,
        unavailableReason: item.unavailable_reason,
        orderable: item.is_orderable,
        image: thumbnailFor(item.image_key),
      })),
  }));
}

/* ── Modifiers, for the order flow ────────────────────────────────────────── */

export interface ModifierOptionView {
  readonly id: string;
  readonly label: string;
  readonly priceDeltaFils: number;
  readonly isDefault: boolean;
}

export interface ModifierGroupView {
  readonly id: string;
  readonly label: string;
  readonly select: 'single' | 'multi';
  readonly min: number;
  readonly max: number;
  readonly options: readonly ModifierOptionView[];
}

/** Modifier groups for one item, in order. */
export async function getModifiersFor(
  itemId: string,
  locale: Locale = 'en',
): Promise<readonly ModifierGroupView[]> {
  const rows = await asAnon(
    async (tx) => tx<
      {
        group_id: string;
        group_label: string;
        group_label_ar: string;
        select_type: 'single' | 'multi';
        min_select: number;
        max_select: number;
        group_sort: number;
        option_id: string;
        option_label: string;
        option_label_ar: string;
        price_delta_fils: number;
        is_default: boolean;
        option_sort: number;
      }[]
    >`
      select g.id as group_id, g.label as group_label, g.label_ar as group_label_ar,
             g.select_type, g.min_select, g.max_select, m.sort_order as group_sort,
             o.id as option_id, o.label as option_label, o.label_ar as option_label_ar,
             o.price_delta_fils, o.is_default, o.sort_order as option_sort
        from menu_item_modifier_groups m
        join modifier_groups g on g.id = m.group_id
        join modifier_options o on o.group_id = g.id
       where m.item_id = ${itemId}
       order by m.sort_order, o.sort_order
    `,
  );

  const ar = locale === 'ar';
  const groups = new Map<string, ModifierGroupView & { options: ModifierOptionView[] }>();

  for (const row of rows) {
    let group = groups.get(row.group_id);
    if (!group) {
      group = {
        id: row.group_id,
        label: ar && row.group_label_ar ? row.group_label_ar : row.group_label,
        select: row.select_type,
        min: row.min_select,
        max: row.max_select,
        options: [],
      };
      groups.set(row.group_id, group);
    }
    group.options.push({
      id: row.option_id,
      label: ar && row.option_label_ar ? row.option_label_ar : row.option_label,
      priceDeltaFils: row.price_delta_fils,
      isDefault: row.is_default,
    });
  }

  return [...groups.values()];
}

/* ── Availability ─────────────────────────────────────────────────────────── */

export type SlotReason =
  | 'available'
  | 'fully_booked'
  | 'no_table_for_party_size'
  | 'kitchen_at_capacity'
  | 'blackout'
  | 'past'
  | 'too_soon'
  | 'closed';

export interface SlotView {
  /** ISO instant. */
  readonly at: string;
  /** "12:30", café-local. */
  readonly time: string;
  readonly period: string;
  readonly available: boolean;
  readonly reason: SlotReason;
  readonly tablesFree: number;
  readonly coversLeft: number;
}

/**
 * Every slot for a date and party size — including the ones that cannot be
 * booked, each carrying the reason. The UI shows them disabled rather than
 * hiding them, because a guest who can see why 13:00 is gone books 13:30, and
 * a guest who sees a gap assumes the site is broken.
 */
export async function getAvailability(
  date: string,
  partySize: number,
  timezone: string,
): Promise<readonly SlotView[]> {
  const rows = await asService(
    async (tx) => tx<
      {
        slot_at: Date;
        local_time: string;
        period_name: string;
        is_available: boolean;
        reason: SlotReason;
        tables_free: number;
        covers_left: number;
      }[]
    >`
      select * from reservation_availability(${date}::date, ${partySize}::int, ${timezone}, 60)
    `,
  );

  return rows.map((row) => ({
    at: row.slot_at.toISOString(),
    time: row.local_time,
    period: row.period_name,
    available: row.is_available,
    reason: row.reason,
    tablesFree: row.tables_free,
    coversLeft: row.covers_left,
  }));
}

/** Which dates in a range have any availability at all — feeds the date picker. */
export async function getDateAvailabilitySummary(
  startDate: string,
  days: number,
  partySize: number,
  timezone: string,
): Promise<Record<string, { open: boolean; slots: number }>> {
  // Delegated to `days_with_availability` (migration 0008). Asking per day
  // from the application meant 21 round trips through the per-slot function;
  // one call does it set-based in single-digit milliseconds.
  const rows = await asService(
    async (tx) => tx<{ day: string; has_availability: boolean }[]>`
      select to_char(day, 'YYYY-MM-DD') as day, has_availability
        from days_with_availability(${startDate}::date, ${days}::int, ${partySize}::int, ${timezone})
    `,
  );

  return Object.fromEntries(
    // `slots` is a flag, not a count — the date step only reads `open`.
    rows.map((row) => [row.day, { open: row.has_availability, slots: row.has_availability ? 1 : 0 }]),
  );
}

/* ── Events ───────────────────────────────────────────────────────────────── */

export interface EventView {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly summary: string;
  readonly description: string;
  readonly type: string;
  readonly startsAt: string;
  readonly endsAt: string;
  readonly priceFils: number;
  readonly capacity: number;
  readonly spotsTaken: number;
  readonly spotsLeft: number;
  readonly soldOut: boolean;
  readonly host: string | null;
  readonly image: ResolvedThumbnail | null;
}

export async function getPublishedEvents(locale: Locale = 'en'): Promise<readonly EventView[]> {
  const rows = await asAnon(
    async (tx) => tx<
      {
        id: string;
        slug: string;
        title: string;
        title_ar: string;
        summary: string;
        summary_ar: string;
        description: string;
        description_ar: string;
        event_type: string;
        starts_at: Date;
        ends_at: Date;
        price_fils: number;
        capacity: number;
        spots_taken: number;
        image_key: string | null;
        host_name: string | null;
      }[]
    >`
      select id, slug, title, title_ar, summary, summary_ar, description, description_ar,
             event_type::text as event_type, starts_at, ends_at, price_fils,
             capacity, spots_taken, image_key, host_name
        from events
       where starts_at > now() - interval '1 day'
       order by starts_at
    `,
  );

  const ar = locale === 'ar';
  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: ar && row.title_ar ? row.title_ar : row.title,
    summary: ar && row.summary_ar ? row.summary_ar : row.summary,
    description: ar && row.description_ar ? row.description_ar : row.description,
    type: row.event_type,
    startsAt: row.starts_at.toISOString(),
    endsAt: row.ends_at.toISOString(),
    priceFils: row.price_fils,
    capacity: row.capacity,
    spotsTaken: row.spots_taken,
    spotsLeft: Math.max(0, row.capacity - row.spots_taken),
    soldOut: row.spots_taken >= row.capacity,
    host: row.host_name,
    image: thumbnailFor(row.image_key),
  }));
}

export async function getEventBySlug(
  slug: string,
  locale: Locale = 'en',
): Promise<EventView | null> {
  const events = await getPublishedEvents(locale);
  return events.find((event) => event.slug === slug) ?? null;
}

/* ── Floor plan (Tier 3) ──────────────────────────────────────────────────── */

export interface TableView {
  readonly id: string;
  readonly code: string;
  readonly label: string;
  readonly zone: string;
  readonly shape: string;
  readonly seatsMin: number;
  readonly seatsMax: number;
  readonly accessible: boolean;
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly fits: boolean;
  readonly free: boolean;
}

/** Which specific tables are free at an instant — the interactive floor plan. */
export async function getTablesAt(
  slotIso: string,
  partySize: number,
): Promise<readonly TableView[]> {
  const rows = await asService(
    async (tx) => tx<
      {
        table_id: string;
        code: string;
        label: string;
        zone: string;
        shape: string;
        seats_min: number;
        seats_max: number;
        is_accessible: boolean;
        plan_x: string;
        plan_y: string;
        plan_w: string;
        plan_h: string;
        fits: boolean;
        is_free: boolean;
      }[]
    >`
      select * from tables_free_at(${slotIso}::timestamptz, ${partySize}::int, 105)
    `,
  );

  return rows.map((row) => ({
    id: row.table_id,
    code: row.code,
    label: row.label,
    zone: row.zone,
    shape: row.shape,
    seatsMin: row.seats_min,
    seatsMax: row.seats_max,
    accessible: row.is_accessible,
    x: Number(row.plan_x),
    y: Number(row.plan_y),
    w: Number(row.plan_w),
    h: Number(row.plan_h),
    fits: row.fits,
    free: row.is_free,
  }));
}
