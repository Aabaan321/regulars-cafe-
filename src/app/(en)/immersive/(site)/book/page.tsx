import type { Metadata } from 'next';
import { TierBookPage } from '@/components/pages/tier-book';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildMetadata({
  title: 'Book a Table',
  description: 'Live availability, instant confirmation, and a link to change or cancel.',
  path: '/immersive/book',
  locale: 'en',
  alternateLocales: ['en', 'ar'],
});

export const revalidate = 0;

export default function Page() {
  return <TierBookPage tier="immersive" locale="en" />;
}
