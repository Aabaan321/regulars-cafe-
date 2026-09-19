import type { ReactNode } from 'react';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { MobileActionBar } from '@/components/layout/mobile-action-bar';
import { TierSwitcher } from '@/components/layout/tier-switcher';
import { TierTheme } from '@/components/layout/tier-theme';
import { RevealController } from '@/components/layout/reveal-controller';
import { LanguageSwitcher } from '@/components/layout/language-switcher';
import { JsonLd } from '@/components/seo/json-ld';
import { cafeSchema, organizationSchema, websiteSchema } from '@/lib/seo/jsonld';
import { getDictionary, type Locale } from '@/lib/i18n/dictionaries';
import { featuresFor, tiers, type TierId } from '@/lib/config/navigation';

/**
 * The chrome every tier's public pages share.
 *
 * One component rather than one per tier: the tier only changes which nav
 * links appear, whether reservations are advertised in the structured data,
 * and whether a language switcher is shown.
 */
export function TierShell({
  tier,
  locale,
  children,
}: {
  tier: TierId;
  locale: Locale;
  children: ReactNode;
}) {
  const dict = getDictionary(locale);
  const bilingual = tiers[tier].bilingual;

  return (
    // `data-tier` is the whole tier design language in one attribute: the
    // token overrides in globals.css hang off it, so every heading, card,
    // rule and rhythm below changes without a single page component knowing
    // which tier it is being rendered for.
    <div data-tier={tier} className="contents">
      <TierTheme />
      <RevealController enabled={featuresFor(tier).scrollReveal} />
      <JsonLd
        id="ld-site"
        data={[
          cafeSchema({ tier, acceptsReservations: tier !== 'essential' }),
          organizationSchema(),
          websiteSchema(),
        ]}
      />
      <SiteHeader
        tier={tier}
        locale={locale}
        dict={dict}
        languageSwitcher={bilingual ? <LanguageSwitcher tier={tier} locale={locale} /> : undefined}
      />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter tier={tier} locale={locale} dict={dict} />
      <MobileActionBar dict={dict} />
      <TierSwitcher current={tier} />
      {/* Clears the sticky mobile bar so it never covers the footer. */}
      <div aria-hidden="true" className="h-14 sm:hidden" />
    </div>
  );
}
