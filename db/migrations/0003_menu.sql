-- ════════════════════════════════════════════════════════════════════════════
-- 0003 — Menu (Tier 2 reads this; the admin menu editor writes to it)
-- ════════════════════════════════════════════════════════════════════════════
--
-- Tier 1 renders `src/lib/content/menu.ts` directly — it is a brochure site and
-- a code deploy is the honest way to change a price. Tier 2 seeds these tables
-- from the same file and then reads from the database, so the owner can change
-- a price at 6am without calling the agency.

create table if not exists public.menu_categories (
  id               text primary key,
  slug             text not null unique,
  name             text not null,
  name_ar          text not null default '',
  description      text not null default '',
  description_ar   text not null default '',
  service_note     text,
  service_note_ar  text,
  sort_order       integer not null default 0,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create trigger menu_categories_touch before update on public.menu_categories
  for each row execute function public.touch_updated_at();

create table if not exists public.modifier_groups (
  id          text primary key,
  label       text not null,
  label_ar    text not null default '',
  select_type text not null check (select_type in ('single', 'multi')),
  min_select  integer not null default 0 check (min_select >= 0),
  max_select  integer not null default 1 check (max_select >= 1),
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint modifier_groups_select_range check (max_select >= min_select)
);

create trigger modifier_groups_touch before update on public.modifier_groups
  for each row execute function public.touch_updated_at();

create table if not exists public.modifier_options (
  id               text primary key,
  group_id         text not null references public.modifier_groups (id) on delete cascade,
  label            text not null,
  label_ar         text not null default '',
  price_delta_fils integer not null default 0,
  is_default       boolean not null default false,
  is_available     boolean not null default true,
  sort_order       integer not null default 0
);

create index if not exists modifier_options_group_idx on public.modifier_options (group_id, sort_order);

create table if not exists public.menu_items (
  id                 text primary key,
  slug               text not null unique,
  category_id        text not null references public.menu_categories (id) on delete cascade,
  name               text not null,
  name_ar            text not null default '',
  description        text not null default '',
  description_ar     text not null default '',
  price_fils         integer not null check (price_fils >= 0),
  dietary            text[] not null default '{}',
  allergens          text[] not null default '{}',
  badges             text[] not null default '{}',
  is_available       boolean not null default true,
  unavailable_reason text,
  is_orderable       boolean not null default true,
  image_key          text,
  sort_order         integer not null default 0,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create trigger menu_items_touch before update on public.menu_items
  for each row execute function public.touch_updated_at();

create index if not exists menu_items_category_idx on public.menu_items (category_id, sort_order);
create index if not exists menu_items_available_idx on public.menu_items (is_available) where is_available;

create table if not exists public.menu_item_modifier_groups (
  item_id    text not null references public.menu_items (id) on delete cascade,
  group_id   text not null references public.modifier_groups (id) on delete cascade,
  sort_order integer not null default 0,
  primary key (item_id, group_id)
);

-- A price change should never silently rewrite history on a placed order, so
-- order lines snapshot the name and price. This view is only for the live menu.
create or replace view public.menu_public
with (security_invoker = true)
as
  select
    i.id,
    i.slug,
    i.category_id,
    c.slug as category_slug,
    i.name, i.name_ar,
    i.description, i.description_ar,
    i.price_fils,
    i.dietary, i.allergens, i.badges,
    i.is_available, i.unavailable_reason, i.is_orderable,
    i.image_key,
    i.sort_order,
    c.sort_order as category_sort_order
  from public.menu_items i
  join public.menu_categories c on c.id = i.category_id
  where c.is_active;
