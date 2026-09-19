import type { Metadata } from 'next';
import { TierOrderPage } from '@/components/pages/tier-order';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildMetadata({
  title: 'اطلب للاستلام',
  description:
    'اطلب القهوة والمخبوزات وأكياس التجزئة من ريقولارز في جادة السركال واستلمها من البار. نحضّرها عند الطلب، وتكون جاهزة خلال اثنتي عشرة دقيقة.',
  path: '/ar/immersive/order',
  locale: 'ar',
  alternateLocales: ['en', 'ar'],
});

export const dynamic = 'force-dynamic';

export default function Page() {
  return <TierOrderPage tier="immersive" locale="ar" />;
}
