-- ════════════════════════════════════════════════════════════════════════════
-- 0004 — Reservations (Tier 2 centrepiece)
-- ════════════════════════════════════════════════════════════════════════════
--
-- The double-booking guarantee lives at the bottom of this file. It is a
-- Postgres EXCLUSION constraint, not application logic: two concurrent
-- requests that both pass the availability check will still result in exactly
-- one booking, because the second INSERT is rejected by the database.

create type reservation_status as enum (
  'pending',    -- created, not yet confirmed (reserved for card-hold flows)
  'confirmed',  -- the normal state of a live booking
  'seated',     -- party has arrived
  'completed',  -- party has left
  'cancelled',  -- cancelled by guest or staff
  'no_show'
);

create type table_zone as enum ('window', 'main', 'counter', 'courtyard', 'mezzanine');
create type table_shape as enum ('round', 'square', 'rect', 'booth');

-- ── Inventory ──────────────────────────────────────────────────────────────
-- x/y/width/height are percentages of the floor-plan viewport, which is what
-- Tier 3's interactive plan renders from. Keeping them here means the owner
-- can move a table in the admin editor and Tier 3 follows.

create table if not exists public.restaurant_tables (
  id           uuid primary key default gen_random_uuid(),
  code         text not null unique,
  label        text not null,
  label_ar     text not null default '',
  seats_min    integer not null check (seats_min >= 1),
  seats_max    integer not null check (seats_max >= seats_min),
  zone         table_zone not null default 'main',
  shape        table_shape not null default 'square',
  is_accessible boolean not null default false,
  is_bookable  boolean not null default true,
  -- Floor-plan geometry, 0–100 in each axis.
  plan_x       numeric(5,2) not null default 0,
  plan_y       numeric(5,2) not null default 0,
  plan_w       numeric(5,2) not null default 8,
  plan_h       numeric(5,2) not null default 8,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger restaurant_tables_touch before update on public.restaurant_tables
  for each row execute function public.touch_updated_at();

-- ── Service periods ────────────────────────────────────────────────────────
-- weekday: 1 = Monday … 7 = Sunday (ISO). A day can have several periods
-- (breakfast / lunch / dinner) with different turn times and slot intervals.

create table if not exists public.service_periods (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,
  name_ar            text not null default '',
  weekday            smallint not null check (weekday between 1 and 7),
  starts_at          time not null,
  -- Last seating, not closing time.
  last_seating_at    time not null,
  slot_interval_min  integer not null default 15 check (slot_interval_min between 5 and 60),
  turn_time_min      integer not null default 90 check (turn_time_min >= 30),
  -- Gap left after a party leaves before the table can be re-seated.
  buffer_min         integer not null default 15 check (buffer_min >= 0),
  -- The ceiling on guests whose bookings may OVERLAP at any instant — i.e.
  -- how full the room and the kitchen are allowed to get at once, not how
  -- many may arrive in one 15-minute slot. Set below the physical seat count
  -- so there is always something left for walk-ins.
  max_covers_per_slot integer not null default 14 check (max_covers_per_slot > 0),
  is_active          boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint service_periods_window check (last_seating_at > starts_at)
);

create trigger service_periods_touch before update on public.service_periods
  for each row execute function public.touch_updated_at();

create index if not exists service_periods_weekday_idx on public.service_periods (weekday, starts_at);

-- ── Blackout dates ─────────────────────────────────────────────────────────
-- Full-day closures (public holidays, private buy-outs) or partial windows
-- (a wedding taking the courtyard from 18:00).

create table if not exists public.blackout_dates (
  id          uuid primary key default gen_random_uuid(),
  date        date not null,
  reason      text not null,
  reason_ar   text not null default '',
  is_full_day boolean not null default true,
  starts_at   time,
  ends_at     time,
  created_at  timestamptz not null default now(),
  constraint blackout_partial_window check (
    is_full_day or (starts_at is not null and ends_at is not null and ends_at > starts_at)
  )
);

create unique index if not exists blackout_dates_full_day_uniq
  on public.blackout_dates (date) where is_full_day;
create index if not exists blackout_dates_date_idx on public.blackout_dates (date);

-- ── Reservations ───────────────────────────────────────────────────────────

create type reservation_occasion as enum (
  'none', 'birthday', 'anniversary', 'business', 'date', 'celebration', 'first_visit'
);

create table if not exists public.reservations (
  id                 uuid primary key default gen_random_uuid(),
  reference          text not null unique default public.generate_reference('RG'),
  guest_name         text not null,
  email              citext not null,
  phone              text not null,
  party_size         integer not null check (party_size between 1 and 20),
  starts_at          timestamptz not null,
  -- Includes the turn time and the buffer; this is the span the table is held.
  ends_at            timestamptz not null,
  table_id           uuid references public.restaurant_tables (id) on delete restrict,
  status             reservation_status not null default 'confirmed',
  occasion           reservation_occasion not null default 'none',
  special_requests   text,
  high_chairs        integer not null default 0 check (high_chairs between 0 and 6),
  accessibility_needs text,
  marketing_opt_in   boolean not null default false,
  -- Hash of the signed self-service token; the plaintext only ever exists in
  -- the guest's email link.
  manage_token_hash  text not null,
  reminder_sent_at   timestamptz,
  cancelled_at       timestamptz,
  cancelled_by       text,
  seated_at          timestamptz,
  completed_at       timestamptz,
  source_tier        text not null default 'signature',
  locale             text not null default 'en',
  internal_note      text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint reservations_span check (ends_at > starts_at)
);

create trigger reservations_touch before update on public.reservations
  for each row execute function public.touch_updated_at();

create index if not exists reservations_starts_idx on public.reservations (starts_at);
create index if not exists reservations_status_starts_idx on public.reservations (status, starts_at);
create index if not exists reservations_email_idx on public.reservations (email);
create index if not exists reservations_manage_token_idx on public.reservations (manage_token_hash);
create index if not exists reservations_reminder_idx on public.reservations (starts_at)
  where status = 'confirmed' and reminder_sent_at is null;

-- ════════════════════════════════════════════════════════════════════════════
--  THE DOUBLE-BOOKING GUARANTEE
-- ════════════════════════════════════════════════════════════════════════════
-- A table cannot be held by two live bookings whose [starts_at, ends_at)
-- ranges overlap. Enforced by the database under concurrency: two requests
-- that race past the availability check produce one success and one
-- constraint violation, which the API turns into "that slot has just gone".
--
-- Requires btree_gist (see 0001) so a uuid equality predicate and a range
-- overlap predicate can share one GiST index.

alter table public.reservations
  drop constraint if exists reservations_no_double_booking;

alter table public.reservations
  add constraint reservations_no_double_booking
  exclude using gist (
    table_id with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  )
  where (status in ('pending', 'confirmed', 'seated') and table_id is not null);

-- ── Waitlist ───────────────────────────────────────────────────────────────

create type waitlist_status as enum ('waiting', 'notified', 'converted', 'expired', 'cancelled');

create table if not exists public.waitlist_entries (
  id             uuid primary key default gen_random_uuid(),
  guest_name     text not null,
  email          citext not null,
  phone          text not null,
  party_size     integer not null check (party_size between 1 and 20),
  desired_date   date not null,
  -- The guest's acceptable window on that date.
  window_start   time not null,
  window_end     time not null,
  status         waitlist_status not null default 'waiting',
  notified_at    timestamptz,
  -- Set when a freed slot is offered, so the offer can expire.
  offer_expires_at timestamptz,
  offered_slot   timestamptz,
  converted_reservation_id uuid references public.reservations (id) on delete set null,
  token_hash     text not null,
  locale         text not null default 'en',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint waitlist_window check (window_end > window_start)
);

create trigger waitlist_touch before update on public.waitlist_entries
  for each row execute function public.touch_updated_at();

create index if not exists waitlist_date_status_idx on public.waitlist_entries (desired_date, status);
