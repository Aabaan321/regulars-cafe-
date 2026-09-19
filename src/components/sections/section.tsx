import type { ReactNode } from 'react';

/** A titled page section, with consistent rhythm and heading hierarchy. */
export function Section({
  id,
  eyebrow,
  heading,
  lede,
  headingLevel = 2,
  children,
  align = 'start',
  tone = 'default',
  action,
  wide = false,
}: {
  id?: string;
  eyebrow?: string;
  heading?: string;
  lede?: string;
  headingLevel?: 2 | 3;
  children?: ReactNode;
  align?: 'start' | 'center';
  tone?: 'default' | 'subtle' | 'ink';
  action?: ReactNode;
  wide?: boolean;
}) {
  const Heading = headingLevel === 2 ? 'h2' : 'h3';

  return (
    <section
      id={id}
      // Picked up by RevealController on Tier 2 and above; inert at Tier 1.
      data-reveal=""
      className={[
        'section-y',
        tone === 'subtle' ? 'bg-bg-subtle' : '',
        tone === 'ink' ? 'bg-ink text-bg' : '',
      ].join(' ')}
    >
      <div className={wide ? 'container-wide' : 'container-page'}>
        {heading || eyebrow || lede ? (
          <header
            className={[
              'mb-[var(--space-xl)]',
              align === 'center' ? 'mx-auto max-w-[44rem] text-center' : '',
              action ? 'flex flex-wrap items-end justify-between gap-4' : '',
            ].join(' ')}
          >
            <div className={action ? 'max-w-[40rem]' : ''}>
              {eyebrow ? <p className="eyebrow mb-3">{eyebrow}</p> : null}
              {heading ? (
                <Heading className={headingLevel === 2 ? 'display-2' : 'display-3'}>
                  {heading}
                </Heading>
              ) : null}
              {lede ? <p className="lede measure mt-4">{lede}</p> : null}
            </div>
            {action ? <div className="shrink-0">{action}</div> : null}
          </header>
        ) : null}
        {children}
      </div>
    </section>
  );
}
