import Link from 'next/link';
import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo/metadata';
import { tierOrder, tiers } from '@/lib/config/navigation';
import { brand } from '@/lib/config/brand';

export const metadata: Metadata = buildMetadata({
  title: 'Three Ways to Build a Café Website',
  description:
    'A working demo of the same Dubai café site built at three levels — Essential, Signature and Immersive. Click between them and pick one.',
  path: '/',
});

/**
 * Placeholder tier selector.
 *
 * Replaced by the full pitch layer once the tiers are built; this exists now
 * so the routes are reachable while Tier 1 is being verified.
 */
export default function TierSelector() {
  return (
    <main id="main" className="container-page section-y flex-1">
      <p className="eyebrow mb-3">{brand.agency.name}</p>
      <h1 className="display-1 max-w-[16ch]">Three ways to build the same café.</h1>
      <p className="lede measure mt-5">
        One café — {brand.name}, in {brand.address.district} — built three times over. Every tier
        below is a working site, not a mockup.
      </p>

      <ul className="mt-12 grid gap-5 lg:grid-cols-3">
        {tierOrder.map((id) => {
          const tier = tiers[id];
          return (
            <li key={id} className="card flex flex-col p-6">
              <p className="eyebrow mb-2">Tier {tier.ordinal}</p>
              <h2 className="display-3">{tier.name}</h2>
              <p className="text-muted mt-3 text-xs leading-relaxed">{tier.blurb}</p>
              <ul className="text-muted mt-5 flex flex-1 flex-col gap-1.5 text-xs">
                {tier.headlineFeatures.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <span aria-hidden="true" className="text-accent">
                      ·
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
              <Link href={`/${id}`} className="btn mt-6 self-start">
                Explore this tier
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
