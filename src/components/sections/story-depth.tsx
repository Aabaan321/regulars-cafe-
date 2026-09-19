import { Section } from '@/components/sections/section';
import type { Locale } from '@/lib/i18n/dictionaries';

/**
 * The build-out, dated, and the people who did it.
 *
 * Tier 2 and above. Tier 1's story page is the narrative — why the café
 * exists and what it believes — which is what a first-time visitor reads.
 * These two sections are what a *regular* reads: the receipts and the names.
 *
 * The timeline is deliberately specific and includes the parts that went
 * badly. "Nine tables, three of them wobbled" is the sort of detail nobody
 * invents for a brochure, and it is what makes the rest of the page credible.
 */

interface Milestone {
  readonly date: string;
  readonly dateAr: string;
  readonly title: string;
  readonly titleAr: string;
  readonly body: string;
  readonly bodyAr: string;
}

const milestones: readonly Milestone[] = [
  {
    date: 'March 2023',
    dateAr: 'مارس 2023',
    title: 'A warehouse nobody wanted',
    titleAr: 'مستودع لم يرغب به أحد',
    body: 'Signed on 340m² in Al Quoz 1 because the ceiling was 6.2m — high enough to vent a roaster, which almost nothing else in the budget was. The landlord thought we were opening a gym.',
    bodyAr:
      'وقّعنا على 340 متراً مربعاً في القوز 1 لأن السقف بارتفاع 6.2 أمتار — يكفي لتهوية محمصة، وهو ما لم يتوفر في أي خيار آخر ضمن الميزانية. ظنّ المالك أننا نفتح صالة رياضية.',
  },
  {
    date: 'August 2023',
    dateAr: 'أغسطس 2023',
    title: 'The roaster arrives four months late',
    titleAr: 'وصول المحمصة متأخرة أربعة أشهر',
    body: 'A 15kg Giesen, stuck in customs through the whole summer. We roasted on a 1kg sample machine in the meantime and sold what we made to two restaurants to keep the lights on.',
    bodyAr:
      'محمصة غيسن سعة 15 كجم، عالقة في الجمارك طوال الصيف. حمّصنا على جهاز عينات سعة كيلو واحد، وبعنا ما أنتجناه لمطعمين لنبقى صامدين.',
  },
  {
    date: 'November 2023',
    dateAr: 'نوفمبر 2023',
    title: 'Opened with nine tables',
    titleAr: 'افتتحنا بتسع طاولات',
    body: 'Three of them wobbled. We served 41 covers on day one, 19 of whom were people we knew. The first genuine stranger ordered a flat white and a date cardamom bun, and came back on the Thursday.',
    bodyAr:
      'ثلاث منها كانت تهتز. قدّمنا 41 طلباً في اليوم الأول، منهم 19 نعرفهم. أول غريب حقيقي طلب فلات وايت وكعكة تمر وهيل، وعاد يوم الخميس.',
  },
  {
    date: 'June 2024',
    dateAr: 'يونيو 2024',
    title: 'Started printing what we pay',
    titleAr: 'بدأنا بطباعة ما ندفعه',
    body: 'Put the FOB price on every retail bag. Two importers told us it was commercially stupid. Bag sales went up 60% in a quarter and three farms we had never met wrote to us.',
    bodyAr:
      'طبعنا سعر الشراء على كل كيس تجزئة. قال لنا مستوردان إن ذلك غباء تجاري. ارتفعت مبيعات الأكياس 60% خلال ربع سنة، وكتبت إلينا ثلاث مزارع لم نلتقِ بها قط.',
  },
  {
    date: 'February 2026',
    dateAr: 'فبراير 2026',
    title: 'Eighteen tables and a mezzanine',
    titleAr: 'ثماني عشرة طاولة وميزانين',
    body: 'Took the unit next door and built up rather than out, which kept the roaster where it was. The mezzanine seats fourteen and is the only quiet room in the building.',
    bodyAr:
      'استأجرنا الوحدة المجاورة وبنينا للأعلى لا للجوانب، فبقيت المحمصة مكانها. تتسع الميزانين لأربعة عشر شخصاً وهي الغرفة الهادئة الوحيدة في المبنى.',
  },
];

export function TimelineSection({ locale }: { locale: Locale }) {
  const ar = locale === 'ar';
  return (
    <Section
      id="timeline"
      tone="subtle"
      eyebrow={ar ? 'كيف وصلنا إلى هنا' : 'How we got here'}
      heading={ar ? 'خمس سنوات، بالتواريخ' : 'Five years, dated'}
      lede={
        ar
          ? 'بما في ذلك الأجزاء التي لم تسر على ما يرام.'
          : 'Including the parts that did not go well.'
      }
    >
      <ol className="border-line relative max-w-[46rem] border-s ps-[var(--space-l)]">
        {milestones.map((m) => (
          <li key={m.date} className="relative pb-[var(--space-xl)] last:pb-0">
            <span
              aria-hidden="true"
              className="bg-accent absolute -start-[calc(var(--space-l)+5px)] top-1.5 size-2.5 rounded-full ring-4 ring-[var(--c-bg-subtle)]"
            />
            <p className="text-accent text-2xs font-bold tracking-[0.14em] uppercase tabular-nums">
              {ar ? m.dateAr : m.date}
            </p>
            <h3 className="display-3 mt-1.5">{ar ? m.titleAr : m.title}</h3>
            <p className="text-muted mt-2.5 leading-[1.7]">{ar ? m.bodyAr : m.body}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
