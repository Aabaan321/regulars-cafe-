import type { Dictionary, Locale } from '@/lib/i18n/dictionaries';

/**
 * The route map for all three tiers.
 *
 * One model, three tiers: each tier declares which pages it has, and the
 * header, footer, sitemap and tier switcher all read from here. Adding a page
 * to Tier 2 is one line, not five files.
 */

export type TierId = 'essential' | 'signature' | 'immersive';

export interface TierDefinition {
  readonly id: TierId;
  readonly name: string;
  readonly ordinal: number;
  readonly positioning: string;
  /** The pitch-deck one-liner shown on the tier selector card. */
  readonly blurb: string;
  readonly headlineFeatures: readonly string[];
  readonly bilingual: boolean;
  readonly heroImageKey: string;
  readonly priceFrom: string;
  readonly timeline: string;
}

export const tiers: Record<TierId, TierDefinition> = {
  essential: {
    id: 'essential',
    name: 'Essential',
    ordinal: 1,
    positioning: 'The site the café actually needs, made properly.',
    blurb:
      'Everything a guest needs before they walk in — fast, findable and honest. No dead weight.',
    headlineFeatures: [
      'Five pages of real content, not a template',
      'Live “open now” from your trading hours',
      'Contact and newsletter that land in a real inbox',
      'Top-of-page Lighthouse scores and full schema.org',
    ],
    bilingual: false,
    heroImageKey: 'spaceMorning',
    priceFrom: 'AED 9,500',
    timeline: '2–3 weeks',
  },
  signature: {
    id: 'signature',
    name: 'Signature',
    ordinal: 2,
    positioning: 'The site starts taking bookings, orders and money.',
    blurb:
      'Everything in Essential, plus a reservation engine, pickup ordering, loyalty and a newsroom — in English and Arabic.',
    headlineFeatures: [
      'Reservations with a real availability engine',
      'Pickup ordering through Stripe',
      'Loyalty, gift cards and an events pipeline',
      'Full Arabic with true RTL layout',
    ],
    bilingual: true,
    heroImageKey: 'spaceCounter',
    priceFrom: 'AED 24,000',
    timeline: '5–7 weeks',
  },
  immersive: {
    id: 'immersive',
    name: 'Immersive',
    ordinal: 3,
    positioning: 'The site people send to their friends.',
    blurb:
      'Everything in Signature, wrapped in a scroll-driven WebGL story that makes the room feel like the room.',
    headlineFeatures: [
      'Scroll-scrubbed 3D pour and bean journey',
      'Pick your actual table from a live floor plan',
      'Cursor, transitions and sound designed as one piece',
      'A designed 2D fallback for weaker devices',
    ],
    bilingual: true,
    heroImageKey: 'heroStory',
    priceFrom: 'AED 52,000',
    timeline: '9–12 weeks',
  },
};

export const tierOrder: readonly TierId[] = ['essential', 'signature', 'immersive'];

/** Base path for a tier in a given language. */
export function tierBase(tier: TierId, locale: Locale = 'en'): string {
  if (locale === 'ar' && tiers[tier].bilingual) return `/ar/${tier}`;
  return `/${tier}`;
}

export interface NavItem {
  readonly key: keyof Dictionary['nav'];
  /** Appended to the tier base. '' is the tier home. */
  readonly path: string;
  /** Rendered as the primary CTA in the header rather than a nav link. */
  readonly cta?: boolean;
}

const essentialNav: readonly NavItem[] = [
  { key: 'menu', path: '/menu' },
  { key: 'story', path: '/story' },
  { key: 'gallery', path: '/gallery' },
  { key: 'visit', path: '/visit' },
];

const signatureNav: readonly NavItem[] = [
  { key: 'menu', path: '/menu' },
  { key: 'story', path: '/story' },
  { key: 'events', path: '/events' },
  { key: 'journal', path: '/journal' },
  { key: 'visit', path: '/visit' },
  { key: 'book', path: '/book', cta: true },
];

export function navFor(tier: TierId): readonly NavItem[] {
  return tier === 'essential' ? essentialNav : signatureNav;
}

/** Secondary links that live in the footer rather than the header. */
export function footerNavFor(tier: TierId): readonly NavItem[] {
  if (tier === 'essential') return [{ key: 'gallery', path: '/gallery' }];
  return [
    { key: 'order', path: '/order' },
    { key: 'loyalty', path: '/loyalty' },
    { key: 'giftCards', path: '/gift-cards' },
    { key: 'gallery', path: '/gallery' },
  ];
}

/** Absolute path for a tier page. */
export function tierHref(tier: TierId, path: string, locale: Locale = 'en'): string {
  return `${tierBase(tier, locale)}${path}`;
}

/** Pitch-layer routes, outside the tiers. */
export const pitchRoutes = {
  home: '/',
  compare: '/compare',
  bespoke: '/bespoke',
} as const;
