# Regulars — three-tier café website demo

A working sales asset for **Aureon Studio**: the same Dubai café site, built
three times over at three levels of ambition, in one Next.js app. Every tier is
a real site — real database, real forms, real bookings. Nothing is faked.

> **Status:** Tier 1 (Essential) is complete and verified. Tier 2 (Signature)
> and Tier 3 (Immersive) are in progress — see *What works today* below.

---

## Quick start (5 minutes)

You need **Node 20.9+** and **PostgreSQL 14+** running locally.

```bash
npm install
cp .env.example .env.local        # then edit AUTH_SECRET and TOKEN_SECRET
```

Create the database and the two roles the app expects:

```bash
sudo -u postgres psql <<'SQL'
CREATE ROLE cafe_admin LOGIN PASSWORD 'cafe_admin_password' SUPERUSER;
CREATE ROLE cafe_app   LOGIN PASSWORD 'cafe_dev_password';
CREATE DATABASE regulars_cafe OWNER cafe_admin;
SQL
```

Then:

```bash
npm run db:migrate    # applies db/migrations/*.sql in order
npm run seed          # a believable week of trade — see below
npm run dev           # http://localhost:3000
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run verify` | typecheck + lint + build |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:reset` | Drop and rebuild the schema from scratch |
| `npm run seed` | Fill the demo with data |
| `npm run reset-demo` | Wipe demo data and re-seed, so the pitch can run twice |
| `npm run images:fetch` | Re-download and re-optimise all photography |

### Demo logins

All three use the password `RegularsDemo!2026` (override with
`DEMO_ADMIN_PASSWORD` before seeding):

| Email | Role | Sees |
| --- | --- | --- |
| `owner@regulars.ae` | owner | Everything, including staff management |
| `manager@regulars.ae` | manager | Everything except staff management |
| `floor@regulars.ae` | staff | Today's bookings and the order queue |

Tier 1 admin: **`/essential/admin`**

---

## What works today

### Tier 1 — Essential ✅ complete and verified

| Route | |
| --- | --- |
| `/essential` | Home — hero, signature plates, story teaser, hours, Instagram, FAQ |
| `/essential/menu` | 46 items, category tabs, dietary filters, AED prices, allergens |
| `/essential/story` | Founder narrative, sourcing, roasting, the team |
| `/essential/gallery` | Masonry grid + keyboard-navigable lightbox |
| `/essential/visit` | Lazy map, hours, live open/closed, contact form, FAQ |
| `/essential/specialty-coffee-al-quoz` | Neighbourhood SEO landing page |
| `/essential/newsletter` | Double opt-in sign-up and confirmation outcomes |
| `/essential/admin` | Enquiries + subscribers, CSV export |

Verified end to end (11/11 automated checks): contact form → database → email
log; newsletter double opt-in including single-use replay protection; honeypot
rejection; admin auth; CSV export including a 401 for signed-out visitors.

**Lighthouse, mobile emulation:**

| Page | Perf | A11y | Best Practices | SEO | LCP | CLS |
| --- | --- | --- | --- | --- | --- | --- |
| `/essential` | 92 | 100 | 100 | 100 | 3.36s | 0.000 |
| `/essential/menu` | 93 | 96 | 100 | 100 | 3.21s | 0.000 |
| `/essential/visit` | 94 | 100 | 100 | 100 | 3.08s | 0.000 |
| `/essential/story` | 93 | 100 | 100 | 100 | 3.29s | 0.000 |
| `/essential/gallery` | 89 | 100 | 100 | 100 | 3.85s | 0.000 |
| `/essential/specialty-coffee-al-quoz` | 94 | 100 | 100 | 100 | 3.08s | 0.000 |

Performance is short of the ≥95 target and LCP short of <2.0s; both are being
worked. CLS is 0.000 across every page and SEO is 100 everywhere.

### Tier 2 — Signature 🚧 in progress

The **data layer is complete and verified**: the availability engine, the
atomic booking function, the double-booking constraint, menu/orders/loyalty/
gift-card schema, and a seeded book of 48 reservations. The public booking UI
is not built yet.

### Tier 3 — Immersive ⏳ not started

---

## Architecture

One Next.js app (App Router, TypeScript strict, Tailwind v4), not three
codebases. Tiers share section components and differ in what they compose.

```
src/app/(en)/          Left-to-right root layout  → /essential, /signature, …
src/app/(ar)/          Right-to-left root layout  → /ar/signature, …
  …/essential/(site)/  Public pages, with marketing chrome
  …/essential/(admin)/ Staff pages, deliberately without it
```

Two root layouts exist so `<html lang>` and `dir` are genuinely correct on
Arabic routes rather than patched in with JavaScript.

### Data

PostgreSQL, reached through `postgres.js`. **No hosted database service is
required or used.** The migrations create the conventional `anon` /
`authenticated` / `service_role` request roles, and the app logs in as an
unprivileged role that `SET LOCAL ROLE`s on every transaction — so row-level
security is genuinely evaluated rather than bypassed by connecting as the table
owner. That also means the schema lifts onto a managed Postgres platform later
without a rewrite.

**Double booking is impossible by construction.** Not by UI logic, not by a
check in the request handler — by a Postgres `EXCLUSION` constraint:

```sql
exclude using gist (
  table_id with =,
  tstzrange(starts_at, ends_at, '[)') with &&
) where (status in ('pending','confirmed','seated') and table_id is not null)
```

A raw `INSERT` that bypasses every line of application code is still rejected.
This is verified, not asserted.

### Security

- RLS on every table. No `USING (true)` on any table containing guest data.
- Guest writes never happen from the browser: a form posts to a server action
  which validates with Zod, checks a honeypot and a submit-timing heuristic,
  rate-limits, and only then writes as `service_role`.
- Tokens in emailed links are HMAC-signed and stored only as SHA-256 hashes.
- Staff passwords are scrypt hashes; sign-in timing is levelled so the form
  cannot be used to enumerate which addresses are staff.
- CSV export runs as the signed-in user, so RLS decides what can leave, and
  cells are prefixed against spreadsheet formula injection.

### Rebranding in one file

Every name, number, address, opening hour, colour and social handle lives in
`src/lib/config/brand.ts`. Change it and the copy, the JSON-LD, the maps links,
the WhatsApp deep links, the email templates, the OG images and the booking
calendar all follow. The menu lives in `src/lib/content/menu.ts`; photography
in `src/lib/content/images.ts`.

### Photography

Sourced from Unsplash but **served from `/public/images`**, because the demo
gets shown on a laptop in a client's office where the wifi may not cooperate.
`npm run images:fetch` re-downloads and re-optimises everything and regenerates
the blur placeholders.

---

## Stripe test cards

Stripe runs in **test mode only**. Never put a live key in this project.

| Card | Result |
| --- | --- |
| `4242 4242 4242 4242` | Succeeds |
| `4000 0000 0000 9995` | Declined — insufficient funds |
| `4000 0025 0000 3155` | Requires 3D Secure authentication |

Any future expiry, any CVC, any postcode.

---

## Email in the demo

`EMAIL_TRANSPORT=log` (the default) sends nothing. Every message is written to
the `sent_emails` table with its full HTML, so a presenter can open a booking
confirmation on stage without a real inbox or a verified domain. Set
`catchall` to send for real but redirect every recipient to
`DEMO_EMAIL_CATCH_ALL`.

---

Built by [Aureon Studio](https://aureon.studio).
