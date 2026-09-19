'use client';

import { useEffect, useState } from 'react';
import { getOpenState, type OpenState } from '@/lib/utils/hours';
import type { Locale } from '@/lib/i18n/dictionaries';

/**
 * The live "open now" pill.
 *
 * The server renders the state it computed at build or revalidation time so
 * there is real text in the HTML for crawlers and for JS-off visitors. On
 * mount the client recomputes from the same trading calendar — which is in the
 * bundle already — and keeps it current on a timer sized to the next
 * transition, so a café that closes at 22:00 flips at 22:00 without polling.
 */
export function OpenNow({
  initial,
  locale = 'en',
  className = '',
  showDetail = true,
}: {
  initial: Pick<OpenState, 'status' | 'label' | 'detail' | 'exceptionLabel'>;
  locale?: Locale;
  className?: string;
  showDetail?: boolean;
}) {
  const [state, setState] = useState(initial);

  useEffect(() => {
    function tick() {
      const next = getOpenState(undefined, locale);
      setState({
        status: next.status,
        label: next.label,
        detail: next.detail,
        exceptionLabel: next.exceptionLabel,
      });
      // Wake up just after the state is due to change, and at least once a
      // minute while we are inside the "closing soon" window.
      return Math.min(Math.max(next.minutesUntilChange, 1), 15) * 60_000;
    }

    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      const delay = tick();
      timer = setTimeout(schedule, delay);
    };
    schedule();
    return () => clearTimeout(timer);
  }, [locale]);

  const tone =
    state.status === 'open'
      ? 'open'
      : state.status === 'closing-soon' || state.status === 'opening-soon'
        ? 'soon'
        : 'closed';

  return (
    <span
      className={`inline-flex items-center gap-2 text-xs ${className}`}
      data-status={state.status}
    >
      <span
        aria-hidden="true"
        className={[
          'inline-block size-2 shrink-0 rounded-full',
          tone === 'open' ? 'bg-success' : tone === 'soon' ? 'bg-warning' : 'bg-dot-idle',
        ].join(' ')}
      />
      <span className="font-semibold" suppressHydrationWarning>
        {state.label}
      </span>
      {showDetail ? (
        <span className="text-faint" suppressHydrationWarning>
          · {state.exceptionLabel ? `${state.exceptionLabel} · ` : ''}
          {state.detail}
        </span>
      ) : null}
    </span>
  );
}
