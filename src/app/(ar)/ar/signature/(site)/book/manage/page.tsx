import type { Metadata } from 'next';
import { ManageBooking } from '@/components/booking/manage-booking';
import { getBookingByToken } from '@/lib/actions/booking';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { buildMetadata } from '@/lib/seo/metadata';
import { tierHref } from '@/lib/config/navigation';
import { brand, telHref } from '@/lib/config/brand';

export const metadata: Metadata = buildMetadata({
  title: 'إدارة حجزك',
  description: 'Change or cancel your table at Regulars.',
  path: '/ar/signature/book/manage',
  locale: 'ar',
  noIndex: true,
});

export const dynamic = 'force-dynamic';

/**
 * Self-service manage-booking, reached from the emailed link.
 *
 * Deliberately noindex: the URL contains a capability token, and a search
 * engine should never hold one.
 */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const dict = getDictionary('ar');
  const booking = token ? await getBookingByToken(token) : null;
  const ar = true;

  return (
    <div className="container-page section-y">
      <div className="mx-auto max-w-[38rem]">
        <p className="eyebrow mb-3">{ar ? 'حجزك' : 'Your booking'}</p>
        <h1 className="display-2">{dict.booking.manageBooking}</h1>

        {booking && token ? (
          <div className="mt-8">
            <ManageBooking
              booking={booking}
              token={token}
              dict={dict}
              locale="ar"
              bookHref={tierHref('signature', '/book', 'ar')}
            />
          </div>
        ) : (
          <div className="border-line bg-bg-subtle mt-8 rounded-[var(--radius-lg)] border border-dashed p-8">
            <p className="font-display text-xl">
              {ar ? 'هذا الرابط لم يعد صالحاً' : 'That link is no longer valid'}
            </p>
            <p className="text-muted mt-2 text-xs leading-relaxed">
              {ar
                ? 'ربما أُلغي الحجز أو انتهت صلاحية الرابط. اتصل بنا ومعك الرقم المرجعي وسنجد الحجز فوراً.'
                : 'The booking may have been cancelled, or the link has expired. Call us with your reference and we will find it in seconds.'}
            </p>
            <a href={telHref} className="btn btn-sm mt-5">
              {brand.contact.phoneDisplay}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
