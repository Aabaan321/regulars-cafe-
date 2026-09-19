/**
 * Seeds the demo.
 *
 *   npm run seed          # fill empty tables, leave existing rows alone
 *   npm run reset-demo    # wipe demo data and re-seed (see reset-demo.ts)
 *
 * An empty demo sells nothing: a bookings board with no bookings and an order
 * queue with no orders look like a broken site, not a quiet Tuesday. So this
 * builds a plausible week of trade — around 25 reservations spread over the
 * next fortnight at realistic times, eight live orders, real enquiries, and
 * loyalty cards at three different stages.
 *
 * Reservations are created through `create_reservation()` rather than inserted
 * directly, so seeding genuinely exercises the availability engine, the table
 * assignment and the double-booking constraint. If the seed completes, the
 * booking engine works.
 */

import postgres from 'postgres';
import { loadEnv } from './lib/env';
import { hashPassword } from '../src/lib/auth/password';
import { issueToken } from '../src/lib/utils/tokens';
import { menuCategories, menuItems, modifierGroups } from '../src/lib/content/menu';
import { brand } from '../src/lib/config/brand';
import {
  enquiries as demoEnquiries,
  guestNames,
  orderNotes,
  servicePeriods,
  specialRequests,
  subscribers as demoSubscribers,
  tables as demoTables,
} from './lib/demo-data';

loadEnv();

const url = process.env.DATABASE_ADMIN_URL ?? process.env.DATABASE_URL;
if (!url) {
  console.error('✗ DATABASE_ADMIN_URL (or DATABASE_URL) is not set. See .env.example.');
  process.exit(1);
}

const sql = postgres(url, { max: 1, onnotice: () => {} });

/* ── Deterministic randomness ──────────────────────────────────────────────
   Seeded so two runs produce the same demo. A presenter who rehearses on
   Monday should see the same board on Tuesday. */
let seedState = 0x2f6e2b1;
function rand(): number {
  seedState ^= seedState << 13;
  seedState ^= seedState >>> 17;
  seedState ^= seedState << 5;
  return ((seedState >>> 0) % 100000) / 100000;
}
function pick<T>(items: readonly T[]): T {
  return items[Math.floor(rand() * items.length)] as T;
}
function randInt(min: number, max: number): number {
  return min + Math.floor(rand() * (max - min + 1));
}

function emailFor(name: string): string {
  const slug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z\s]/g, '')
    .trim()
    .split(/\s+/)
    .join('.');
  return `${slug}@example.com`;
}

function phoneFor(index: number): string {
  return `+9715${String(index % 10)}${String(1000000 + ((index * 73129) % 8999999))}`;
}

/** Café-local date, N days from today, as YYYY-MM-DD. */
function dubaiDatePlus(days: number): string {
  const now = new Date();
  const local = new Date(now.toLocaleString('en-US', { timeZone: brand.timezone }));
  local.setDate(local.getDate() + days);
  return `${local.getFullYear()}-${String(local.getMonth() + 1).padStart(2, '0')}-${String(local.getDate()).padStart(2, '0')}`;
}

async function main() {
  console.info('Seeding the demo…\n');

  /* ── Staff ──────────────────────────────────────────────────────────── */
  const password = process.env.DEMO_ADMIN_PASSWORD ?? 'RegularsDemo!2026';
  const hash = await hashPassword(password);

  const staff = [
    { email: 'owner@regulars.ae', name: 'Nadia Haddad', role: 'owner' },
    { email: 'manager@regulars.ae', name: 'Rami Kassab', role: 'manager' },
    { email: 'floor@regulars.ae', name: 'Joy Mendoza', role: 'staff' },
  ] as const;

  for (const person of staff) {
    await sql`
      insert into admin_users (email, name, role, password_hash)
      values (${person.email}, ${person.name}, ${person.role}::admin_role, ${hash})
      on conflict (email) do update
        set name = excluded.name, role = excluded.role, password_hash = excluded.password_hash
    `;
  }
  console.info(`  ✓ ${staff.length} staff logins (password: ${password})`);

  /* ── Menu ───────────────────────────────────────────────────────────── */
  for (const category of menuCategories) {
    await sql`
      insert into menu_categories (id, slug, name, name_ar, description, description_ar, service_note, service_note_ar, sort_order)
      values (
        ${category.id}, ${category.slug}, ${category.name}, ${category.nameAr},
        ${category.description}, ${category.descriptionAr},
        ${category.serviceNote ?? null}, ${category.serviceNoteAr ?? null}, ${category.sortOrder}
      )
      on conflict (id) do update set
        slug = excluded.slug, name = excluded.name, name_ar = excluded.name_ar,
        description = excluded.description, description_ar = excluded.description_ar,
        service_note = excluded.service_note, service_note_ar = excluded.service_note_ar,
        sort_order = excluded.sort_order
    `;
  }

  for (const [index, group] of modifierGroups.entries()) {
    await sql`
      insert into modifier_groups (id, label, label_ar, select_type, min_select, max_select, sort_order)
      values (${group.id}, ${group.label}, ${group.labelAr}, ${group.select}, ${group.min}, ${group.max}, ${index})
      on conflict (id) do update set
        label = excluded.label, label_ar = excluded.label_ar,
        select_type = excluded.select_type, min_select = excluded.min_select,
        max_select = excluded.max_select, sort_order = excluded.sort_order
    `;
    for (const [optionIndex, option] of group.options.entries()) {
      await sql`
        insert into modifier_options (id, group_id, label, label_ar, price_delta_fils, is_default, sort_order)
        values (${option.id}, ${group.id}, ${option.label}, ${option.labelAr},
                ${option.priceDeltaFils}, ${option.isDefault ?? false}, ${optionIndex})
        on conflict (id) do update set
          label = excluded.label, label_ar = excluded.label_ar,
          price_delta_fils = excluded.price_delta_fils, is_default = excluded.is_default,
          sort_order = excluded.sort_order
      `;
    }
  }

  for (const item of menuItems) {
    await sql`
      insert into menu_items (
        id, slug, category_id, name, name_ar, description, description_ar,
        price_fils, dietary, allergens, badges, is_available, unavailable_reason,
        is_orderable, image_key, sort_order
      ) values (
        ${item.id}, ${item.slug}, ${item.categoryId}, ${item.name}, ${item.nameAr},
        ${item.description}, ${item.descriptionAr}, ${item.priceFils},
        ${sql.array([...item.dietary])}, ${sql.array([...item.allergens])}, ${sql.array([...item.badges])},
        ${item.available}, ${item.unavailableReason ?? null}, ${item.orderable},
        ${item.imageKey ?? null}, ${item.sortOrder}
      )
      on conflict (id) do update set
        name = excluded.name, name_ar = excluded.name_ar,
        description = excluded.description, description_ar = excluded.description_ar,
        price_fils = excluded.price_fils, dietary = excluded.dietary,
        allergens = excluded.allergens, badges = excluded.badges,
        is_available = excluded.is_available, unavailable_reason = excluded.unavailable_reason,
        is_orderable = excluded.is_orderable, image_key = excluded.image_key,
        sort_order = excluded.sort_order
    `;
    for (const [groupIndex, groupId] of item.modifierGroupIds.entries()) {
      await sql`
        insert into menu_item_modifier_groups (item_id, group_id, sort_order)
        values (${item.id}, ${groupId}, ${groupIndex})
        on conflict (item_id, group_id) do update set sort_order = excluded.sort_order
      `;
    }
  }
  console.info(
    `  ✓ ${menuCategories.length} categories, ${menuItems.length} menu items, ${modifierGroups.length} modifier groups`,
  );

  /* ── Room ───────────────────────────────────────────────────────────── */
  for (const [index, table] of demoTables.entries()) {
    await sql`
      insert into restaurant_tables (
        code, label, label_ar, seats_min, seats_max, zone, shape,
        is_accessible, plan_x, plan_y, plan_w, plan_h, sort_order
      ) values (
        ${table.code}, ${table.label}, ${table.labelAr}, ${table.seatsMin}, ${table.seatsMax},
        ${table.zone}::table_zone, ${table.shape}::table_shape, ${table.accessible},
        ${table.x}, ${table.y}, ${table.w}, ${table.h}, ${index}
      )
      on conflict (code) do update set
        label = excluded.label, label_ar = excluded.label_ar,
        seats_min = excluded.seats_min, seats_max = excluded.seats_max,
        zone = excluded.zone, shape = excluded.shape, is_accessible = excluded.is_accessible,
        plan_x = excluded.plan_x, plan_y = excluded.plan_y,
        plan_w = excluded.plan_w, plan_h = excluded.plan_h, sort_order = excluded.sort_order
    `;
  }

  await sql`delete from service_periods`;
  for (const period of servicePeriods) {
    for (const weekday of period.weekdays) {
      await sql`
        insert into service_periods (
          name, name_ar, weekday, starts_at, last_seating_at,
          slot_interval_min, turn_time_min, buffer_min, max_covers_per_slot
        ) values (
          ${period.name}, ${period.nameAr}, ${weekday}, ${period.startsAt}, ${period.lastSeatingAt},
          ${period.slotInterval}, ${period.turnTime}, ${period.buffer}, ${period.maxCovers}
        )
      `;
    }
  }
  const seats = demoTables.reduce((sum, t) => sum + t.seatsMax, 0);
  console.info(
    `  ✓ ${demoTables.length} tables (${seats} covers), ${servicePeriods.length} service periods`,
  );

  /* ── Blackout dates ─────────────────────────────────────────────────── */
  const blackouts = [
    {
      date: dubaiDatePlus(9),
      reason: 'Private hire — book launch, whole warehouse',
      fullDay: true,
      from: null,
      to: null,
    },
    {
      date: dubaiDatePlus(4),
      reason: 'Courtyard closed for a photo shoot',
      fullDay: false,
      from: '16:00',
      to: '20:30',
    },
  ];
  for (const blackout of blackouts) {
    await sql`
      insert into blackout_dates (date, reason, is_full_day, starts_at, ends_at)
      values (${blackout.date}, ${blackout.reason}, ${blackout.fullDay}, ${blackout.from}, ${blackout.to})
      on conflict do nothing
    `;
  }
  console.info(`  ✓ ${blackouts.length} blackout dates (one full day, one partial)`);

  /* ── Reservations ───────────────────────────────────────────────────── */
  // Created through the real RPC, so this doubles as an end-to-end test of
  // the availability engine and the no-double-booking constraint.
  // Real books cluster. If bookings are spread evenly across a fortnight no
  // slot is ever contended, the booking flow never shows a disabled slot, and
  // the client never sees the half of the engine that matters. So most of the
  // trade lands in each day's peak window, exactly as it does in the café.
  const weekdayPeak = ['09:00', '09:15', '09:30', '12:30', '12:45', '13:00', '13:15'];
  const weekdayQuiet = ['07:30', '08:00', '10:45', '14:30', '17:00', '18:00', '19:00'];
  const weekendPeak = ['11:15', '11:30', '11:45', '12:00', '12:15', '12:30', '12:45', '13:00'];
  const weekendQuiet = ['08:30', '09:15', '10:00', '14:45', '17:00', '18:30'];
  const occasions = [
    'none',
    'none',
    'none',
    'birthday',
    'anniversary',
    'business',
    'first_visit',
    'date',
  ];

  let booked = 0;
  let rejected = 0;
  const rejectionReasons = new Map<string, number>();

  for (let day = 0; day <= 13 && booked < 48; day += 1) {
    const date = dubaiDatePlus(day);
    const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
    const isWeekend = weekday === 6 || weekday === 0;
    const peak = isWeekend ? weekendPeak : weekdayPeak;
    const quiet = isWeekend ? weekendQuiet : weekdayQuiet;
    // Front-loaded hard. The first three days are what a presenter clicks, and
    // they need to look like a café people cannot get into on a Saturday —
    // which is also the only way the booking flow ever shows a disabled slot
    // with a reason on it. Later days stay sparse so the same flow also
    // demonstrates wide-open availability.
    const perDay = day <= 2 ? randInt(9, 12) : day <= 6 ? randInt(2, 4) : randInt(1, 2);

    for (let n = 0; n < perDay && booked < 48; n += 1) {
      const name = guestNames[(booked * 3 + day) % guestNames.length] as string;
      // Four fifths of the book sits in the peak window.
      const time = rand() > 0.2 ? pick(peak) : pick(quiet);
      const partySize = randInt(1, 100) > 70 ? randInt(4, 6) : randInt(2, 3);
      const slotIso = `${date}T${time}:00`;
      const token = issueToken('manage-booking', `${date}-${time}-${n}`);

      try {
        await sql`
          select * from create_reservation(
            ${name},
            ${emailFor(name)},
            ${phoneFor(booked + 7)},
            ${partySize},
            (${slotIso}::timestamp at time zone ${brand.timezone}),
            ${token.hash},
            ${pick(occasions)}::reservation_occasion,
            ${pick(specialRequests)},
            ${partySize >= 4 && rand() > 0.7 ? 1 : 0},
            ${null},
            ${rand() > 0.6},
            'en',
            'signature',
            ${null},
            ${brand.timezone}
          )
        `;
        booked += 1;
      } catch (error) {
        rejected += 1;
        const message = error instanceof Error ? error.message : 'unknown';
        rejectionReasons.set(message, (rejectionReasons.get(message) ?? 0) + 1);
      }
    }
  }

  // A couple of past bookings so the admin board has history to show.
  await sql`
    update reservations set status = 'completed', completed_at = starts_at + interval '90 minutes'
     where starts_at < now() - interval '2 hours'
  `;

  console.info(`  ✓ ${booked} reservations over the next 14 days`);
  if (rejected > 0) {
    const summary = [...rejectionReasons.entries()]
      .map(([reason, n]) => `${reason} ×${n}`)
      .join(', ');
    console.info(`    (${rejected} attempts correctly refused by the engine: ${summary})`);
  }

  /* ── Waitlist ───────────────────────────────────────────────────────── */
  const waitlist = [
    { name: 'Georgia Papadopoulos', party: 4, day: 2, from: '12:00', to: '14:30' },
    { name: 'Hassan Al Rayes', party: 2, day: 3, from: '09:00', to: '11:00' },
  ];
  for (const entry of waitlist) {
    const token = issueToken('waitlist-offer', `${entry.name}-${entry.day}`);
    await sql`
      insert into waitlist_entries (
        guest_name, email, phone, party_size, desired_date, window_start, window_end, token_hash
      ) values (
        ${entry.name}, ${emailFor(entry.name)}, ${phoneFor(entry.party + 20)},
        ${entry.party}, ${dubaiDatePlus(entry.day)}, ${entry.from}, ${entry.to}, ${token.hash}
      )
    `;
  }
  console.info(`  ✓ ${waitlist.length} waitlist entries`);

  /* ── Enquiries ──────────────────────────────────────────────────────── */
  for (const enquiry of demoEnquiries) {
    await sql`
      insert into enquiries (name, email, phone, topic, message, status, created_at)
      values (
        ${enquiry.name}, ${enquiry.email}, ${enquiry.phone}, ${enquiry.topic}::enquiry_topic,
        ${enquiry.message}, ${enquiry.status}::enquiry_status,
        now() - make_interval(days => ${enquiry.daysAgo})
      )
    `;
  }
  console.info(`  ✓ ${demoEnquiries.length} enquiries`);

  /* ── Subscribers ────────────────────────────────────────────────────── */
  for (const subscriber of demoSubscribers) {
    const token = issueToken('confirm-subscription', subscriber.email);
    await sql`
      insert into subscribers (
        email, name, status, confirm_token_hash, confirmed_at, created_at, source
      ) values (
        ${subscriber.email}, ${subscriber.name},
        ${subscriber.confirmed ? 'confirmed' : 'pending'}::subscriber_status,
        ${subscriber.confirmed ? null : token.hash},
        ${subscriber.confirmed ? sql`now() - make_interval(days => ${subscriber.daysAgo})` : null},
        now() - make_interval(days => ${subscriber.daysAgo}),
        ${pick(['footer', 'footer', 'menu-page', 'journal'])}
      )
      on conflict (email) do nothing
    `;
  }
  console.info(
    `  ✓ ${demoSubscribers.length} subscribers (${demoSubscribers.filter((s) => s.confirmed).length} confirmed)`,
  );

  /* ── Orders ─────────────────────────────────────────────────────────── */
  const orderable = menuItems.filter((i) => i.orderable && i.available);
  const orderStatuses: readonly ('paid' | 'preparing' | 'ready' | 'collected')[] = [
    'paid',
    'paid',
    'preparing',
    'preparing',
    'ready',
    'ready',
    'collected',
    'paid',
  ];

  for (const [index, status] of orderStatuses.entries()) {
    const name = guestNames[(index * 5 + 2) % guestNames.length] as string;
    // Spread collection times across the next two hours.
    const minutesOut = status === 'collected' ? -randInt(20, 60) : randInt(8, 120);

    const lineCount = randInt(1, 3);
    const lines = Array.from({ length: lineCount }, () => {
      const item = pick(orderable);
      const quantity = randInt(1, 2);
      return { item, quantity, lineTotal: item.priceFils * quantity };
    });

    const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
    // UAE VAT is 5% and menu prices already include it, so back it out.
    const vat = Math.round(subtotal - subtotal / 1.05);

    const [order] = await sql<{ id: string; reference: string }[]>`
      insert into orders (
        guest_name, email, phone, status, payment_status, pickup_at,
        subtotal_fils, vat_fils, total_fils, notes, paid_at,
        ready_at, collected_at, kitchen_notified_at, stripe_session_id
      ) values (
        ${name}, ${emailFor(name)}, ${phoneFor(index + 40)},
        ${status}::order_status, 'paid'::payment_status,
        now() + make_interval(mins => ${minutesOut}),
        ${subtotal}, ${vat}, ${subtotal},
        ${pick(orderNotes)},
        now() - make_interval(mins => ${randInt(10, 90)}),
        ${status === 'ready' || status === 'collected' ? sql`now() - make_interval(mins => ${randInt(2, 20)})` : null},
        ${status === 'collected' ? sql`now() - make_interval(mins => ${randInt(1, 15)})` : null},
        now() - make_interval(mins => ${randInt(10, 88)}),
        ${`cs_test_seed_${index}_${Date.now()}`}
      )
      returning id, reference
    `;

    for (const [lineIndex, line] of lines.entries()) {
      await sql`
        insert into order_items (
          order_id, menu_item_id, name_snapshot, name_ar_snapshot,
          unit_price_fils, quantity, modifiers, modifiers_total_fils, line_total_fils, sort_order
        ) values (
          ${order?.id ?? null}, ${line.item.id}, ${line.item.name}, ${line.item.nameAr},
          ${line.item.priceFils}, ${line.quantity}, ${sql.json([])}, 0, ${line.lineTotal}, ${lineIndex}
        )
      `;
    }
  }
  console.info(`  ✓ ${orderStatuses.length} orders in the queue`);

  /* ── Events ─────────────────────────────────────────────────────────── */
  const events = [
    {
      slug: 'guji-cupping-october',
      title: 'Cupping: three Ethiopias, side by side',
      titleAr: 'جلسة تذوّق: ثلاث قهوات إثيوبية جنباً إلى جنب',
      summary: 'Taste the Guji Uraga against two lots we did not buy, and find out why.',
      summaryAr: 'تذوّق قوجي أوراقا مقابل دفعتين لم نشترهما، واعرف السبب.',
      description:
        'An hour on the cupping table with Nadia. We pour three coffees blind — the Guji Uraga we buy, and two lots from the same region we passed on — and you score them before we tell you which is which. You will leave able to taste the difference between a good natural and a great one, and with a 250g bag of whichever you liked most.',
      descriptionAr:
        'ساعة على طاولة التذوّق مع نادية. نقدّم ثلاث قهوات دون كشف هويتها، وتمنحها درجاتك قبل أن نخبرك أيها أيّ. ستغادر قادراً على تمييز الفرق، ومعك كيس ٢٥٠ غراماً من القهوة التي فضّلتها.',
      type: 'cupping',
      daysOut: 11,
      hour: 16,
      durationMinutes: 75,
      priceFils: 12000,
      capacity: 12,
      taken: 9,
      imageKey: 'pourOver',
      host: 'Nadia Haddad',
    },
    {
      slug: 'latte-art-for-people-who-spill',
      title: 'Latte art for people who spill',
      titleAr: 'فن اللاتيه لمن يسكب الحليب',
      summary: 'A genuinely beginner class. Three hours, unlimited milk, no judgement.',
      summaryAr: 'صف للمبتدئين فعلاً. ثلاث ساعات وحليب بلا حدود وبلا أحكام.',
      description:
        'Joy takes six people at a time through milk texturing from the beginning: why your microfoam is bubbly, why the jug matters more than the wrist, and how to pour a heart that survives being carried to a table. You get the machine to yourself for the last hour. Everybody leaves able to pour something.',
      descriptionAr:
        'تأخذ جوي ستة أشخاص في كل مرة عبر أساسيات رغوة الحليب: لماذا تكون رغوتك فقاعية، ولماذا يهم الإبريق أكثر من المعصم. وتحصل على الآلة لنفسك في الساعة الأخيرة.',
      type: 'workshop',
      daysOut: 18,
      hour: 15,
      durationMinutes: 180,
      priceFils: 28000,
      capacity: 6,
      taken: 6,
      imageKey: 'flatWhite',
      host: 'Joy Mendoza',
    },
    {
      slug: 'supper-club-levantine-breakfast-at-night',
      title: 'Supper club: Levantine breakfast, at night',
      titleAr: 'نادي العشاء: إفطار شامي في المساء',
      summary: 'Rami cooks the breakfast menu as a seven-course dinner. Once only.',
      summaryAr: 'يطهو رامي قائمة الإفطار كعشاء من سبعة أطباق. لمرة واحدة فقط.',
      description:
        'Thirty seats, one long table, seven courses. Rami takes the dishes he cooks every morning and treats them like a tasting menu: foul as a warm dumpling, shakshuka reduced to a sauce under quail egg, kunafa french toast as a dessert it always wanted to be. Arrive at seven, leave when we stop talking.',
      descriptionAr:
        'ثلاثون مقعداً وطاولة واحدة طويلة وسبعة أطباق. يأخذ رامي ما يطهوه كل صباح ويقدّمه كقائمة تذوّق. الوصول عند السابعة، والمغادرة حين نتوقف عن الحديث.',
      type: 'supper_club',
      daysOut: 25,
      hour: 19,
      durationMinutes: 210,
      priceFils: 32000,
      capacity: 30,
      taken: 17,
      imageKey: 'brunchSpread',
      host: 'Rami Kassab',
    },
  ] as const;

  for (const event of events) {
    const date = dubaiDatePlus(event.daysOut);
    await sql`
      insert into events (
        slug, title, title_ar, summary, summary_ar, description, description_ar,
        event_type, starts_at, ends_at, price_fils, capacity, spots_taken,
        image_key, host_name, is_published
      ) values (
        ${event.slug}, ${event.title}, ${event.titleAr}, ${event.summary}, ${event.summaryAr},
        ${event.description}, ${event.descriptionAr}, ${event.type}::event_type,
        (${`${date}T${String(event.hour).padStart(2, '0')}:00:00`}::timestamp at time zone ${brand.timezone}),
        (${`${date}T${String(event.hour).padStart(2, '0')}:00:00`}::timestamp at time zone ${brand.timezone})
          + make_interval(mins => ${event.durationMinutes}),
        ${event.priceFils}, ${event.capacity}, ${event.taken},
        ${event.imageKey}, ${event.host}, true
      )
      on conflict (slug) do update set
        title = excluded.title, summary = excluded.summary, description = excluded.description,
        starts_at = excluded.starts_at, ends_at = excluded.ends_at,
        spots_taken = excluded.spots_taken, is_published = excluded.is_published
    `;
  }
  console.info(`  ✓ ${events.length} published events`);

  /* ── Event enquiries ────────────────────────────────────────────────── */
  await sql`
    insert into event_enquiries (
      name, email, phone, company, event_date, headcount, budget_fils,
      event_type, message, routed_to, routing_reason
    ) values (
      'Dana Farouk', 'dana.farouk@example.ae', '+971501234567', 'Maktaba Press',
      ${dubaiDatePlus(68)}, 45, 1500000, 'launch',
      'Book launch, standing, 7–10pm. Would the courtyard work?',
      'private_hire', 'Over 40 guests and an evening slot — whole-venue hire.'
    )
  `;

  /* ── Loyalty ────────────────────────────────────────────────────────── */
  const cards = [
    {
      name: 'Layla Al Marzooqi',
      email: 'layla.marzooqi@example.ae',
      stamps: 4,
      earned: 1,
      redeemed: 1,
    },
    { name: 'Tom Whitfield', email: 't.whitfield@example.com', stamps: 8, earned: 0, redeemed: 0 },
    { name: 'Priya Raghunathan', email: 'priya.r@example.in', stamps: 1, earned: 2, redeemed: 1 },
  ];
  for (const card of cards) {
    const token = issueToken('loyalty-card', card.email);
    const [row] = await sql<{ id: string }[]>`
      insert into loyalty_cards (email, name, stamps, rewards_earned, rewards_redeemed, qr_token_hash, last_stamp_at)
      values (${card.email}, ${card.name}, ${card.stamps}, ${card.earned}, ${card.redeemed},
              ${token.hash}, now() - make_interval(days => ${randInt(1, 9)}))
      on conflict (email) do update set
        stamps = excluded.stamps, rewards_earned = excluded.rewards_earned,
        rewards_redeemed = excluded.rewards_redeemed
      returning id
    `;
    for (let i = 0; i < card.stamps; i += 1) {
      await sql`
        insert into loyalty_stamps (card_id, stamped_at)
        values (${row?.id ?? null}, now() - make_interval(days => ${card.stamps - i + randInt(0, 3)}))
      `;
    }
  }
  console.info(
    `  ✓ ${cards.length} loyalty cards (${cards.map((c) => `${c.stamps}/9`).join(', ')})`,
  );

  /* ── Gift cards ─────────────────────────────────────────────────────── */
  const giftCards = [
    {
      code: 'GC-4KP2XQ',
      initial: 25000,
      balance: 25000,
      purchaser: 'Claire Dubois',
      recipient: 'Karim Nasser',
    },
    {
      code: 'GC-9TMV3B',
      initial: 50000,
      balance: 17500,
      purchaser: 'Daniel Okafor',
      recipient: null,
    },
  ];
  for (const card of giftCards) {
    await sql`
      insert into gift_cards (
        code, initial_fils, balance_fils, purchaser_name, purchaser_email,
        recipient_name, recipient_email, message, status, expires_at
      ) values (
        ${card.code}, ${card.initial}, ${card.balance}, ${card.purchaser},
        ${emailFor(card.purchaser)}, ${card.recipient}, ${card.recipient ? emailFor(card.recipient) : null},
        ${card.recipient ? 'Happy birthday — go and try the kunafa french toast.' : null},
        'active'::gift_card_status, now() + interval '1 year'
      )
      on conflict (code) do update set balance_fils = excluded.balance_fils
    `;
  }
  console.info(`  ✓ ${giftCards.length} gift cards`);

  /* ── Analytics ──────────────────────────────────────────────────────── */
  // A fortnight of funnel events, so the admin analytics panel has a shape
  // rather than a single bar.
  const funnel: readonly [string, number][] = [
    ['booking_started', 210],
    ['booking_step_completed', 168],
    ['booking_confirmed', 96],
    ['order_started', 140],
    ['order_confirmed', 71],
    ['menu_filter_used', 312],
    ['whatsapp_clicked', 88],
    ['directions_clicked', 133],
  ];
  for (const [name, count] of funnel) {
    await sql`
      insert into analytics_events (name, tier, locale, session_id, path, props, occurred_at)
      select
        ${name}, 'signature',
        case when random() > 0.78 then 'ar' else 'en' end,
        'seed-' || floor(random() * 4000)::text,
        '/signature/book',
        '{}'::jsonb,
        now() - make_interval(mins => (random() * 20160)::int)
      from generate_series(1, ${count})
    `;
  }
  console.info(
    `  ✓ ${funnel.reduce((s, [, n]) => s + n, 0)} analytics events across ${funnel.length} funnel steps`,
  );

  console.info('\n✓ Demo seeded.\n');
  console.info(`  Admin:  /signature/admin`);
  console.info(`  Login:  owner@regulars.ae / ${password}\n`);
}

main()
  .catch((error: unknown) => {
    console.error('\n✗ seed failed:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sql.end({ timeout: 5 });
  });
