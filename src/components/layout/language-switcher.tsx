'use client';

import { usePathname } from 'next/navigation';
import { localeMeta, type Locale } from '@/lib/i18n/dictionaries';
import type { TierId } from '@/lib/config/navigation';

/**
 * English ⇄ العربية.
 *
 * A plain anchor, not a router push: the two languages live under separate
 * root layouts (so `<html lang>` and `dir` are genuinely correct), and moving
 * between root layouts is a document navigation by design.
 *
 * `hreflang` is set on each link, which is also the signal Google reads.
 */
export function LanguageSwitcher({ tier, locale }: { tier: TierId; locale: Locale }) {
  const pathname = usePathname();
  const other: Locale = locale === 'ar' ? 'en' : 'ar';

  // '/signature/menu' ⇄ '/ar/signature/menu'
  const target =
    locale === 'ar'
      ? pathname.replace(new RegExp(`^/ar/${tier}`), `/${tier}`)
      : pathname.replace(new RegExp(`^/${tier}`), `/ar/${tier}`);

  return (
    <a
      href={target}
      hrefLang={localeMeta[other].htmlLang}
      lang={localeMeta[other].htmlLang}
      dir={localeMeta[other].dir}
      className="border-line text-muted hover:text-ink hover:bg-bg-subtle inline-flex h-8 items-center rounded-[var(--radius-pill)] border px-3 text-2xs font-bold no-underline transition-colors"
    >
      {localeMeta[other].nativeLabel}
    </a>
  );
}
