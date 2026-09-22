import Image from 'next/image';
import { formatPrice, dietaryLabels } from '@/lib/content/menu-display';
import type { MenuItemView } from '@/components/menu/menu-item-card';
import type { Locale } from '@/lib/i18n/dictionaries';

/**
 * The signature plates, at Tier 3.
 *
 * Tiers 1 and 2 show these as a priced list with a thumbnail, which is the
 * right thing for a menu you are scanning. On the Immersive home page that
 * same list was the moment the page stopped being a premium site and became
 * an ordinary one: four 56px squares and some body copy, immediately after
 * four full-screen chapters of filmed coffee.
 *
 * So here they are photographs first — large, in a deliberate 2x2 that gives
 * the first plate more room than the others — with the name set at display
 * size and the price where a menu puts it. The numbering is not decoration:
 * it tells you there are four and that you have seen them all, which a grid
 * of equal cards does not.
 *
 * Server-rendered, like everything else on this page. The hover state is two
 * CSS transforms; there is no JavaScript here at all.
 */
export function SignatureShowcase({
  items,
  locale,
  href,
  viewAllLabel,
}: {
  items: readonly MenuItemView[];
  locale: Locale;
  href: string;
  viewAllLabel: string;
}) {
  const ar = locale === 'ar';

  return (
    <ul className="grid gap-x-8 gap-y-14 sm:grid-cols-2">
      {items.map((item, index) => (
        <li
          key={item.id}
          className={
            // The first plate gets the wide slot. An even grid of four says
            // "these are interchangeable"; they are not, and the most ordered
            // drink in the room should not be filed alphabetically.
            index === 0 ? 'sm:col-span-2' : ''
          }
        >
          <article className="group">
            {item.image ? (
              <div
                className={`relative overflow-hidden rounded-[var(--radius-md)] ${
                  index === 0 ? 'aspect-[16/7]' : 'aspect-[4/3]'
                }`}
              >
                <Image
                  src={item.image.src}
                  alt={item.image.alt}
                  fill
                  sizes={
                    index === 0
                      ? '(min-width: 640px) 76rem, 100vw'
                      : '(min-width: 640px) 38rem, 100vw'
                  }
                  placeholder="blur"
                  blurDataURL={item.image.blurDataURL}
                  className="object-cover transition-transform duration-700 ease-[var(--ease-in-out-soft)] group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                />
                <span
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent"
                />
                <span
                  aria-hidden="true"
                  className="text-2xs absolute start-4 top-4 rounded-full bg-black/45 px-2.5 py-1 font-bold tracking-[0.14em] text-white/85 tabular-nums backdrop-blur-sm"
                >
                  {String(index + 1).padStart(2, '0')}
                </span>
              </div>
            ) : null}

            <div className="mt-5 flex items-baseline justify-between gap-5 border-b border-white/15 pb-3">
              <h3 className="display-3 text-[#FFFBF4]">{item.name}</h3>
              <p className="text-base font-semibold text-[#E3894A] tabular-nums">
                {formatPrice(item.priceFils, locale)}
              </p>
            </div>

            <p className="mt-4 max-w-[34rem] text-[0.975rem] leading-[1.65] text-[#D9CBB8]">
              {item.description}
            </p>

            {item.dietary.length > 0 ? (
              <ul className="mt-4 flex flex-wrap gap-2">
                {item.dietary.map((tag) => (
                  <li
                    key={tag}
                    className="text-2xs rounded-full border border-white/20 px-2.5 py-1 font-bold tracking-[0.12em] text-[#C9B9A4] uppercase"
                  >
                    {dietaryLabels[tag][ar ? 'ar' : 'en']}
                  </li>
                ))}
              </ul>
            ) : null}
          </article>
        </li>
      ))}

      <li className="sm:col-span-2">
        <a
          href={href}
          className="group flex items-center justify-between gap-6 border-t border-white/20 pt-6 text-[#FFFBF4] no-underline"
        >
          <span className="display-3">{viewAllLabel}</span>
          <span
            aria-hidden="true"
            className="text-2xl transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none rtl:group-hover:-translate-x-1"
          >
            {ar ? '←' : '→'}
          </span>
        </a>
      </li>
    </ul>
  );
}
