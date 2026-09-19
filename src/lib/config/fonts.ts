import { Fraunces, Karla } from 'next/font/google';

/**
 * Fonts are self-hosted: next/font downloads the files at build time, emits
 * them from our own origin and inlines an optimised @font-face block, so there
 * is no connection to a third-party font CDN at runtime and no layout shift
 * from a late swap.
 *
 * The pairing is deliberate — see `brand.typography` for the intent behind it.
 */

/**
 * Display face. Loaded as a true variable font — weight is a continuous axis,
 * which the Tier 3 scroll narrative interpolates, and SOFT/WONK/opsz are what
 * stop it reading as a generic serif.
 */
export const fraunces = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-fraunces',
  weight: 'variable',
  // opsz only. SOFT and WONK are lovely and cost ~70KB between them, which is
  // most of a hero image — the optical-size axis is the one that actually
  // earns its bytes on a face set from 11px to 84px.
  axes: ['opsz'],
  fallback: ['Georgia', 'ui-serif', 'serif'],
  adjustFontFallback: true,
});

/**
 * UI and body face. Also variable, so the 560/650/750 weights the design
 * system asks for are real instances rather than a browser's fake bold.
 */
export const karla = Karla({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-karla',
  weight: 'variable',
  fallback: ['system-ui', 'Segoe UI', 'sans-serif'],
  adjustFontFallback: true,
});

/**
 * The Latin font variables, for the <html> class list.
 *
 * The Arabic face lives in `fonts-arabic.ts` and is imported only by the
 * right-to-left root layout. That split is load-bearing, not tidiness:
 * next/font preloads every font declared in a module that a route pulls in,
 * so simply *not applying* the Arabic class still shipped three extra font
 * files (~130KB) to every English page.
 */
export const latinFontVariables = `${fraunces.variable} ${karla.variable}`;
