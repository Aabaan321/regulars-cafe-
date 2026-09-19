import type { Metadata } from 'next';
import { TierEventsPage } from '@/components/pages/tier-events';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildMetadata({
  title: 'Events & Private Hire',
  description: 'Cuppings, workshops and supper clubs at Regulars — and the whole warehouse for private hire in Al Quoz, Dubai.',
  path: '/signature/events',
  locale: 'en',
  alternateLocales: ['en', 'ar'],
});

export const revalidate = 600;

export default function Page() {
  return <TierEventsPage tier="signature" locale="en" />;
}
