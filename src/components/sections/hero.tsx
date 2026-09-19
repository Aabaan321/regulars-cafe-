import Image from 'next/image';
import Link from 'next/link';
import { requireImage } from '@/lib/content/images';
import { OpenNow } from '@/components/ui/open-now';
import { getOpenState } from '@/lib/utils/hours';
import type { Locale } from '@/lib/i18n/dictionaries';

/**
 * The page hero — two compositions, chosen by tier.
 *
 * **`panel` (Tier 1).** The photograph sits in a framed block and the words
 * sit beside it on the page's own background, in the ink colour. Nothing is
 * overlaid. It reads as a clean, well-set editorial page — restrained on
 * purpose, and finished rather than stripped back.
 *
 * **`overlay` (Tiers 2 and 3).** Full-bleed photograph, white type over it,
 * scrims doing the contrast work. It is the more expensive-looking of the
 * two, and it should be, because it is the more expensive tier.
 *
 * This is the first thing anyone sees on any page, so it is where the tiers
 * have to diverge hardest. Before this split, Tier 1 and Tier 2 opened with
 * the same picture, the same headline and the same layout, and a client
 * clicking between them could not see what the money bought.
 *
 * In both, the image is `priority` and sized for the viewport so it is the
 * LCP element, and the headline sits in document flow so a crawler and a
 * screen reader meet the words before the scenery.
 */
export function Hero({
  imageKey,
  eyebrow,
  heading,
  lede,
  actions,
  locale = 'en',
  showOpenState = false,
  size = 'full',
  align = 'start',
  layout = 'overlay',
}: {
  imageKey: string;
  eyebrow?: string;
  heading: string;
  lede?: string;
  actions?: readonly {
    label: string;
    href: string;
    variant?: 'primary' | 'secondary';
    external?: boolean;
  }[];
  locale?: Locale;
  showOpenState?: boolean;
  size?: 'full' | 'short';
  align?: 'start' | 'center';
  /** `panel` is Tier 1's composition; `overlay` is Tiers 2 and 3. */
  layout?: 'overlay' | 'panel';
}) {
  const image = requireImage(imageKey);
  const open = getOpenState(undefined, locale);

  const verticalScrim =
    'linear-gradient(to top,' +
    'rgba(10,7,5,0.94) 0%,' +
    'rgba(10,7,5,0.86) 20%,' +
    'rgba(10,7,5,0.68) 40%,' +
    'rgba(10,7,5,0.42) 62%,' +
    'rgba(10,7,5,0.30) 80%,' +
    'rgba(10,7,5,0.55) 100%)';

  const edgeScrim =
    align === 'center'
      ? 'radial-gradient(ellipse at center, rgba(10,7,5,0.5), transparent 72%)'
      : `linear-gradient(to ${locale === 'ar' ? 'left' : 'right'},` +
        'rgba(10,7,5,0.62) 0%,' +
        'rgba(10,7,5,0.30) 40%,' +
        'transparent 70%)';

  if (layout === 'panel') {
    return (
      <section className="bg-bg pt-[calc(var(--header-h)+var(--space-l))] pb-[var(--space-xl)]">
        <div className="container-wide">
          <div className="grid items-center gap-[var(--space-l)] lg:grid-cols-[1fr_1.05fr] lg:gap-[var(--space-2xl)]">
            <div className={align === 'center' ? 'mx-auto max-w-[40rem] text-center' : ''}>
              {eyebrow ? <p className="eyebrow mb-3">{eyebrow}</p> : null}

              <h1 className="display-1 text-ink">{heading}</h1>

              {lede ? <p className="lede mt-5 max-w-[36rem]">{lede}</p> : null}

              {showOpenState ? (
                <div className="border-line bg-bg-subtle mt-6 inline-flex rounded-[var(--radius-pill)] border px-3.5 py-1.5">
                  <OpenNow
                    initial={{
                      status: open.status,
                      label: open.label,
                      detail: open.detail,
                      exceptionLabel: open.exceptionLabel,
                    }}
                    locale={locale}
                  />
                </div>
              ) : null}

              {actions && actions.length > 0 ? (
                <div className="mt-8 flex flex-wrap gap-3">
                  {actions.map((action) =>
                    action.external ? (
                      <a
                        key={action.label}
                        href={action.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={
                          action.variant === 'secondary' ? 'btn btn-lg btn-secondary' : 'btn btn-lg'
                        }
                      >
                        {action.label}
                      </a>
                    ) : (
                      <Link
                        key={action.label}
                        href={action.href}
                        className={
                          action.variant === 'secondary' ? 'btn btn-lg btn-secondary' : 'btn btn-lg'
                        }
                      >
                        {action.label}
                      </Link>
                    ),
                  )}
                </div>
              ) : null}
            </div>

            <div
              className={[
                'border-line relative overflow-hidden rounded-[var(--radius-lg)] border',
                size === 'full' ? 'aspect-[4/3] lg:aspect-[5/4]' : 'aspect-[16/9] lg:aspect-[3/2]',
              ].join(' ')}
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                priority
                fetchPriority="high"
                quality={72}
                sizes="(min-width: 1024px) 52vw, 100vw"
                placeholder="blur"
                blurDataURL={image.blurDataURL}
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className={[
        'relative isolate flex w-full overflow-hidden',
        size === 'full'
          ? 'min-h-[min(88svh,46rem)] items-end pb-[var(--space-xl)]'
          : 'min-h-[min(52svh,26rem)] items-end pb-[var(--space-l)]',
        'pt-[calc(var(--header-h)+var(--space-l))]',
      ].join(' ')}
    >
      <Image
        src={image.src}
        alt={image.alt}
        fill
        priority
        fetchPriority="high"
        quality={72}
        sizes="100vw"
        placeholder="blur"
        blurDataURL={image.blurDataURL}
        className="-z-20 object-cover"
      />
      {/* Two scrims, not one. The vertical pass carries the text block; the
          horizontal pass keeps the left-aligned column readable when the
          photograph happens to be bright on that side, and flips under RTL.
          Written as inline styles rather than arbitrary utilities: a five-stop
          gradient is exactly the case where a utility class stops being
          readable, and these are two decorative divs, not a design token. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10"
        style={{ backgroundImage: verticalScrim }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10"
        style={{ backgroundImage: edgeScrim }}
      />

      <div className="container-wide relative">
        <div className={align === 'center' ? 'mx-auto max-w-[46rem] text-center' : 'max-w-[42rem]'}>
          {eyebrow ? (
            <p className="mb-3 text-xs font-bold tracking-[0.14em] text-[#EFE0CB] uppercase [text-shadow:0_1px_10px_rgba(0,0,0,0.6)]">
              {eyebrow}
            </p>
          ) : null}

          <h1 className="display-1 text-[#FFFBF4] [text-shadow:0_2px_24px_rgba(0,0,0,0.35)]">
            {heading}
          </h1>

          {lede ? (
            <p className="mt-5 max-w-[38rem] text-lg leading-[1.5] text-[#F1E7D9] [text-shadow:0_1px_16px_rgba(0,0,0,0.65)]">
              {lede}
            </p>
          ) : null}

          {showOpenState ? (
            <div className="mt-6 inline-flex rounded-[var(--radius-pill)] border border-white/25 bg-black/35 px-3.5 py-1.5 backdrop-blur-sm">
              <OpenNow
                initial={{
                  status: open.status,
                  label: open.label,
                  detail: open.detail,
                  exceptionLabel: open.exceptionLabel,
                }}
                locale={locale}
                className="text-[#F3E9DA] [&_.text-faint]:text-[#CBBBA6]"
              />
            </div>
          ) : null}

          {actions && actions.length > 0 ? (
            <div
              className={[
                'mt-8 flex flex-wrap gap-3',
                align === 'center' ? 'justify-center' : '',
              ].join(' ')}
            >
              {actions.map((action) =>
                action.external ? (
                  <a
                    key={action.label}
                    href={action.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={
                      action.variant === 'secondary'
                        ? 'btn btn-lg border-white/45 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20'
                        : 'btn btn-lg'
                    }
                  >
                    {action.label}
                  </a>
                ) : (
                  <Link
                    key={action.label}
                    href={action.href}
                    className={
                      action.variant === 'secondary'
                        ? 'btn btn-lg border-white/45 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20'
                        : 'btn btn-lg'
                    }
                  >
                    {action.label}
                  </Link>
                ),
              )}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
