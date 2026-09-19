import type { Metadata } from 'next';
import { TierVisitPage } from '@/components/pages/tier-visit';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildMetadata({
  title: 'زورونا — جادة السركال، القوز',
  description: 'مستودع ١٤، جادة السركال. المواعيد والمواقف والمترو والاتجاهات.',
  path: '/ar/immersive/visit',
  locale: 'ar',
  alternateLocales: ['en', 'ar'],
});

export const revalidate = 3600;

export default function Page() {
  return <TierVisitPage tier="immersive" locale="ar" />;
}
