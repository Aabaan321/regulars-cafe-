# Regulars — three-tier café website demo

A working sales asset for **Aureon Studio**: the same Dubai café site, built
three times over at three levels of ambition, in one Next.js app. Every tier is
a real site — real database, real forms, real bookings. Nothing is faked.

> **Status:** Tier 1 (Essential) is complete and verified. Tier 2 (Signature)
> and Tier 3 (Immersive) are in progress — see _What works today_ below.

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

| Command                | What it does                                           |
| ---------------------- | ------------------------------------------------------ |
| `npm run dev`          | Development server                                     |
| `npm run build`        | Production build                                       |
| `npm run verify`       | typecheck + lint + build                               |
| `npm run db:migrate`   | Apply pending migrations                               |
| `npm run db:reset`     | Drop and rebuild the schema from scratch               |
| `npm run seed`         | Fill the demo with data                                |
| `npm run reset-demo`   | Wipe demo data and re-seed, so the pitch can run twice |
| `npm run images:fetch` | Re-download and re-optimise all photography            |

### Demo logins

All three use the password `RegularsDemo!2026` (override with
`DEMO_ADMIN_PASSWORD` before seeding):

| Email                 | Role    | Sees                                   |
| --------------------- | ------- | -------------------------------------- |
| `owner@regulars.ae`   | owner   | Everything, including staff management |
| `manager@regulars.ae` | manager | Everything except staff management     |
| `floor@regulars.ae`   | staff   | Today's bookings and the order queue   |

Tier 1 admin: **`/essential/admin`**

---

## What works today

### Tier 1 — Essential ✅ complete and verified

| Route                                 |                                                                    |
| ------------------------------------- | ------------------------------------------------------------------ |
| `/essential`                          | Home — hero, signature plates, story teaser, hours, Instagram, FAQ |
| `/essential/menu`                     | 46 items, category tabs, dietary filters, AED prices, allergens    |
| `/essential/story`                    | Founder narrative, sourcing, roasting, the team                    |
| `/essential/gallery`                  | Masonry grid + keyboard-navigable lightbox                         |
| `/essential/visit`                    | Lazy map, hours, live open/closed, contact form, FAQ               |
| `/essential/specialty-coffee-al-quoz` | Neighbourhood SEO landing page                                     |
| `/essential/newsletter`               | Double opt-in sign-up and confirmation outcomes                    |
| `/essential/admin`                    | Enquiries + subscribers, CSV export                                |

Verified end to end in a real browser: contact form → database → email log;
newsletter double opt-in including single-use replay protection; honeypot
rejection; admin auth; CSV export including a 401 for signed-out visitors.
Also verified that with no `DATABASE_URL` the static pages still serve and the
forms show a designed message rather than a 500.

**Lighthouse, mobile emulation:**

| Page                                  | Perf | A11y | Best Practices | SEO | LCP   | CLS   |
| ------------------------------------- | ---- | ---- | -------------- | --- | ----- | ----- |
| `/essential`                          | 92   | 100  | 100            | 100 | 3.36s | 0.000 |
| `/essential/menu`                     | 93   | 96   | 100            | 100 | 3.21s | 0.000 |
| `/essential/visit`                    | 94   | 100  | 100            | 100 | 3.08s | 0.000 |
| `/essential/story`                    | 93   | 100  | 100            | 100 | 3.29s | 0.000 |
| `/essential/gallery`                  | 89   | 100  | 100            | 100 | 3.85s | 0.000 |
| `/essential/specialty-coffee-al-quoz` | 94   | 100  | 100            | 100 | 3.08s | 0.000 |

Performance is short of the ≥95 target and LCP short of <2.0s; both are being
worked. CLS is 0.000 across every page and SEO is 100 everywhere.

### What separates the three tiers

Before this, the shared pages (`/menu`, `/story`, `/visit`) rendered
**pixel-identically** at every tier — 10,371px at Tier 2, 10,371px at Tier 3.
A client clicking between tiers saw the same site three times, which is fatal
for a sales asset whose whole job is answering "what does the extra money
buy?"

Two mechanisms fix that, and neither forks a page component.

**A tier design language**, set by one `data-tier` attribute on the shell.
Each tier redefines the tokens the whole system already reads — type scale,
vertical rhythm, radius, elevation, motion — so every heading, card and rule
changes without any page knowing which tier it is. Colour is held constant on
purpose: it is the same café at every tier. Tier 1 is quiet and tight; Tier 2
is editorial with cards that lift; Tier 3 is poster-scale.

**A tier capability model** in `src/lib/config/navigation.ts`. Pages ask
`features.menuSourcing` and render a section or do not. Adding depth to Tier 2
is a boolean and a guard, not a fork.

Measured on the shared pages, same content source, same components:

| Page     | Essential              | Signature              | Immersive              |
| -------- | ---------------------- | ---------------------- | ---------------------- |
| `/menu`  | 10,341px · 1,696 words | 14,560px · 3,162 words | 17,268px · 3,310 words |
| `/visit` | 3,789px · 552 words    | 6,606px · 1,115 words  | 6,840px · 1,115 words  |
| `/story` | 5,952px · 982 words    | 7,627px · 1,194 words  | 8,380px · 1,194 words  |

What Tier 2 adds to the shared pages: the lots on the brew bar with the FOB
price paid against the commodity price that week, a full allergen grid as a
real `<table>` with row/column scope, pickup ordering, four routes into Al
Quoz, what each room in the building is good and bad for, and an
accessibility list that marks what the café **does not** provide as plainly
as what it does.

What Tier 3 adds on top: a full-bleed editorial showcase of the signatures,
and — on `/book` — the interactive floor plan.

### Tier 2 — Signature 🚧 in progress

Built and verified: the availability engine, the atomic booking function, the
double-booking constraint, the four-step booking flow, the self-service
manage/cancel page, the events enquiry with its routing rules, the MDX
journal, and full English + Arabic with true RTL.

Verified in a real browser: a booking taken through the UI, the emailed manage
link opened, the booking cancelled, and the cancellation logged; an events
enquiry submitted, routed, written (the row is invisible to the app's own
database role, which is RLS doing its job), and the alert email logged.

**Pickup ordering** is built and verified end to end: basket, collection
slots derived from trading hours, a real row in `orders` and `order_items`,
and the alert email logged. The rule that shapes it is that **the cart is a
claim, not a price** — every number the browser sends about money is thrown
away and recomputed from the menu server-side. That is tested rather than
asserted: a forged basket claiming 1 fil per item was charged the full 1800.
VAT is _extracted_ from the inclusive menu price rather than added to it,
which is what the café actually charges.

Not built yet: Stripe (orders are pay-at-the-bar today), loyalty, gift cards,
the Tier 2/3 admin dashboard, the reminder cron, and waitlist auto-notify.

### Tier 3 — Immersive 🚧 in progress

The scroll narrative is built, with the visual work split between the two
techniques by what each is actually good at.

**Three filmed sequences on the home page, and one behind every other page.**
A pour carries the first third of the narrative, a cascade of beans the
middle, and latte art the last sixth; behind every other Immersive route sits
a shot chosen for that page. Something is always moving, rather than one shot
playing for four seconds and then holding for the rest of the page, or one
clip repeating until it reads as wallpaper.

**Frame counts are set by the best device, not the worst.** Each device
fetches a fraction of a sequence by its profile — a desktop on wifi takes all
of them, a mid-range phone three fifths, anything on 3g a third. Because
frames arrive in binary-subdivision order, a budget is an even sample of the
whole shot at a lower frame rate, never the first part of it at full rate, and
because the renderer cross-fades between whichever frames have _arrived_, a
third of the frames still scrubs continuously rather than in steps.

**The backgrounds are real footage.** Nine filmed clips, cut into stills and
scrubbed against the scroll wheel — forwards as you read down, backwards as you
read up, at the speed of your hand. A shader cannot fake crema and it is
obvious when it tries. `<video>` cannot do it either: setting `currentTime`
seeks to the nearest keyframe, so a scrubbed video stutters, and iOS will not
paint one before a user gesture. Stills are the only technique that tracks the
wheel exactly, which is why Apple's product pages use them.

**Every page family has its own shot**, and the home page runs three in
sequence:

| where             | clip                           | window             |
| ----------------- | ------------------------------ | ------------------ |
| home, first third | a latte going into a cup       | 9.5s · 171 frames  |
| home, middle      | beans leaving the scoop        | 12s · 168 frames   |
| home, last sixth  | latte art being drawn          | 13.4s · 147 frames |
| menu              | an espresso extracting         | 11.9s · 119 frames |
| order pickup      | latte art being drawn          | 13.4s · 147 frames |
| story             | ground coffee filling a filter | 14.9s · 134 frames |
| story, bean band  | beans falling onto beans       | 14s · 154 frames   |
| journal           | beans falling onto beans       | 14s · 154 frames   |
| visit, events     | the room, with people in it    | 10.3s · 93 frames  |
| book              | a cup being filled             | 15s · 135 frames   |
| gallery           | a steaming cup                 | 10s · 100 frames   |

Every window was chosen from a survey rather than by eye: each source clip was
sampled at 4fps end to end and scored for adjacent-frame delta (is anything
moving), drift from the first frame (is the _picture_ changing, or is motion
happening inside a composition that never moves), and mean luminance. Two
things disqualify a window — drift going flat, and a jump in luminance, which
means a hard cut, and a cut halfway through a scrub is the one artefact there
is no hiding. The survey is also how the previous default plate was caught:
its motion decayed from 3.3 to 0.67 and its drift flatlined at 6s of a 9.6s
window, so the background visibly _stopped_ two-thirds of the way down every
page.

**Between two frames is a real position.** Rounding the scroll position to the
nearest still is a step function — the picture holds, jumps, holds. Instead
the position is kept as a float in frame units and the two loaded frames
either side of it are composited, the second at the position's share of the
distance between them.

The word _loaded_ is the whole trick. On any device with a reduced frame
budget only a subset of frames ever arrives, evenly spread, so blending
between _adjacent indices_ finds both present maybe a third of the time and
quietly stops happening — precisely where it matters most, because fewer
frames is exactly what makes stepping visible. Searching outward in each
direction instead means a 42-frame sequence blends across its real spacing.
Measured: scrolling in 24px steps across a page where one loaded frame covers
400px, twelve consecutive samples produce twelve different pictures. Before
the fix, with the same frames on disk, it was ten.

**The drawn position chases the scroll position** rather than tracking it, at
a rate raised to the elapsed time so the curve is identical at 30, 60 and
144Hz — about 90% of the distance closed in 200ms. That smooths a wheel notch
and lets the shot carry on settling for a moment after the scroll stops. It is
deliberately near-off on the home page, where Lenis has already interpolated
the scroll: easing an eased signal does not smooth it twice, it only adds lag.

How the sequences stay inside the performance budget:

- **One ~30KB poster is the only thing on the critical path.** It paints the
  page immediately. The frames stream afterwards, at low priority, and only
  once the browser has fired `load` and gone idle.
- **Frames arrive in binary subdivision order** — both ends, then the
  midpoint, then the midpoints of those halves. Every prefix of that order is
  an even sample of the whole shot, so it animates coarsely within a second or
  two and simply refines. Whatever the visitor is looking at jumps the queue.
- **A layer that only appears late fetches nothing until it is approached.**
  The home page's closing shot arms at 55% of the scroll, so a visitor who
  never reaches it never pays for it.
- **Two cuts, and a device downloads exactly one.** A 16:9 frame cropped into
  a phone's viewport throws away most of its own width, so portrait gets a
  separate cut framed on the subject.
- **Hero and plate are not sized the same.** A plate sits behind a page's own
  content under a 52–76% veil, so it is built at 840×472 with a heavy focus
  falloff and drawn into a 1.25× backing store instead of 2×. Measured on one
  frame: dropping WebP quality from 54 to 34 saved 24%, while widening the
  blur and pulling the sharp radius in saved 25% _without_ touching quality —
  almost all of a plate's cost is high-frequency detail nobody is looking at.
- **Reduced motion or Save-Data fetches zero sequence bytes** and gets the
  poster, held. Verified: 0 requests, 0 canvases.
- **three.js is not on the boot path.** It is `next/dynamic` _and_ only
  mounted once the visitor scrolls a fifth of the way in.

The cost, stated plainly: 18.8MB of WebP committed to the repo, and a page
that fetches one sequence — 160KB to 400KB on a phone, up to ~1MB on a desktop
taking every frame — after it is already interactive. The home page fetches
three, which is ~2.0MB at a phone's budget and ~5.6MB at a desktop's. That is
a lot of decoration, and it is decoration this tier exists to sell.

The scrim over the film is measured, not eyeballed: the brightest
99.5th-percentile luminance under the text column is 0.31 on the wide cut and
0.23 on the tall one, which puts the minimum scrim clearing 4.5:1 against
`#FFFBF4` at 0.46 and 0.40. The shipped values sit just above those and no
higher, because every extra point of black is photography thrown away.

Verified in a real browser at desktop and iPhone 13, across all nine Immersive
routes: the right clip behind each page, no horizontal overflow (390px
document in a 390px viewport), every canvas painting, and no console errors.

**The interactive floor plan** is built. Pick your actual table off a plan of
the room drawn from the real `plan_x`/`plan_y` columns on
`restaurant_tables`, so moving a table in the admin moves it in the drawing.
It is a radio group rather than a canvas of click targets — arrow keys move
between tables, and every table's accessible name says everything the picture
says ("Window 4, Window run, seats 2 to 4, step-free, free"), so the plan is
usable with the screen off. Availability is never carried by colour alone: a
taken table is hatched and its label struck through.

Not built yet: the custom cursor, View Transitions, the 3D menu showcase,
ambient audio, and a Lighthouse run for Tiers 2–3.

#### Rebuilding the sequences

The frames are committed, so a normal `npm install && npm run build` never
needs ffmpeg. To re-cut them — a different clip, a different window, a
different frame rate — edit the `SEQUENCES` registry at the top of
`scripts/build-pour-frames.ts` and run:

```bash
npm run pour:frames                  # all nine
npm run pour:frames -- --only room   # just one
npm run pour:frames -- --force       # re-download the sources too
```

It uses the `ffmpeg-static` binary from devDependencies, falling back to
`FFMPEG_PATH` or ffmpeg on `PATH`. Sequences removed from the registry have
their directories deleted and their manifest entries dropped, so a retired
clip cannot linger as a 404.

Every clip is Mixkit stock under the Mixkit Free Stock Video License — free
for commercial use, no attribution required; only redistribution _as stock
footage_ is forbidden, which is not what a website background is. Each source
URL, title, licence and window is recorded in
`src/lib/content/pour-sequence.json` so whoever inherits this repo can see
exactly what is being shipped. Swapping in the café's own footage is a
`videoId` and a re-run.
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

| Card                  | Result                            |
| --------------------- | --------------------------------- |
| `4242 4242 4242 4242` | Succeeds                          |
| `4000 0000 0000 9995` | Declined — insufficient funds     |
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
