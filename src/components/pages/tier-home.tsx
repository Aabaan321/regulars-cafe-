import Image from 'next/image';
import Link from 'next/link';
import { Hero } from '@/components/sections/hero';
import { Section } from '@/components/sections/section';
import { MenuItemCard, type MenuItemView } from '@/components/menu/menu-item-card';
import { InstagramGrid } from '@/components/sections/instagram-grid';
import { FaqAccordion } from '@/components/sections/faq-accordion';
import { OpenNow } from '@/components/ui/open-now';
import { JsonLd } from '@/components/seo/json-ld';
import { faqs } from '@/lib/content/faq';
import { founder, storyIntro } from '@/lib/content/story';
import { getImage, requireImage } from '@/lib/content/images';
import { menuItems } from '@/lib/content/menu';
import { brand, directionsHref } from '@/lib/config/brand';
import { getDictionary, type Locale } from '@/lib/i18n/dictionaries';
import { faqSchema } from '@/lib/seo/jsonld';
import { getOpenState, weeklyHoursRows } from '@/lib/utils/hours';
import { featuresFor, tierHref, type TierId } from '@/lib/config/navigation';

/**
 * The Tier 2+ home page.
 *
 * Same bones as Tier 1's, with the two things Tier 2 adds up front: a booking
 * CTA in the hero, and a strip for the things the site now does — reserve,
 * order, events, loyalty.
 */
export function TierHomePage({ tier, locale }: { tier: TierId; locale: Locale }) {
  const dict = getDictionary(locale);
  const open = getOpenState(undefined, locale);
  const rows = weeklyHoursRows(locale);
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

  const story = requireImage('spaceCounter');
  const founderImage = requireImage(founder.imageKey);

  const services = [
    {
      title: ar ? 'احجز طاولة' : 'Book a table',
      body: ar
        ? 'توفّر مباشر، تأكيد فوري، وتعديل أو إلغاء برابط واحد.'
        : 'Live availability, instant confirmation, and a link to change or cancel.',
      href: tierHref(tier, '/book', locale),
      cta: dict.common.bookTable,
    },
    {
      title: ar ? 'اطلب للاستلام' : 'Order for pickup',
      body: ar
        ? 'اختر وقت الاستلام، وادفع أونلاين، وخذ طلبك من الكاشير.'
        : 'Pick a collection time, pay online, walk past the queue.',
      href: tierHref(tier, '/order', locale),
      cta: dict.common.orderNow,
    },
    {
      title: ar ? 'الفعاليات' : 'Events & private hire',
      body: ar
        ? 'جلسات تذوّق وورش ونوادي عشاء، وحجز المكان بالكامل.'
        : 'Cuppings, workshops, supper clubs — and the whole warehouse when you need it.',
      href: tierHref(tier, '/events', locale),
      cta: dict.nav.events,
    },
    {
      title: ar ? 'بطاقة الأختام' : 'The stamp card',
      body: ar
        ? 'تسع قهوات والعاشرة علينا. بلا تطبيق وبلا بطاقة.'
        : 'Nine coffees, the tenth is ours. No app, no plastic card.',
      href: tierHref(tier, '/loyalty', locale),
      cta: dict.nav.loyalty,
    },
  ];

  return (
    <>
      <JsonLd
        id="ld-faq-home"
        data={faqSchema(faqs.slice(0, 6).map((f) => ({ question: f.question, answer: f.answer })))}
      />

      <Hero
        layout={featuresFor(tier).heroLayout}
        imageKey="heroHome"
        locale={locale}
        eyebrow={`${brand.address.district} · ${brand.address.city}`}
        heading={ar ? 'تعال مرتين. تصبح من الرواد.' : 'Come twice. You’re a regular.'}
        lede={ar ? brandPositioningAr : brand.positioning}
        showOpenState
        actions={[
          { label: dict.common.bookTable, href: tierHref(tier, '/book', locale) },
          {
            label: dict.common.viewMenu,
            href: tierHref(tier, '/menu', locale),
            variant: 'secondary',
          },
        ]}
      />

      {/* What the site does, now that it does things */}
      <Section
        tone="subtle"
        eyebrow={ar ? 'من هذا الموقع' : 'From this site'}
        heading={ar ? 'كل ما تحتاجه قبل أن تأتي' : 'Everything you need before you arrive'}
      >
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((service) => (
            <li key={service.title} className="card flex flex-col p-5">
              <h3 className="font-display text-ink text-lg font-semibold">{service.title}</h3>
              <p className="text-muted mt-2 flex-1 text-xs leading-relaxed">{service.body}</p>
              <Link href={service.href} className="btn btn-secondary btn-sm mt-4 self-start">
                {service.cta}
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      {/* Signature plates */}
      <Section
        eyebrow={ar ? 'ما نُعرف به' : 'What we are known for'}
        heading={ar ? 'أطباق تستحق الطريق إلى القوز' : 'Worth the drive to Al Quoz'}
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

      {/* Story teaser */}
      <Section tone="subtle">
        <div className="grid items-center gap-[var(--space-xl)] lg:grid-cols-2">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-xl)]">
            <Image
              src={story.src}
              alt={story.alt}
              fill
              sizes="(max-width: 64rem) 100vw, 45vw"
              placeholder="blur"
              blurDataURL={story.blurDataURL}
              quality={70}
              className="object-cover"
            />
          </div>
          <div>
            <p className="eyebrow mb-3">{dict.nav.story}</p>
            <h2 className="display-2">{ar ? storyIntro.headingAr : storyIntro.heading}</h2>
            <p className="lede measure mt-4">{ar ? storyIntro.ledeAr : storyIntro.lede}</p>

            <figure className="border-accent mt-8 border-s-[3px] ps-5">
              <blockquote className="font-display text-ink text-xl leading-[1.25]">
                “{ar ? founder.quoteAr : founder.quote}”
              </blockquote>
              <figcaption className="mt-4 flex items-center gap-3">
                <Image
                  src={founderImage.src}
                  alt={founderImage.alt}
                  width={48}
                  height={48}
                  sizes="48px"
                  placeholder="blur"
                  blurDataURL={founderImage.blurDataURL}
                  className="size-12 rounded-full object-cover"
                />
                <span className="text-xs">
                  <span className="text-ink block font-bold">
                    {ar ? founder.nameAr : founder.name}
                  </span>
                  <span className="text-faint">{ar ? founder.roleAr : founder.role}</span>
                </span>
              </figcaption>
            </figure>

            <Link href={tierHref(tier, '/story', locale)} className="btn btn-secondary mt-8">
              {ar ? 'اقرأ القصة كاملة' : 'Read the whole story'}
            </Link>
          </div>
        </div>
      </Section>

      {/* Hours */}
      <Section
        eyebrow={dict.nav.visit}
        heading={ar ? 'مستودع ١٤، جادة السركال' : 'Warehouse 14, Alserkal Avenue'}
      >
        <div className="grid gap-[var(--space-xl)] lg:grid-cols-2">
          <div className="border-line bg-surface rounded-[var(--radius-lg)] border p-5">
            <OpenNow
              initial={{
                status: open.status,
                label: open.label,
                detail: open.detail,
                exceptionLabel: open.exceptionLabel,
              }}
              locale={locale}
            />
            <table className="mt-4 w-full text-xs">
              <caption className="sr-only">{dict.footer.hours}</caption>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.label} className="border-line/60 border-b last:border-0">
                    <th scope="row" className="text-muted py-1.5 pe-3 text-start font-medium">
                      {ar ? row.labelAr : row.label}
                    </th>
                    <td className="text-ink py-1.5 text-end font-semibold tabular-nums">
                      {row.display}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col justify-center gap-4">
            <p className="prose-body measure">
              {ar ? brand.service.parking : brand.service.parking}
            </p>
            <div className="flex flex-wrap gap-2">
              <Link href={tierHref(tier, '/visit', locale)} className="btn">
                {dict.nav.visit}
              </Link>
              <a
                href={directionsHref}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
              >
                {dict.common.directions}
              </a>
            </div>
          </div>
        </div>
      </Section>

      <Section tone="subtle" wide>
        <InstagramGrid
          heading={ar ? 'على إنستغرام' : 'On Instagram'}
          cta={ar ? 'تابعنا' : 'Follow us'}
        />
      </Section>

      <Section
        eyebrow={ar ? 'قبل أن تأتي' : 'Before you come'}
        heading={ar ? 'أسئلة يسألها الناس' : 'Questions we get asked'}
      >
        <FaqAccordion faqs={faqs.slice(0, 6)} locale={locale} />
      </Section>
    </>
  );
}

const brandPositioningAr =
  'محمصة عاملة وغرفة برانش طوال اليوم في جادة السركال — قهوة أحادية المصدر تُحمّص في الموقع، ومطبخ يعامل الإفطار كما يعامل العشاء.';
