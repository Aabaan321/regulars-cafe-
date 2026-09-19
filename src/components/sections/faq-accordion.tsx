import type { Faq } from '@/lib/content/faq';
import type { Locale } from '@/lib/i18n/dictionaries';

/**
 * FAQ list.
 *
 * Native <details>/<summary>, so it opens without JavaScript, is keyboard
 * operable for free, and is searchable by the browser's find-in-page (Chrome
 * expands a closed details element to reveal a match). The matching FAQPage
 * JSON-LD is emitted by the page that renders this.
 */
export function FaqAccordion({
  faqs,
  locale = 'en',
  defaultOpenFirst = true,
}: {
  faqs: readonly Faq[];
  locale?: Locale;
  defaultOpenFirst?: boolean;
}) {
  return (
    <div className="border-line divide-line divide-y border-y">
      {faqs.map((faq, index) => (
        <details
          key={faq.question}
          name="faq"
          open={defaultOpenFirst && index === 0}
          className="group"
        >
          <summary className="hover:text-accent flex cursor-pointer list-none items-start justify-between gap-4 py-5 [&::-webkit-details-marker]:hidden">
            <h3 className="font-display text-lg leading-snug font-semibold">
              {locale === 'ar' ? faq.questionAr : faq.question}
            </h3>
            <span
              aria-hidden="true"
              className="text-faint mt-1 shrink-0 text-lg leading-none transition-transform duration-200 group-open:rotate-45"
            >
              +
            </span>
          </summary>
          <div className="pb-6">
            <p className="text-muted measure text-base leading-relaxed">
              {locale === 'ar' ? faq.answerAr : faq.answer}
            </p>
          </div>
        </details>
      ))}
    </div>
  );
}
