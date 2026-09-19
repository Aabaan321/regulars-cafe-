-- ════════════════════════════════════════════════════════════════════════════
-- 0008 — Make the availability engine fast enough for a booking UI
-- ════════════════════════════════════════════════════════════════════════════
--
-- 0007's version was correct but ran three correlated subqueries per slot:
-- free tables, booked covers, and a partial-blackout check. At 45 slots a day
-- that is 135 subquery executions, and the date step of the booking flow asks
-- for 21 days at once — which measured at 1.1 seconds. A guest picking a date
-- should not wait a second to find out which days are open.
--
-- This replaces it with a single pass: build every slot, LEFT JOIN the live
-- reservations once on range overlap, and aggregate. Same results, same
-- reasons, same signature — the callers do not change.
--
-- Also adds the indexes the overlap predicate can actually use. The exclusion
-- constraint from 0004 already indexes (table_id, range); this adds the
-- range-only and date-lookup cases.

create index if not exists reservations_live_range_idx
  on public.reservations using gist (tstzrange(starts_at, ends_at, '[)'))
  where status in ('pending', 'confirmed', 'seated');

create index if not exists reservations_live_starts_idx
  on public.reservations (starts_at)
  where status in ('pending', 'confirmed', 'seated');

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
language sql
stable
security definer
set search_path = ''
as $$
  with
  -- Service periods for this weekday.
  periods as (
    select sp.*
      from public.service_periods sp
     where sp.weekday = extract(isodow from p_date)::smallint
       and sp.is_active
  ),
  -- Every bookable slot start. The series is generated over local timestamps
  -- and only then pinned to the café's zone, so a slot lands on the wall-clock
  -- time a guest chose regardless of the server's zone.
  slots as (
    select
      p.name as period_name,
      p.max_covers_per_slot,
      (s.local_ts at time zone p_timezone) as slot_at,
      tstzrange(
        (s.local_ts at time zone p_timezone),
        (s.local_ts at time zone p_timezone) + make_interval(mins => p.turn_time_min + p.buffer_min),
        '[)'
      ) as hold
    from periods p
    cross join lateral generate_series(
      (p_date + p.starts_at)::timestamp,
      (p_date + p.last_seating_at)::timestamp,
      make_interval(mins => p.slot_interval_min)
    ) as s(local_ts)
  ),
  -- Tables that physically seat this party. Counted once, not per slot.
  fitting as (
    select t.id
      from public.restaurant_tables t
     where t.is_bookable
       and p_party_size between t.seats_min and t.seats_max
  ),
  fitting_count as (select count(*)::int as n from fitting),
  -- The live book, narrowed to the window this date can possibly touch.
  live as (
    select r.table_id, r.party_size, tstzrange(r.starts_at, r.ends_at, '[)') as span
      from public.reservations r
     where r.status in ('pending', 'confirmed', 'seated')
       and r.starts_at >= (p_date - 1)::timestamp at time zone p_timezone
       and r.starts_at <  (p_date + 2)::timestamp at time zone p_timezone
  ),
  -- One pass: how many fitting tables are busy, and how many covers are held.
  occupancy as (
    select
      s.slot_at,
      s.period_name,
      s.max_covers_per_slot,
      s.hold,
      count(distinct l.table_id) filter (where f.id is not null)::int as busy_fitting,
      coalesce(sum(l.party_size), 0)::int as covers_booked
    from slots s
    left join live l on l.span && s.hold
    left join fitting f on f.id = l.table_id
    group by s.slot_at, s.period_name, s.max_covers_per_slot, s.hold
  ),
  -- Blackouts, evaluated once for the whole day.
  full_blackout as (
    select exists (
      select 1 from public.blackout_dates b where b.date = p_date and b.is_full_day
    ) as closed
  ),
  partial_blackouts as (
    select tstzrange(
             (p_date + b.starts_at) at time zone p_timezone,
             (p_date + b.ends_at) at time zone p_timezone,
             '[)'
           ) as span
      from public.blackout_dates b
     where b.date = p_date and not b.is_full_day
  )
  select
    o.slot_at,
    to_char(o.slot_at at time zone p_timezone, 'HH24:MI') as local_time,
    o.period_name,
    case
      when fb.closed then false
      when exists (select 1 from partial_blackouts pb where pb.span && o.hold) then false
      when o.slot_at <= now() then false
      when o.slot_at < now() + make_interval(mins => p_min_lead_minutes) then false
      when fc.n = 0 then false
      when fc.n - o.busy_fitting <= 0 then false
      when o.covers_booked + p_party_size > o.max_covers_per_slot then false
      else true
    end as is_available,
    case
      when fb.closed then 'blackout'::public.slot_reason
      when exists (select 1 from partial_blackouts pb where pb.span && o.hold) then 'blackout'::public.slot_reason
      when o.slot_at <= now() then 'past'::public.slot_reason
      when o.slot_at < now() + make_interval(mins => p_min_lead_minutes) then 'too_soon'::public.slot_reason
      when fc.n = 0 then 'no_table_for_party_size'::public.slot_reason
      when fc.n - o.busy_fitting <= 0 then 'fully_booked'::public.slot_reason
      when o.covers_booked + p_party_size > o.max_covers_per_slot then 'kitchen_at_capacity'::public.slot_reason
      else 'available'::public.slot_reason
    end as reason,
    greatest(0, fc.n - o.busy_fitting)::int as tables_free,
    greatest(0, o.max_covers_per_slot - o.covers_booked)::int as covers_left
  from occupancy o
  cross join fitting_count fc
  cross join full_blackout fb
  order by o.slot_at;
$$;

comment on function public.reservation_availability is
  'Every slot for a date and party size, each tagged available or with the reason it is not. Single-pass: one join against the live book rather than three correlated subqueries per slot.';

-- ── Day-level summary, for the booking flow''s date step ────────────────────
-- Answers "which of the next N days can this party book at all", which is a
-- much cheaper question than "list every slot for 21 days".

create or replace function public.days_with_availability(
  p_start date,
  p_days integer,
  p_party_size integer,
  p_timezone text default 'Asia/Dubai'
)
returns table (day date, has_availability boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select d.day,
         exists (
           select 1
             from public.reservation_availability(d.day, p_party_size, p_timezone, 60) a
            where a.is_available
         ) as has_availability
    from (
      select (p_start + offs)::date as day
        from generate_series(0, greatest(p_days, 1) - 1) as offs
    ) d
   order by d.day;
$$;
