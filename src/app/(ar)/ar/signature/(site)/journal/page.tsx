import type { Metadata } from 'next';
import { TierJournalIndex } from '@/components/pages/tier-journal';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildMetadata({
  title: 'المدوّنة — قهوة وطعام والحي',
  description: 'نكتب عن القهوة والطعام وحي القوز حين يكون لدينا ما نقوله.',
  path: '/ar/signature/journal',
  locale: 'ar',
  alternateLocales: ['en', 'ar'],
});

export const revalidate = 3600;

export default function Page() {
  return <TierJournalIndex tier="signature" locale="ar" />;
}
