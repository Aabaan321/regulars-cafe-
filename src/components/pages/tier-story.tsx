import Image from 'next/image';
import { Hero } from '@/components/sections/hero';
import { Section } from '@/components/sections/section';
import { JsonLd } from '@/components/seo/json-ld';
import { founder, storyIntro, storySections, team } from '@/lib/content/story';
import { getImage, requireImage } from '@/lib/content/images';
import { breadcrumbSchema } from '@/lib/seo/jsonld';
import { featuresFor, tierHref, type TierId } from '@/lib/config/navigation';
import { TimelineSection } from '@/components/sections/story-depth';
import { BeanBand } from '@/components/sections/bean-band';
import type { Locale } from '@/lib/i18n/dictionaries';

export function TierStoryPage({ tier, locale }: { tier: TierId; locale: Locale }) {
  const ar = locale === 'ar';
  const features = featuresFor(tier);
  const founderImage = requireImage(founder.imageKey);

  return (
    <>
      <JsonLd
        id="ld-crumbs"
        data={breadcrumbSchema([
          { name: 'Home', path: tierHref(tier, '', locale) },
          { name: 'Our Story', path: tierHref(tier, '/story', locale) },
        ])}
      />

      <Hero
        layout={featuresFor(tier).heroLayout}
        imageKey="heroStory"
        size="short"
        locale={locale}
        eyebrow={ar ? `منذ ٢٠٢٤` : `Since ${founderYear()}`}
        heading={ar ? storyIntro.headingAr : storyIntro.heading}
        lede={ar ? storyIntro.ledeAr : storyIntro.lede}
      />

      <section className="section-y">
        <div className="container-page">
          <figure className="mx-auto max-w-[48rem] text-center">
            <blockquote className="font-display text-ink text-3xl leading-[1.15] text-balance">
              “{ar ? founder.quoteAr : founder.quote}”
            </blockquote>
            <figcaption className="mt-8 flex items-center justify-center gap-3">
              <Image
                src={founderImage.src}
                alt={founderImage.alt}
                width={56}
                height={56}
                sizes="56px"
                placeholder="blur"
                blurDataURL={founderImage.blurDataURL}
                className="size-14 rounded-full object-cover"
              />
              <span className="text-start text-xs">
                <span className="text-ink block font-bold">
                  {ar ? founder.nameAr : founder.name}
                </span>
                <span className="text-faint">{ar ? founder.roleAr : founder.role}</span>
              </span>
            </figcaption>
          </figure>
        </div>
      </section>

      {storySections.map((section, index) => {
        const image = section.imageKey ? getImage(section.imageKey) : undefined;
        const reversed = index % 2 === 1;
        const body = ar ? section.bodyAr : section.body;

        return (
          <section
            key={section.id}
            id={section.id}
            className={reversed ? 'section-y bg-bg-subtle' : 'section-y'}
          >
            <div className="container-page">
              <div className="grid items-center gap-[var(--space-xl)] lg:grid-cols-2">
                {image ? (
                  <div
                    className={[
                      'relative aspect-[4/3] overflow-hidden rounded-[var(--radius-xl)]',
                      reversed ? 'lg:order-2' : '',
                    ].join(' ')}
                  >
                    <Image
                      src={image.src}
                      alt={image.alt}
                      fill
                      sizes="(max-width: 64rem) 100vw, 45vw"
                      placeholder="blur"
                      blurDataURL={image.blurDataURL}
                      loading="lazy"
                      quality={68}
                      className="object-cover"
                    />
                  </div>
                ) : null}
                <div className={reversed ? 'lg:order-1' : ''}>
                  <p className="eyebrow mb-3">{ar ? section.eyebrowAr : section.eyebrow}</p>
                  <h2 className="display-2">{ar ? section.headingAr : section.heading}</h2>
                  <div className="mt-5 flex flex-col gap-4">
                    {body.map((paragraph) => (
                      <p key={paragraph.slice(0, 40)} className="prose-body measure">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        );
      })}

      {/* Tier 2 and above: real footage of beans falling, scrubbed by the
          band's own position on the page. Tier 1's story is words and
          photographs, which is the right amount of story for Tier 1. */}
      {features.storyBeanBand ? (
        <BeanBand
          locale={locale}
          heading={ar ? 'أربع مزارع، وطريق واحد' : 'Four farms, one road'}
          body={
            ar
              ? 'كل حبة في هذا الفنجان مرّت بيد مزارع نعرف اسمه، ومحمصة على بعد أمتار من البار. نطبع ما دفعناه على الكيس.'
              : 'Every bean in that cup passed through the hands of a farmer we can name, and a roaster eleven metres from the bar. We print what we paid on the bag.'
          }
        />
      ) : null}

      {features.storyTimeline ? <TimelineSection locale={locale} /> : null}

      {features.storyTeam ? (
        <Section
          eyebrow={ar ? 'من ستقابل' : 'Who you will meet'}
          heading={ar ? 'الفريق خلف البار' : 'The people behind the bar'}
        >
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {team.map((person) => (
              <li key={person.name} className="card p-5">
                <h3 className="font-display text-ink text-lg font-semibold">{person.name}</h3>
                <p className="text-accent text-2xs mt-0.5 font-bold tracking-wide uppercase">
                  {ar ? person.roleAr : person.role}
                </p>
                <p className="text-muted mt-3 text-xs leading-relaxed">
                  {ar ? person.noteAr : person.note}
                </p>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
    </>
  );
}

function founderYear(): number {
  return new Date().getFullYear() - 2;
}
