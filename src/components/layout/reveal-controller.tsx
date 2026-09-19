'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Sections that arrive rather than simply being there.
 *
 * Tier 2 and above. This is the cheapest thing on the site that reads as
 * *expensive*: the same content, entering. Tier 1 renders flat and static,
 * and the difference is obvious within one scroll — which is the whole point,
 * because a client comparing tiers is looking, not reading a feature list.
 *
 * One controller for the page rather than a wrapper component per section:
 * thirty sections would otherwise mean thirty React components, thirty
 * observers and thirty edits to the page files. This finds everything marked
 * `data-reveal` and drives the lot from a single IntersectionObserver.
 *
 * Three rules it must not break:
 *
 *  • Content is visible in the markup and hidden *by script*, only once we
 *    know the observer will run. With JavaScript off nothing is ever
 *    invisible — which matters because this runs over the whole page,
 *    including the text search engines read.
 *  • `prefers-reduced-motion` opts out completely. Not a faster fade: no
 *    fade, content simply present.
 *  • It is one-way. Re-hiding on scroll-up is what makes reveals feel like a
 *    gimmick instead of like the page settling.
 */
export function RevealController({ enabled }: { enabled: boolean }) {
  const pathname = usePathname();

  useEffect(() => {
    if (!enabled) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (nodes.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const node = entry.target as HTMLElement;
          node.style.opacity = '1';
          node.style.transform = 'none';
          observer.unobserve(node);
          window.setTimeout(() => {
            // A permanent `will-change` keeps a compositor layer alive for
            // every section on the page; drop it once the transition is done.
            node.style.willChange = '';
          }, 900);
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.06 },
    );

    for (const node of nodes) {
      // Anything already on screen at load stays put. Fading in the thing the
      // visitor is currently looking at is just a flicker.
      const box = node.getBoundingClientRect();
      if (box.top < window.innerHeight * 0.92) continue;

      node.style.opacity = '0';
      node.style.transform = 'translate3d(0, 20px, 0)';
      node.style.transition =
        'opacity 640ms var(--ease-out-soft), transform 640ms var(--ease-out-soft)';
      node.style.willChange = 'opacity, transform';
      observer.observe(node);
    }

    return () => observer.disconnect();
    // Re-scanned per route: a soft navigation swaps the DOM under us.
  }, [enabled, pathname]);

  return null;
}
