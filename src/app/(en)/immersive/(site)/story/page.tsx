import type { Metadata } from 'next';
import { TierStoryPage } from '@/components/pages/tier-story';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildMetadata({
  title: 'Our Story — A Roastery in Al Quoz',
  description: 'Why we opened in a warehouse nobody wanted, and the four farms we buy from.',
  path: '/immersive/story',
  locale: 'en',
  alternateLocales: ['en', 'ar'],
});

export const revalidate = 3600;

export default function Page() {
  return <TierStoryPage tier="immersive" locale="en" />;
}
