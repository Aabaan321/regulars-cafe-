-- ════════════════════════════════════════════════════════════════════════════
-- 0002 — Core: admin identity, email log, rate limits, analytics,
--              enquiries and subscribers (Tier 1)
-- ════════════════════════════════════════════════════════════════════════════

-- ── Admin users ────────────────────────────────────────────────────────────
-- Roles are hierarchical in intent, not in the database: `owner` sees
-- everything, `manager` loses the ability to change staff, `staff` is the
-- floor view (today's bookings and the order queue) and nothing else.

create type admin_role as enum ('owner', 'manager', 'staff');

create table if not exists public.admin_users (
  id            uuid primary key default gen_random_uuid(),
  email         citext not null unique,
  name          text not null,
  role          admin_role not null default 'staff',
  password_hash text not null,
  is_active     boolean not null default true,
  last_login_at timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger admin_users_touch before update on public.admin_users
  for each row execute function public.touch_updated_at();

comment on table public.admin_users is
  'Staff logins for the tier admin areas. Passwords are scrypt hashes — see src/lib/auth/password.ts.';

-- Is the current JWT an active admin? Used by every admin RLS policy.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_users a
    where a.email = public.jwt_email()
      and a.is_active
  );
$$;

create or replace function public.has_admin_role(required admin_role[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_users a
    where a.email = public.jwt_email()
      and a.is_active
      and a.role = any(required)
  );
$$;

-- ── Sent email log ─────────────────────────────────────────────────────────
-- Every outbound email is written here whether or not a provider is
-- configured, so the presenter can show a confirmation email on stage without
-- a real inbox. See /signature/admin/emails.

create type email_status as enum ('logged', 'sent', 'failed', 'suppressed');

create table if not exists public.sent_emails (
  id            uuid primary key default gen_random_uuid(),
  to_email      citext not null,
  reply_to      citext,
  subject       text not null,
  template      text not null,
  html_body     text not null,
  text_body     text not null,
  status        email_status not null default 'logged',
  provider_id   text,
  error         text,
  -- Where the mail would have gone if the demo catch-all were not on.
  intended_to   citext,
  attachments   jsonb not null default '[]'::jsonb,
  meta          jsonb not null default '{}'::jsonb,
  tier          text,
  created_at    timestamptz not null default now()
);

create index if not exists sent_emails_created_idx on public.sent_emails (created_at desc);
create index if not exists sent_emails_template_idx on public.sent_emails (template);

-- ── Rate limiting ──────────────────────────────────────────────────────────
-- A fixed-window counter keyed by bucket + identity. Postgres is the right
-- place for this in a single-region demo: no extra service, and the limit
-- survives a redeploy.

create table if not exists public.rate_limits (
  bucket       text not null,
  identity     text not null,
  window_start timestamptz not null,
  hits         integer not null default 0,
  primary key (bucket, identity, window_start)
);

create index if not exists rate_limits_window_idx on public.rate_limits (window_start);

-- Atomically records a hit and reports whether the caller is over the limit.
create or replace function public.check_rate_limit(
  p_bucket text,
  p_identity text,
  p_limit integer,
  p_window_seconds integer
)
returns table (allowed boolean, hits integer, retry_after_seconds integer)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_window_start timestamptz;
  v_hits integer;
begin
  v_window_start := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );

  insert into public.rate_limits (bucket, identity, window_start, hits)
  values (p_bucket, p_identity, v_window_start, 1)
  on conflict (bucket, identity, window_start)
    do update set hits = public.rate_limits.hits + 1
  returning public.rate_limits.hits into v_hits;

  -- Opportunistic cleanup; cheap because of the window index.
  delete from public.rate_limits
   where window_start < now() - interval '1 day';

  return query select
    v_hits <= p_limit,
    v_hits,
    greatest(
      0,
      ceil(extract(epoch from (v_window_start + make_interval(secs => p_window_seconds) - now())))::int
    );
end;
$$;

-- ── Analytics ──────────────────────────────────────────────────────────────
-- First-party, cookieless. No IP address and no user agent are stored; the
-- session id is a per-tab random value that dies with the tab.

create table if not exists public.analytics_events (
  id          bigserial primary key,
  name        text not null,
  tier        text not null,
  locale      text not null default 'en',
  session_id  text not null,
  path        text,
  props       jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create index if not exists analytics_name_time_idx on public.analytics_events (name, occurred_at desc);
create index if not exists analytics_session_idx on public.analytics_events (session_id);

comment on table public.analytics_events is
  'Cookieless first-party funnel events. No IP, no user agent, no cross-site identifier.';

-- ── Enquiries (Tier 1 contact form) ────────────────────────────────────────

create type enquiry_status as enum ('new', 'in_progress', 'closed', 'spam');
create type enquiry_topic  as enum ('general', 'feedback', 'press', 'careers', 'private_hire', 'wholesale');

create table if not exists public.enquiries (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  email        citext not null,
  phone        text,
  topic        enquiry_topic not null default 'general',
  message      text not null,
  status       enquiry_status not null default 'new',
  source_tier  text not null default 'essential',
  locale       text not null default 'en',
  handled_by   uuid references public.admin_users (id) on delete set null,
  handled_at   timestamptz,
  internal_note text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger enquiries_touch before update on public.enquiries
  for each row execute function public.touch_updated_at();

create index if not exists enquiries_status_idx on public.enquiries (status, created_at desc);
create index if not exists enquiries_created_idx on public.enquiries (created_at desc);

-- ── Newsletter subscribers (double opt-in) ─────────────────────────────────

create type subscriber_status as enum ('pending', 'confirmed', 'unsubscribed', 'bounced');

create table if not exists public.subscribers (
  id               uuid primary key default gen_random_uuid(),
  email            citext not null unique,
  name             text,
  status           subscriber_status not null default 'pending',
  -- Opaque single-use tokens. Hashed at rest so a database dump cannot be
  -- used to confirm or unsubscribe anybody.
  confirm_token_hash    text,
  unsubscribe_token_hash text,
  confirm_sent_at  timestamptz,
  confirmed_at     timestamptz,
  unsubscribed_at  timestamptz,
  source           text not null default 'footer',
  source_tier      text not null default 'essential',
  locale           text not null default 'en',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create trigger subscribers_touch before update on public.subscribers
  for each row execute function public.touch_updated_at();

create index if not exists subscribers_status_idx on public.subscribers (status, created_at desc);
create index if not exists subscribers_confirm_idx on public.subscribers (confirm_token_hash)
  where confirm_token_hash is not null;
