import type { Metadata } from 'next';
import { TierStoryPage } from '@/components/pages/tier-story';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildMetadata({
  title: 'قصتنا — محمصة في القوز',
  description: 'لماذا افتتحنا في مستودع لم يرغب به أحد، والمزارع الأربع التي نشتري منها، وما يحدث كل ثلاثاء وجمعة.',
  path: '/ar/signature/story',
  locale: 'ar',
  alternateLocales: ['en', 'ar'],
});

export const revalidate = 3600;

export default function Page() {
  return <TierStoryPage tier="signature" locale="ar" />;
}
