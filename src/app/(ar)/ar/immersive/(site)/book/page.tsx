import type { Metadata } from 'next';
import { TierBookPage } from '@/components/pages/tier-book';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildMetadata({
  title: 'احجز طاولة',
  description: 'توفّر مباشر وتأكيد فوري ورابط للتعديل أو الإلغاء.',
  path: '/ar/immersive/book',
  locale: 'ar',
  alternateLocales: ['en', 'ar'],
});

export const revalidate = 0;

export default function Page() {
  return <TierBookPage tier="immersive" locale="ar" />;
}
