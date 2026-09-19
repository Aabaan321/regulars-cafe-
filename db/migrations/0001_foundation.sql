-- ════════════════════════════════════════════════════════════════════════════
-- 0001 — Foundation: extensions, roles, shared helpers
-- ════════════════════════════════════════════════════════════════════════════
--
-- Target: a plain PostgreSQL 14+ server, applied with `npm run db:migrate`.
-- That is how the demo runs — on a laptop, with no network and no managed
-- service in the loop.
--
-- The three request roles created below (anon / authenticated / service_role)
-- are the same names a managed Postgres platform hands you. That is on
-- purpose: it costs nothing here, and it means these files can be pushed to
-- one later without a rewrite. The DO blocks are idempotent, so they simply
-- no-op if the roles already exist.

create extension if not exists "pgcrypto";   -- gen_random_uuid(), digest()
create extension if not exists "btree_gist"; -- required by the reservation
                                             -- exclusion constraint in 0004
create extension if not exists "citext";     -- case-insensitive email columns

-- ── Request roles ──────────────────────────────────────────────────────────
-- The application logs in as `authenticator`, which owns no data and inherits
-- nothing. Every request opens a transaction and does `SET LOCAL ROLE` to
-- anon, authenticated or service_role, so row-level security is genuinely
-- evaluated rather than bypassed by connecting as the table owner.

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin noinherit bypassrls;
  end if;
end
$$;

-- Ensure service_role can bypass RLS even if it pre-existed without it.
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role' and not rolbypassrls)
     and (select rolsuper from pg_roles where rolname = current_user) then
    alter role service_role bypassrls;
  end if;
exception when insufficient_privilege then
  raise notice 'service_role bypassrls not granted (insufficient privilege) — expected on a managed platform where it is preset';
end
$$;

grant usage on schema public to anon, authenticated, service_role;

-- New tables should be reachable by the request roles without a grant per
-- table; RLS, not GRANT, is what actually gates the rows.
alter default privileges in schema public
  grant select on tables to anon, authenticated;
alter default privileges in schema public
  grant select, insert, update, delete on tables to service_role;
alter default privileges in schema public
  grant usage, select on sequences to anon, authenticated, service_role;

-- ── JWT claim helpers ──────────────────────────────────────────────────────
-- Policies read the caller's identity from `request.jwt.claims`, a GUC the
-- application sets per transaction. Using the conventional claim names means
-- an external auth provider can be dropped in later without touching a single
-- policy.

create or replace function public.jwt_claims()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claims', true), '')::jsonb,
    '{}'::jsonb
  );
$$;

create or replace function public.jwt_email()
returns text
language sql
stable
security invoker
set search_path = ''
as $$
  select lower(nullif(public.jwt_claims() ->> 'email', ''));
$$;

create or replace function public.jwt_role()
returns text
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(nullif(public.jwt_claims() ->> 'role', ''), 'anon');
$$;

-- ── updated_at ─────────────────────────────────────────────────────────────

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── Short, human-quotable references (e.g. "RG-7F3K2Q") ────────────────────
-- Crockford-style alphabet: no I, L, O, U, so a reference read down the phone
-- cannot be mistranscribed.

create or replace function public.generate_reference(prefix text default 'RG')
returns text
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  alphabet constant text := '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  result text := '';
  i integer;
begin
  for i in 1..6 loop
    result := result || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
  end loop;
  return prefix || '-' || result;
end;
$$;
