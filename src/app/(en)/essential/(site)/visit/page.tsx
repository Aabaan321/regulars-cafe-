import type { Metadata } from 'next';
import { Hero } from '@/components/sections/hero';
import { Section } from '@/components/sections/section';
import { LazyMap } from '@/components/visit/lazy-map';
import { CopyAddress } from '@/components/visit/copy-address';
import { ContactForm } from '@/components/forms/contact-form';
import { FaqAccordion } from '@/components/sections/faq-accordion';
import { OpenNow } from '@/components/ui/open-now';
import { JsonLd } from '@/components/seo/json-ld';
import { faqs } from '@/lib/content/faq';
import { requireImage } from '@/lib/content/images';
import { brand, directionsHref, telHref, whatsappHref } from '@/lib/config/brand';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { buildMetadata } from '@/lib/seo/metadata';
import { breadcrumbSchema, faqSchema } from '@/lib/seo/jsonld';
import { getOpenState, upcomingExceptions, weeklyHoursRows } from '@/lib/utils/hours';

export const metadata: Metadata = buildMetadata({
  title: 'Visit Us — Alserkal Avenue, Al Quoz',
  description:
    'Warehouse 14, Alserkal Avenue, Al Quoz 1. Opening hours, free parking, metro access, WhatsApp and directions — plus how to reach a person.',
  path: '/essential/visit',
  keywords: ['Alserkal Avenue café', 'café Al Quoz Dubai', 'coffee near Equiti metro'],
});

export const revalidate = 3600;

export default function VisitPage() {
  const dict = getDictionary('en');
  const open = getOpenState();
  const rows = weeklyHoursRows('en');
  const exceptions = upcomingExceptions();
  const mapPreview = requireImage('spaceSign');

  return (
    <>
      <JsonLd
        id="ld-crumbs"
        data={breadcrumbSchema([
          { name: 'Home', path: '/essential' },
          { name: 'Visit Us', path: '/essential/visit' },
        ])}
      />
      <JsonLd
        id="ld-faq"
        data={faqSchema(faqs.map((f) => ({ question: f.question, answer: f.answer })))}
      />

      <Hero
        imageKey="heroVisit"
        size="short"
        eyebrow={brand.address.district}
        heading="Visit us"
        lede="Turn off Al Manara Street onto 17th. We are the warehouse with the roller door open."
        showOpenState
      />

      <div className="container-page pt-[var(--space-xl)] pb-[var(--section-y)]">
        <div className="grid gap-[var(--space-2xl)] lg:grid-cols-[1.15fr_1fr]">
          {/* Map + actions */}
          <div>
            <LazyMap dict={dict} previewSrc={mapPreview.src} previewBlur={mapPreview.blurDataURL} />

            <div className="mt-5 flex flex-wrap gap-2">
              <a href={directionsHref} target="_blank" rel="noopener noreferrer" className="btn">
                <span aria-hidden="true">➤</span>
                {dict.common.directions}
              </a>
              <a href={telHref} className="btn btn-secondary">
                <span aria-hidden="true">☎</span>
                {brand.contact.phoneDisplay}
              </a>
              <a
                href={whatsappHref(`Hi ${brand.name} — I have a question about`)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
              >
                <span aria-hidden="true">✆</span>
                {dict.common.whatsapp}
              </a>
              <CopyAddress dict={dict} />
            </div>

            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              <div>
                <h2 className="eyebrow mb-2">Parking</h2>
                <p className="text-muted text-xs leading-relaxed">{brand.service.parking}</p>
              </div>
              <div>
                <h2 className="eyebrow mb-2">By metro</h2>
                <p className="text-muted text-xs leading-relaxed">{brand.service.metro}</p>
              </div>
              <div>
                <h2 className="eyebrow mb-2">Accessibility</h2>
                <p className="text-muted text-xs leading-relaxed">{brand.service.accessibility}</p>
              </div>
              <div>
                <h2 className="eyebrow mb-2">Working from here</h2>
                <p className="text-muted text-xs leading-relaxed">
                  Free fibre Wi-Fi, power at the long table and the window bench. The long table is
                  shared from noon at weekends.
                </p>
              </div>
            </div>
          </div>

          {/* Hours */}
          <div>
            <div className="border-line bg-surface sticky top-[calc(var(--header-h)+1rem)] rounded-[var(--radius-lg)] border p-6">
              <h2 className="display-3 mb-1">Hours</h2>
              <OpenNow
                initial={{
                  status: open.status,
                  label: open.label,
                  detail: open.detail,
                  exceptionLabel: open.exceptionLabel,
                }}
                className="mb-4"
              />

              <table className="w-full text-xs">
                <caption className="sr-only">Weekly opening hours</caption>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.label} className="border-line/60 border-b last:border-0">
                      <th scope="row" className="text-muted py-2 pe-3 text-start font-medium">
                        {row.label}
                      </th>
                      <td className="text-ink py-2 text-end font-semibold tabular-nums">
                        {row.display}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <p className="text-faint text-2xs mt-3">
                The kitchen closes 45 minutes before the café.
              </p>

              {exceptions.length > 0 ? (
                <div className="border-line mt-6 border-t pt-5">
                  <h3 className="eyebrow mb-3">Holiday hours</h3>
                  <ul className="flex flex-col gap-2">
                    {exceptions.map((exception) => (
                      <li
                        key={exception.date}
                        className="flex items-baseline justify-between gap-3 text-xs"
                      >
                        <span className="text-muted">
                          <span className="text-ink block font-semibold">{exception.label}</span>
                          <span className="text-faint text-2xs tabular-nums">{exception.date}</span>
                        </span>
                        <span className="text-ink shrink-0 font-semibold tabular-nums">
                          {exception.windows.length === 0
                            ? 'Closed'
                            : exception.windows.map((w) => `${w.open}–${w.close}`).join(', ')}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Contact */}
      <Section
        id="contact"
        tone="subtle"
        eyebrow="Say hello"
        heading="Send us a message"
        lede="For a table today, phone or WhatsApp is faster. For anything else, this reaches us directly."
      >
        <div className="max-w-[46rem]">
          <ContactForm dict={dict} locale="en" tier="essential" />
        </div>
      </Section>

      {/* FAQ */}
      <Section id="faq" eyebrow="Good to know" heading="Questions we get asked">
        <FaqAccordion faqs={faqs} />
      </Section>
    </>
  );
}
