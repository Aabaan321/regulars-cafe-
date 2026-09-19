-- ════════════════════════════════════════════════════════════════════════════
-- 0007 — The availability engine and atomic booking
-- ════════════════════════════════════════════════════════════════════════════
--
-- Availability is computed in the database, not the application, for three
-- reasons: it is one round trip instead of N, it sees a consistent snapshot,
-- and the same function is used by the public booking flow, the admin board
-- and Tier 3's floor plan, so they cannot disagree.
--
-- A slot that cannot be booked is returned with a machine-readable `reason`
-- rather than being filtered out. The UI shows the slot, disabled, with the
-- reason — "fully booked", "kitchen at capacity", "too close to closing" —
-- because a guest who can see why they cannot have 13:00 books 13:30, and a
-- guest who sees a gap assumes the site is broken.

create type slot_reason as enum (
  'available',
  'fully_booked',            -- every table of the right size is taken
  'no_table_for_party_size', -- no table in the room seats this many
  'kitchen_at_capacity',     -- per-slot cover limit reached
  'blackout',                -- closed or privately hired
  'past',                    -- earlier today
  'too_soon',                -- inside the minimum lead time
  'closed'                   -- outside every service period
);

-- ── Availability ───────────────────────────────────────────────────────────

create or replace function public.reservation_availability(
  p_date date,
  p_party_size integer,
  p_timezone text default 'Asia/Dubai',
  p_min_lead_minutes integer default 60
)
returns table (
  slot_at        timestamptz,
  local_time     text,
  period_name    text,
  is_available   boolean,
  reason         public.slot_reason,
  tables_free    integer,
  covers_left    integer
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_weekday smallint;
  v_now timestamptz := now();
  v_blackout_full boolean;
begin
  -- ISO weekday: Monday = 1 … Sunday = 7.
  v_weekday := extract(isodow from p_date)::smallint;

  select exists (
    select 1 from public.blackout_dates b
     where b.date = p_date and b.is_full_day
  ) into v_blackout_full;

  return query
  with periods as (
    select sp.*
      from public.service_periods sp
     where sp.weekday = v_weekday
       and sp.is_active
  ),
  -- Every bookable slot start across every service period for this weekday.
  -- The series is generated over local timestamps and only then pinned to the
  -- café's zone, so a slot lands on the wall-clock time a guest chose even
  -- across a DST boundary in whatever zone the server happens to run in.
  slots as (
    select
      p.name as period_name,
      p.turn_time_min,
      p.buffer_min,
      p.max_covers_per_slot,
      (s.local_ts at time zone p_timezone) as slot_at
    from periods p
    cross join lateral generate_series(
      (p_date + p.starts_at)::timestamp,
      (p_date + p.last_seating_at)::timestamp,
      make_interval(mins => p.slot_interval_min)
    ) as s(local_ts)
  ),
  -- Tables that physically seat this party.
  fitting_tables as (
    select t.id, t.seats_max
      from public.restaurant_tables t
     where t.is_bookable
       and p_party_size between t.seats_min and t.seats_max
  ),
  computed as (
    select
      sl.slot_at,
      sl.period_name,
      sl.turn_time_min,
      sl.buffer_min,
      sl.max_covers_per_slot,
      -- The span this booking would hold the table for.
      tstzrange(
        sl.slot_at,
        sl.slot_at + make_interval(mins => sl.turn_time_min + sl.buffer_min),
        '[)'
      ) as hold,
      (select count(*) from fitting_tables) as fitting_count
    from slots sl
  ),
  measured as (
    select
      c.*,
      (
        select count(*)
          from fitting_tables ft
         where not exists (
           select 1
             from public.reservations r
            where r.table_id = ft.id
              and r.status in ('pending', 'confirmed', 'seated')
              and tstzrange(r.starts_at, r.ends_at, '[)') && c.hold
         )
      ) as free_tables,
      (
        select coalesce(sum(r.party_size), 0)
          from public.reservations r
         where r.status in ('pending', 'confirmed', 'seated')
           and tstzrange(r.starts_at, r.ends_at, '[)') && c.hold
      ) as covers_booked,
      exists (
        select 1
          from public.blackout_dates b
         where b.date = p_date
           and not b.is_full_day
           and tstzrange(
                 (p_date + b.starts_at) at time zone p_timezone,
                 (p_date + b.ends_at) at time zone p_timezone,
                 '[)'
               ) && c.hold
      ) as partial_blackout
    from computed c
  )
  select
    m.slot_at,
    to_char(m.slot_at at time zone p_timezone, 'HH24:MI') as local_time,
    m.period_name,
    -- is_available
    case
      when v_blackout_full then false
      when m.partial_blackout then false
      when m.slot_at <= v_now then false
      when m.slot_at < v_now + make_interval(mins => p_min_lead_minutes) then false
      when m.fitting_count = 0 then false
      when m.free_tables = 0 then false
      when m.covers_booked + p_party_size > m.max_covers_per_slot then false
      else true
    end,
    -- reason
    case
      when v_blackout_full then 'blackout'::public.slot_reason
      when m.partial_blackout then 'blackout'::public.slot_reason
      when m.slot_at <= v_now then 'past'::public.slot_reason
      when m.slot_at < v_now + make_interval(mins => p_min_lead_minutes) then 'too_soon'::public.slot_reason
      when m.fitting_count = 0 then 'no_table_for_party_size'::public.slot_reason
      when m.free_tables = 0 then 'fully_booked'::public.slot_reason
      when m.covers_booked + p_party_size > m.max_covers_per_slot then 'kitchen_at_capacity'::public.slot_reason
      else 'available'::public.slot_reason
    end,
    m.free_tables::integer,
    greatest(0, m.max_covers_per_slot - m.covers_booked)::integer
  from measured m
  order by m.slot_at;
end;
$$;

comment on function public.reservation_availability is
  'Every slot for a date and party size, each tagged available or with the reason it is not. Used by the booking flow, the admin board and the Tier 3 floor plan.';

-- ── Which specific tables are free at an instant ───────────────────────────
-- Tier 3's floor plan asks for this so a guest can choose their actual table.

create or replace function public.tables_free_at(
  p_slot timestamptz,
  p_party_size integer,
  p_turn_minutes integer default 105
)
returns table (
  table_id uuid,
  code text,
  label text,
  zone public.table_zone,
  shape public.table_shape,
  seats_min integer,
  seats_max integer,
  is_accessible boolean,
  plan_x numeric,
  plan_y numeric,
  plan_w numeric,
  plan_h numeric,
  fits boolean,
  is_free boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    t.id,
    t.code,
    t.label,
    t.zone,
    t.shape,
    t.seats_min,
    t.seats_max,
    t.is_accessible,
    t.plan_x, t.plan_y, t.plan_w, t.plan_h,
    (p_party_size between t.seats_min and t.seats_max) as fits,
    not exists (
      select 1
        from public.reservations r
       where r.table_id = t.id
         and r.status in ('pending', 'confirmed', 'seated')
         and tstzrange(r.starts_at, r.ends_at, '[)')
             && tstzrange(p_slot, p_slot + make_interval(mins => p_turn_minutes), '[)')
    ) as is_free
  from public.restaurant_tables t
  where t.is_bookable
  order by t.sort_order, t.code;
$$;

-- ── Creating a booking ─────────────────────────────────────────────────────
--
-- Picks the smallest table that fits (so a two-top is not burned on a party of
-- two when a four-top would do just as well, and the room stays sellable), and
-- inserts. The EXCLUSION constraint from 0004 is what actually guarantees
-- uniqueness: if two requests race, the loser gets a 23P01 exclusion violation
-- which this function converts into a clean `slot_taken` error the API maps to
-- HTTP 409.

create or replace function public.create_reservation(
  p_guest_name text,
  p_email text,
  p_phone text,
  p_party_size integer,
  p_slot timestamptz,
  p_manage_token_hash text,
  p_occasion public.reservation_occasion default 'none',
  p_special_requests text default null,
  p_high_chairs integer default 0,
  p_accessibility_needs text default null,
  p_marketing_opt_in boolean default false,
  p_locale text default 'en',
  p_source_tier text default 'signature',
  p_preferred_table uuid default null,
  p_timezone text default 'Asia/Dubai'
)
returns public.reservations
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_weekday smallint;
  v_period public.service_periods%rowtype;
  v_ends_at timestamptz;
  v_table uuid;
  v_covers integer;
  v_row public.reservations%rowtype;
begin
  v_weekday := extract(isodow from (p_slot at time zone p_timezone))::smallint;

  -- The service period whose seating window contains this slot.
  select sp.* into v_period
    from public.service_periods sp
   where sp.weekday = v_weekday
     and sp.is_active
     and (p_slot at time zone p_timezone)::time >= sp.starts_at
     and (p_slot at time zone p_timezone)::time <= sp.last_seating_at
   order by sp.starts_at
   limit 1;

  if v_period.id is null then
    raise exception 'closed' using errcode = 'check_violation',
      detail = 'No service period covers that time.';
  end if;

  if exists (
    select 1 from public.blackout_dates b
     where b.date = (p_slot at time zone p_timezone)::date
       and b.is_full_day
  ) then
    raise exception 'blackout' using errcode = 'check_violation',
      detail = 'The café is closed on that date.';
  end if;

  v_ends_at := p_slot + make_interval(mins => v_period.turn_time_min + v_period.buffer_min);

  if exists (
    select 1 from public.blackout_dates b
     where b.date = (p_slot at time zone p_timezone)::date
       and not b.is_full_day
       and tstzrange(
             ((p_slot at time zone p_timezone)::date + b.starts_at) at time zone p_timezone,
             ((p_slot at time zone p_timezone)::date + b.ends_at) at time zone p_timezone,
             '[)'
           ) && tstzrange(p_slot, v_ends_at, '[)')
  ) then
    raise exception 'blackout' using errcode = 'check_violation',
      detail = 'That time is reserved for a private event.';
  end if;

  -- Serialise concurrent bookings for the same slot so the best-fit choice is
  -- made against a stable picture. The exclusion constraint still has the
  -- final say; this just turns most races into a clean second-best table
  -- rather than an error the guest has to retry.
  perform pg_advisory_xact_lock(hashtextextended(p_slot::text, 0));

  select coalesce(sum(r.party_size), 0) into v_covers
    from public.reservations r
   where r.status in ('pending', 'confirmed', 'seated')
     and tstzrange(r.starts_at, r.ends_at, '[)') && tstzrange(p_slot, v_ends_at, '[)');

  if v_covers + p_party_size > v_period.max_covers_per_slot then
    raise exception 'kitchen_at_capacity' using errcode = 'check_violation',
      detail = 'The kitchen is at capacity for that time.';
  end if;

  -- Best fit: the smallest table that seats the party and is free. A specific
  -- table may be requested (Tier 3 floor plan) and is honoured if free.
  select t.id into v_table
    from public.restaurant_tables t
   where t.is_bookable
     and p_party_size between t.seats_min and t.seats_max
     and (p_preferred_table is null or t.id = p_preferred_table)
     and not exists (
       select 1
         from public.reservations r
        where r.table_id = t.id
          and r.status in ('pending', 'confirmed', 'seated')
          and tstzrange(r.starts_at, r.ends_at, '[)') && tstzrange(p_slot, v_ends_at, '[)')
     )
   order by t.seats_max asc, t.sort_order asc
   limit 1;

  if v_table is null then
    if p_preferred_table is not null then
      raise exception 'table_taken' using errcode = 'check_violation',
        detail = 'That table has just been taken.';
    end if;
    raise exception 'fully_booked' using errcode = 'check_violation',
      detail = 'No table of that size is free at that time.';
  end if;

  begin
    insert into public.reservations (
      guest_name, email, phone, party_size, starts_at, ends_at, table_id,
      status, occasion, special_requests, high_chairs, accessibility_needs,
      marketing_opt_in, manage_token_hash, locale, source_tier
    ) values (
      p_guest_name, p_email, p_phone, p_party_size, p_slot, v_ends_at, v_table,
      'confirmed', p_occasion, p_special_requests, p_high_chairs, p_accessibility_needs,
      p_marketing_opt_in, p_manage_token_hash, p_locale, p_source_tier
    )
    returning * into v_row;
  exception
    when exclusion_violation then
      -- Another transaction took this exact table between our SELECT and our
      -- INSERT. The database, not the application, is what stopped it.
      raise exception 'slot_taken' using errcode = 'check_violation',
        detail = 'That slot was taken a moment ago. Please pick another.';
  end;

  return v_row;
end;
$$;

comment on function public.create_reservation is
  'Atomically assigns the best-fitting free table and books it. Double booking is prevented by the reservations_no_double_booking exclusion constraint, not by this function.';

-- ── Moving or cancelling a booking ─────────────────────────────────────────

create or replace function public.reschedule_reservation(
  p_reservation_id uuid,
  p_slot timestamptz,
  p_party_size integer default null,
  p_timezone text default 'Asia/Dubai'
)
returns public.reservations
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_existing public.reservations%rowtype;
  v_weekday smallint;
  v_period public.service_periods%rowtype;
  v_ends_at timestamptz;
  v_party integer;
  v_table uuid;
  v_row public.reservations%rowtype;
begin
  select * into v_existing from public.reservations where id = p_reservation_id for update;
  if v_existing.id is null then
    raise exception 'not_found' using errcode = 'no_data_found';
  end if;
  if v_existing.status not in ('pending', 'confirmed') then
    raise exception 'not_modifiable' using errcode = 'check_violation',
      detail = 'Only an upcoming booking can be changed.';
  end if;

  v_party := coalesce(p_party_size, v_existing.party_size);
  v_weekday := extract(isodow from (p_slot at time zone p_timezone))::smallint;

  select sp.* into v_period
    from public.service_periods sp
   where sp.weekday = v_weekday and sp.is_active
     and (p_slot at time zone p_timezone)::time >= sp.starts_at
     and (p_slot at time zone p_timezone)::time <= sp.last_seating_at
   order by sp.starts_at limit 1;

  if v_period.id is null then
    raise exception 'closed' using errcode = 'check_violation';
  end if;

  v_ends_at := p_slot + make_interval(mins => v_period.turn_time_min + v_period.buffer_min);

  perform pg_advisory_xact_lock(hashtextextended(p_slot::text, 0));

  select t.id into v_table
    from public.restaurant_tables t
   where t.is_bookable
     and v_party between t.seats_min and t.seats_max
     and not exists (
       select 1 from public.reservations r
        where r.table_id = t.id
          and r.id <> p_reservation_id
          and r.status in ('pending', 'confirmed', 'seated')
          and tstzrange(r.starts_at, r.ends_at, '[)') && tstzrange(p_slot, v_ends_at, '[)')
     )
   order by t.seats_max asc, t.sort_order asc
   limit 1;

  if v_table is null then
    raise exception 'fully_booked' using errcode = 'check_violation';
  end if;

  begin
    update public.reservations
       set starts_at = p_slot,
           ends_at = v_ends_at,
           party_size = v_party,
           table_id = v_table,
           reminder_sent_at = null
     where id = p_reservation_id
     returning * into v_row;
  exception when exclusion_violation then
    raise exception 'slot_taken' using errcode = 'check_violation';
  end;

  return v_row;
end;
$$;

-- ── Waitlist ───────────────────────────────────────────────────────────────
-- Called after a cancellation. Returns the entries whose window now has a
-- free table, oldest first, so the notifier can offer the slot.

create or replace function public.waitlist_matches_for_date(
  p_date date,
  p_timezone text default 'Asia/Dubai'
)
returns table (
  entry_id uuid,
  guest_name text,
  email citext,
  party_size integer,
  matched_slot timestamptz,
  locale text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  return query
  select w.id, w.guest_name, w.email, w.party_size, a.slot_at, w.locale
    from public.waitlist_entries w
    cross join lateral (
      select av.slot_at
        from public.reservation_availability(p_date, w.party_size, p_timezone, 60) av
       where av.is_available
         and (av.slot_at at time zone p_timezone)::time >= w.window_start
         and (av.slot_at at time zone p_timezone)::time <= w.window_end
       order by av.slot_at
       limit 1
    ) a
   where w.desired_date = p_date
     and w.status = 'waiting'
   order by w.created_at;
end;
$$;
