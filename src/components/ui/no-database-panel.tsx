import { brand, telHref, whatsappHref } from '@/lib/config/brand';
import type { Locale } from '@/lib/i18n/dictionaries';

/**
 * Shown where a feature needs the database and there is not one.
 *
 * A preview deployment without DATABASE_URL should say what is missing and
 * still give the visitor a way to reach the café, rather than throwing a 500
 * at them.
 */
export function NoDatabasePanel({ locale = 'en' }: { locale?: Locale }) {
  const ar = locale === 'ar';

  return (
    <div className="border-line bg-bg-subtle rounded-[var(--radius-lg)] border border-dashed p-8 text-center">
      <p className="font-display text-ink text-xl">
        {ar ? 'هذه النسخة التجريبية بلا قاعدة بيانات' : 'This preview has no database connected'}
      </p>
      <p className="text-muted mx-auto mt-2 max-w-[34rem] text-xs leading-relaxed">
        {ar
          ? 'لا يمكن حفظ الحجوزات هنا. اتصل بنا أو راسلنا على واتساب ونحجز لك الطاولة فوراً.'
          : 'Bookings cannot be saved on this deployment. Call or WhatsApp us and we will put the table in the book by hand.'}
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <a href={telHref} className="btn btn-sm">
          {brand.contact.phoneDisplay}
        </a>
        <a
          href={whatsappHref()}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary btn-sm"
        >
          WhatsApp
        </a>
      </div>
      <p className="text-faint mx-auto mt-5 max-w-[34rem] text-2xs leading-relaxed">
        {ar
          ? 'للمطوّر: اضبط DATABASE_URL ثم شغّل npm run db:migrate && npm run seed.'
          : 'For the developer: set DATABASE_URL, then run npm run db:migrate && npm run seed.'}
      </p>
    </div>
  );
}
