import type { Metadata } from 'next';
import { TierImmersiveHomePage } from '@/components/pages/tier-immersive-home';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildMetadata({
  title: 'Specialty Coffee & Brunch, Al Quoz',
  description: 'A scroll-driven story of a working roastery and all-day brunch room in Alserkal Avenue, Dubai.',
  path: '/immersive',
  locale: 'en',
  alternateLocales: ['en', 'ar'],
});

export const revalidate = 3600;

export default function Page() {
  return <TierImmersiveHomePage tier="immersive" locale="en" />;
}
