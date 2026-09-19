-- ════════════════════════════════════════════════════════════════════════════
-- 0006 — Row Level Security
-- ════════════════════════════════════════════════════════════════════════════
--
-- Model
-- ─────
-- • anon           — the public website. Can read published content and
--                    nothing else. It can read no guest data at all: there is
--                    no `USING (true)` policy on any table containing a name,
--                    an email address or a booking.
-- • authenticated  — a signed-in member of staff. Gated on `is_admin()`, which
--                    checks the JWT's email against an active admin_users row.
-- • service_role   — the server-side route handlers, after Zod validation,
--                    honeypot and rate limiting. Bypasses RLS by role
--                    attribute (BYPASSRLS), so it needs no policies.
--
-- Guest writes never happen from the browser. A form posts to a route handler,
-- which validates and then writes as service_role. That is why the guest-data
-- tables below have no anon INSERT policy — by design, not by omission.

-- ── Enable everywhere ──────────────────────────────────────────────────────

alter table public.admin_users            enable row level security;
alter table public.sent_emails            enable row level security;
alter table public.rate_limits            enable row level security;
alter table public.analytics_events       enable row level security;
alter table public.enquiries              enable row level security;
alter table public.subscribers            enable row level security;
alter table public.menu_categories        enable row level security;
alter table public.menu_items             enable row level security;
alter table public.modifier_groups        enable row level security;
alter table public.modifier_options       enable row level security;
alter table public.menu_item_modifier_groups enable row level security;
alter table public.restaurant_tables      enable row level security;
alter table public.service_periods        enable row level security;
alter table public.blackout_dates         enable row level security;
alter table public.reservations           enable row level security;
alter table public.waitlist_entries       enable row level security;
alter table public.orders                 enable row level security;
alter table public.order_items            enable row level security;
alter table public.events                 enable row level security;
alter table public.event_enquiries        enable row level security;
alter table public.loyalty_cards          enable row level security;
alter table public.loyalty_stamps         enable row level security;
alter table public.gift_cards             enable row level security;
alter table public.gift_card_transactions enable row level security;

-- ── Published content: readable by the public, writable by staff ───────────

create policy menu_categories_public_read on public.menu_categories
  for select to anon, authenticated
  using (is_active);

create policy menu_categories_admin_write on public.menu_categories
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy menu_items_public_read on public.menu_items
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.menu_categories c
       where c.id = menu_items.category_id and c.is_active
    )
  );

create policy menu_items_admin_write on public.menu_items
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Modifier groups are only public insofar as they are attached to a visible
-- item — an unused group is staff-only.
create policy modifier_groups_public_read on public.modifier_groups
  for select to anon, authenticated
  using (
    exists (
      select 1
        from public.menu_item_modifier_groups m
        join public.menu_items i on i.id = m.item_id
       where m.group_id = modifier_groups.id and i.is_available
    )
  );

create policy modifier_groups_admin_write on public.modifier_groups
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy modifier_options_public_read on public.modifier_options
  for select to anon, authenticated
  using (is_available);

create policy modifier_options_admin_write on public.modifier_options
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy menu_item_mg_public_read on public.menu_item_modifier_groups
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.menu_items i
       where i.id = menu_item_modifier_groups.item_id and i.is_available
    )
  );

create policy menu_item_mg_admin_write on public.menu_item_modifier_groups
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Floor plan and trading calendar are public facts about the café, not guest
-- data. Tier 3's interactive plan reads the bookable tables directly.
create policy tables_public_read on public.restaurant_tables
  for select to anon, authenticated
  using (is_bookable);

create policy tables_admin_write on public.restaurant_tables
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy service_periods_public_read on public.service_periods
  for select to anon, authenticated
  using (is_active);

create policy service_periods_admin_write on public.service_periods
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy blackout_public_read on public.blackout_dates
  for select to anon, authenticated
  using (date >= (now() at time zone 'Asia/Dubai')::date - interval '1 day');

create policy blackout_admin_write on public.blackout_dates
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy events_public_read on public.events
  for select to anon, authenticated
  using (is_published);

create policy events_admin_write on public.events
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ── Guest data: staff only. No anon policy of any kind. ────────────────────

create policy enquiries_admin_all on public.enquiries
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy subscribers_admin_all on public.subscribers
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy reservations_admin_all on public.reservations
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy waitlist_admin_all on public.waitlist_entries
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy orders_admin_all on public.orders
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy order_items_admin_all on public.order_items
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy event_enquiries_admin_all on public.event_enquiries
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy loyalty_cards_admin_all on public.loyalty_cards
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy loyalty_stamps_admin_all on public.loyalty_stamps
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy gift_cards_admin_all on public.gift_cards
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy gift_card_txn_admin_all on public.gift_card_transactions
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy sent_emails_admin_read on public.sent_emails
  for select to authenticated
  using (public.is_admin());

create policy analytics_admin_read on public.analytics_events
  for select to authenticated
  using (public.is_admin());

-- Rate limit counters are written by the service role only and are readable
-- by nobody — they are an implementation detail, and the identity column is
-- a hashed client fingerprint.
create policy rate_limits_no_access on public.rate_limits
  for select to authenticated
  using (false);

-- Staff can see the staff list; only owners can change it.
create policy admin_users_self_read on public.admin_users
  for select to authenticated
  using (public.is_admin());

create policy admin_users_owner_write on public.admin_users
  for all to authenticated
  using (public.has_admin_role(array['owner']::admin_role[]))
  with check (public.has_admin_role(array['owner']::admin_role[]));

-- ── Explicit grants ────────────────────────────────────────────────────────
-- RLS filters rows; GRANT decides whether the role may touch the table at all.
-- Both are needed, and the defaults set in 0001 only apply to tables created
-- after that migration ran, so they are restated here.

grant select on
  public.menu_categories, public.menu_items, public.modifier_groups,
  public.modifier_options, public.menu_item_modifier_groups,
  public.restaurant_tables, public.service_periods, public.blackout_dates,
  public.events, public.menu_public
to anon, authenticated;

grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role, authenticated, anon;

-- Staff need write access on the tables their policies allow.
grant select, insert, update, delete on
  public.enquiries, public.subscribers, public.reservations,
  public.waitlist_entries, public.orders, public.order_items,
  public.event_enquiries, public.loyalty_cards, public.loyalty_stamps,
  public.gift_cards, public.gift_card_transactions,
  public.menu_categories, public.menu_items, public.modifier_groups,
  public.modifier_options, public.menu_item_modifier_groups,
  public.restaurant_tables, public.service_periods, public.blackout_dates,
  public.events, public.admin_users
to authenticated;

grant select on public.sent_emails, public.analytics_events to authenticated;
