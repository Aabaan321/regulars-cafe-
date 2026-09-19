import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Hero } from '@/components/sections/hero';
import { Section } from '@/components/sections/section';
import { MenuItemCard } from '@/components/menu/menu-item-card';
import { InstagramGrid } from '@/components/sections/instagram-grid';
import { FaqAccordion } from '@/components/sections/faq-accordion';
import { OpenNow } from '@/components/ui/open-now';
import { JsonLd } from '@/components/seo/json-ld';
import { faqs } from '@/lib/content/faq';
import { founder, storyIntro } from '@/lib/content/story';
import { getImage, requireImage } from '@/lib/content/images';
import { menuItems } from '@/lib/content/menu';
import { brand, directionsHref } from '@/lib/config/brand';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { buildMetadata } from '@/lib/seo/metadata';
import { faqSchema } from '@/lib/seo/jsonld';
import { getOpenState, weeklyHoursRows } from '@/lib/utils/hours';

export const metadata: Metadata = buildMetadata({
  title: 'Specialty Coffee & Brunch, Al Quoz',
  description:
    'A working roastery and all-day brunch room in Alserkal Avenue. Coffee roasted on site, breakfast served until close, and a kitchen that treats it like dinner.',
  path: '/essential',
  keywords: [
    'specialty coffee Dubai',
    'Alserkal Avenue café',
    'all day brunch Al Quoz',
    'coffee roastery Dubai',
  ],
});

/** Revalidate hourly so the server-rendered open state is never far off. */
export const revalidate = 3600;

export default function EssentialHome() {
  const dict = getDictionary('en');
  const open = getOpenState();
  const rows = weeklyHoursRows('en');

  const signatures = menuItems
    .filter((item) => item.badges.includes('signature'))
    .slice(0, 5)
    .map(toMenuItemView);

  const story = requireImage('spaceCounter');
  const founderImage = requireImage(founder.imageKey);
  const visitImage = requireImage('heroVisit');

  return (
    <>
      <JsonLd
        id="ld-faq-home"
        data={faqSchema(faqs.slice(0, 6).map((f) => ({ question: f.question, answer: f.answer })))}
      />

      {/* Tier 1's hero is the panel composition: photograph framed, words on
          the page's own ground in ink. Not a lesser version of the overlay
          the paid tiers use — a different, quieter piece of art direction. */}
      <Hero
        layout="panel"
        imageKey="heroHome"
        eyebrow={`${brand.address.district} · ${brand.address.city}`}
        heading="Come twice. You’re a regular."
        lede={brand.positioning}
        showOpenState
        actions={[
          { label: dict.common.viewMenu, href: '/essential/menu' },
          {
            label: dict.common.directions,
            href: directionsHref,
            variant: 'secondary',
            external: true,
          },
        ]}
      />

      {/* Positioning strip — the three facts a first-time visitor needs. */}
      <section className="border-line bg-bg-subtle border-b">
        <div className="container-wide grid gap-6 py-8 sm:grid-cols-3">
          {[
            {
              title: 'Roasted here',
              body: 'On a 5kg Giesen at the back, every Tuesday and Friday. Bags stamped with the roast date.',
            },
            {
              title: 'Brunch until close',
              body: 'Everything on the breakfast menu, all day. The shakshuka at 6pm is a feature, not a mistake.',
            },
            {
              title: 'Free parking',
              body: 'On 17th Street and in the Alserkal visitor lot. Equiti Metro is a seven-minute taxi.',
            },
          ].map((fact) => (
            <div key={fact.title}>
              <h2 className="font-display text-ink mb-1.5 text-lg font-semibold">{fact.title}</h2>
              <p className="text-muted text-xs leading-relaxed">{fact.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Signature plates */}
      <Section
        eyebrow="What we are known for"
        heading="Five things worth the drive to Al Quoz"
        lede="The rest of the menu is on its own page. These are the ones people come back for."
        action={
          <Link href="/essential/menu" className="btn btn-secondary">
            {dict.common.viewMenu}
          </Link>
        }
      >
        <ul className="flex flex-col">
          {signatures.map((item) => (
            <MenuItemCard key={item.id} item={item} showImage />
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
            <p className="eyebrow mb-3">Our story</p>
            <h2 className="display-2">{storyIntro.heading}</h2>
            <p className="lede measure mt-4">{storyIntro.lede}</p>

            <figure className="border-accent mt-8 border-s-[3px] ps-5">
              <blockquote className="font-display text-ink text-xl leading-[1.25]">
                “{founder.quote}”
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
                  <span className="text-ink block font-bold">{founder.name}</span>
                  <span className="text-faint">{founder.role}</span>
                </span>
              </figcaption>
            </figure>

            <Link href="/essential/story" className="btn btn-secondary mt-8">
              Read the whole story
            </Link>
          </div>
        </div>
      </Section>

      {/* Visit */}
      <Section
        eyebrow="Visit us"
        heading="Warehouse 14, Alserkal Avenue"
        lede="Turn off Al Manara Street onto 17th. We are the one with the roller door open and the roaster running."
      >
        <div className="grid gap-[var(--space-xl)] lg:grid-cols-[1.1fr_1fr]">
          <div className="relative aspect-[16/10] overflow-hidden rounded-[var(--radius-xl)]">
            <Image
              src={visitImage.src}
              alt={visitImage.alt}
              fill
              sizes="(max-width: 64rem) 100vw, 55vw"
              placeholder="blur"
              blurDataURL={visitImage.blurDataURL}
              quality={70}
              className="object-cover"
            />
          </div>

          <div>
            <div className="border-line bg-surface rounded-[var(--radius-lg)] border p-5">
              <OpenNow
                initial={{
                  status: open.status,
                  label: open.label,
                  detail: open.detail,
                  exceptionLabel: open.exceptionLabel,
                }}
              />
              <table className="mt-4 w-full text-xs">
                <caption className="sr-only">Opening hours</caption>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.label} className="border-line/60 border-b last:border-0">
                      <th scope="row" className="text-muted py-1.5 pe-3 text-start font-medium">
                        {row.label}
                      </th>
                      <td className="text-ink py-1.5 text-end font-semibold tabular-nums">
                        {row.display}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/essential/visit" className="btn">
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

      {/* Instagram */}
      <Section tone="subtle" wide>
        <InstagramGrid heading="On Instagram" cta="Follow us" />
      </Section>

      {/* FAQ */}
      <Section
        eyebrow="Before you come"
        heading="Questions we get asked"
        lede="If it is not here, WhatsApp us — a person answers."
      >
        <FaqAccordion faqs={faqs.slice(0, 6)} />
        <Link href="/essential/visit#faq" className="btn btn-secondary mt-8">
          All the questions
        </Link>
      </Section>
    </>
  );
}

/** Builds the client-safe view model, resolving photography on the server. */
function toMenuItemView(item: (typeof menuItems)[number]) {
  const image = item.imageKey ? getImage(item.imageKey) : undefined;
  return {
    id: item.id,
    name: item.name,
    description: item.description,
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
}
