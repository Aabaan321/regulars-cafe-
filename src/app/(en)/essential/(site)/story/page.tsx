import Image from 'next/image';
import type { Metadata } from 'next';
import { Hero } from '@/components/sections/hero';
import { Section } from '@/components/sections/section';
import { JsonLd } from '@/components/seo/json-ld';
import { founder, storyIntro, storySections, team } from '@/lib/content/story';
import { getImage, requireImage } from '@/lib/content/images';
import { buildMetadata } from '@/lib/seo/metadata';
import { breadcrumbSchema } from '@/lib/seo/jsonld';

export const metadata: Metadata = buildMetadata({
  title: 'Our Story — A Roastery in Al Quoz',
  description:
    'Why we opened in a warehouse nobody wanted, the four farms we buy from, and what happens on the Giesen every Tuesday and Friday.',
  path: '/essential/story',
  keywords: ['coffee roastery Dubai', 'Alserkal Avenue coffee', 'Dubai specialty coffee story'],
});

export const revalidate = 86400;

export default function StoryPage() {
  const founderImage = requireImage(founder.imageKey);

  return (
    <>
      <JsonLd
        id="ld-crumbs"
        data={breadcrumbSchema([
          { name: 'Home', path: '/essential' },
          { name: 'Our Story', path: '/essential/story' },
        ])}
      />

      <Hero
        imageKey="heroStory"
        size="short"
        eyebrow={`Since ${new Date().getFullYear() - 2}`}
        heading={storyIntro.heading}
        lede={storyIntro.lede}
      />

      {/* Founder quote, up front — it is the thesis of the page. */}
      <section className="section-y">
        <div className="container-page">
          <figure className="mx-auto max-w-[48rem] text-center">
            <blockquote className="font-display text-ink text-3xl leading-[1.15] text-balance">
              “{founder.quote}”
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
                <span className="text-ink block font-bold">{founder.name}</span>
                <span className="text-faint">{founder.role}</span>
              </span>
            </figcaption>
          </figure>
        </div>
      </section>

      {/* The narrative, alternating sides */}
      {storySections.map((section, index) => {
        const image = section.imageKey ? getImage(section.imageKey) : undefined;
        const reversed = index % 2 === 1;

        return (
          <section
            key={section.id}
            id={section.id}
            className={index % 2 === 1 ? 'section-y bg-bg-subtle' : 'section-y'}
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
                  <p className="eyebrow mb-3">{section.eyebrow}</p>
                  <h2 className="display-2">{section.heading}</h2>
                  <div className="mt-5 flex flex-col gap-4">
                    {section.body.map((paragraph) => (
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

      {/* Team */}
      <Section
        eyebrow="Who you will meet"
        heading="The people behind the bar"
        lede="Four of us most days, six at the weekend. All of them will tell you honestly what is good today."
      >
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {team.map((person) => (
            <li key={person.name} className="card p-5">
              <h3 className="font-display text-ink text-lg font-semibold">
                {person.name}
              </h3>
              <p className="text-accent mt-0.5 text-2xs font-bold tracking-wide uppercase">
                {person.role}
              </p>
              <p className="text-muted mt-3 text-xs leading-relaxed">{person.note}</p>
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}
