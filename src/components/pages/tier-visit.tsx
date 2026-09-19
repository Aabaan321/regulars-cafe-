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
import { getDictionary, type Locale } from '@/lib/i18n/dictionaries';
import { breadcrumbSchema, faqSchema } from '@/lib/seo/jsonld';
import { getOpenState, upcomingExceptions, weeklyHoursRows } from '@/lib/utils/hours';
import { tierHref, type TierId } from '@/lib/config/navigation';

export function TierVisitPage({ tier, locale }: { tier: TierId; locale: Locale }) {
  const dict = getDictionary(locale);
  const ar = locale === 'ar';
  const open = getOpenState(undefined, locale);
  const rows = weeklyHoursRows(locale);
  const exceptions = upcomingExceptions();
  const mapPreview = requireImage('spaceSign');

  return (
    <>
      <JsonLd
        id="ld-crumbs"
        data={breadcrumbSchema([
          { name: 'Home', path: tierHref(tier, '', locale) },
          { name: 'Visit Us', path: tierHref(tier, '/visit', locale) },
        ])}
      />
      <JsonLd
        id="ld-faq"
        data={faqSchema(faqs.map((f) => ({ question: f.question, answer: f.answer })))}
      />

      <Hero
        imageKey="heroVisit"
        size="short"
        locale={locale}
        eyebrow={brand.address.district}
        heading={dict.nav.visit}
        lede={
          ar
            ? 'انعطف من شارع المنارة إلى شارع ١٧. نحن المستودع ذو الباب المتحرك المفتوح.'
            : 'Turn off Al Manara Street onto 17th. We are the warehouse with the roller door open.'
        }
        showOpenState
      />

      <div className="container-page pt-[var(--space-xl)] pb-[var(--section-y)]">
        <div className="grid gap-[var(--space-2xl)] lg:grid-cols-[1.15fr_1fr]">
          <div>
            <LazyMap dict={dict} previewSrc={mapPreview.src} previewBlur={mapPreview.blurDataURL} />
            <div className="mt-5 flex flex-wrap gap-2">
              <a href={directionsHref} target="_blank" rel="noopener noreferrer" className="btn">
                {dict.common.directions}
              </a>
              <a href={telHref} className="btn btn-secondary">
                {brand.contact.phoneDisplay}
              </a>
              <a
                href={whatsappHref()}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
              >
                {dict.common.whatsapp}
              </a>
              <CopyAddress dict={dict} />
            </div>

            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              <div>
                <h2 className="eyebrow mb-2">{ar ? 'المواقف' : 'Parking'}</h2>
                <p className="text-muted text-xs leading-relaxed">{brand.service.parking}</p>
              </div>
              <div>
                <h2 className="eyebrow mb-2">{ar ? 'بالمترو' : 'By metro'}</h2>
                <p className="text-muted text-xs leading-relaxed">{brand.service.metro}</p>
              </div>
              <div>
                <h2 className="eyebrow mb-2">{ar ? 'إمكانية الوصول' : 'Accessibility'}</h2>
                <p className="text-muted text-xs leading-relaxed">{brand.service.accessibility}</p>
              </div>
              <div>
                <h2 className="eyebrow mb-2">{ar ? 'العمل من هنا' : 'Working from here'}</h2>
                <p className="text-muted text-xs leading-relaxed">
                  {ar
                    ? 'إنترنت ألياف مجاني، مع منافذ كهرباء عند الطاولة الطويلة ومقعد النافذة.'
                    : 'Free fibre Wi-Fi, power at the long table and the window bench.'}
                </p>
              </div>
            </div>
          </div>

          <div>
            <div className="border-line bg-surface sticky top-[calc(var(--header-h)+1rem)] rounded-[var(--radius-lg)] border p-6">
              <h2 className="display-3 mb-1">{dict.footer.hours}</h2>
              <OpenNow
                initial={{
                  status: open.status,
                  label: open.label,
                  detail: open.detail,
                  exceptionLabel: open.exceptionLabel,
                }}
                locale={locale}
                className="mb-4"
              />
              <table className="w-full text-xs">
                <caption className="sr-only">{dict.footer.hours}</caption>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.label} className="border-line/60 border-b last:border-0">
                      <th scope="row" className="text-muted py-2 pe-3 text-start font-medium">
                        {ar ? row.labelAr : row.label}
                      </th>
                      <td className="text-ink py-2 text-end font-semibold tabular-nums">
                        {row.display}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {exceptions.length > 0 ? (
                <div className="border-line mt-6 border-t pt-5">
                  <h3 className="eyebrow mb-3">{ar ? 'مواعيد العطلات' : 'Holiday hours'}</h3>
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
                            ? dict.common.closed
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

      <Section
        id="contact"
        tone="subtle"
        eyebrow={ar ? 'تواصل معنا' : 'Say hello'}
        heading={ar ? 'أرسل لنا رسالة' : 'Send us a message'}
      >
        <div className="max-w-[46rem]">
          <ContactForm dict={dict} locale={locale} tier={tier} />
        </div>
      </Section>

      <Section
        id="faq"
        eyebrow={ar ? 'جيد أن تعرف' : 'Good to know'}
        heading={ar ? 'أسئلة متكررة' : 'Questions we get asked'}
      >
        <FaqAccordion faqs={faqs} locale={locale} />
      </Section>
    </>
  );
}
