'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Logo } from '@/components/ui/logo';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { navFor, tierBase, type TierId } from '@/lib/config/navigation';
import type { Dictionary, Locale } from '@/lib/i18n/dictionaries';

/**
 * The site header.
 *
 * Sticky, compact, and the same component for every tier — the tier only
 * changes which links appear and where they point. The mobile panel is a
 * <dialog>-free disclosure so it works with JS but degrades to a plain list of
 * links that are already in the DOM when it does not.
 */
export function SiteHeader({
  tier,
  locale,
  dict,
  languageSwitcher,
}: {
  tier: TierId;
  locale: Locale;
  dict: Dictionary;
  languageSwitcher?: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const base = tierBase(tier, locale);
  const items = navFor(tier);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const cta = items.find((i) => i.cta);
  const links = items.filter((i) => !i.cta);

  function isActive(path: string): boolean {
    const href = `${base}${path}`;
    return path === '' ? pathname === href : pathname.startsWith(href);
  }

  return (
    <header
      className={[
        'sticky top-0 z-50 w-full border-b backdrop-blur-lg',
        'transition-[background-color,box-shadow,border-color] duration-200',
        // Always translucent rather than transparent-until-scrolled: the hero
        // photograph underneath can be light or dark, and a header that only
        // works over one of them is a header that breaks on the next page.
        scrolled
          ? 'border-line bg-bg/88 shadow-[var(--elev-1)]'
          : 'bg-bg/72 border-transparent',
      ].join(' ')}
      data-scrolled={scrolled}
    >
      <div className="container-wide flex h-[var(--header-h)] items-center gap-4">
        <Link
          href={base}
          className="rounded-sm text-lg no-underline"
          aria-label={`${dict.nav.home} — Regulars`}
        >
          <Logo />
        </Link>

        <nav aria-label={dict.nav.primaryLabel} className="ms-auto hidden lg:block">
          <ul className="flex items-center gap-1">
            {links.map((item) => (
              <li key={item.path}>
                <Link
                  href={`${base}${item.path}`}
                  aria-current={isActive(item.path) ? 'page' : undefined}
                  className={[
                    'rounded-[var(--radius-pill)] px-3 py-2 text-xs font-semibold no-underline transition-colors',
                    isActive(item.path)
                      ? 'text-ink bg-bg-subtle'
                      : 'text-muted hover:text-ink hover:bg-bg-subtle',
                  ].join(' ')}
                >
                  {dict.nav[item.key]}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ms-auto flex items-center gap-2 lg:ms-0">
          {languageSwitcher}
          <ThemeToggle dict={dict} className="hidden sm:inline-flex" />
          {cta ? (
            <Link href={`${base}${cta.path}`} className="btn btn-sm hidden sm:inline-flex">
              {dict.nav[cta.key]}
            </Link>
          ) : (
            <Link href={`${base}/visit`} className="btn btn-sm hidden sm:inline-flex">
              {dict.nav.visit}
            </Link>
          )}

          <button
            type="button"
            className="btn btn-ghost btn-sm border-line -me-2 border lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
          >
            <span aria-hidden="true" className="text-[15px] leading-none">
              {open ? '✕' : '☰'}
            </span>
            <span className="sr-only">{open ? dict.nav.closeMenu : dict.nav.openMenu}</span>
          </button>
        </div>
      </div>

      <div
        id="mobile-nav"
        hidden={!open}
        className="border-line bg-bg border-t lg:hidden"
      >
        <nav aria-label={`${dict.nav.primaryLabel} — mobile`} className="container-page py-3">
          <ul className="flex flex-col">
            {items.map((item) => (
              <li key={item.path}>
                <Link
                  href={`${base}${item.path}`}
                  aria-current={isActive(item.path) ? 'page' : undefined}
                  className="border-line/60 hover:text-accent flex items-center justify-between border-b py-3 text-base font-semibold no-underline last:border-0"
                >
                  {dict.nav[item.key]}
                  <span aria-hidden="true" className="text-faint rtl:rotate-180">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between pt-4 pb-2">
            <ThemeToggle dict={dict} />
          </div>
        </nav>
      </div>
    </header>
  );
}
