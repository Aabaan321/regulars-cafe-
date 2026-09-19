import { brand, siteUrl } from '@/lib/config/brand';
import { menuCategories, menuItems, type DietaryTag, type MenuItem } from '@/lib/content/menu';
import { openingHoursSpecification, specialOpeningHoursSpecification } from '@/lib/utils/hours';

/**
 * Structured data.
 *
 * Every builder returns a plain object; pages render it with `<JsonLd>`, which
 * serialises it into a single `application/ld+json` script. Validated against
 * the Google Rich Results Test and schema.org's own validator — see
 * SEO-REPORT.md for what each page emits and what it was tested with.
 *
 * NAP (name, address, phone) is emitted from `brand.ts`, the same object the
 * footer renders from, so the two cannot drift apart.
 */

// JSON-LD is an open vocabulary; a recursive JSON type is the honest shape.
export type JsonValue = string | number | boolean | null | JsonValue[] | { [k: string]: JsonValue };
export type JsonLdNode = { [k: string]: JsonValue };

const ORG_ID = `${siteUrl}/#organization`;
const PLACE_ID = `${siteUrl}/#place`;
const WEBSITE_ID = `${siteUrl}/#website`;

export function postalAddress(): JsonLdNode {
  return {
    '@type': 'PostalAddress',
    streetAddress: `${brand.address.unit}, ${brand.address.street}`,
    addressLocality: brand.address.district,
    addressRegion: brand.address.region,
    postalCode: brand.address.postalCode,
    addressCountry: brand.address.countryCode,
  };
}

export function geoCoordinates(): JsonLdNode {
  return {
    '@type': 'GeoCoordinates',
    latitude: brand.geo.latitude,
    longitude: brand.geo.longitude,
  };
}

const sameAs: string[] = [brand.social.instagram, brand.social.tiktok, brand.social.google];

/**
 * The café itself. `CafeOrCoffeeShop` is a subtype of both `FoodEstablishment`
 * and `LocalBusiness`, so one node satisfies the local-business requirement
 * without emitting a second, conflicting entity.
 */
export function cafeSchema(options?: { tier?: string; acceptsReservations?: boolean }): JsonLdNode {
  const acceptsReservations = options?.acceptsReservations ?? brand.service.acceptsReservations;

  return {
    '@context': 'https://schema.org',
    '@type': 'CafeOrCoffeeShop',
    '@id': PLACE_ID,
    name: brand.name,
    legalName: brand.legalName,
    description: brand.positioning,
    url: siteUrl,
    telephone: brand.contact.phone,
    email: brand.contact.email,
    priceRange: brand.priceRange,
    currenciesAccepted: brand.currencyCode,
    paymentAccepted: 'Cash, Credit Card, Apple Pay, Google Pay',
    servesCuisine: [...brand.servesCuisine],
    address: postalAddress(),
    geo: geoCoordinates(),
    hasMap: `https://www.google.com/maps/search/?api=1&query=${brand.geo.latitude},${brand.geo.longitude}`,
    openingHoursSpecification: openingHoursSpecification() as unknown as JsonValue,
    specialOpeningHoursSpecification: specialOpeningHoursSpecification() as unknown as JsonValue,
    acceptsReservations: acceptsReservations ? `${siteUrl}/signature/en/book` : 'False',
    hasMenu: `${siteUrl}/essential/menu`,
    sameAs,
    image: [
      `${siteUrl}/images/heroHome.jpg`,
      `${siteUrl}/images/spaceCounter.jpg`,
      `${siteUrl}/images/brunchSpread.jpg`,
    ],
    logo: `${siteUrl}/icon.svg`,
    foundingDate: String(brand.founded),
    amenityFeature: [
      amenity('Free Wi-Fi', brand.service.wifi),
      amenity('Outdoor seating', brand.service.outdoorSeating),
      amenity('Step-free access', true),
      amenity('Takeaway', brand.service.takeaway),
      amenity('Accepts reservations', acceptsReservations),
    ],
    publicAccess: true,
    isAccessibleForFree: true,
    smokingAllowed: false,
    areaServed: [
      { '@type': 'City', name: 'Dubai' },
      { '@type': 'Place', name: 'Al Quoz' },
      { '@type': 'Place', name: 'Alserkal Avenue' },
    ],
  };
}

function amenity(name: string, value: boolean): JsonLdNode {
  return { '@type': 'LocationFeatureSpecification', name, value };
}

/** The business as an Organization, for the knowledge panel and sameAs graph. */
export function organizationSchema(): JsonLdNode {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ORG_ID,
    name: brand.name,
    legalName: brand.legalName,
    url: siteUrl,
    logo: { '@type': 'ImageObject', url: `${siteUrl}/icon.svg` },
    sameAs,
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: brand.contact.phone,
        contactType: 'reservations',
        areaServed: 'AE',
        availableLanguage: ['English', 'Arabic'],
      },
    ],
  };
}

export function websiteSchema(): JsonLdNode {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: siteUrl,
    name: brand.name,
    inLanguage: ['en-AE', 'ar-AE'],
    publisher: { '@id': ORG_ID },
  };
}

/* ── Menu ─────────────────────────────────────────────────────────────────── */

/** schema.org's restricted-diet URIs. Only the ones with a real mapping. */
const DIET_URI: Partial<Record<DietaryTag, string>> = {
  vegan: 'https://schema.org/VeganDiet',
  vegetarian: 'https://schema.org/VegetarianDiet',
  'gluten-free': 'https://schema.org/GlutenFreeDiet',
};

function menuItemNode(item: MenuItem): JsonLdNode {
  const diets = item.dietary.map((d) => DIET_URI[d]).filter((v): v is string => Boolean(v));

  const node: JsonLdNode = {
    '@type': 'MenuItem',
    name: item.name,
    description: item.description,
    offers: {
      '@type': 'Offer',
      price: (item.priceFils / 100).toFixed(2),
      priceCurrency: brand.currencyCode,
      availability: item.available ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  };

  if (diets.length > 0) node.suitableForDiet = diets;
  if (item.allergens.length > 0) {
    node.nutrition = {
      '@type': 'NutritionInformation',
      description: `Contains: ${item.allergens.join(', ')}`,
    };
  }
  return node;
}

export function menuSchema(): JsonLdNode {
  return {
    '@context': 'https://schema.org',
    '@type': 'Menu',
    '@id': `${siteUrl}/essential/menu#menu`,
    name: `${brand.name} menu`,
    inLanguage: 'en-AE',
    url: `${siteUrl}/essential/menu`,
    hasMenuSection: menuCategories.map((category) => ({
      '@type': 'MenuSection',
      name: category.name,
      description: category.description,
      hasMenuItem: menuItems
        .filter((i) => i.categoryId === category.id)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(menuItemNode),
    })),
  };
}

/* ── Navigation ───────────────────────────────────────────────────────────── */

export interface Crumb {
  readonly name: string;
  readonly path: string;
}

export function breadcrumbSchema(crumbs: readonly Crumb[]): JsonLdNode {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.name,
      item: `${siteUrl}${crumb.path}`,
    })),
  };
}

/* ── FAQ ──────────────────────────────────────────────────────────────────── */

export interface FaqEntry {
  readonly question: string;
  readonly answer: string;
}

export function faqSchema(entries: readonly FaqEntry[]): JsonLdNode {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: entries.map((entry) => ({
      '@type': 'Question',
      name: entry.question,
      acceptedAnswer: { '@type': 'Answer', text: entry.answer },
    })),
  };
}

/* ── Article & Event ──────────────────────────────────────────────────────── */

export interface ArticleSchemaInput {
  readonly title: string;
  readonly description: string;
  readonly path: string;
  readonly imagePath: string;
  readonly publishedAt: string;
  readonly updatedAt?: string;
  readonly authorName: string;
  readonly section?: string;
  readonly wordCount?: number;
}

export function articleSchema(input: ArticleSchemaInput): JsonLdNode {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: input.title.slice(0, 110),
    description: input.description,
    image: [`${siteUrl}${input.imagePath}`],
    datePublished: input.publishedAt,
    dateModified: input.updatedAt ?? input.publishedAt,
    author: { '@type': 'Person', name: input.authorName },
    publisher: { '@id': ORG_ID },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${siteUrl}${input.path}` },
    ...(input.section ? { articleSection: input.section } : {}),
    ...(input.wordCount ? { wordCount: input.wordCount } : {}),
    inLanguage: 'en-AE',
  };
}

export interface EventSchemaInput {
  readonly name: string;
  readonly description: string;
  readonly path: string;
  readonly startsAt: string;
  readonly endsAt: string;
  readonly priceFils: number;
  readonly capacity: number;
  readonly spotsTaken: number;
  readonly imagePath?: string;
}

export function eventSchema(input: EventSchemaInput): JsonLdNode {
  const soldOut = input.spotsTaken >= input.capacity;
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: input.name,
    description: input.description,
    startDate: input.startsAt,
    endDate: input.endsAt,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: brand.name,
      address: postalAddress(),
      geo: geoCoordinates(),
    },
    organizer: { '@id': ORG_ID },
    ...(input.imagePath ? { image: [`${siteUrl}${input.imagePath}`] } : {}),
    offers: {
      '@type': 'Offer',
      url: `${siteUrl}${input.path}`,
      price: (input.priceFils / 100).toFixed(2),
      priceCurrency: brand.currencyCode,
      availability: soldOut ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
      validFrom: new Date().toISOString(),
    },
    maximumAttendeeCapacity: input.capacity,
    remainingAttendeeCapacity: Math.max(0, input.capacity - input.spotsTaken),
  };
}
