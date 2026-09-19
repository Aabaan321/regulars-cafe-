import Image from 'next/image';
import {
  badgeLabels,
  dietaryLabels,
  formatPrice,
  type DietaryTag,
  type MenuBadge,
  type ResolvedThumbnail,
} from '@/lib/content/menu-display';
import type { Locale } from '@/lib/i18n/dictionaries';

export interface MenuItemView {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly priceFils: number;
  readonly dietary: readonly DietaryTag[];
  readonly allergens: readonly string[];
  readonly badges: readonly MenuBadge[];
  readonly available: boolean;
  readonly unavailableReason?: string | null;
  /**
   * Already resolved on the server. Passing the resolved photograph rather
   * than a key keeps the image registry — and every blur placeholder in it —
   * out of the browser bundle.
   */
  readonly image?: ResolvedThumbnail | null;
}

/**
 * A single menu line.
 *
 * The price sits in its own column with a dotted leader, so the eye can scan
 * down the right-hand edge — the thing a printed menu gets right and most
 * websites do not. Unavailable items stay on the page, dimmed, with the
 * reason: a guest who can see the Colombia is sold out asks what else is on
 * filter; a guest who sees a gap assumes the page is broken.
 */
export function MenuItemCard({
  item,
  locale = 'en',
  showImage = false,
  action,
}: {
  item: MenuItemView;
  locale?: Locale;
  showImage?: boolean;
  action?: React.ReactNode;
}) {
  const image = showImage ? item.image : undefined;

  return (
    <li
      className={[
        'group border-line/70 relative flex gap-4 border-b py-5 last:border-b-0',
        item.available ? '' : 'opacity-60',
      ].join(' ')}
      data-available={item.available}
    >
      {image ? (
        <Image
          src={image.src}
          alt=""
          width={112}
          height={112}
          sizes="112px"
          placeholder="blur"
          blurDataURL={image.blurDataURL}
          className="border-line size-20 shrink-0 rounded-[var(--radius-md)] border object-cover sm:size-28"
        />
      ) : null}

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-3">
          <h3 className="font-display text-ink min-w-0 text-lg leading-tight font-semibold">
            {item.name}
          </h3>
          <span
            aria-hidden="true"
            className="border-line mb-1 hidden min-w-4 flex-1 border-b border-dotted sm:block"
          />
          <span className="text-ink shrink-0 text-base font-bold tabular-nums">
            {formatPrice(item.priceFils, locale)}
          </span>
        </div>

        <p className="text-muted measure mt-1.5 text-xs leading-relaxed">{item.description}</p>

        {item.badges.length > 0 || item.dietary.length > 0 || !item.available ? (
          <ul className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {item.badges.map((badge) => (
              <li key={badge}>
                <span className={badge === 'new' ? 'badge badge-new' : 'badge badge-signature'}>
                  {badgeLabels[badge][locale]}
                </span>
              </li>
            ))}
            {item.dietary.map((tag) => (
              <li key={tag}>
                <span
                  className="border-line text-faint text-2xs inline-flex items-center rounded-[var(--radius-xs)] border px-1.5 py-0.5 font-bold"
                  title={dietaryLabels[tag][locale]}
                >
                  <span aria-hidden="true">{dietaryLabels[tag].short}</span>
                  <span className="sr-only">{dietaryLabels[tag][locale]}</span>
                </span>
              </li>
            ))}
            {!item.available ? (
              <li>
                <span className="text-2xs text-danger font-bold">
                  {item.unavailableReason ?? (locale === 'ar' ? 'غير متوفر' : 'Unavailable')}
                </span>
              </li>
            ) : null}
          </ul>
        ) : null}

        {item.allergens.length > 0 ? (
          <p className="text-faint text-2xs mt-1.5">
            {locale === 'ar' ? 'يحتوي على: ' : 'Contains: '}
            {item.allergens.join(', ')}
          </p>
        ) : null}
      </div>

      {action ? <div className="flex shrink-0 items-center">{action}</div> : null}
    </li>
  );
}
