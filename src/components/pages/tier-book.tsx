import { BookingFlow } from '@/components/booking/booking-flow';
import { WaitlistForm } from '@/components/booking/waitlist-form';
import { Section } from '@/components/sections/section';
import { JsonLd } from '@/components/seo/json-ld';
import { faqsFor } from '@/lib/content/faq';
import { FaqAccordion } from '@/components/sections/faq-accordion';
import { breadcrumbSchema, faqSchema } from '@/lib/seo/jsonld';
import { brand } from '@/lib/config/brand';
import { bookableDates } from '@/lib/utils/booking-dates';
import { getDictionary, type Locale } from '@/lib/i18n/dictionaries';
import { tierHref, type TierId } from '@/lib/config/navigation';
import { isDatabaseConfigured } from '@/lib/db/client';
import { NoDatabasePanel } from '@/components/ui/no-database-panel';

/**
 * The booking page.
 *
 * Everything above the flow is server-rendered real HTML — the heading, the
 * policy copy, the FAQ — so the page reads completely with JavaScript off and
 * a crawler sees a page about booking a table rather than an empty div.
 */
export function TierBookPage({ tier, locale }: { tier: TierId; locale: Locale }) {
  const dict = getDictionary(locale);
  const dates = bookableDates(21, locale);
  const faqs = faqsFor('booking');
  const ar = locale === 'ar';

  return (
    <>
      <JsonLd
        id="ld-crumbs"
        data={breadcrumbSchema([
          { name: 'Home', path: tierHref(tier, '', locale) },
          { name: 'Book a table', path: tierHref(tier, '/book', locale) },
        ])}
      />
      <JsonLd
        id="ld-faq-booking"
        data={faqSchema(faqs.map((f) => ({ question: f.question, answer: f.answer })))}
      />

      <div className="container-page pt-[calc(var(--header-h)+var(--space-xl))] pb-[var(--space-xl)]">
        <p className="eyebrow mb-3">{ar ? 'الحجز' : 'Reservations'}</p>
        <h1 className="display-1 max-w-[16ch]">{dict.booking.title}</h1>
        <p className="lede measure mt-5">
          {ar
            ? 'نحتفظ بجزء من الطاولات للزوار دون حجز، لذا يمكنك دائماً المحاولة. لكن عطلة نهاية الأسبوع بين التاسعة والواحدة تُحجز قبل أيام.'
            : 'We keep part of the room for walk-ins, so you can always chance it. But weekends between 9am and 1pm book out days ahead.'}
        </p>
      </div>

      <div className="container-page pb-[var(--section-y)]">
        {isDatabaseConfigured() ? (
          <BookingFlow
            dict={dict}
            locale={locale}
            tier={tier}
            dates={dates}
            maxPartySize={brand.service.maxOnlinePartySize}
            privateHireHref={tierHref(tier, '/events#private-hire', locale)}
          />
        ) : (
          <NoDatabasePanel locale={locale} />
        )}
      </div>

      <Section
        id="waitlist"
        tone="subtle"
        eyebrow={ar ? 'إن كان اليوم ممتلئاً' : 'If the day you want is full'}
        heading={dict.booking.joinWaitlist}
        lede={
          ar
            ? 'تحدث معظم الإلغاءات في اليوم السابق. أخبرنا بالوقت الذي يناسبك وسنراسلك فور توفّر طاولة.'
            : 'Most cancellations land the day before. Tell us the window that works and we will email you the moment something frees up.'
        }
      >
        <div className="max-w-[40rem]">
          {isDatabaseConfigured() ? (
            <WaitlistForm
              dict={dict}
              locale={locale}
              maxPartySize={brand.service.maxOnlinePartySize}
            />
          ) : (
            <NoDatabasePanel locale={locale} />
          )}
        </div>
      </Section>

      <Section
        eyebrow={ar ? 'أسئلة شائعة' : 'Before you book'}
        heading={ar ? 'أسئلة متكررة' : 'Questions about booking'}
      >
        <FaqAccordion faqs={faqs} locale={locale} />
      </Section>
    </>
  );
}
