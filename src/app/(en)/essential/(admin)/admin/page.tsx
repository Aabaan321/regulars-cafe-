import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AdminShell, EmptyState, StatTile } from '@/components/admin/admin-shell';
import { asAdmin } from '@/lib/db/client';
import { getCurrentAdmin } from '@/lib/auth/session';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildMetadata({
  title: 'Enquiries & subscribers',
  description: 'Staff area.',
  path: '/essential/admin',
  noIndex: true,
});

export const dynamic = 'force-dynamic';

interface EnquiryRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  topic: string;
  message: string;
  status: string;
  created_at: Date;
}

interface SubscriberRow {
  id: string;
  email: string;
  name: string | null;
  status: string;
  source: string;
  created_at: Date;
  confirmed_at: Date | null;
}

const dateFormat = new Intl.DateTimeFormat('en-AE', {
  timeZone: 'Asia/Dubai',
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

export default async function EssentialAdminPage() {
  const identity = await getCurrentAdmin();
  if (!identity) redirect('/essential/admin/login');

  // Every query runs as `authenticated` with this admin's claims, so the RLS
  // policies decide what comes back — the page does not get to assume.
  const { enquiries, subscribers } = await asAdmin(identity, async (tx) => {
    const [enquiryRows, subscriberRows] = await Promise.all([
      tx<EnquiryRow[]>`
        select id, name, email::text, phone, topic::text as topic, message,
               status::text as status, created_at
          from enquiries
         order by created_at desc
         limit 100
      `,
      tx<SubscriberRow[]>`
        select id, email::text, name, status::text as status, source, created_at, confirmed_at
          from subscribers
         order by created_at desc
         limit 200
      `,
    ]);
    return { enquiries: enquiryRows, subscribers: subscriberRows };
  });

  const newEnquiries = enquiries.filter((e) => e.status === 'new').length;
  const confirmed = subscribers.filter((s) => s.status === 'confirmed').length;
  const pending = subscribers.filter((s) => s.status === 'pending').length;

  return (
    <AdminShell
      identity={identity}
      current="/essential/admin"
      loginPath="/essential/admin/login"
      publicHref="/essential"
      nav={[{ href: '/essential/admin', label: 'Enquiries & subscribers', badge: newEnquiries }]}
      title="Enquiries & subscribers"
      subtitle="Everything the Essential site collects. Export either list as CSV for your mail tool."
      actions={
        <>
          <a href="/api/admin/export?type=enquiries" className="btn btn-secondary btn-sm" download>
            Export enquiries
          </a>
          <a href="/api/admin/export?type=subscribers" className="btn btn-secondary btn-sm" download>
            Export subscribers
          </a>
        </>
      }
    >
      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="New enquiries" value={newEnquiries} tone={newEnquiries > 0 ? 'accent' : 'default'} hint="Unread" />
        <StatTile label="All enquiries" value={enquiries.length} hint="Last 100" />
        <StatTile label="Subscribers" value={confirmed} hint="Confirmed, double opt-in" />
        <StatTile label="Awaiting confirmation" value={pending} hint="Sent, not yet clicked" />
      </div>

      <section aria-labelledby="enquiries-heading" className="mb-12">
        <h2 id="enquiries-heading" className="display-3 mb-4">
          Enquiries
        </h2>

        {enquiries.length === 0 ? (
          <EmptyState
            title="No enquiries yet"
            body="When somebody fills in the contact form on the Visit page, it lands here and an alert goes to the café inbox. Nothing is lost if the email bounces — the record is in the database either way."
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {enquiries.map((enquiry) => (
              <li key={enquiry.id} className="card p-4">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h3 className="text-ink text-base font-bold">{enquiry.name}</h3>
                  <a href={`mailto:${enquiry.email}`} className="text-accent text-xs font-semibold">
                    {enquiry.email}
                  </a>
                  {enquiry.phone ? (
                    <a href={`tel:${enquiry.phone}`} className="text-muted text-xs">
                      {enquiry.phone}
                    </a>
                  ) : null}
                  <span className="text-faint ms-auto text-2xs tabular-nums">
                    {dateFormat.format(enquiry.created_at)}
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="badge badge-signature">{enquiry.topic.replace(/_/g, ' ')}</span>
                  <span
                    className={
                      enquiry.status === 'new'
                        ? 'badge badge-new'
                        : 'badge border-line text-faint border'
                    }
                  >
                    {enquiry.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <p className="text-muted mt-3 text-xs leading-relaxed whitespace-pre-wrap">
                  {enquiry.message}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="subscribers-heading">
        <h2 id="subscribers-heading" className="display-3 mb-4">
          Subscribers
        </h2>

        {subscribers.length === 0 ? (
          <EmptyState
            title="Nobody on the list yet"
            body="The footer form sends a confirmation email; addresses only appear as confirmed once somebody clicks the link in it. That is what makes this list worth having."
          />
        ) : (
          <div className="border-line overflow-x-auto rounded-[var(--radius-md)] border">
            <table className="w-full text-xs">
              <caption className="sr-only">Newsletter subscribers</caption>
              <thead className="bg-bg-subtle">
                <tr>
                  {['Email', 'Name', 'Status', 'Source', 'Joined'].map((header) => (
                    <th
                      key={header}
                      scope="col"
                      className="text-faint px-3 py-2 text-start text-2xs font-bold tracking-wider uppercase"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-line divide-y">
                {subscribers.map((subscriber) => (
                  <tr key={subscriber.id}>
                    <td className="px-3 py-2 font-semibold">{subscriber.email}</td>
                    <td className="text-muted px-3 py-2">{subscriber.name ?? '—'}</td>
                    <td className="px-3 py-2">
                      <span
                        className={
                          subscriber.status === 'confirmed'
                            ? 'badge badge-new'
                            : 'badge border-line text-faint border'
                        }
                      >
                        {subscriber.status}
                      </span>
                    </td>
                    <td className="text-muted px-3 py-2">{subscriber.source}</td>
                    <td className="text-faint px-3 py-2 tabular-nums">
                      {dateFormat.format(subscriber.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AdminShell>
  );
}
