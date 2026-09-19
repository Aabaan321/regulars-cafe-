import Link from 'next/link';
import { brand } from '@/lib/config/brand';
import { tierHref, type TierId } from '@/lib/config/navigation';
import type { Locale } from '@/lib/i18n/dictionaries';

/**
 * Pickup ordering, advertised at the top of the menu.
 *
 * Tier 2 and above. This is the line where the site stops being a brochure
 * and starts being a till: from here the menu is not something you read
 * before you come, it is something you order from on the way.
 *
 * It sits above the menu rather than below it because the decision to order
 * is made before the reading, not after — and because a café that takes
 * orders and hides that fact at the bottom of the page is paying for a
 * feature it is not using.
 */
export function PickupBanner({ tier, locale }: { tier: TierId; locale: Locale }) {
  const ar = locale === 'ar';

  return (
    <div className="border-line border-y bg-[var(--c-bg-subtle)]">
      <div className="container-page flex flex-wrap items-center gap-x-[var(--space-l)] gap-y-[var(--space-s)] py-[var(--space-m)]">
        <div className="min-w-[16rem] flex-1">
          <p className="eyebrow mb-1">{ar ? 'اطلب للاستلام' : 'Order for pickup'}</p>
          <p className="text-base font-semibold">
            {ar
              ? 'اطلب الآن واستلم من البار خلال 12–15 دقيقة.'
              : 'Order now, collect from the bar in 12–15 minutes.'}
          </p>
          <p className="text-muted mt-1 text-sm">
            {ar
              ? `الدفع ببطاقة أو Apple Pay. آخر طلب قبل الإغلاق بنصف ساعة.`
              : `Card or Apple Pay. Last orders half an hour before we close — ${brand.name} does not hold a queue past that.`}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href={tierHref(tier, '/order', locale)} className="btn">
            {ar ? 'ابدأ الطلب' : 'Start an order'}
          </Link>
          <a href={`tel:${brand.contact.phone.replace(/\s/g, '')}`} className="btn btn-secondary">
            {ar ? 'اطلب هاتفياً' : 'Order by phone'}
          </a>
        </div>
      </div>
    </div>
  );
}
