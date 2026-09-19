'use client';

import { useState } from 'react';
import { readStorage, useClientValue, writeStorage } from '@/lib/hooks/use-client-value';
import type { Dictionary } from '@/lib/i18n/dictionaries';

type Choice = 'light' | 'dark' | 'system';
const STORAGE_KEY = 'regulars-theme';

function readStoredChoice(): Choice {
  const stored = readStorage(STORAGE_KEY);
  return stored === 'light' || stored === 'dark' ? stored : 'system';
}

/**
 * Theme control.
 *
 * Three states, not two: "system" is the default and has to stay reachable,
 * because a guest who has set their phone to dark for the evening should not
 * have to re-choose here. The inline script in the document head has already
 * applied the right theme before paint; this only writes the preference.
 */
export function ThemeToggle({ dict, className = '' }: { dict: Dictionary; className?: string }) {
  // The stored preference is read through a client snapshot, so there is no
  // "mounted" flag and no second render. A click takes precedence for the rest
  // of the visit.
  const stored = useClientValue(readStoredChoice, 'system');
  const [override, setOverride] = useState<Choice | null>(null);
  const choice = override ?? stored;

  function apply(next: Choice) {
    setOverride(next);
    const root = document.documentElement;
    if (next === 'system') {
      writeStorage(STORAGE_KEY, null);
      const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.setAttribute('data-theme', dark ? 'dark' : 'light');
    } else {
      writeStorage(STORAGE_KEY, next);
      root.setAttribute('data-theme', next);
    }
  }

  const options: readonly { value: Choice; label: string; icon: string }[] = [
    { value: 'light', label: dict.common.lightTheme, icon: '☀' },
    { value: 'dark', label: dict.common.darkTheme, icon: '☾' },
    { value: 'system', label: dict.common.systemTheme, icon: '◐' },
  ];

  return (
    <div
      role="radiogroup"
      aria-label={dict.common.theme}
      className={`border-line bg-bg-subtle inline-flex items-center gap-0.5 rounded-[var(--radius-pill)] border p-0.5 ${className}`}
    >
      {options.map((option) => {
        const active = choice === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            title={option.label}
            onClick={() => apply(option.value)}
            className={[
              'grid size-7 place-items-center rounded-full text-[13px] transition-colors',
              'hover:bg-surface-raised',
              active ? 'bg-ink text-bg' : 'text-muted',
            ].join(' ')}
          >
            <span aria-hidden="true">{option.icon}</span>
            <span className="sr-only">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
