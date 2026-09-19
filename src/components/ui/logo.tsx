import { brand } from '@/lib/config/brand';

/**
 * The wordmark. Set in the display face with the "R" carrying a coffee-ring
 * counter — drawn as text plus one SVG ring rather than an image so it stays
 * crisp, themeable and selectable.
 */
export function Logo({
  className = '',
  showRing = true,
}: {
  className?: string;
  showRing?: boolean;
}) {
  return (
    <span
      className={`font-display relative inline-flex items-baseline leading-none font-semibold tracking-[-0.03em] ${className}`}
    >
      {showRing ? (
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="text-accent me-[0.35em] size-[0.72em] shrink-0 self-center"
          fill="none"
        >
          <circle cx="12" cy="12" r="9.2" stroke="currentColor" strokeWidth="2.4" opacity="0.35" />
          <path
            d="M12 2.8a9.2 9.2 0 0 1 8.7 6.2"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </svg>
      ) : null}
      {brand.name}
    </span>
  );
}
