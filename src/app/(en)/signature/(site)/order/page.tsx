import type { Metadata } from 'next';
import { TierOrderPage } from '@/components/pages/tier-order';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildMetadata({
  title: 'Order for Pickup',
  description:
    'Order coffee, bakery and retail bags from Regulars in Alserkal Avenue and collect from the bar. Made when you order, ready in twelve minutes.',
  path: '/signature/order',
  locale: 'en',
  alternateLocales: ['en', 'ar'],
});

// Collection slots are derived from the clock, so this page is never static.
export const dynamic = 'force-dynamic';

export default function Page() {
  return <TierOrderPage tier="signature" locale="en" />;
}
