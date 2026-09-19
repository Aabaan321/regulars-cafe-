import type { Metadata } from 'next';
import { TierGalleryPage } from '@/components/pages/tier-gallery';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildMetadata({
  title: 'Gallery — The Room and The Food',
  description: 'Inside Warehouse 14: the brew bar, the long table and the open kitchen.',
  path: '/immersive/gallery',
  locale: 'en',
  alternateLocales: ['en', 'ar'],
});

export const revalidate = 3600;

export default function Page() {
  return <TierGalleryPage tier="immersive" locale="en" />;
}
