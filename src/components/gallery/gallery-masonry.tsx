'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ResolvedImage } from '@/lib/content/images';
import { fill, type Dictionary, type Locale } from '@/lib/i18n/dictionaries';

/**
 * Masonry gallery with a keyboard-navigable lightbox.
 *
 * The grid is CSS columns, so it reflows without JavaScript and without a
 * layout pass — every tile has explicit intrinsic dimensions, so opening the
 * page costs no CLS. Images below the first row are lazy.
 *
 * The lightbox is a real <dialog>: Escape, the backdrop and the close button
 * all dismiss it, focus is trapped by the element itself, arrow keys move
 * between images, and focus returns to the thumbnail that opened it.
 */
export function GalleryMasonry({
  images,
  dict,
  locale = 'en',
}: {
  images: readonly ResolvedImage[];
  dict: Dictionary;
  locale?: Locale;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggersRef = useRef<(HTMLButtonElement | null)[]>([]);
  const lastTriggerIndex = useRef<number | null>(null);

  const open = useCallback((index: number) => {
    lastTriggerIndex.current = index;
    setOpenIndex(index);
  }, []);

  const close = useCallback(() => {
    setOpenIndex(null);
  }, []);

  const step = useCallback(
    (delta: number) => {
      setOpenIndex((current) => {
        if (current === null) return current;
        return (current + delta + images.length) % images.length;
      });
    },
    [images.length],
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (openIndex !== null && !dialog.open) {
      dialog.showModal();
      document.body.style.overflow = 'hidden';
    } else if (openIndex === null && dialog.open) {
      dialog.close();
      document.body.style.overflow = '';
      const trigger = triggersRef.current[lastTriggerIndex.current ?? 0];
      trigger?.focus();
    }
  }, [openIndex]);

  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    if (openIndex === null) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        step(1);
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        step(-1);
      } else if (event.key === 'Home') {
        event.preventDefault();
        setOpenIndex(0);
      } else if (event.key === 'End') {
        event.preventDefault();
        setOpenIndex(images.length - 1);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [openIndex, step, images.length]);

  const active = openIndex === null ? null : images[openIndex];

  return (
    <>
      <ul className="columns-2 gap-[var(--space-xs)] md:columns-3 lg:columns-4 [&>li]:mb-[var(--space-xs)] [&>li]:break-inside-avoid">
        {images.map((image, index) => (
          <li key={image.key}>
            <button
              type="button"
              ref={(el) => {
                triggersRef.current[index] = el;
              }}
              onClick={() => open(index)}
              aria-haspopup="dialog"
              className="group border-line block w-full overflow-hidden rounded-[var(--radius-md)] border"
            >
              <Image
                src={image.src}
                alt={image.alt}
                width={image.width}
                height={image.height}
                sizes="(max-width: 48rem) 50vw, (max-width: 64rem) 33vw, 25vw"
                placeholder="blur"
                blurDataURL={image.blurDataURL}
                loading={index < 4 ? 'eager' : 'lazy'}
                quality={68}
                className="h-auto w-full transition-transform duration-500 [transition-timing-function:var(--ease-out-soft)] group-hover:scale-[1.03]"
              />
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialogRef}
        aria-label={dict.a11y.galleryLightbox}
        onClose={close}
        onClick={(event) => {
          // Backdrop clicks land on the dialog element itself.
          if (event.target === dialogRef.current) close();
        }}
        className="bg-bg text-ink m-auto max-h-[100dvh] w-full max-w-[min(96vw,80rem)] border-0 p-0 backdrop:bg-black/80 open:flex open:flex-col"
      >
        {active ? (
          <div className="flex h-full max-h-[100dvh] flex-col">
            <div className="border-line flex items-center justify-between gap-4 border-b px-4 py-2.5">
              <p className="text-faint text-2xs tabular-nums">
                {fill(dict.a11y.imageCounter, { index: (openIndex ?? 0) + 1, total: images.length }, locale)}
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => step(-1)}
                  className="btn btn-ghost btn-sm"
                  aria-label={dict.a11y.previousImage}
                >
                  <span aria-hidden="true">←</span>
                </button>
                <button
                  type="button"
                  onClick={() => step(1)}
                  className="btn btn-ghost btn-sm"
                  aria-label={dict.a11y.nextImage}
                >
                  <span aria-hidden="true">→</span>
                </button>
                <button
                  type="button"
                  onClick={close}
                  className="btn btn-secondary btn-sm ms-2"
                  autoFocus
                >
                  <span aria-hidden="true" className="me-1">
                    ✕
                  </span>
                  {dict.common.close}
                </button>
              </div>
            </div>

            <div className="flex min-h-0 flex-1 items-center justify-center bg-black/90 p-2">
              <Image
                key={active.key}
                src={active.src}
                alt={active.alt}
                width={active.width}
                height={active.height}
                sizes="96vw"
                placeholder="blur"
                blurDataURL={active.blurDataURL}
                quality={82}
                className="max-h-[calc(100dvh-9rem)] w-auto max-w-full object-contain"
              />
            </div>

            <p className="text-muted px-4 py-3 text-xs">{active.alt}</p>
          </div>
        ) : null}
      </dialog>
    </>
  );
}
