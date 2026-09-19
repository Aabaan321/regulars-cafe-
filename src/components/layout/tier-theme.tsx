'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { readStorage } from '@/lib/hooks/use-client-value';

/**
 * Keeps the Tier 3 dark default correct across client-side navigation.
 *
 * The inline head script runs once per document load, so it gets the first
 * page right and nothing after it: clicking from the Signature menu into the
 * Immersive tier is a soft navigation, the script never re-runs, and Tier 3
 * would arrive in cream. This watches the path and re-applies.
 *
 * It never overrides an explicit choice — if someone has picked a theme from
 * the toggle, that is the answer on every tier.
 */
export function TierTheme() {
  const pathname = usePathname();

  useEffect(() => {
    const stored = readStorage('regulars-theme');
    if (stored === 'light' || stored === 'dark') return;

    const tier3 = pathname.startsWith('/immersive') || pathname.startsWith('/ar/immersive');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', tier3 || prefersDark ? 'dark' : 'light');
  }, [pathname]);

  return null;
}
