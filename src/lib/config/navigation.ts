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
  readonly features: TierFeatures;
}

/**
 * What each tier's pages actually contain.
 *
 * The shared pages used to render identically at every tier, which made the
 * expensive tiers look like the cheap one with extra routes bolted on — a
 * fatal thing for a sales asset, because the client's whole question is
 * "what does the extra money buy?"
 *
 * So depth is a declared capability, read by the page components. A page asks
 * `features.menuSourcing` and renders the farm cards or does not. Adding a
 * section to Tier 2 is a boolean here and a guard there, not a fork of the
 * page — which is also the honest engineering answer, since all three tiers
 * are one codebase.
 *
 * The rule for where a feature lands: Tier 1 gets everything a guest needs
 * to decide to come. Tier 2 adds everything the café needs to *run* on the
 * site. Tier 3 adds everything that makes someone send it to a friend.
 */
export interface TierFeatures {
  /** Menu: provenance cards for the lots currently on the brew bar. */
  readonly menuSourcing: boolean;
  /** Menu: what the kitchen suggests alongside each signature. */
  readonly menuPairings: boolean;
  /** Menu: the full allergen grid, not just per-item chips. */
  readonly menuAllergenMatrix: boolean;
  /** Menu: pickup ordering. */
  readonly menuOrdering: boolean;
  /** Story: the dated build-out timeline. */
  readonly storyTimeline: boolean;
  /** Story: who actually works here. */
  readonly storyTeam: boolean;
  /** Story: a scrubbed band of real beans falling. */
  readonly storyBeanBand: boolean;
  /** Visit: getting here by metro, taxi, car and bike. */
  readonly visitTransport: boolean;
  /** Visit: step-free access, hearing loop, the honest caveats. */
  readonly visitAccessibility: boolean;
  /** Visit: which room to ask for, and what each seats. */
  readonly visitRooms: boolean;
  /** Booking: choose your actual table off a live plan of the room. */
  readonly bookingFloorPlan: boolean;
  /** Menu: a full-bleed editorial spread of the signatures. */
  readonly menuShowcase: boolean;
  /** Chrome: which hero composition the pages open with. */
  readonly heroLayout: 'overlay' | 'panel';
  /** Chrome: sections reveal on scroll rather than simply being there. */
  readonly scrollReveal: boolean;
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
      'Six pages of real content, not a template',
      'Live “open now” from your trading hours',
      'Contact and newsletter that land in a real inbox',
      'Basic SEO — titles, schema, sitemap, Google Business',
      'Deployed on your domain, keys handed over',
    ],
    bilingual: false,
    heroImageKey: 'spaceMorning',
    priceFrom: '₹15,000',
    timeline: '2–3 weeks',
    features: {
      menuSourcing: false,
      menuPairings: false,
      menuAllergenMatrix: false,
      menuOrdering: false,
      storyTimeline: false,
      storyTeam: false,
      storyBeanBand: false,
      visitTransport: false,
      visitAccessibility: false,
      visitRooms: false,
      bookingFloorPlan: false,
      menuShowcase: false,
      heroLayout: 'panel',
      scrollReveal: false,
    },
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
      'Pickup ordering and card payments',
      'WhatsApp automation — confirmations, reminders, vouchers',
      'Advanced SEO with three months of reporting',
      'Admin back office and two weeks of support',
    ],
    bilingual: true,
    heroImageKey: 'spaceCounter',
    priceFrom: '₹25,000–30,000',
    timeline: '5–7 weeks',
    features: {
      menuSourcing: true,
      menuPairings: true,
      menuAllergenMatrix: true,
      menuOrdering: true,
      storyTimeline: true,
      storyTeam: true,
      storyBeanBand: true,
      visitTransport: true,
      visitAccessibility: true,
      visitRooms: true,
      bookingFloorPlan: false,
      menuShowcase: false,
      heroLayout: 'overlay',
      scrollReveal: true,
    },
  },
  immersive: {
    id: 'immersive',
    name: 'Immersive',
    ordinal: 3,
    positioning: 'The site people send to their friends.',
    blurb:
      'Everything in Signature, wrapped in a scroll-driven WebGL story that makes the room feel like the room.',
    headlineFeatures: [
      'Filmed motion on every page, not just the home',
      'AI ordering assistant with voice',
      'Fully automated WhatsApp journeys',
      'Premium SEO — the stack the brands above you run',
      'QR order-at-table for ₹5,000 more',
    ],
    bilingual: true,
    heroImageKey: 'heroStory',
    priceFrom: '₹45,000–50,000',
    timeline: '9–12 weeks',
    features: {
      menuSourcing: true,
      menuPairings: true,
      menuAllergenMatrix: true,
      menuOrdering: true,
      storyTimeline: true,
      storyTeam: true,
      storyBeanBand: true,
      visitTransport: true,
      visitAccessibility: true,
      visitRooms: true,
      bookingFloorPlan: true,
      menuShowcase: true,
      heroLayout: 'overlay',
      scrollReveal: true,
    },
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
  { key: 'order', path: '/order' },
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
  /*
   * Loyalty and gift cards are sold in the tier matrix and are not built yet,
   * so they are not linked. They were: every Tier 2 and Tier 3 footer pointed
   * at /loyalty and /gift-cards, both of which 404, and Next prefetched them
   * on hover so the console filled with errors before anyone even clicked.
   * A link to nothing is worse than no link — put them back the moment the
   * pages exist.
   */
  return [
    { key: 'order', path: '/order' },
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

/** Shorthand for the common `tiers[tier].features` read. */
export function featuresFor(tier: TierId): TierFeatures {
  return tiers[tier].features;
}
