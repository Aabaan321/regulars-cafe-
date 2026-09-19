import type { Metadata } from 'next';
import { brand, siteUrl } from '@/lib/config/brand';

/**
 * Metadata construction, with the limits enforced rather than hoped for.
 *
 * Google truncates titles around 60 characters and descriptions around 155.
 * Rather than trust every page author to count, `buildMetadata` warns in
 * development when a value is over budget, so the problem surfaces while
 * someone is looking at it instead of in an audit three months later.
 */

const TITLE_LIMIT = 60;
const DESCRIPTION_LIMIT = 155;

export type Tier = 'essential' | 'signature' | 'immersive' | 'pitch';
export type Locale = 'en' | 'ar';

export interface BuildMetadataOptions {
  /** Without the brand suffix — the suffix is added and counted for you. */
  readonly title: string;
  readonly description: string;
  /** Root-relative, e.g. '/signature/menu'. */
  readonly path: string;
  readonly locale?: Locale;
  /** Set for Tier 2+ pages that exist in both languages. */
  readonly alternateLocales?: readonly Locale[];
  readonly ogImagePath?: string;
  readonly type?: 'website' | 'article';
  readonly publishedTime?: string;
  readonly modifiedTime?: string;
  readonly authors?: readonly string[];
  readonly noIndex?: boolean;
  readonly keywords?: readonly string[];
}

function warnIfTooLong(kind: string, value: string, limit: number, path: string): void {
  if (process.env.NODE_ENV === 'production') return;
  if (value.length > limit) {
    console.warn(`[seo] ${kind} for ${path} is ${value.length} chars (limit ${limit}): "${value}"`);
  }
}

/**
 * The full title as it appears in the tab and the SERP. Kept under the limit
 * by only appending the brand when there is room for it.
 */
export function composeTitle(title: string): string {
  const suffix = ` · ${brand.name}`;
  if (title.endsWith(brand.name)) return title;
  return title.length + suffix.length <= TITLE_LIMIT ? `${title}${suffix}` : title;
}

export function buildMetadata(options: BuildMetadataOptions): Metadata {
  const {
    title,
    description,
    path,
    locale = 'en',
    alternateLocales,
    ogImagePath,
    type = 'website',
    publishedTime,
    modifiedTime,
    authors,
    noIndex = false,
    keywords,
  } = options;

  const fullTitle = composeTitle(title);
  warnIfTooLong('title', fullTitle, TITLE_LIMIT, path);
  warnIfTooLong('description', description, DESCRIPTION_LIMIT, path);

  const canonical = `${siteUrl}${path}`;
  const ogImage = ogImagePath ?? `${path === '/' ? '' : path}/opengraph-image`;

  const languages: Record<string, string> = {};
  if (alternateLocales && alternateLocales.length > 0) {
    for (const alt of alternateLocales) {
      languages[alt === 'ar' ? 'ar-AE' : 'en-AE'] = `${siteUrl}${swapLocale(path, alt)}`;
    }
    languages['x-default'] = `${siteUrl}${swapLocale(path, 'en')}`;
  }

  return {
    title: fullTitle,
    description,
    ...(keywords && keywords.length > 0 ? { keywords: [...keywords] } : {}),
    alternates: {
      canonical,
      ...(Object.keys(languages).length > 0 ? { languages } : {}),
    },
    robots: noIndex
      ? { index: false, follow: false, nocache: true }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
          },
        },
    openGraph: {
      type,
      title: fullTitle,
      description,
      url: canonical,
      siteName: brand.name,
      locale: locale === 'ar' ? 'ar_AE' : 'en_AE',
      ...(alternateLocales?.includes(locale === 'ar' ? 'en' : 'ar')
        ? { alternateLocale: locale === 'ar' ? 'en_AE' : 'ar_AE' }
        : {}),
      images: [{ url: `${siteUrl}${ogImage}`, width: 1200, height: 630, alt: fullTitle }],
      ...(type === 'article'
        ? {
            publishedTime,
            modifiedTime,
            authors: authors ? [...authors] : undefined,
          }
        : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [`${siteUrl}${ogImage}`],
    },
    other: {
      'geo.region': 'AE-DU',
      'geo.placename': brand.address.district,
      'geo.position': `${brand.geo.latitude};${brand.geo.longitude}`,
      ICBM: `${brand.geo.latitude}, ${brand.geo.longitude}`,
    },
  };
}

/**
 * Rewrites the locale segment of a Tier 2+ path.
 * '/signature/en/menu' + 'ar' → '/signature/ar/menu'
 */
export function swapLocale(path: string, locale: Locale): string {
  return path.replace(/^(\/(?:signature|immersive))\/(en|ar)(\/|$)/, `$1/${locale}$3`);
}

/** The viewport theme colour, matched to each designed theme. */
export const themeColors = [
  { media: '(prefers-color-scheme: light)', color: brand.colors.light.bg },
  { media: '(prefers-color-scheme: dark)', color: brand.colors.dark.bg },
];
