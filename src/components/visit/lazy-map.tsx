'use client';

import { useState } from 'react';
import Image from 'next/image';
import { brand, directionsHref } from '@/lib/config/brand';
import type { Dictionary } from '@/lib/i18n/dictionaries';

/**
 * The map, loaded on interaction rather than on page load.
 *
 * An embedded Google map is roughly 1.5MB of third-party JavaScript and
 * several cross-origin connections, and it is the single most reliable way to
 * lose a performance budget on a café site. So: a static, self-hosted preview
 * with the real actions (directions, call, copy address) working immediately,
 * and the interactive iframe only after the visitor asks for it.
 *
 * Nothing loads from a third party until that click.
 */
export function LazyMap({
  dict,
  previewSrc,
  previewBlur,
}: {
  dict: Dictionary;
  previewSrc: string;
  previewBlur: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const embedSrc = `https://www.google.com/maps?q=${brand.geo.latitude},${brand.geo.longitude}&z=${brand.geo.mapZoom}&output=embed`;

  return (
    <div className="border-line bg-bg-subtle relative aspect-[16/10] w-full overflow-hidden rounded-[var(--radius-lg)] border sm:aspect-[2/1]">
      {loaded ? (
        <iframe
          title={`Map showing ${brand.name}, ${brand.address.formatted}`}
          src={embedSrc}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="absolute inset-0 size-full border-0"
          allowFullScreen
        />
      ) : (
        <>
          <Image
            src={previewSrc}
            alt=""
            fill
            sizes="(max-width: 64rem) 100vw, 50vw"
            placeholder="blur"
            blurDataURL={previewBlur}
            quality={60}
            className="object-cover"
          />
          <div aria-hidden="true" className="absolute inset-0 bg-[rgba(12,9,7,0.45)]" />

          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
            <p className="max-w-[24rem] text-xs font-semibold text-white">
              {brand.address.formatted}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <button type="button" onClick={() => setLoaded(true)} className="btn btn-sm">
                Load the interactive map
              </button>
              <a
                href={directionsHref}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm border-white/50 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
              >
                {dict.common.directions}
              </a>
            </div>
            <p className="text-2xs text-white/70">
              Loads Google Maps — nothing is requested from Google until you click.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
