import type { Metadata } from 'next';
import { TierMenuPage } from '@/components/pages/tier-menu';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildMetadata({
  title: 'Menu — Coffee, Brunch & Bakery',
  description: 'Single-origin filter, an espresso bar, all-day brunch and a bakery that sells out by eleven. AED prices, dietary tags and allergens.',
  path: '/signature/menu',
  locale: 'en',
  alternateLocales: ['en', 'ar'],
});

export const revalidate = 3600;

export default function Page() {
  return <TierMenuPage tier="signature" locale="en" />;
}
