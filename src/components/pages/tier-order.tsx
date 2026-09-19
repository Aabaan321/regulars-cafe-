import { Hero } from '@/components/sections/hero';
import { OrderBuilder, type OrderableItem } from '@/components/order/order-builder';
import { JsonLd } from '@/components/seo/json-ld';
import { menuCategories, itemsByCategory } from '@/lib/content/menu';
import { pickupSlots, LEAD_MINUTES } from '@/lib/orders/pickup';
import { breadcrumbSchema } from '@/lib/seo/jsonld';
import { featuresFor, tierHref, type TierId } from '@/lib/config/navigation';
import type { Locale } from '@/lib/i18n/dictionaries';

/**
 * Pickup ordering — the page where the site stops being a brochure.
 *
 * Tier 2 and above. Everything orderable is rendered as server HTML with its
 * real price, so the page is a readable menu before a single byte of the cart
 * runs; the client component adds the counters on top.
 *
 * Collection times are generated on the server from the café's trading hours,
 * which means the list is correct at request time and a closed café shows a
 * closed state rather than an empty dropdown.
 */
export function TierOrderPage({ tier, locale }: { tier: TierId; locale: Locale }) {
  const ar = locale === 'ar';
  const slots = pickupSlots(undefined, ar ? 'ar' : 'en');

  // Drinks and food that travel. A poached-egg plate does not survive fifteen
  // minutes in a box, and a café that sends one out anyway gets the review it
  // deserves, so the orderable list is narrower than the menu on purpose.
  const TAKEAWAY_CATEGORIES = new Set(['espresso', 'brew', 'not-coffee', 'bakery', 'retail']);

  const items: OrderableItem[] = menuCategories
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .filter((category) => TAKEAWAY_CATEGORIES.has(category.id))
    .flatMap((category) =>
      itemsByCategory(category.id)
        .filter((item) => item.available)
        .map((item) => ({
          id: item.id,
          name: ar ? item.nameAr : item.name,
          priceFils: item.priceFils,
          categoryId: category.id,
          categoryName: ar ? category.nameAr : category.name,
          available: item.available,
        })),
    );

  return (
    <>
      <JsonLd
        id="ld-crumbs"
        data={breadcrumbSchema([
          { name: 'Home', path: tierHref(tier, '', locale) },
          { name: 'Order', path: tierHref(tier, '/order', locale) },
        ])}
      />

      <Hero
        layout={featuresFor(tier).heroLayout}
        imageKey="pourOver"
        size="short"
        locale={locale}
        eyebrow={ar ? 'استلام من البار' : 'Collect from the bar'}
        heading={ar ? 'اطلب للاستلام' : 'Order for pickup'}
        lede={
          ar
            ? `اختر ما تريد ووقت الاستلام. أقرب وقت بعد ${LEAD_MINUTES} دقيقة — نحضّر كل شيء عند الطلب.`
            : `Choose what you want and when you want it. The earliest slot is ${LEAD_MINUTES} minutes out, because everything is made when you order it.`
        }
      />

      <div className="container-page py-[var(--section-y)]">
        <OrderBuilder
          items={items}
          slots={slots}
          locale={locale}
          sourceTier={tier}
          menuHref={tierHref(tier, '/menu', locale)}
        />
      </div>
    </>
  );
}
