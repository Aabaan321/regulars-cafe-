import Image from 'next/image';
import Link from 'next/link';
import { requireImage } from '@/lib/content/images';
import { OpenNow } from '@/components/ui/open-now';
import { getOpenState } from '@/lib/utils/hours';
import type { Locale } from '@/lib/i18n/dictionaries';

/**
 * The page hero.
 *
 * The image is `priority` and sized for the viewport so it is the LCP element
 * and arrives first; the headline sits in normal document flow above it in
 * source order so a crawler and a screen reader meet the words before the
 * scenery. The overlay is a two-stop gradient rather than a flat tint, which
 * keeps contrast over the text without greying out the whole photograph.
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
}: {
  imageKey: string;
  eyebrow?: string;
  heading: string;
  lede?: string;
  actions?: readonly { label: string; href: string; variant?: 'primary' | 'secondary'; external?: boolean }[];
  locale?: Locale;
  showOpenState?: boolean;
  size?: 'full' | 'short';
  align?: 'start' | 'center';
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
      <div aria-hidden="true" className="absolute inset-0 -z-10" style={{ backgroundImage: verticalScrim }} />
      <div aria-hidden="true" className="absolute inset-0 -z-10" style={{ backgroundImage: edgeScrim }} />

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
