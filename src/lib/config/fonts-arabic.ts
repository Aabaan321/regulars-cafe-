import { IBM_Plex_Sans_Arabic } from 'next/font/google';
import { latinFontVariables } from '@/lib/config/fonts';

/**
 * The Arabic face, in its own module.
 *
 * Imported only by the right-to-left root layout, so English routes never
 * declare it and next/font never preloads it there. A Naskh-rooted sans with
 * true Arabic proportions — never a Latin face with Arabic bolted on.
 *
 * Not a variable font, so each weight is a separate file: three is enough for
 * body, semibold and headings.
 */
export const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  display: 'swap',
  variable: '--font-plex-arabic',
  weight: ['400', '600', '700'],
  fallback: ['Tahoma', 'sans-serif'],
});

/** Latin plus Arabic, for the <html> class list on RTL routes. */
export const arabicFontVariables = `${latinFontVariables} ${plexArabic.variable}`;
