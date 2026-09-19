import Link from 'next/link';
import type { Metadata } from 'next';
import { NewsletterForm } from '@/components/forms/newsletter-form';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildMetadata({
  title: 'The Regulars letter',
  description:
    'One email a month from Regulars: what we are roasting, what is new on the menu, and first refusal on events.',
  path: '/essential/newsletter',
});

export const dynamic = 'force-dynamic';

type Status = 'confirmed' | 'already' | 'unsubscribed' | 'invalid';

const OUTCOMES: Record<Status, { title: string; body: string; tone: 'good' | 'bad' }> = {
  confirmed: {
    title: 'You’re on the list.',
    body: 'Thank you — that is you confirmed. The next letter goes out at the start of the month, and there will not be another one before then.',
    tone: 'good',
  },
  already: {
    title: 'You were already on the list.',
    body: 'Nothing to do. That link had been used once before, which is exactly what should happen.',
    tone: 'good',
  },
  unsubscribed: {
    title: 'You’re unsubscribed.',
    body: 'Done, and no hard feelings. You will not hear from us again unless you sign up below.',
    tone: 'good',
  },
  invalid: {
    title: 'That link has expired.',
    body: 'Confirmation links work once and last seven days. Put your address in below and we will send a fresh one.',
    tone: 'bad',
  },
};

export default async function NewsletterPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const dict = getDictionary('en');
  const { status } = await searchParams;
  const outcome = status && status in OUTCOMES ? OUTCOMES[status as Status] : null;

  return (
    <div className="container-page section-y">
      <div className="mx-auto max-w-[38rem]">
        {outcome ? (
          <div
            role="status"
            className={[
              'mb-10 rounded-[var(--radius-lg)] border p-6',
              outcome.tone === 'good'
                ? 'border-[color-mix(in_oklab,var(--c-success)_40%,transparent)] bg-[color-mix(in_oklab,var(--c-success)_10%,transparent)]'
                : 'border-[color-mix(in_oklab,var(--c-warning)_45%,transparent)] bg-[color-mix(in_oklab,var(--c-warning)_10%,transparent)]',
            ].join(' ')}
          >
            <p className="font-display text-ink text-xl">{outcome.title}</p>
            <p className="text-muted mt-2 text-xs leading-relaxed">{outcome.body}</p>
          </div>
        ) : null}

        <p className="eyebrow mb-3">Once a month, that is all</p>
        <h1 className="display-2">The Regulars letter</h1>
        <p className="lede mt-4">
          What is on the brew bar, what the kitchen has started doing, and first refusal on cuppings
          and supper clubs. We have never sent two in a month and we are not going to start.
        </p>

        <div className="border-line mt-10 border-t pt-8">
          <NewsletterForm
            dict={dict}
            locale="en"
            tier="essential"
            source="newsletter-page"
            compact={false}
          />
        </div>

        <p className="text-faint text-2xs mt-8 leading-relaxed">
          Double opt-in: we send one confirmation email and you are not on the list until you click
          it. Every letter carries a one-click unsubscribe. We do not sell or share the list — there
          is nobody to sell it to who would treat you well.
        </p>

        <Link href="/essential" className="btn btn-secondary mt-8">
          Back to the site
        </Link>
      </div>
    </div>
  );
}
