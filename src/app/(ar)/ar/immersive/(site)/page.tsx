import type { Metadata } from 'next';
import { TierImmersiveHomePage } from '@/components/pages/tier-immersive-home';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildMetadata({
  title: 'قهوة مختصة وبرانش في القوز',
  description: 'تجربة تمرير غامرة: محمصة عاملة وغرفة برانش في جادة السركال.',
  path: '/ar/immersive',
  locale: 'ar',
  alternateLocales: ['en', 'ar'],
});

export const revalidate = 3600;

export default function Page() {
  return <TierImmersiveHomePage tier="immersive" locale="ar" />;
}
