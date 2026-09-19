import type { Metadata } from 'next';
import { TierHomePage } from '@/components/pages/tier-home';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildMetadata({
  title: 'قهوة مختصة وبرانش في القوز',
  description: 'احجز طاولة، واطلب للاستلام، وتعرّف على ما يُقدَّم اليوم. محمصة عاملة وغرفة برانش في جادة السركال.',
  path: '/ar/signature',
  locale: 'ar',
  alternateLocales: ['en', 'ar'],
});

export const revalidate = 3600;

export default function Page() {
  return <TierHomePage tier="signature" locale="ar" />;
}
