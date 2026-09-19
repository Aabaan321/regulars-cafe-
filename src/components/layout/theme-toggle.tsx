'use client';

import { useEffect, useState } from 'react';
import type { Dictionary } from '@/lib/i18n/dictionaries';

type Choice = 'light' | 'dark' | 'system';
const STORAGE_KEY = 'regulars-theme';

/**
 * Theme control.
 *
 * Three states, not two: "system" is the default and has to stay reachable,
 * because a guest who has set their phone to dark for the evening should not
 * have to re-choose here. The inline script in the document head has already
 * applied the right theme before paint; this only writes the preference.
 */
export function ThemeToggle({ dict, className = '' }: { dict: Dictionary; className?: string }) {
  const [choice, setChoice] = useState<Choice>('system');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') setChoice(stored);
    } catch {
      /* storage blocked — stay on system */
    }
  }, []);

  function apply(next: Choice) {
    setChoice(next);
    const root = document.documentElement;
    try {
      if (next === 'system') {
        localStorage.removeItem(STORAGE_KEY);
        const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.setAttribute('data-theme', dark ? 'dark' : 'light');
      } else {
        localStorage.setItem(STORAGE_KEY, next);
        root.setAttribute('data-theme', next);
      }
    } catch {
      root.setAttribute('data-theme', next === 'system' ? 'light' : next);
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
        const active = mounted && choice === option.value;
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
