import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/config/brand';
import { tierOrder, tiers } from '@/lib/config/navigation';
import { journalPosts } from '@/lib/content/journal';

/**
 * The sitemap, generated from the route model rather than hand-maintained.
 *
 * Priorities are relative and honest: the tier home pages and the menu are
 * what we want ranked, the pitch pages are for one audience of one, and the
 * Arabic routes are declared as alternates rather than as separate pages so
 * Google treats them as one document in two languages.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  const push = (
    path: string,
    priority: number,
    changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'],
    alternates?: { en: string; ar: string },
  ) => {
    entries.push({
      url: `${siteUrl}${path}`,
      lastModified: now,
      changeFrequency,
      priority,
      ...(alternates
        ? {
            alternates: {
              languages: {
                'en-AE': `${siteUrl}${alternates.en}`,
                'ar-AE': `${siteUrl}${alternates.ar}`,
                'x-default': `${siteUrl}${alternates.en}`,
              },
            },
          }
        : {}),
    });
  };

  // Pitch layer.
  push('/', 1.0, 'monthly');
  // /compare and /bespoke are planned pitch-layer pages and are not built.
  // Listed here they were two guaranteed 404s in the file we hand to search
  // engines. They go back in with the pages.

  // Tier 1.
  push('/essential', 0.9, 'weekly');
  push('/essential/menu', 0.9, 'weekly');
  push('/essential/story', 0.7, 'monthly');
  push('/essential/gallery', 0.6, 'monthly');
  push('/essential/visit', 0.8, 'weekly');
  push('/essential/specialty-coffee-al-quoz', 0.8, 'monthly');

  // Tiers 2 and 3, both languages.
  for (const tier of tierOrder) {
    if (tier === 'essential') continue;
    const bilingual = tiers[tier].bilingual;
    const pages: readonly [string, number, MetadataRoute.Sitemap[number]['changeFrequency']][] = [
      ['', 0.9, 'weekly'],
      ['/menu', 0.9, 'weekly'],
      ['/book', 0.9, 'weekly'],
      ['/order', 0.8, 'weekly'],
      ['/story', 0.6, 'monthly'],
      ['/gallery', 0.5, 'monthly'],
      ['/visit', 0.7, 'weekly'],
      ['/events', 0.7, 'weekly'],
      ['/journal', 0.7, 'weekly'],
      // No /loyalty or /gift-cards: both are sold in the tier matrix and
      // neither is built, and submitting a 404 to a search engine is worse
      // than not submitting it. Add them back with the pages.
    ];

    for (const [path, priority, freq] of pages) {
      const en = `/${tier}${path}`;
      const ar = `/ar/${tier}${path}`;
      push(en, priority, freq, bilingual ? { en, ar } : undefined);
      if (bilingual) push(ar, priority - 0.1, freq, { en, ar });
    }
  }

  // Journal posts (Tier 2+ only).
  for (const post of journalPosts) {
    push(`/signature/journal/${post.slug}`, 0.6, 'monthly');
    push(`/immersive/journal/${post.slug}`, 0.5, 'monthly');
  }

  return entries;
}
