import Link from 'next/link';
import { ImmersiveNarrative, ScrollReveal } from '@/components/immersive/narrative';
import { Section } from '@/components/sections/section';
import { MenuItemCard, type MenuItemView } from '@/components/menu/menu-item-card';
import { FaqAccordion } from '@/components/sections/faq-accordion';
import { JsonLd } from '@/components/seo/json-ld';
import { faqs } from '@/lib/content/faq';
import { founder } from '@/lib/content/story';
import { getImage, requireImage } from '@/lib/content/images';
import { menuItems } from '@/lib/content/menu';
import { brand } from '@/lib/config/brand';
import { getDictionary, type Locale } from '@/lib/i18n/dictionaries';
import { faqSchema } from '@/lib/seo/jsonld';
import { tierHref, type TierId } from '@/lib/config/navigation';
import type { ResolvedThumbnail } from '@/lib/content/menu-display';

/**
 * The Immersive home page.
 *
 * Read the JSX and notice what is NOT in the canvas: every heading, every
 * paragraph, the menu, the FAQ — all of it is ordinary server-rendered HTML,
 * in the document, in reading order. The WebGL layer is fixed behind it and
 * contains no text at all.
 *
 * That is the rule the brief sets and it is the right one: with JavaScript
 * off, or on a device that gets the 2D fallback, this page still reads
 * completely and still ranks. The 3D is decoration over a real page, never
 * the page itself.
 */
export function TierImmersiveHomePage({ tier, locale }: { tier: TierId; locale: Locale }) {
  const dict = getDictionary(locale);
  const ar = locale === 'ar';

  const signatures: MenuItemView[] = menuItems
    .filter((item) => item.badges.includes('signature'))
    .slice(0, 4)
    .map((item) => {
      const image = item.imageKey ? getImage(item.imageKey) : undefined;
      return {
        id: item.id,
        name: ar ? item.nameAr : item.name,
        description: ar ? item.descriptionAr : item.description,
        priceFils: item.priceFils,
        dietary: item.dietary,
        allergens: item.allergens,
        badges: item.badges,
        available: item.available,
        unavailableReason: item.unavailableReason ?? null,
        image: image
          ? {
              src: image.src,
              width: image.width,
              height: image.height,
              blurDataURL: image.blurDataURL,
              alt: image.alt,
            }
          : null,
      };
    });

  // The one photograph the narrative cross-fades to, for the chapter that is
  // about the room rather than the coffee. Resolved on the server.
  const room = requireImage('spaceCounter');
  const closingImage: ResolvedThumbnail = {
    src: room.src,
    width: room.width,
    height: room.height,
    blurDataURL: room.blurDataURL,
    alt: room.alt,
  };

  const chapters = [
    {
      eyebrow: ar ? 'الفصل الأول' : 'One',
      heading: ar ? 'فنجان، وضوء.' : 'A cup, and some light.',
      body: ar
        ? 'كل شيء هنا يبدأ بهذا: خزف دافئ، وضوء شمالي من أحد عشر متراً من الزجاج، وقهوة حُمّصت في الغرفة المجاورة قبل أيام لا شهور.'
        : 'Everything here starts with this: warm ceramic, north light through eleven metres of glass, and coffee roasted in the next room days ago rather than months.',
      start: 0.0,
      end: 0.2,
    },
    {
      eyebrow: ar ? 'الفصل الثاني' : 'Two',
      heading: ar ? 'السكب.' : 'The pour.',
      body: ar
        ? 'هذا سكبٌ حقيقي، صُوِّر مرة واحدة وقُطِّع إلى إطارات. مرّر الصفحة فينسكب، وارجع للأعلى فيرتدّ. الإيقاع لك — تماماً كما هو الحال عند البار، حيث لا شيء يُسكب قبل أن تكون جاهزاً.'
        : 'This is a real pour, filmed once and cut into frames. Scroll and it pours; scroll back and it un-pours. The pace is yours — which is also true at the bar, where nothing is poured until you are ready for it.',
      start: 0.2,
      end: 0.34,
    },
    {
      eyebrow: ar ? 'الفصل الثالث' : 'Three',
      heading: ar ? 'رحلة الحبة.' : 'The bean journey.',
      body: ar
        ? 'أربع مزارع. اثنتان في قوجي بإثيوبيا، وواحدة في كاوكا بكولومبيا، ودفعة موسمية من كارناتاكا. نذكر أسماءها جميعاً، ونطبع ما دفعناه على الكيس.'
        : 'Four farms. Two in Guji in Ethiopia, one in Cauca in Colombia, and a seasonal lot from Karnataka. We name all of them, and we print what we paid on the bag.',
      start: 0.34,
      end: 0.56,
    },
    {
      eyebrow: ar ? 'الفصل الرابع' : 'Four',
      heading: ar ? 'المكان.' : 'The space.',
      body: ar
        ? 'مستودع لم يرغب به أحد، بسقف مرتفع يكفي لتهوية محمصة وضوء يكفي لكل شيء آخر. تسع طاولات في البداية. الآن ثماني عشرة.'
        : 'A warehouse nobody wanted, with a ceiling high enough to vent a roaster and light enough for everything else. Nine tables at first. Eighteen now.',
      start: 0.56,
      end: 0.74,
    },
  ];

  return (
    <ImmersiveNarrative dir={ar ? 'rtl' : 'ltr'} closingImage={closingImage}>
      <JsonLd
        id="ld-faq-home"
        data={faqSchema(faqs.slice(0, 6).map((f) => ({ question: f.question, answer: f.answer })))}
      />

      {/* ── Opening ─────────────────────────────────────────────────────── */}
      <section className="relative flex min-h-[100svh] items-center">
        <div className="container-page">
          <div className="max-w-[40rem]">
            <p className="mb-4 text-xs font-bold tracking-[0.18em] text-[#EFE0CB] uppercase [text-shadow:0_1px_10px_rgba(0,0,0,0.7)]">
              {brand.address.district} · {brand.address.city}
            </p>
            <h1 className="display-1 text-[#FFFBF4] [text-shadow:0_2px_30px_rgba(0,0,0,0.55)]">
              {ar ? 'تعال مرتين. تصبح من الرواد.' : 'Come twice. You’re a regular.'}
            </h1>
            <p className="mt-6 max-w-[34rem] text-lg leading-[1.55] text-[#F1E7D9] [text-shadow:0_1px_18px_rgba(0,0,0,0.7)]">
              {ar ? 'محمصة عاملة وغرفة برانش طوال اليوم في جادة السركال.' : brand.positioning}
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href={tierHref(tier, '/book', locale)} className="btn btn-lg">
                {dict.common.bookTable}
              </Link>
              <Link
                href={tierHref(tier, '/menu', locale)}
                className="btn btn-lg border-white/45 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
              >
                {dict.common.viewMenu}
              </Link>
            </div>
          </div>
        </div>

        <p
          aria-hidden="true"
          data-motion-only
          className="text-2xs absolute inset-x-0 bottom-8 text-center font-bold tracking-[0.3em] text-white/50 uppercase"
        >
          {ar ? 'مرّر' : 'Scroll'}
        </p>
      </section>

      {/* ── Chapters. Real headings and paragraphs, in the document. ────── */}
      {chapters.map((chapter) => (
        <section
          key={chapter.heading}
          className="relative flex min-h-[100svh] items-center"
          aria-labelledby={`chapter-${chapter.start}`}
        >
          <div className="container-page">
            <ScrollReveal start={chapter.start} end={chapter.end} className="max-w-[34rem]">
              <p className="text-2xs mb-3 font-bold tracking-[0.22em] text-[#E3894A] uppercase">
                {chapter.eyebrow}
              </p>
              <h2
                id={`chapter-${chapter.start}`}
                className="display-2 text-[#FFFBF4] [text-shadow:0_2px_24px_rgba(0,0,0,0.6)]"
              >
                {chapter.heading}
              </h2>
              <p className="mt-5 text-base leading-[1.7] text-[#E8DCCC] [text-shadow:0_1px_14px_rgba(0,0,0,0.65)]">
                {chapter.body}
              </p>
            </ScrollReveal>
          </div>
        </section>
      ))}

      {/* ── Menu reveal ─────────────────────────────────────────────────── */}
      <section className="bg-bg relative">
        <Section
          eyebrow={ar ? 'ما نُعرف به' : 'What we are known for'}
          heading={ar ? 'أربعة أطباق' : 'Four plates'}
          action={
            <Link href={tierHref(tier, '/menu', locale)} className="btn btn-secondary">
              {dict.common.viewMenu}
            </Link>
          }
        >
          <ul className="flex flex-col">
            {signatures.map((item) => (
              <MenuItemCard key={item.id} item={item} locale={locale} showImage />
            ))}
          </ul>
        </Section>
      </section>

      {/* ── Closing ─────────────────────────────────────────────────────── */}
      <section className="bg-bg relative">
        <Section tone="subtle">
          <figure className="mx-auto max-w-[44rem] text-center">
            <blockquote className="font-display text-ink text-3xl leading-[1.15] text-balance">
              “{ar ? founder.quoteAr : founder.quote}”
            </blockquote>
            <figcaption className="text-faint mt-6 text-xs">
              {ar ? founder.nameAr : founder.name} · {ar ? founder.roleAr : founder.role}
            </figcaption>
          </figure>
        </Section>

        <Section
          eyebrow={ar ? 'قبل أن تأتي' : 'Before you come'}
          heading={ar ? 'أسئلة يسألها الناس' : 'Questions we get asked'}
        >
          <FaqAccordion faqs={faqs.slice(0, 6)} locale={locale} />
        </Section>
      </section>
    </ImmersiveNarrative>
  );
}
