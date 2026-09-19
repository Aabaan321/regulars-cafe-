import type { Metadata } from 'next';
import { TierVisitPage } from '@/components/pages/tier-visit';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildMetadata({
  title: 'Visit Us — Alserkal Avenue, Al Quoz',
  description: 'Warehouse 14, Alserkal Avenue. Hours, parking, metro, WhatsApp and directions.',
  path: '/immersive/visit',
  locale: 'en',
  alternateLocales: ['en', 'ar'],
});

export const revalidate = 3600;

export default function Page() {
  return <TierVisitPage tier="immersive" locale="en" />;
}
