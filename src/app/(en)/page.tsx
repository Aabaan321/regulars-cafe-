import Link from 'next/link';
import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo/metadata';
import { ComparisonTable } from '@/components/pitch/comparison-table';
import { tierCaveats } from '@/lib/content/tier-matrix';
import { tierOrder, tiers } from '@/lib/config/navigation';
import { brand } from '@/lib/config/brand';

export const metadata: Metadata = buildMetadata({
  title: 'Three Ways to Build a Café Website',
  description:
    'The same Dubai café site, built at three levels — Essential, Signature and Immersive. Working demos, a full feature comparison, and what each one costs.',
  path: '/',
});

/**
 * The pitch page.
 *
 * This is the page a café owner lands on, and the only question it has to
 * answer is "what do I get for the extra money?" — so it answers it in
 * detail, in one table, including the parts that are *not* included.
 *
 * Each tier links to a working site rather than a screenshot. That is the
 * whole argument: the demo is the deliverable, built once and rebranded, so
 * what they click through is what they would be buying with their own name on
 * it.
 */
export default function TierSelector() {
  return (
    <main id="main" className="flex-1">
      {/* ── Opening ─────────────────────────────────────────────────────── */}
      <section className="container-page section-y">
        <p className="eyebrow mb-3">{brand.agency.name}</p>
        <h1 className="display-1 max-w-[18ch]">Three ways to build the same café.</h1>
        <p className="lede measure mt-6">
          One café — {brand.name}, in {brand.address.district} — built three times over, at three
          levels of ambition. Every tier below is a working site you can click through, not a
          mockup. Yours would be the same build with your name, your menu and your photographs.
        </p>
      </section>

      {/* ── The three tiers ─────────────────────────────────────────────── */}
      <section className="container-wide pb-[var(--section-y)]">
        <ul className="grid gap-[var(--space-l)] lg:grid-cols-3">
          {tierOrder.map((id) => {
            const tier = tiers[id];
            const caveat = tierCaveats[id];
            return (
              <li key={id} className="card flex flex-col p-[var(--space-l)]">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="eyebrow">Tier {tier.ordinal}</p>
                  <p className="text-faint text-2xs tabular-nums">{tier.timeline}</p>
                </div>

                <h2 className="display-2 mt-2">{tier.name}</h2>
                <p className="text-muted mt-1 text-sm">{tier.positioning}</p>

                <p className="font-display mt-5 text-3xl tabular-nums">{tier.priceFrom}</p>
                <p className="text-faint text-2xs">Fixed price, quoted before we start</p>

                <ul className="mt-[var(--space-l)] flex flex-1 flex-col gap-2 text-sm">
                  {tier.headlineFeatures.map((feature) => (
                    <li key={feature} className="flex gap-2.5">
                      <span aria-hidden="true" className="text-accent font-bold">
                        ✓
                      </span>
                      <span className="text-muted">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* The honest part. Every tier says what it is not. */}
                {caveat ? (
                  <p className="border-line text-faint text-2xs mt-[var(--space-l)] border-t pt-4 leading-[1.6]">
                    <span className="font-bold">What it is not: </span>
                    {caveat.en}
                  </p>
                ) : null}

                <Link href={`/${id}`} className="btn mt-[var(--space-l)] self-start">
                  Open the {tier.name} site
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ── The matrix ──────────────────────────────────────────────────── */}
      <section id="compare" className="bg-bg-subtle section-y">
        <div className="container-wide">
          <header className="mb-[var(--space-xl)] max-w-[46rem]">
            <p className="eyebrow mb-3">Line by line</p>
            <h2 className="display-2">Everything each tier does and does not include</h2>
            <p className="lede mt-5">
              Including the exclusions and what the add-ons cost. If something you need is missing
              from your tier, it is usually a paid add-on rather than a reason to jump a tier — ask
              and we will price it.
            </p>
          </header>

          <ComparisonTable />
        </div>
      </section>

      {/* ── Support, plainly ────────────────────────────────────────────── */}
      <section className="container-page section-y">
        <header className="mb-[var(--space-xl)] max-w-[46rem]">
          <p className="eyebrow mb-3">After it goes live</p>
          <h2 className="display-2">What support actually means</h2>
          <p className="lede mt-5">
            &ldquo;Support&rdquo; is the word every agency is vaguest about, so here is ours in
            plain numbers. Support means we fix things, make changes and answer questions, at no
            extra cost, for the window below.
          </p>
        </header>

        <dl className="grid gap-[var(--space-m)] sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              name: 'Essential',
              window: 'Handover only',
              body: 'We deploy it, point your domain at it and hand you the keys. There is no support window after that — if you want one, take a care plan.',
            },
            {
              name: 'Signature',
              window: '2 weeks',
              body: 'Two weeks of everything: bug fixes, copy changes, menu corrections, questions answered the same working day. Plus one training session for your team.',
            },
            {
              name: 'Immersive',
              window: '1 month',
              body: 'A full month on the same terms, and two training sessions — one for managers on the admin, one for floor staff on the order-at-table view.',
            },
            {
              name: 'Bespoke',
              window: 'Agreed with you',
              body: 'Scoped as part of the engagement, because a build this size does not have a standard shape and pretending otherwise helps nobody.',
            },
          ].map((item) => (
            <div key={item.name} className="card p-[var(--space-l)]">
              <dt>
                <span className="eyebrow block">{item.name}</span>
                <span className="font-display mt-1 block text-2xl">{item.window}</span>
              </dt>
              <dd className="text-muted mt-3 text-sm leading-[1.65]">{item.body}</dd>
            </div>
          ))}
        </dl>

        <p className="text-faint mt-[var(--space-l)] max-w-[46rem] text-sm leading-[1.7]">
          After the included window, a monthly care plan covers updates, hosting, backups,
          monitoring and a set number of change requests. It is optional on every tier and you can
          stop it whenever you like — you own the code and the data either way.
        </p>
      </section>
    </main>
  );
}
