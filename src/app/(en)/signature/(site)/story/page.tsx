import type { Metadata } from 'next';
import { TierStoryPage } from '@/components/pages/tier-story';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildMetadata({
  title: 'Our Story — A Roastery in Al Quoz',
  description: 'Why we opened in a warehouse nobody wanted, the four farms we buy from, and what happens on the Giesen every Tuesday and Friday.',
  path: '/signature/story',
  locale: 'en',
  alternateLocales: ['en', 'ar'],
});

export const revalidate = 3600;

export default function Page() {
  return <TierStoryPage tier="signature" locale="en" />;
}
