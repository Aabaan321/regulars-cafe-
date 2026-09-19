import type { Metadata } from 'next';
import { TierBookPage } from '@/components/pages/tier-book';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildMetadata({
  title: 'Book a Table',
  description: 'Live availability for one to eight guests, instant confirmation, and a link to change or cancel. Weekends book out days ahead.',
  path: '/signature/book',
  locale: 'en',
  alternateLocales: ['en', 'ar'],
});

export const revalidate = 0;

export default function Page() {
  return <TierBookPage tier="signature" locale="en" />;
}
