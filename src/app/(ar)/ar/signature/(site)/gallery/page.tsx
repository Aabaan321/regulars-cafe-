import type { Metadata } from 'next';
import { TierGalleryPage } from '@/components/pages/tier-gallery';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildMetadata({
  title: 'الصور — المكان والطعام',
  description: 'داخل المستودع ١٤: بار التقطير والطاولة الطويلة وخبز الصباح وأطباق المطبخ المفتوح.',
  path: '/ar/signature/gallery',
  locale: 'ar',
  alternateLocales: ['en', 'ar'],
});

export const revalidate = 3600;

export default function Page() {
  return <TierGalleryPage tier="signature" locale="ar" />;
}
