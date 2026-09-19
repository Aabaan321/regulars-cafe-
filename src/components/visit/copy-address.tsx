'use client';

import { useEffect, useState } from 'react';
import { brand } from '@/lib/config/brand';
import type { Dictionary } from '@/lib/i18n/dictionaries';

/** Copy-to-clipboard for the address, with a real confirmation state. */
export function CopyAddress({ dict }: { dict: Dictionary }) {
  const [copied, setCopied] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    setSupported(typeof navigator !== 'undefined' && Boolean(navigator.clipboard));
  }, []);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2400);
    return () => clearTimeout(timer);
  }, [copied]);

  if (!supported) return null;

  return (
    <button
      type="button"
      className="btn btn-secondary btn-sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(brand.address.formatted);
          setCopied(true);
        } catch {
          setCopied(false);
        }
      }}
    >
      <span aria-hidden="true">{copied ? '✓' : '⧉'}</span>
      <span aria-live="polite">{copied ? dict.common.copied : dict.common.copyAddress}</span>
    </button>
  );
}
