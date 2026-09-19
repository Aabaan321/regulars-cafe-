import Image from 'next/image';
import { formatPrice } from '@/lib/content/menu-display';
import { menuItems } from '@/lib/content/menu';
import { getImage } from '@/lib/content/images';
import type { Locale } from '@/lib/i18n/dictionaries';

/**
 * The signatures, at poster size.
 *
 * Tier 3 only. Tiers 1 and 2 present the menu as a list, which is what a menu
 * is; this presents four dishes the way a magazine would — full-bleed, edge
 * to edge, one per screen, with the photograph doing the selling rather than
 * the description.
 *
 * It is the clearest single answer on a shared page to "what does Tier 3 buy
 * me": same café, same dishes, same prices, completely different confidence.
 *
 * The images are the only heavy thing here, so each one is sized to its real
 * slot rather than to the viewport, and only the first is eager — the rest
 * are below the fold by definition.
 */
export function SignatureShowcase({ locale }: { locale: Locale }) {
  const ar = locale === 'ar';

  const signatures = menuItems
    .filter((item) => item.badges.includes('signature') && item.imageKey)
    .slice(0, 4);

  if (signatures.length === 0) return null;

  return (
    <section
      aria-labelledby="signatures-heading"
      className="bg-ink text-bg relative overflow-hidden py-[var(--section-y)]"
    >
      <div className="container-wide">
        <header className="mb-[var(--space-2xl)] max-w-[44rem]">
          <p className="text-2xs mb-3 font-bold tracking-[0.22em] text-[#E3894A] uppercase">
            {ar ? 'ما نُعرف به' : 'What we are known for'}
          </p>
          <h2 id="signatures-heading" className="display-2">
            {ar ? 'أربعة أطباق، عن قرب' : 'Four plates, up close'}
          </h2>
          <p className="mt-5 text-lg leading-[1.6] text-[color-mix(in_oklab,var(--c-bg)_72%,transparent)]">
            {ar
              ? 'نفس القائمة ونفس الأسعار. الفرق أن هذه الصفحة تعرضها كما تبدو فعلاً على الطاولة.'
              : 'The same menu at the same prices. The difference is that this page shows them the way they actually arrive at the table.'}
          </p>
        </header>
      </div>

      <div className="flex flex-col gap-[var(--space-3xl)]">
        {signatures.map((item, index) => {
          const image = item.imageKey ? getImage(item.imageKey) : undefined;
          if (!image) return null;
          const flip = index % 2 === 1;

          return (
            <article
              key={item.id}
              className="container-wide grid items-center gap-[var(--space-xl)] lg:grid-cols-2"
            >
              <div
                className={[
                  'relative aspect-[4/3] overflow-hidden rounded-[var(--radius-xl)]',
                  flip ? 'lg:order-2' : '',
                ].join(' ')}
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  sizes="(min-width: 1024px) 48vw, 100vw"
                  quality={70}
                  loading={index === 0 ? 'eager' : 'lazy'}
                  placeholder="blur"
                  blurDataURL={image.blurDataURL}
                  className="object-cover"
                />
              </div>

              <div
                className={flip ? 'lg:order-1 lg:pe-[var(--space-xl)]' : 'lg:ps-[var(--space-xl)]'}
              >
                <p className="text-2xs font-bold tracking-[0.2em] text-[#E3894A] uppercase tabular-nums">
                  {String(index + 1).padStart(2, '0')}
                </p>
                <h3 className="display-2 mt-3">{ar ? item.nameAr : item.name}</h3>
                <p className="mt-5 max-w-[34rem] text-lg leading-[1.65] text-[color-mix(in_oklab,var(--c-bg)_74%,transparent)]">
                  {ar ? item.descriptionAr : item.description}
                </p>
                <p className="font-display mt-6 text-3xl tabular-nums">
                  {formatPrice(item.priceFils, locale)}
                </p>
                {item.allergens.length > 0 ? (
                  <p className="text-2xs mt-4 text-[color-mix(in_oklab,var(--c-bg)_52%,transparent)]">
                    {ar ? 'يحتوي: ' : 'Contains: '}
                    {item.allergens.join(', ')}
                  </p>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
