import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Section } from '@/components/sections/section';
import { FaqAccordion } from '@/components/sections/faq-accordion';
import { OpenNow } from '@/components/ui/open-now';
import { JsonLd } from '@/components/seo/json-ld';
import { faqsFor } from '@/lib/content/faq';
import { requireImage } from '@/lib/content/images';
import { brand, directionsHref } from '@/lib/config/brand';
import { buildMetadata } from '@/lib/seo/metadata';
import { breadcrumbSchema, faqSchema } from '@/lib/seo/jsonld';
import { getOpenState } from '@/lib/utils/hours';

/**
 * The neighbourhood landing page.
 *
 * Targets "specialty coffee in Al Quoz / Alserkal Avenue" with content that is
 * actually about the neighbourhood — the galleries on the same street, where
 * to park on a Saturday, which metro station, what else to do afterwards. A
 * local page that just repeats the home page ranks for nothing; this one earns
 * the position by being the page a person genuinely wanted.
 */

export const metadata: Metadata = buildMetadata({
  title: 'Specialty Coffee in Al Quoz, Dubai',
  description:
    'Where to find good coffee in Al Quoz: parking on 17th Street, the nearest metro, what else is open on Alserkal Avenue, and what to order when you get here.',
  path: '/essential/specialty-coffee-al-quoz',
  keywords: [
    'specialty coffee Al Quoz',
    'coffee Alserkal Avenue',
    'best coffee Al Quoz Dubai',
    'cafes near Alserkal Avenue',
    'brunch Al Quoz',
  ],
});

export const revalidate = 86400;

const neighbours = [
  {
    name: 'Alserkal Avenue galleries',
    distance: 'Same courtyard',
    note: 'Twenty-odd contemporary galleries. Most open at 10am and close on Sundays — check before you plan a morning around them.',
  },
  {
    name: 'Concrete',
    distance: '90 seconds on foot',
    note: 'The OMA-designed exhibition hall at the centre of the Avenue. Whatever is on, it is worth putting your head in.',
  },
  {
    name: 'The Courtyard',
    distance: '6 minutes by car',
    note: 'The older arts complex on Street 4a. Quieter, a little scruffier, and good for a wander after brunch.',
  },
  {
    name: 'Al Quoz Pond Park',
    distance: '8 minutes by car',
    note: 'Where to walk it off. Best between November and March; in July, do not.',
  },
];

const parkingNotes = [
  {
    when: 'Weekday mornings',
    advice:
      'Street parking on 17th is free and usually half empty before 9am. After 10am try the visitor lot behind Warehouse 21.',
  },
  {
    when: 'Saturday 10am–2pm',
    advice:
      'The busiest window of the week. The visitor lot fills first; there is almost always space on Street 8, a three-minute walk.',
  },
  {
    when: 'Gallery opening nights',
    advice:
      'Thursday evenings during the season, the whole Avenue fills. Come by taxi or park on Al Manara Street and walk in.',
  },
];

export default function NeighbourhoodPage() {
  const open = getOpenState();
  const hero = requireImage('spaceDining');
  const secondary = requireImage('spaceMorning');
  const faqs = faqsFor('visit');

  return (
    <>
      <JsonLd
        id="ld-crumbs"
        data={breadcrumbSchema([
          { name: 'Home', path: '/essential' },
          { name: 'Visit Us', path: '/essential/visit' },
          { name: 'Specialty coffee in Al Quoz', path: '/essential/specialty-coffee-al-quoz' },
        ])}
      />
      <JsonLd
        id="ld-faq-local"
        data={faqSchema(faqs.map((f) => ({ question: f.question, answer: f.answer })))}
      />

      <div className="container-page pt-[calc(var(--header-h)+var(--space-xl))]">
        <p className="eyebrow mb-3">Al Quoz 1 · Dubai</p>
        <h1 className="display-1 max-w-[20ch]">Specialty coffee in Al Quoz</h1>
        <p className="lede measure mt-5">
          Al Quoz is an industrial district that turned into Dubai&rsquo;s arts quarter without
          bothering to change its address. Alserkal Avenue sits in the middle of it, and we roast in
          Warehouse 14 at the 17th Street end.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <OpenNow
            initial={{
              status: open.status,
              label: open.label,
              detail: open.detail,
              exceptionLabel: open.exceptionLabel,
            }}
          />
          <a href={directionsHref} target="_blank" rel="noopener noreferrer" className="btn btn-sm">
            {brand.address.unit} — directions
          </a>
        </div>

        <div className="relative mt-10 aspect-[16/9] overflow-hidden rounded-[var(--radius-xl)]">
          <Image
            src={hero.src}
            alt={hero.alt}
            fill
            priority
            sizes="(max-width: 76rem) 100vw, 76rem"
            placeholder="blur"
            blurDataURL={hero.blurDataURL}
            quality={70}
            className="object-cover"
          />
        </div>
      </div>

      <Section
        eyebrow="Getting here"
        heading="Parking, honestly"
        lede="Every café in Dubai says “parking available”. Here is what it is actually like, hour by hour."
      >
        <ul className="grid gap-4 md:grid-cols-3">
          {parkingNotes.map((note) => (
            <li key={note.when} className="card p-5">
              <h3 className="font-display text-ink text-lg font-semibold">{note.when}</h3>
              <p className="text-muted mt-2 text-xs leading-relaxed">{note.advice}</p>
            </li>
          ))}
        </ul>

        <div className="border-line mt-10 grid gap-8 border-t pt-10 md:grid-cols-2">
          <div>
            <h3 className="display-3">By metro and taxi</h3>
            <p className="prose-body measure mt-3">{brand.service.metro}</p>
            <p className="prose-body measure mt-3">
              Al Quoz is not walkable from a metro station in summer, and anyone who tells you
              otherwise has not tried it in June. Take the Red Line to Equiti and a taxi for the
              last two kilometres — it is about AED 12.
            </p>
          </div>
          <div>
            <h3 className="display-3">By car</h3>
            <p className="prose-body measure mt-3">
              Coming from Sheikh Zayed Road, exit at Umm Al Sheif and follow Al Manara Street south
              for 1.8km. Turn left onto 17th Street; the Avenue entrance is 200 metres on the right.
              From Al Khail Road, exit at Al Quoz and follow the signs for Alserkal Avenue.
            </p>
            <p className="prose-body measure mt-3">
              Set your map to{' '}
              <a
                href={directionsHref}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent font-semibold underline"
              >
                {brand.geo.latitude}, {brand.geo.longitude}
              </a>{' '}
              rather than the street name — Al Quoz addresses confuse every satnav ever made.
            </p>
          </div>
        </div>
      </Section>

      <Section
        tone="subtle"
        eyebrow="While you are here"
        heading="What else is on this street"
        lede="We are not the reason to come to Al Quoz. We are a good reason to stay longer."
      >
        <div className="grid items-start gap-[var(--space-xl)] lg:grid-cols-[1fr_1.1fr]">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-xl)]">
            <Image
              src={secondary.src}
              alt={secondary.alt}
              fill
              sizes="(max-width: 64rem) 100vw, 40vw"
              placeholder="blur"
              blurDataURL={secondary.blurDataURL}
              loading="lazy"
              quality={66}
              className="object-cover"
            />
          </div>

          <ul className="flex flex-col">
            {neighbours.map((place) => (
              <li key={place.name} className="border-line/70 border-b py-4 last:border-0">
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="font-display text-ink text-lg font-semibold">{place.name}</h3>
                  <span className="text-faint text-2xs shrink-0 font-bold">{place.distance}</span>
                </div>
                <p className="text-muted mt-1.5 text-xs leading-relaxed">{place.note}</p>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section
        eyebrow="What to order"
        heading="If it is your first time"
        lede="Three orders that tell you whether you like the place."
      >
        <div className="grid gap-5 md:grid-cols-3">
          {[
            {
              title: 'The flat white',
              body: 'The baseline. If a café cannot make this properly, nothing else on the menu matters.',
              href: '/essential/menu',
            },
            {
              title: 'The V60, black',
              body: 'Ask what is on the brew bar. It changes every fortnight and it is where the roasting shows.',
              href: '/essential/menu',
            },
            {
              title: 'The shakshuka',
              body: 'Forty minutes to build, eleven to cook, and the one plate we have never taken off.',
              href: '/essential/menu',
            },
          ].map((pick) => (
            <Link
              key={pick.title}
              href={pick.href}
              className="card hover:border-line-strong block p-5 no-underline"
            >
              <h3 className="font-display text-ink text-lg font-semibold">{pick.title}</h3>
              <p className="text-muted mt-2 text-xs leading-relaxed">{pick.body}</p>
            </Link>
          ))}
        </div>
      </Section>

      <Section tone="subtle" eyebrow="Local questions" heading="Before you drive over">
        <FaqAccordion faqs={faqs} />
        <div className="mt-8 flex flex-wrap gap-2">
          <Link href="/essential/visit" className="btn">
            Full visit details
          </Link>
          <Link href="/essential/menu" className="btn btn-secondary">
            See the menu
          </Link>
        </div>
      </Section>
    </>
  );
}
