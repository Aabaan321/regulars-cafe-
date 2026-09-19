import Image from 'next/image';
import { Hero } from '@/components/sections/hero';
import { Section } from '@/components/sections/section';
import { EventEnquiryForm } from '@/components/forms/event-enquiry-form';
import { JsonLd } from '@/components/seo/json-ld';
import { NoDatabasePanel } from '@/components/ui/no-database-panel';
import { getPublishedEvents } from '@/lib/db/queries';
import { isDatabaseConfigured } from '@/lib/db/client';
import { formatPrice } from '@/lib/content/menu-display';
import { brand } from '@/lib/config/brand';
import { getDictionary, formatNumber, type Locale } from '@/lib/i18n/dictionaries';
import { breadcrumbSchema, eventSchema } from '@/lib/seo/jsonld';
import { featuresFor, tierHref, type TierId } from '@/lib/config/navigation';

/**
 * Events and private hire.
 *
 * Each published event emits its own `Event` structured data, which is what
 * puts a café's cupping into the Google events carousel — the single highest
 * leverage piece of schema a venue can ship, and the one almost nobody does.
 */
export async function TierEventsPage({ tier, locale }: { tier: TierId; locale: Locale }) {
  const dict = getDictionary(locale);
  const ar = locale === 'ar';
  const events = isDatabaseConfigured() ? await getPublishedEvents(locale) : [];

  const dateFormat = new Intl.DateTimeFormat(ar ? 'ar-AE' : 'en-AE', {
    timeZone: brand.timezone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <>
      <JsonLd
        id="ld-crumbs"
        data={breadcrumbSchema([
          { name: 'Home', path: tierHref(tier, '', locale) },
          { name: 'Events', path: tierHref(tier, '/events', locale) },
        ])}
      />
      {events.map((event) => (
        <JsonLd
          key={event.id}
          id={`ld-event-${event.slug}`}
          data={eventSchema({
            name: event.title,
            description: event.summary,
            path: tierHref(tier, `/events#${event.slug}`, locale),
            startsAt: event.startsAt,
            endsAt: event.endsAt,
            priceFils: event.priceFils,
            capacity: event.capacity,
            spotsTaken: event.spotsTaken,
            imagePath: event.image?.src,
          })}
        />
      ))}

      <Hero
        layout={featuresFor(tier).heroLayout}
        imageKey="spaceDining"
        size="short"
        locale={locale}
        eyebrow={ar ? 'الفعاليات والحجز الخاص' : 'Events & private hire'}
        heading={ar ? 'المكان بعد الإغلاق' : 'The room, after hours'}
        lede={
          ar
            ? 'جلسات تذوّق وورش ونوادي عشاء — وحجز المستودع بالكامل حين تحتاج إليه.'
            : 'Cuppings, workshops and supper clubs — and the whole warehouse when you need it.'
        }
      />

      <Section
        eyebrow={ar ? 'ما هو قادم' : 'What is coming up'}
        heading={ar ? 'الفعاليات القادمة' : 'Upcoming events'}
      >
        {!isDatabaseConfigured() ? (
          <NoDatabasePanel locale={locale} />
        ) : events.length === 0 ? (
          <div className="border-line bg-bg-subtle rounded-[var(--radius-lg)] border border-dashed p-10 text-center">
            <p className="font-display text-xl">
              {ar ? 'لا توجد فعاليات مجدولة حالياً' : 'Nothing in the diary just now'}
            </p>
            <p className="text-muted mx-auto mt-2 max-w-[32rem] text-xs leading-relaxed">
              {ar
                ? 'نعلن عن الجلسات قبل أسبوعين تقريباً، وعادةً عبر الرسالة الشهرية أولاً.'
                : 'We announce sittings about a fortnight ahead, and usually in the monthly letter first.'}
            </p>
          </div>
        ) : (
          <ul className="grid gap-6 lg:grid-cols-3">
            {events.map((event) => (
              <li key={event.id} id={event.slug} className="card flex flex-col overflow-hidden">
                {event.image ? (
                  <div className="relative aspect-[3/2]">
                    <Image
                      src={event.image.src}
                      alt={event.image.alt}
                      fill
                      sizes="(max-width: 64rem) 100vw, 30vw"
                      placeholder="blur"
                      blurDataURL={event.image.blurDataURL}
                      loading="lazy"
                      quality={66}
                      className="object-cover"
                    />
                  </div>
                ) : null}

                <div className="flex flex-1 flex-col p-5">
                  <p className="eyebrow mb-2">
                    {event.type.replace(/_/g, ' ')}
                    {event.host ? ` · ${event.host}` : ''}
                  </p>
                  <h3 className="font-display text-ink text-xl leading-tight font-semibold">
                    {event.title}
                  </h3>
                  <p className="text-accent mt-2 text-xs font-bold">
                    {dateFormat.format(new Date(event.startsAt))}
                  </p>
                  <p className="text-muted mt-3 flex-1 text-xs leading-relaxed">{event.summary}</p>

                  <div className="border-line mt-4 flex items-center justify-between border-t pt-4">
                    <span className="text-ink font-bold">
                      {event.priceFils === 0
                        ? ar
                          ? 'مجاناً'
                          : 'Free'
                        : formatPrice(event.priceFils, locale)}
                    </span>
                    {event.soldOut ? (
                      <span className="badge border-line text-faint border">
                        {dict.common.soldOut}
                      </span>
                    ) : (
                      <span className="badge badge-new">
                        {ar
                          ? `${formatNumber(event.spotsLeft, locale)} مقاعد متبقية`
                          : `${event.spotsLeft} left`}
                      </span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section
        id="private-hire"
        tone="subtle"
        eyebrow={ar ? 'الحجز الخاص' : 'Private hire'}
        heading={ar ? 'احجز المكان بالكامل' : 'Take the whole place'}
        lede={
          ar
            ? 'يتسع الفناء لـ ٤٠ واقفاً أو ٢٤ جالساً، ويستوعب المستودع بالكامل ٧٠ واقفاً. أخبرنا بالتاريخ والعدد ونعود إليك خلال يوم بأرقام حقيقية.'
            : 'The courtyard seats 40 standing or 24 seated; the whole warehouse takes 70 standing. Tell us the date and the headcount and we will come back within a day with real numbers.'
        }
      >
        <div className="grid gap-[var(--space-xl)] lg:grid-cols-[1fr_1.2fr]">
          <dl className="flex flex-col gap-4">
            {[
              {
                k: ar ? 'الفناء' : 'Courtyard',
                v: ar ? '٤٠ واقفاً · ٢٤ جالساً' : '40 standing · 24 seated',
              },
              {
                k: ar ? 'المستودع كاملاً' : 'Whole warehouse',
                v: ar ? '٧٠ واقفاً · ٤٤ جالساً' : '70 standing · 44 seated',
              },
              { k: ar ? 'الطاولة الطويلة' : 'The long table', v: ar ? '١٦ جالساً' : '16 seated' },
              { k: ar ? 'أقل مدة' : 'Minimum hire', v: ar ? 'ثلاث ساعات' : 'Three hours' },
            ].map((row) => (
              <div key={row.k} className="border-line/70 flex justify-between gap-4 border-b pb-3">
                <dt className="text-muted text-xs">{row.k}</dt>
                <dd className="text-ink text-xs font-bold">{row.v}</dd>
              </div>
            ))}
          </dl>

          <div>
            {isDatabaseConfigured() ? (
              <EventEnquiryForm dict={dict} locale={locale} />
            ) : (
              <NoDatabasePanel locale={locale} />
            )}
          </div>
        </div>
      </Section>
    </>
  );
}
