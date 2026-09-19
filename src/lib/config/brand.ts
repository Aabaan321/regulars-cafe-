/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  THE ONE FILE YOU EDIT TO REBRAND THIS SITE.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Every name, number, address, opening hour, colour and social handle that
 *  appears anywhere on any tier is defined here. Change the values below and
 *  the entire three-tier site — copy, schema.org JSON-LD, maps, WhatsApp deep
 *  links, email footers, OG images, the booking engine's trading calendar —
 *  follows.
 *
 *  Menu items live in `src/lib/content/menu.ts`.
 *  Photography lives in `src/lib/content/images.ts`.
 *
 *  See README.md § "Rebranding in one file".
 */

export type Weekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

/** A single continuous trading window, 24h clock, café-local time. */
export interface TradingWindow {
  /** "07:00" */
  readonly open: string;
  /** "22:00" */
  readonly close: string;
  /** Optional label shown in the UI, e.g. "Kitchen closes 21:30". */
  readonly note?: string;
}

export interface DayHours {
  readonly day: Weekday;
  /** Empty array = closed all day. Multiple windows = split trading. */
  readonly windows: readonly TradingWindow[];
}

/**
 * A dated override of the weekly pattern. Used for public holidays, Ramadan
 * timings, private buy-outs and maintenance days. `windows: []` means closed.
 */
export interface HoursException {
  /** ISO date, café-local, "YYYY-MM-DD". */
  readonly date: string;
  readonly label: string;
  readonly windows: readonly TradingWindow[];
}

export interface BrandColorScale {
  readonly bg: string;
  readonly bgSubtle: string;
  readonly surface: string;
  readonly surfaceRaised: string;
  readonly border: string;
  readonly borderStrong: string;
  readonly text: string;
  readonly textMuted: string;
  readonly textFaint: string;
  readonly accent: string;
  readonly accentHover: string;
  readonly accentContrast: string;
  readonly secondary: string;
  readonly secondaryContrast: string;
  readonly highlight: string;
  readonly highlightContrast: string;
  readonly success: string;
  readonly warning: string;
  readonly danger: string;
  readonly dangerContrast: string;
}

export const brand = {
  /* ── Identity ─────────────────────────────────────────────────────────── */
  name: 'Regulars',
  legalName: 'Regulars Speciality Coffee L.L.C.',
  /** Used where the name needs to stand alone, e.g. <title> suffixes. */
  shortName: 'Regulars',
  tagline: 'Come twice. You’re a regular.',
  /** One sentence, used as the hero positioning line and meta description seed. */
  positioning:
    'A working roastery and all-day brunch room in Alserkal Avenue — single-origin coffee roasted on site, and a kitchen that treats breakfast like dinner.',
  /** Short descriptor for schema.org and directory listings. */
  descriptor: 'Specialty coffee roastery and all-day brunch café in Al Quoz, Dubai',
  founded: 2024,
  priceRange: 'AED 25–120',
  currency: 'AED',
  currencyCode: 'AED',
  servesCuisine: ['Coffee', 'Brunch', 'Middle Eastern', 'Café'] as const,

  /* ── Contact ──────────────────────────────────────────────────────────── */
  contact: {
    /** E.164, used for tel: links and schema.org. */
    phone: '+97143381974',
    phoneDisplay: '+971 4 338 1974',
    /** E.164 without the +, used to build wa.me deep links. */
    whatsapp: '971504617722',
    whatsappDisplay: '+971 50 461 7722',
    email: 'hello@regulars.ae',
    bookingsEmail: 'bookings@regulars.ae',
    pressEmail: 'press@regulars.ae',
  },

  /* ── Address & geo ────────────────────────────────────────────────────── */
  address: {
    unit: 'Warehouse 14',
    street: 'Alserkal Avenue, 17th Street',
    district: 'Al Quoz Industrial Area 1',
    city: 'Dubai',
    region: 'Dubai',
    postalCode: '00000',
    country: 'United Arab Emirates',
    countryCode: 'AE',
    /** Single-line form. Keep consistent with the parts above — this is the NAP. */
    formatted: 'Warehouse 14, Alserkal Avenue, 17th Street, Al Quoz 1, Dubai, United Arab Emirates',
  },
  geo: {
    latitude: 25.1441,
    longitude: 55.2364,
    /** What Google Maps should search for if coordinates ever drift. */
    placeQuery: 'Alserkal Avenue, Al Quoz 1, Dubai',
    /** Used by the Visit page and the LocalBusiness JSON-LD. */
    mapZoom: 16,
  },

  /* ── Trading hours ────────────────────────────────────────────────────── */
  /** IANA zone. Every open/closed calculation in the app resolves through this. */
  timezone: 'Asia/Dubai',
  hours: [
    { day: 'mon', windows: [{ open: '07:00', close: '22:00', note: 'Kitchen closes 21:15' }] },
    { day: 'tue', windows: [{ open: '07:00', close: '22:00', note: 'Kitchen closes 21:15' }] },
    { day: 'wed', windows: [{ open: '07:00', close: '22:00', note: 'Kitchen closes 21:15' }] },
    { day: 'thu', windows: [{ open: '07:00', close: '23:00', note: 'Kitchen closes 22:15' }] },
    { day: 'fri', windows: [{ open: '07:00', close: '23:00', note: 'Kitchen closes 22:15' }] },
    { day: 'sat', windows: [{ open: '08:00', close: '23:00', note: 'Brunch service from 08:00' }] },
    { day: 'sun', windows: [{ open: '08:00', close: '21:00', note: 'Kitchen closes 20:15' }] },
  ] satisfies readonly DayHours[],

  /**
   * Dated exceptions. The open/closed indicator, the booking availability
   * engine and the JSON-LD `specialOpeningHoursSpecification` all read this.
   * Keep the next ~12 months populated; stale entries are ignored.
   */
  hoursExceptions: [
    {
      date: '2026-01-01',
      label: 'New Year’s Day — late start',
      windows: [{ open: '09:00', close: '22:00' }],
    },
    { date: '2026-03-20', label: 'Eid al Fitr — closed', windows: [] },
    {
      date: '2026-03-21',
      label: 'Eid al Fitr — reduced hours',
      windows: [{ open: '16:00', close: '23:00' }],
    },
    { date: '2026-05-27', label: 'Eid al Adha — closed', windows: [] },
    {
      date: '2026-12-01',
      label: 'Commemoration Day',
      windows: [{ open: '08:00', close: '18:00' }],
    },
    { date: '2026-12-02', label: 'UAE National Day', windows: [] },
    {
      date: '2026-12-03',
      label: 'UAE National Day holiday',
      windows: [{ open: '10:00', close: '23:00' }],
    },
    {
      date: '2027-01-01',
      label: 'New Year’s Day — late start',
      windows: [{ open: '09:00', close: '22:00' }],
    },
  ] satisfies readonly HoursException[],

  /* ── Social ───────────────────────────────────────────────────────────── */
  social: {
    instagram: 'https://www.instagram.com/regulars.dxb',
    instagramHandle: '@regulars.dxb',
    tiktok: 'https://www.tiktok.com/@regulars.dxb',
    google: 'https://maps.google.com/?q=Alserkal+Avenue+Al+Quoz+1+Dubai',
    talabat: 'https://www.talabat.com',
    deliveroo: 'https://deliveroo.ae',
  },

  /* ── Service model ────────────────────────────────────────────────────── */
  service: {
    acceptsReservations: true,
    /** Largest party the booking widget will take without a phone call. */
    maxOnlinePartySize: 8,
    /** Parties above this route to the private-hire enquiry form instead. */
    privateHireThreshold: 9,
    takeaway: true,
    delivery: true,
    dineIn: true,
    outdoorSeating: true,
    wifi: true,
    parking: 'Free street parking on 17th Street and in the Alserkal Avenue visitor lot.',
    metro: 'Equiti Metro Station (Red Line) is 2.4 km away — a 7-minute taxi.',
    accessibility:
      'Step-free entrance from the 17th Street courtyard, accessible WC, and 90 cm clearance between all floor tables.',
  },

  /* ── Colour system ────────────────────────────────────────────────────── */
  /**
   * Both themes are designed, not derived. Contrast ratios against their own
   * background are noted where they matter for WCAG 2.2 AA (4.5:1 body text,
   * 3:1 large text and UI boundaries).
   */
  colors: {
    light: {
      bg: '#F7F2E9', //             tahini
      bgSubtle: '#F1EADF',
      surface: '#FFFDF9',
      surfaceRaised: '#FFFFFF',
      border: '#E2D8C8',
      borderStrong: '#C9B99F',
      // Contrast ratios below are the WORST case across bg, bgSubtle and
      // surface — not the flattering one. textFaint sits on bgSubtle more
      // often than on bg, and measuring against bg alone hid an AA failure.
      text: '#1B1512', //           14.9:1 worst case
      textMuted: '#5A4C42', //      6.9:1 worst case
      textFaint: '#6E5F53', //      5.1:1 worst case (AA for body text)
      accent: '#9C4B1E', //         date syrup — 6.1:1 on bg
      accentHover: '#7E3C16',
      accentContrast: '#FFF8F1',
      secondary: '#4F6136', //      pistachio grove — 6.4:1 on bg
      secondaryContrast: '#F4F7EC',
      highlight: '#C98A21', //      saffron — 3.2:1, large text / UI only
      highlightContrast: '#231703',
      success: '#2F6B46',
      warning: '#8A5A12',
      danger: '#9B2C2C',
      dangerContrast: '#FFF5F5',
    } satisfies BrandColorScale,
    dark: {
      bg: '#14100D', //             roasted
      bgSubtle: '#1A1512',
      surface: '#201A16',
      surfaceRaised: '#2A231D',
      border: '#3A2F27',
      borderStrong: '#584838',
      text: '#F2E9DC', //           14.8:1 on bg
      textMuted: '#C0B0A0', //      8.3:1 on bg
      textFaint: '#9A897A', //      5.2:1 on bg
      accent: '#E3894A', //         warmed date syrup — 8.0:1 on bg
      accentHover: '#F0A167',
      accentContrast: '#1B0F06',
      secondary: '#9DB574', //      lit pistachio — 9.1:1 on bg
      secondaryContrast: '#131A08',
      highlight: '#E9B85C', //     lit saffron — 10.3:1 on bg
      highlightContrast: '#1A1203',
      success: '#6FBF8E',
      warning: '#E0AC5B',
      danger: '#F08585',
      dangerContrast: '#2A0A0A',
    } satisfies BrandColorScale,
  },

  /* ── Typography ───────────────────────────────────────────────────────── */
  /**
   * Loaded and self-hosted through next/font in `src/lib/config/fonts.ts`.
   * Changing a family name here is documentation only — update fonts.ts too.
   */
  typography: {
    display: 'Fraunces',
    displayIntent:
      'A variable optical-size serif with a soft axis. Set tight and large it reads as a restaurant menu; set small it stays warm rather than corporate.',
    body: 'Karla',
    bodyIntent:
      'A humanist grotesque with open apertures and slightly odd details — friendly at 16px, legible at 13px on a phone in sunlight.',
    arabic: 'IBM Plex Sans Arabic',
    arabicIntent:
      'A Naskh-rooted sans with true Arabic proportions. Never a Latin face with Arabic bolted on — the counters and kerning are drawn for the script.',
  },

  /* ── Presenter / agency layer ─────────────────────────────────────────── */
  agency: {
    name: 'Aureon Studio',
    tagline: 'Websites that do the work of a staff member.',
    url: 'https://aureon.studio',
    email: 'studio@aureon.studio',
  },
} as const;

export type Brand = typeof brand;

const LOCAL_ORIGIN = 'http://localhost:3000';

/** Treats an unset, blank or whitespace-only variable as absent. */
function envOrigin(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/**
 * Resolves the canonical origin, with no trailing slash.
 *
 * Written defensively because it runs at module scope and feeds
 * `metadataBase: new URL(siteUrl)` — anything that returns a non-URL here
 * fails the whole build rather than one page.
 *
 * The subtlety that bit us: Next inlines `process.env.NEXT_PUBLIC_*` at build
 * time, and an unset one becomes the empty string, not `undefined`. `??`
 * therefore does NOT fall through, and `new URL('')` throws. Every candidate
 * is checked for emptiness explicitly, and the result is parsed before it is
 * trusted.
 */
function resolveSiteUrl(): string {
  const candidates = [
    // Explicit configuration always wins.
    envOrigin(process.env.NEXT_PUBLIC_SITE_URL),
    // The stable production domain of a Vercel project.
    prefixHttps(envOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL)),
    // The per-deployment URL, so preview builds get correct canonicals.
    prefixHttps(envOrigin(process.env.VERCEL_URL)),
    LOCAL_ORIGIN,
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      const url = new URL(candidate);
      return url.origin;
    } catch {
      // Malformed value — try the next candidate rather than failing the build.
    }
  }

  return LOCAL_ORIGIN;
}

/** Vercel exposes host names without a scheme. */
function prefixHttps(host: string | null): string | null {
  if (!host) return null;
  return /^https?:\/\//i.test(host) ? host : `https://${host}`;
}

/** Canonical absolute URL for the deployed site, no trailing slash. */
export const siteUrl = resolveSiteUrl();

/** tel: href for the café's landline. */
export const telHref = `tel:${brand.contact.phone}`;

/** Pre-filled WhatsApp deep link. Works on desktop web and both mobile OSes. */
export function whatsappHref(message?: string): string {
  const text = message ?? `Hi ${brand.name} — I have a question about`;
  return `https://wa.me/${brand.contact.whatsapp}?text=${encodeURIComponent(text)}`;
}

/** Google Maps directions link, coordinate-first with a text fallback. */
export const directionsHref = `https://www.google.com/maps/dir/?api=1&destination=${brand.geo.latitude},${brand.geo.longitude}&destination_place_id=&travelmode=driving`;

/** Static map / "view on maps" link. */
export const mapHref = `https://www.google.com/maps/search/?api=1&query=${brand.geo.latitude},${brand.geo.longitude}`;
