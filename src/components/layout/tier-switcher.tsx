'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { readStorage, useClientValue, writeStorage } from '@/lib/hooks/use-client-value';
import { tierOrder, tiers, type TierId } from '@/lib/config/navigation';

/**
 * The presenter's control.
 *
 * A collapsible pill, bottom-right, that jumps between the same page on
 * another tier — so the client can be shown the menu on Essential, then the
 * menu on Immersive, without scrolling back to a selector. It remembers
 * whether it was collapsed or hidden, because a presenter who hides it once
 * does not want it back on the next click.
 *
 * Hidden from print, and from the pitch pages, which have their own
 * navigation.
 */

const STORAGE_KEY = 'regulars-tier-switcher';
type PillState = 'expanded' | 'collapsed' | 'hidden';

function readStoredState(): PillState {
  const stored = readStorage(STORAGE_KEY);
  return stored === 'expanded' || stored === 'hidden' ? stored : 'collapsed';
}

/** '/essential/menu' → '/menu'; the Arabic routes carry an /ar prefix. */
function subPath(pathname: string): string {
  const match = pathname.match(/^\/(?:ar\/)?(?:essential|signature|immersive)(\/.*)?$/);
  return match?.[1] ?? '';
}

function isArabic(pathname: string): boolean {
  return pathname.startsWith('/ar/');
}

/** Pages that exist on one tier but not another fall back to the tier home. */
function targetFor(tier: TierId, pathname: string): string {
  const sub = subPath(pathname);
  const arabic = isArabic(pathname) && tiers[tier].bilingual;
  const base = arabic ? `/ar/${tier}` : `/${tier}`;

  const essentialOnly = ['/menu', '/story', '/gallery', '/visit', ''];
  if (tier === 'essential' && !essentialOnly.includes(sub)) return base;
  return `${base}${sub}`;
}

export function TierSwitcher({ current }: { current: TierId }) {
  const pathname = usePathname();
  // 'ssr' until the client snapshot arrives, so the pill is not rendered into
  // the server HTML at all — it is a presenter control, not page content, and
  // it should never appear in a crawl or a print.
  const stored = useClientValue(readStoredState, 'ssr');
  const [override, setOverride] = useState<PillState | null>(null);
  const state: PillState | 'ssr' = override ?? stored;

  function persist(next: PillState) {
    setOverride(next);
    writeStorage(STORAGE_KEY, next);
  }

  // Keyboard shortcut for the presenter: ⌥1 / ⌥2 / ⌥3.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (!event.altKey || event.metaKey || event.ctrlKey) return;
      const index = ['1', '2', '3'].indexOf(event.key);
      if (index === -1) return;
      const tier = tierOrder[index];
      if (!tier || tier === current) return;
      event.preventDefault();
      window.location.href = targetFor(tier, pathname);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [current, pathname]);

  if (state === 'ssr' || state === 'hidden') {
    return state === 'hidden' ? (
      <button
        type="button"
        onClick={() => persist('collapsed')}
        className="tier-switcher border-line bg-surface/80 text-faint hover:text-ink fixed end-3 bottom-3 z-40 grid size-8 place-items-center rounded-full border text-[11px] backdrop-blur-sm"
        title="Show tier switcher"
      >
        <span aria-hidden="true">⋯</span>
        <span className="sr-only">Show the tier switcher</span>
      </button>
    ) : null;
  }

  return (
    <div
      data-print="hide"
      className="tier-switcher fixed end-3 bottom-[4.5rem] z-40 sm:bottom-4"
      role="group"
      aria-label="Switch demo tier"
    >
      <div className="border-line bg-surface/92 flex items-center gap-1 rounded-[var(--radius-pill)] border p-1 shadow-[var(--elev-3)] backdrop-blur-md">
        {state === 'expanded' ? (
          <>
            {tierOrder.map((tier, i) => {
              const active = tier === current;
              return (
                <Link
                  key={tier}
                  href={targetFor(tier, pathname)}
                  aria-current={active ? 'true' : undefined}
                  title={`${tiers[tier].name} — ${tiers[tier].positioning} (⌥${i + 1})`}
                  className={[
                    'text-2xs rounded-[var(--radius-pill)] px-3 py-1.5 font-bold no-underline transition-colors',
                    active ? 'bg-ink text-bg' : 'text-muted hover:bg-bg-subtle hover:text-ink',
                  ].join(' ')}
                >
                  <span className="text-faint me-1 tabular-nums">{i + 1}</span>
                  {tiers[tier].name}
                </Link>
              );
            })}
            <span className="bg-line mx-0.5 h-5 w-px" aria-hidden="true" />
            <button
              type="button"
              onClick={() => persist('collapsed')}
              className="text-faint hover:text-ink grid size-7 place-items-center rounded-full text-[13px]"
              title="Collapse"
            >
              <span aria-hidden="true">›</span>
              <span className="sr-only">Collapse the tier switcher</span>
            </button>
            <button
              type="button"
              onClick={() => persist('hidden')}
              className="text-faint hover:text-ink grid size-7 place-items-center rounded-full text-[13px]"
              title="Hide"
            >
              <span aria-hidden="true">✕</span>
              <span className="sr-only">Hide the tier switcher</span>
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => persist('expanded')}
            className="text-muted hover:text-ink text-2xs flex items-center gap-2 rounded-[var(--radius-pill)] px-3 py-1.5 font-bold"
          >
            <span className="bg-accent inline-block size-1.5 rounded-full" aria-hidden="true" />
            Tier {tiers[current].ordinal} · {tiers[current].name}
            <span aria-hidden="true" className="text-faint">
              ⇄
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
