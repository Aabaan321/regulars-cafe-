import type { ReactNode } from 'react';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { MobileActionBar } from '@/components/layout/mobile-action-bar';
import { TierSwitcher } from '@/components/layout/tier-switcher';
import { JsonLd } from '@/components/seo/json-ld';
import { cafeSchema, organizationSchema, websiteSchema } from '@/lib/seo/jsonld';
import { getDictionary } from '@/lib/i18n/dictionaries';

/**
 * Tier 1 chrome.
 *
 * The site-wide structured data (the café, the organisation, the website) is
 * emitted once here rather than per page, so every route inherits it and no
 * two pages can describe the business differently.
 */
export default function EssentialLayout({ children }: { children: ReactNode }) {
  const dict = getDictionary('en');

  return (
    <>
      <JsonLd
        id="ld-site"
        data={[
          cafeSchema({ tier: 'essential', acceptsReservations: false }),
          organizationSchema(),
          websiteSchema(),
        ]}
      />
      <SiteHeader tier="essential" locale="en" dict={dict} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter tier="essential" locale="en" dict={dict} />
      <MobileActionBar dict={dict} />
      <TierSwitcher current="essential" />
      {/* Clears the sticky mobile bar so it never covers the footer's last row. */}
      <div aria-hidden="true" className="h-14 sm:hidden" />
    </>
  );
}
