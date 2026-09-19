import type { Metadata } from 'next';
import { TierMenuPage } from '@/components/pages/tier-menu';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildMetadata({
  title: 'القائمة — قهوة وبرانش ومخبوزات',
  description: 'قهوة مقطّرة أحادية المصدر وبار إسبريسو وبرانش طوال اليوم. الأسعار بالدرهم مع بيانات الحساسية.',
  path: '/ar/signature/menu',
  locale: 'ar',
  alternateLocales: ['en', 'ar'],
});

export const revalidate = 3600;

export default function Page() {
  return <TierMenuPage tier="signature" locale="ar" />;
}
