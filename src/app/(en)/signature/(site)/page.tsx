import type { Metadata } from 'next';
import { TierHomePage } from '@/components/pages/tier-home';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildMetadata({
  title: 'Specialty Coffee & Brunch, Al Quoz',
  description: 'Book a table, order for pickup, and see what is on the brew bar. A working roastery and all-day brunch room in Alserkal Avenue.',
  path: '/signature',
  locale: 'en',
  alternateLocales: ['en', 'ar'],
});

export const revalidate = 3600;

export default function Page() {
  return <TierHomePage tier="signature" locale="en" />;
}
