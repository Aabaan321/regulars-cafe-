import type { ReactNode } from 'react';
import type { Metadata, Viewport } from 'next';
import { themeCss, themeInitScript } from '@/lib/config/theme-css';
import { brand, siteUrl } from '@/lib/config/brand';
import { themeColors } from '@/lib/seo/metadata';
import { getDictionary, localeMeta, type Locale } from '@/lib/i18n/dictionaries';
import { SkipLink } from '@/components/layout/skip-link';
import '@/app/globals.css';

/**
 * The shared body of both root layouts.
 *
 * There are two root layouts — one per text direction — because `dir` and
 * `lang` belong on <html>, and Next only lets a *root* layout render <html>.
 * Route groups give us `(en)` and `(ar)` roots that share everything below
 * this line, so the duplication is two files of five lines rather than a
 * second copy of the site.
 */
export function RootShell({
  children,
  locale,
  fontClassName,
}: {
  children: ReactNode;
  locale: Locale;
  /** Passed in by each root layout — see `fonts.ts` for why. */
  fontClassName: string;
}) {
  const meta = localeMeta[locale];
  const dict = getDictionary(locale);

  return (
    <html lang={meta.htmlLang} dir={meta.dir} className={fontClassName} suppressHydrationWarning>
      {/* eslint-disable-next-line @next/next/no-head-element --
          `next/head` is the Pages Router API. In an App Router root layout
          <head> is the correct and only way to render into the document head. */}
      <head>
        {/* Colour tokens, generated from brand.ts. Inline so there is no
            second request and no flash of the wrong palette. */}
        <style dangerouslySetInnerHTML={{ __html: themeCss() }} />
        {/* Applies the stored theme before first paint. */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-dvh flex-col">
        <SkipLink label={dict.nav.skipToContent} />
        {children}
      </body>
    </html>
  );
}

export const rootViewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: themeColors,
};

export const rootMetadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${brand.name} — ${brand.descriptor}`,
    template: `%s`,
  },
  description: brand.positioning,
  applicationName: brand.name,
  authors: [{ name: brand.agency.name, url: brand.agency.url }],
  creator: brand.agency.name,
  publisher: brand.legalName,
  formatDetection: { telephone: true, address: true, email: true },
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/apple-icon.png' }],
  },
  manifest: '/site.webmanifest',
};
