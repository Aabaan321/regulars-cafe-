import { brand } from '@/lib/config/brand';

/**
 * Menu formatting helpers, deliberately separated from the menu *data*.
 *
 * `menu.ts` holds 46 items with English and Arabic copy — about 37KB. The
 * client-side menu browser needs `formatPrice` and `dietaryLabels` but not a
 * single byte of that data, and importing them from `menu.ts` dragged the
 * whole catalogue into the browser bundle (module-level work in that file
 * also defeats tree-shaking).
 *
 * Rule of thumb for this codebase: data modules are server-only, formatting
 * modules are shared.
 */

export type DietaryTag =
  'vegan' | 'vegetarian' | 'gluten-free' | 'dairy-free' | 'contains-nuts' | 'spicy';

export type MenuBadge = 'new' | 'signature';

const enPrice = new Intl.NumberFormat('en-AE', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});
const arPrice = new Intl.NumberFormat('ar-AE', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** 2600 → "AED 26". 3450 → "AED 34.50". */
export function formatPrice(fils: number, locale: 'en' | 'ar' = 'en'): string {
  const amount = fils / 100;
  return locale === 'ar'
    ? `${arPrice.format(amount)} د.إ`
    : `${brand.currency} ${enPrice.format(amount)}`;
}

export const dietaryLabels: Record<DietaryTag, { en: string; ar: string; short: string }> = {
  vegan: { en: 'Vegan', ar: 'نباتي صرف', short: 'VG' },
  vegetarian: { en: 'Vegetarian', ar: 'نباتي', short: 'V' },
  'gluten-free': { en: 'Gluten free', ar: 'خالٍ من الغلوتين', short: 'GF' },
  'dairy-free': { en: 'Dairy free', ar: 'خالٍ من الألبان', short: 'DF' },
  'contains-nuts': { en: 'Contains nuts', ar: 'يحتوي مكسرات', short: 'N' },
  spicy: { en: 'Spicy', ar: 'حار', short: '🌶' },
};

export const badgeLabels: Record<MenuBadge, { en: string; ar: string }> = {
  new: { en: 'New', ar: 'جديد' },
  signature: { en: 'Signature', ar: 'مميّز' },
};

/** A photograph already resolved on the server, safe to send to the client. */
export interface ResolvedThumbnail {
  readonly src: string;
  readonly width: number;
  readonly height: number;
  readonly blurDataURL: string;
  readonly alt: string;
}
