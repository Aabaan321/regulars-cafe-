import type { Metadata } from 'next';
import { TierBookPage } from '@/components/pages/tier-book';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildMetadata({
  title: 'احجز طاولة',
  description: 'توفّر مباشر من شخص إلى ثمانية، وتأكيد فوري، ورابط للتعديل أو الإلغاء.',
  path: '/ar/signature/book',
  locale: 'ar',
  alternateLocales: ['en', 'ar'],
});

export const revalidate = 0;

export default function Page() {
  return <TierBookPage tier="signature" locale="ar" />;
}
