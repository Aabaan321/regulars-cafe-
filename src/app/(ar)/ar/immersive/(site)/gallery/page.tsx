import type { Metadata } from 'next';
import { TierGalleryPage } from '@/components/pages/tier-gallery';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildMetadata({
  title: 'الصور — المكان والطعام',
  description: 'داخل المستودع ١٤: بار التقطير والطاولة الطويلة والمطبخ المفتوح.',
  path: '/ar/immersive/gallery',
  locale: 'ar',
  alternateLocales: ['en', 'ar'],
});

export const revalidate = 3600;

export default function Page() {
  return <TierGalleryPage tier="immersive" locale="ar" />;
}
