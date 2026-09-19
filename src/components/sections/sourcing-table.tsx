import { Section } from '@/components/sections/section';
import { coffeeLots, premiumOverC } from '@/lib/content/sourcing';
import type { Locale } from '@/lib/i18n/dictionaries';

/**
 * What is on the bar, where it came from, and what we paid.
 *
 * Tier 2 and above. The café's claim is that it names its farms and prints
 * the price on the bag, so this section states the claim in numbers: FOB per
 * kilo against the commodity price that week, with the premium worked out.
 * A café that will publish that is making a check-able statement; one that
 * only says "ethically sourced" is not.
 *
 * Rendered as cards rather than a table on purpose — a four-column table of
 * nine fields is unreadable on a phone, and every one of these lots deserves
 * to be read rather than scanned.
 */
export function SourcingSection({ locale }: { locale: Locale }) {
  const ar = locale === 'ar';

  return (
    <Section
      id="sourcing"
      tone="subtle"
      eyebrow={ar ? 'على البار الآن' : 'On the bar right now'}
      heading={ar ? 'أربع مزارع، بالاسم' : 'Four farms, by name'}
      lede={
        ar
          ? 'نطبع ما دفعناه لكل دفعة على الكيس. هذه هي نفس الأرقام، محدَّثة مع كل شحنة تصل.'
          : 'We print what we paid for every lot on the bag. These are those same numbers, updated as each shipment lands.'
      }
    >
      <ul className="grid gap-[var(--space-m)] sm:grid-cols-2">
        {coffeeLots.map((lot) => {
          const premium = premiumOverC(lot);
          return (
            <li key={lot.id} className="card flex flex-col p-[var(--space-l)]">
              <div className="flex items-baseline justify-between gap-3">
                <p className="eyebrow">{ar ? lot.originAr : lot.origin}</p>
                <p className="text-faint text-2xs">{lot.landed}</p>
              </div>

              <h3 className="display-3 mt-2">{ar ? lot.farmAr : lot.farm}</h3>
              <p className="text-muted mt-1 text-sm">
                {lot.producer} · {ar ? lot.regionAr : lot.region}
              </p>

              <dl className="border-line mt-[var(--space-m)] grid grid-cols-2 gap-x-4 gap-y-3 border-t pt-[var(--space-m)] text-sm">
                <div>
                  <dt className="text-faint text-2xs font-bold tracking-[0.12em] uppercase">
                    {ar ? 'الارتفاع' : 'Altitude'}
                  </dt>
                  <dd className="mt-0.5 font-semibold tabular-nums">{lot.altitude}</dd>
                </div>
                <div>
                  <dt className="text-faint text-2xs font-bold tracking-[0.12em] uppercase">
                    {ar ? 'الصنف' : 'Varietal'}
                  </dt>
                  <dd className="mt-0.5 font-semibold">{ar ? lot.varietalAr : lot.varietal}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-faint text-2xs font-bold tracking-[0.12em] uppercase">
                    {ar ? 'المعالجة' : 'Process'}
                  </dt>
                  <dd className="mt-0.5 font-semibold">{ar ? lot.processAr : lot.process}</dd>
                </div>
              </dl>

              {/* The claim, in numbers. */}
              <div className="border-line mt-[var(--space-m)] border-t pt-[var(--space-m)]">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="font-display text-2xl tabular-nums">
                    ${lot.fobUsdPerKg.toFixed(2)}
                  </span>
                  <span className="text-muted text-sm">{ar ? '/ كجم FOB' : '/ kg FOB'}</span>
                  <span className="bg-accent/12 text-accent text-2xs ms-auto rounded-[var(--radius-pill)] px-2.5 py-1 font-bold tabular-nums">
                    {premium > 0 ? '+' : ''}
                    {premium}% {ar ? 'فوق سعر السوق' : 'over C'}
                  </span>
                </div>
                <p className="text-faint text-2xs mt-1.5">
                  {ar
                    ? `سعر السوق ذلك الأسبوع: $${lot.cPriceUsdPerKg.toFixed(2)} / كجم`
                    : `Commodity price that week: $${lot.cPriceUsdPerKg.toFixed(2)} / kg`}
                </p>
              </div>

              <div className="mt-[var(--space-m)] flex flex-wrap gap-1.5">
                {(ar ? lot.tastingNotesAr : lot.tastingNotes).map((note) => (
                  <span
                    key={note}
                    className="border-line text-2xs rounded-[var(--radius-pill)] border px-2.5 py-1 font-semibold"
                  >
                    {note}
                  </span>
                ))}
              </div>

              <p className="text-faint text-2xs mt-auto pt-[var(--space-m)]">
                {ar ? 'يُقدَّم كـ' : 'Served as'} {(ar ? lot.servedAsAr : lot.servedAs).join(' · ')}
              </p>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
