import NextImage from 'next/image';
import { getImage } from '@/lib/content/images';

/**
 * Elements a journal post can use beyond plain Markdown. Kept to three, on
 * purpose — a post that needs more than a captioned image, a pull quote and
 * an aside is usually a post that needs an editor.
 */

export function MdxImage({
  imageKey,
  caption,
  priority = false,
}: {
  imageKey: string;
  caption?: string;
  priority?: boolean;
}) {
  const image = getImage(imageKey);
  if (!image) return null;

  return (
    <figure className="-mx-[var(--gutter)] my-10 sm:mx-0">
      <NextImage
        src={image.src}
        alt={image.alt}
        width={image.width}
        height={image.height}
        placeholder="blur"
        blurDataURL={image.blurDataURL}
        sizes="(max-width: 48rem) 100vw, 44rem"
        priority={priority}
        className="w-full sm:rounded-[var(--radius-lg)]"
      />
      {caption ? (
        <figcaption className="text-faint mt-3 px-[var(--gutter)] text-xs sm:px-0">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

export function MdxPullQuote({ children, cite }: { children: React.ReactNode; cite?: string }) {
  return (
    <figure className="border-accent my-12 border-s-[3px] ps-6">
      <blockquote className="font-display text-ink text-2xl leading-[1.2]">{children}</blockquote>
      {cite ? <figcaption className="text-faint mt-3 text-xs">— {cite}</figcaption> : null}
    </figure>
  );
}

export function MdxNote({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <aside className="bg-bg-subtle border-line my-8 rounded-[var(--radius-md)] border p-5">
      {title ? (
        <p className="text-ink mb-2 text-xs font-bold tracking-wide uppercase">{title}</p>
      ) : null}
      <div className="text-muted [&>p]:my-2 [&>p]:text-xs [&>p]:leading-relaxed">{children}</div>
    </aside>
  );
}
