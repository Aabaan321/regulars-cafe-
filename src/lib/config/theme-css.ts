import { brand, type BrandColorScale } from '@/lib/config/brand';

/**
 * Renders `brand.colors` into the custom properties the stylesheet consumes.
 *
 * Doing this at request time (as a small inline <style> in <head>) rather than
 * hard-coding hex values in CSS is what keeps `brand.ts` the single rebrand
 * file. It costs ~900 bytes of inlined CSS and no extra request, and because
 * it is server-rendered into the head there is no flash of unstyled colour.
 */

const propertyNames: Record<keyof BrandColorScale, string> = {
  bg: '--c-bg',
  bgSubtle: '--c-bg-subtle',
  surface: '--c-surface',
  surfaceRaised: '--c-surface-raised',
  border: '--c-border',
  borderStrong: '--c-border-strong',
  text: '--c-text',
  textMuted: '--c-text-muted',
  textFaint: '--c-text-faint',
  accent: '--c-accent',
  accentHover: '--c-accent-hover',
  accentContrast: '--c-accent-contrast',
  secondary: '--c-secondary',
  secondaryContrast: '--c-secondary-contrast',
  highlight: '--c-highlight',
  highlightContrast: '--c-highlight-contrast',
  success: '--c-success',
  warning: '--c-warning',
  danger: '--c-danger',
  dangerContrast: '--c-danger-contrast',
};

function toDeclarations(scale: BrandColorScale): string {
  return (Object.keys(propertyNames) as (keyof BrandColorScale)[])
    .map((key) => `${propertyNames[key]}:${scale[key]}`)
    .join(';');
}

/** The full themed stylesheet, both colour schemes, as one string. */
export function themeCss(): string {
  const light = toDeclarations(brand.colors.light);
  const dark = toDeclarations(brand.colors.dark);

  return [
    `:root{${light}}`,
    // System preference, unless the visitor has explicitly chosen light.
    `@media (prefers-color-scheme:dark){:root:not([data-theme='light']){${dark}}}`,
    // Explicit choice always wins.
    `[data-theme='dark']{${dark}}`,
    `[data-theme='light']{${light}}`,
  ].join('');
}

/**
 * Runs before first paint. Reads the visitor's stored choice and sets
 * `data-theme` so the server-rendered markup never flashes the wrong theme.
 * Kept deliberately tiny and dependency-free — it is inlined into <head>.
 */
/**
 * Applies the theme before first paint.
 *
 * Precedence, and the order matters:
 *   1. An explicit choice from the toggle. A person who picked light gets
 *      light, everywhere, including Tier 3.
 *   2. Tier 3 defaults to dark. The Immersive tier is a cinema — it opens on
 *      a filmed pour over a near-black ground — and dropping into a cream
 *      menu page one click later breaks the whole illusion. This is the
 *      loudest single difference between the tiers and it costs one branch.
 *   3. Otherwise the operating system decides.
 *
 * Inline and synchronous on purpose: anything async here is a flash of the
 * wrong palette on every load.
 */
export const themeInitScript = `(function(){try{var s=localStorage.getItem('regulars-theme');var p=location.pathname;var tier3=p.indexOf('/immersive')===0||p.indexOf('/ar/immersive')===0;var m=window.matchMedia('(prefers-color-scheme: dark)').matches;var t=s==='light'||s==='dark'?s:(tier3?'dark':(m?'dark':'light'));document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`;
