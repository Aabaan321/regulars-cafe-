import type { Metadata } from 'next';
import { TierJournalIndex } from '@/components/pages/tier-journal';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildMetadata({
  title: 'Journal — Coffee, Food & Al Quoz',
  description: 'Sourcing stories, an opinionated brunch guide, a barista profile and a neighbourhood guide to Al Quoz.',
  path: '/signature/journal',
  locale: 'en',
  alternateLocales: ['en', 'ar'],
});

export const revalidate = 3600;

export default function Page() {
  return <TierJournalIndex tier="signature" locale="en" />;
}
