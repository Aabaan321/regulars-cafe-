-- ════════════════════════════════════════════════════════════════════════════
-- 0005 — Commerce: pickup orders, events, loyalty, gift cards
-- ════════════════════════════════════════════════════════════════════════════

-- ── Pickup orders ──────────────────────────────────────────────────────────

create type order_status as enum (
  'draft',      -- cart created, checkout not started
  'awaiting_payment',
  'paid',       -- Stripe confirmed; this is when the kitchen is told
  'preparing',
  'ready',
  'collected',
  'cancelled',
  'refunded'
);

create type payment_status as enum ('unpaid', 'paid', 'failed', 'refunded');

create table if not exists public.orders (
  id                uuid primary key default gen_random_uuid(),
  reference         text not null unique default public.generate_reference('ORD'),
  guest_name        text not null,
  email             citext not null,
  phone             text not null,
  status            order_status not null default 'draft',
  payment_status    payment_status not null default 'unpaid',
  -- Requested collection time, café-local, stored as an instant.
  pickup_at         timestamptz not null,
  subtotal_fils     integer not null default 0 check (subtotal_fils >= 0),
  -- UAE VAT at 5%, calculated and stored rather than derived at read time.
  vat_fils          integer not null default 0 check (vat_fils >= 0),
  total_fils        integer not null default 0 check (total_fils >= 0),
  notes             text,
  stripe_session_id text unique,
  stripe_payment_intent text,
  paid_at           timestamptz,
  ready_at          timestamptz,
  collected_at      timestamptz,
  cancelled_at      timestamptz,
  kitchen_notified_at timestamptz,
  locale            text not null default 'en',
  source_tier       text not null default 'signature',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create trigger orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();

create index if not exists orders_status_idx on public.orders (status, pickup_at);
create index if not exists orders_pickup_idx on public.orders (pickup_at);
create index if not exists orders_email_idx on public.orders (email);

-- Line items snapshot the name and unit price: repricing the menu tomorrow
-- must not silently rewrite what somebody paid today.
create table if not exists public.order_items (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references public.orders (id) on delete cascade,
  menu_item_id    text references public.menu_items (id) on delete set null,
  name_snapshot   text not null,
  name_ar_snapshot text not null default '',
  unit_price_fils integer not null check (unit_price_fils >= 0),
  quantity        integer not null check (quantity between 1 and 50),
  -- [{ groupId, groupLabel, optionId, optionLabel, priceDeltaFils }]
  modifiers       jsonb not null default '[]'::jsonb,
  modifiers_total_fils integer not null default 0,
  line_total_fils integer not null check (line_total_fils >= 0),
  notes           text,
  sort_order      integer not null default 0
);

create index if not exists order_items_order_idx on public.order_items (order_id, sort_order);

-- ── Events & private hire ──────────────────────────────────────────────────

create type event_type as enum ('cupping', 'workshop', 'supper_club', 'launch', 'community', 'private_hire');

create table if not exists public.events (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique,
  title          text not null,
  title_ar       text not null default '',
  summary        text not null,
  summary_ar     text not null default '',
  description    text not null,
  description_ar text not null default '',
  event_type     event_type not null default 'workshop',
  starts_at      timestamptz not null,
  ends_at        timestamptz not null,
  price_fils     integer not null default 0 check (price_fils >= 0),
  capacity       integer not null check (capacity > 0),
  spots_taken    integer not null default 0 check (spots_taken >= 0),
  image_key      text,
  host_name      text,
  is_published   boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint events_span check (ends_at > starts_at),
  constraint events_capacity check (spots_taken <= capacity)
);

create trigger events_touch before update on public.events
  for each row execute function public.touch_updated_at();

create index if not exists events_published_idx on public.events (is_published, starts_at);

create type event_enquiry_route as enum ('events_team', 'private_hire', 'owner', 'declined_capacity');
create type event_enquiry_status as enum ('new', 'quoted', 'won', 'lost', 'closed');

create table if not exists public.event_enquiries (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid references public.events (id) on delete set null,
  name          text not null,
  email         citext not null,
  phone         text not null,
  company       text,
  event_date    date not null,
  headcount     integer not null check (headcount > 0),
  budget_fils   integer check (budget_fils >= 0),
  event_type    event_type not null default 'private_hire',
  message       text not null,
  -- Set by the routing rules in src/lib/reservations/event-routing.ts.
  routed_to     event_enquiry_route not null default 'events_team',
  routing_reason text not null default '',
  status        event_enquiry_status not null default 'new',
  locale        text not null default 'en',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger event_enquiries_touch before update on public.event_enquiries
  for each row execute function public.touch_updated_at();

create index if not exists event_enquiries_status_idx on public.event_enquiries (status, created_at desc);

-- ── Loyalty ────────────────────────────────────────────────────────────────
-- Identified by email, not an account. Buy nine, the tenth is on us.

create table if not exists public.loyalty_cards (
  id             uuid primary key default gen_random_uuid(),
  email          citext not null unique,
  name           text,
  stamps         integer not null default 0 check (stamps between 0 and 9),
  rewards_earned integer not null default 0 check (rewards_earned >= 0),
  rewards_redeemed integer not null default 0 check (rewards_redeemed >= 0),
  -- Hashed; the plaintext lives only in the guest's QR code.
  qr_token_hash  text not null unique,
  last_stamp_at  timestamptz,
  locale         text not null default 'en',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint loyalty_rewards_balance check (rewards_redeemed <= rewards_earned)
);

create trigger loyalty_cards_touch before update on public.loyalty_cards
  for each row execute function public.touch_updated_at();

create table if not exists public.loyalty_stamps (
  id         uuid primary key default gen_random_uuid(),
  card_id    uuid not null references public.loyalty_cards (id) on delete cascade,
  order_id   uuid references public.orders (id) on delete set null,
  staff_id   uuid references public.admin_users (id) on delete set null,
  note       text,
  stamped_at timestamptz not null default now()
);

create index if not exists loyalty_stamps_card_idx on public.loyalty_stamps (card_id, stamped_at desc);

-- Adds a stamp and rolls the card over on the ninth. Atomic so a double-tap
-- on the staff scanner cannot produce two rewards.
create or replace function public.add_loyalty_stamp(
  p_card_id uuid,
  p_staff_id uuid default null,
  p_order_id uuid default null,
  p_note text default null
)
returns table (stamps integer, rewards_earned integer, rolled_over boolean)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_stamps integer;
  v_rolled boolean := false;
begin
  select c.stamps into v_stamps
    from public.loyalty_cards c
   where c.id = p_card_id
     for update;

  if v_stamps is null then
    raise exception 'loyalty card % not found', p_card_id using errcode = 'no_data_found';
  end if;

  insert into public.loyalty_stamps (card_id, staff_id, order_id, note)
  values (p_card_id, p_staff_id, p_order_id, p_note);

  if v_stamps + 1 >= 9 then
    v_rolled := true;
    update public.loyalty_cards
       set stamps = 0,
           rewards_earned = public.loyalty_cards.rewards_earned + 1,
           last_stamp_at = now()
     where id = p_card_id;
  else
    update public.loyalty_cards
       set stamps = public.loyalty_cards.stamps + 1,
           last_stamp_at = now()
     where id = p_card_id;
  end if;

  return query
    select c.stamps, c.rewards_earned, v_rolled
      from public.loyalty_cards c
     where c.id = p_card_id;
end;
$$;

-- ── Gift cards ─────────────────────────────────────────────────────────────

create type gift_card_status as enum ('pending_payment', 'active', 'depleted', 'expired', 'void');

create table if not exists public.gift_cards (
  id               uuid primary key default gen_random_uuid(),
  code             text not null unique,
  initial_fils     integer not null check (initial_fils > 0),
  balance_fils     integer not null check (balance_fils >= 0),
  purchaser_name   text not null,
  purchaser_email  citext not null,
  recipient_name   text,
  recipient_email  citext,
  message          text,
  status           gift_card_status not null default 'pending_payment',
  stripe_session_id text unique,
  expires_at       timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint gift_card_balance check (balance_fils <= initial_fils)
);

create trigger gift_cards_touch before update on public.gift_cards
  for each row execute function public.touch_updated_at();

create type gift_card_txn_kind as enum ('issue', 'redeem', 'refund', 'adjustment');

create table if not exists public.gift_card_transactions (
  id           uuid primary key default gen_random_uuid(),
  gift_card_id uuid not null references public.gift_cards (id) on delete cascade,
  kind         gift_card_txn_kind not null,
  amount_fils  integer not null,
  order_id     uuid references public.orders (id) on delete set null,
  note         text,
  created_at   timestamptz not null default now()
);

create index if not exists gift_card_txn_card_idx on public.gift_card_transactions (gift_card_id, created_at desc);
