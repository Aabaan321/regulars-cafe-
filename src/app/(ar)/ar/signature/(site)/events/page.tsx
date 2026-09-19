import type { Metadata } from 'next';
import { TierEventsPage } from '@/components/pages/tier-events';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildMetadata({
  title: 'الفعاليات والحجز الخاص',
  description: 'جلسات تذوّق وورش ونوادي عشاء، وحجز المستودع بالكامل في القوز، دبي.',
  path: '/ar/signature/events',
  locale: 'ar',
  alternateLocales: ['en', 'ar'],
});

export const revalidate = 600;

export default function Page() {
  return <TierEventsPage tier="signature" locale="ar" />;
}
