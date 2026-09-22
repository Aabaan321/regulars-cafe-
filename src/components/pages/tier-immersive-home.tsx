import Link from 'next/link';
import { ImmersiveNarrative } from '@/components/immersive/narrative';
import { Chapter, FarmTable, PourMeta, SpecList, StatGrid } from '@/components/immersive/chapters';
import { Section } from '@/components/sections/section';
import type { MenuItemView } from '@/components/menu/menu-item-card';
import { SignatureShowcase } from '@/components/immersive/signature-showcase';
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
      // Every plate in the showcase needs a photograph — a grid with one
      // empty cell looks broken rather than sparse. The date latte has no
      // shot of its own; `syrupPour` is literally the date syrup going in.
      const key = item.imageKey ?? (item.id === 'date-cardamom-latte' ? 'syrupPour' : undefined);
      const image = key ? getImage(key) : undefined;
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

  /*
   * The four chapters.
   *
   * Each carries an `aside` as well as prose, because a chapter that is one
   * paragraph centred in a full screen of photograph is a caption, not a
   * page. Every fact in the asides is already asserted on the story page or
   * in `lib/content/story.ts`; none of it is new, it was simply never used
   * here.
   */
  const chapters = [
    {
      index: '01',
      eyebrow: ar ? 'الوصول' : 'Arriving',
      heading: ar ? 'فنجان، وضوء.' : 'A cup, and some light.',
      body: ar
        ? 'كل شيء هنا يبدأ بهذا: خزف دافئ، وضوء شمالي من أحد عشر متراً من الزجاج، وقهوة حُمّصت في الغرفة المجاورة قبل أيام لا شهور.'
        : 'Everything here starts with this: warm ceramic, north light through eleven metres of glass, and coffee roasted in the next room days ago rather than months.',
      aside: (
        <SpecList
          rows={
            ar
              ? ([
                  ['الضوء', 'شمالي، حتى الثالثة عصراً'],
                  ['الزجاج', '١١ متراً'],
                  ['التحميص', 'في الغرفة المجاورة'],
                  ['الافتتاح', 'أكتوبر ٢٠٢٤'],
                ] as const)
              : ([
                  ['Light', 'North, until 3pm'],
                  ['Glass', 'Eleven metres'],
                  ['Roasted', 'In the next room'],
                  ['Opened', 'October 2024'],
                ] as const)
          }
        />
      ),
    },
    {
      index: '02',
      eyebrow: ar ? 'الحرفة' : 'The craft',
      heading: ar ? 'السكب.' : 'The pour.',
      body: ar
        ? 'هذا سكبٌ حقيقي، صُوِّر مرة واحدة وقُطِّع إلى إطارات. مرّر الصفحة فينسكب، وارجع للأعلى فيرتدّ. الإيقاع لك — تماماً كما هو الحال عند البار، حيث لا شيء يُسكب قبل أن تكون جاهزاً.'
        : 'This is a real pour, filmed once and cut into frames. Scroll and it pours; scroll back and it un-pours. The pace is yours — which is also true at the bar, where nothing is poured until you are ready for it.',
      aside: (
        <PourMeta
          labels={
            ar
              ? {
                  frame: 'الإطار',
                  source: 'لقطة واحدة · ٩٫٥ ثانية',
                  note: 'الرقم أعلاه هو الإطار المرسوم خلف هذا النص الآن. لا يتقدّم من تلقاء نفسه — أنت من يحرّكه.',
                }
              : {
                  frame: 'Frame',
                  source: 'One shot · 9.5 seconds',
                  note: 'That number is the frame being drawn behind this text right now. It does not advance on its own. You are moving it.',
                }
          }
        />
      ),
    },
    {
      index: '03',
      eyebrow: ar ? 'المصدر' : 'Sourcing',
      heading: ar ? 'رحلة الحبة.' : 'The bean journey.',
      body: ar
        ? 'أربع مزارع. اثنتان في قوجي بإثيوبيا، وواحدة في كاوكا بكولومبيا، ودفعة موسمية من كارناتاكا. نذكر أسماءها جميعاً، ونطبع ما دفعناه على الكيس.'
        : 'Four farms. Two in Guji in Ethiopia, one in Cauca in Colombia, and a seasonal lot from Karnataka. We name all of them, and we print what we paid on the bag.',
      aside: (
        <FarmTable
          columns={ar ? ['المنشأ', 'المنطقة', 'الوصول'] : ['Origin', 'Region', 'Lands']}
          rows={
            ar
              ? ([
                  ['إثيوبيا', 'قوجي — تعاونية', 'مارس'],
                  ['إثيوبيا', 'قوجي — دفعة ثانية', 'مارس'],
                  ['كولومبيا', 'كاوكا', 'يوليو'],
                  ['الهند', 'كارناتاكا — موسمية', 'مارس'],
                ] as const)
              : ([
                  ['Ethiopia', 'Guji — cooperative', 'March'],
                  ['Ethiopia', 'Guji — second lot', 'March'],
                  ['Colombia', 'Cauca', 'July'],
                  ['India', 'Karnataka — seasonal', 'March'],
                ] as const)
          }
        />
      ),
    },
    {
      index: '04',
      eyebrow: ar ? 'المكان' : 'The room',
      heading: ar ? 'المكان.' : 'The space.',
      body: ar
        ? 'مستودع لم يرغب به أحد، بسقف مرتفع يكفي لتهوية محمصة وضوء يكفي لكل شيء آخر. تسع طاولات في البداية. الآن ثماني عشرة.'
        : 'A warehouse nobody wanted, with a ceiling high enough to vent a roaster and light enough for everything else. Nine tables at first. Eighteen now.',
      aside: (
        <StatGrid
          stats={
            ar
              ? ([
                  { value: '١١', unit: 'م', label: 'زجاج مواجه للشمال' },
                  { value: '٩→١٨', label: 'طاولات، منذ الافتتاح' },
                  { value: '٥', unit: 'كجم', label: 'سعة المحمصة' },
                  { value: '٤٨', unit: '°م', label: 'في الخارج، أغسطس' },
                ] as const)
              : ([
                  { value: '11', unit: 'm', label: 'Of north-facing glass' },
                  { value: '9→18', label: 'Tables, since opening' },
                  { value: '5', unit: 'kg', label: 'Roaster capacity' },
                  { value: '48', unit: '°C', label: 'Outside, in August' },
                ] as const)
          }
        />
      ),
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
        <Chapter
          key={chapter.index}
          index={chapter.index}
          eyebrow={chapter.eyebrow}
          heading={chapter.heading}
          body={chapter.body}
          aside={chapter.aside}
          dir={ar ? 'rtl' : 'ltr'}
        />
      ))}

      {/* ── Menu reveal ─────────────────────────────────────────────────── */}
      <section className="bg-bg relative">
        <Section
          eyebrow={ar ? 'ما نُعرف به' : 'What we are known for'}
          heading={ar ? 'أربعة أطباق' : 'Four plates'}
        >
          <SignatureShowcase
            items={signatures}
            locale={locale}
            href={tierHref(tier, '/menu', locale)}
            viewAllLabel={ar ? 'القائمة كاملة' : 'The whole menu'}
          />
        </Section>
      </section>

      {/* ── Closing ─────────────────────────────────────────────────────── */}
      <section className="bg-bg relative">
        <Section>
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
