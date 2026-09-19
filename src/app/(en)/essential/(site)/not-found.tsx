import Link from 'next/link';
import Image from 'next/image';
import { requireImage } from '@/lib/content/images';
import { brand, directionsHref } from '@/lib/config/brand';

/**
 * Tier 1's 404.
 *
 * A 404 is a person who wanted something specific and did not get it, so this
 * one apologises briefly and then offers the four things they were most
 * likely after. It has the brand's voice rather than a shrug.
 */
export default function EssentialNotFound() {
  const image = requireImage('spaceShelf');

  const links = [
    { href: '/essential/menu', title: 'The menu', body: 'Coffee, brunch and what came out of the oven this morning.' },
    { href: '/essential/visit', title: 'Visit us', body: 'Hours, parking, and whether we are open right now.' },
    { href: '/essential/story', title: 'Our story', body: 'The warehouse, the farms and the Giesen at the back.' },
    { href: '/essential/gallery', title: 'Gallery', body: 'What the room actually looks like.' },
  ];

  return (
    <div className="container-page section-y">
      <div className="grid items-center gap-[var(--space-2xl)] lg:grid-cols-[1fr_1.1fr]">
        <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-xl)]">
          <Image
            src={image.src}
            alt={image.alt}
            fill
            sizes="(max-width: 64rem) 100vw, 45vw"
            placeholder="blur"
            blurDataURL={image.blurDataURL}
            priority
            quality={65}
            className="object-cover"
          />
        </div>

        <div>
          <p className="eyebrow mb-3">404 — page not found</p>
          <h1 className="display-2">We have looked everywhere. It is not on the shelf.</h1>
          <p className="lede measure mt-4">
            That page has either moved or never existed. Either way it is our fault, not yours.
            Here is where most people were heading.
          </p>

          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="card hover:border-line-strong block h-full p-4 no-underline transition-colors"
                >
                  <span className="font-display text-ink block text-base font-semibold">
                    {link.title}
                  </span>
                  <span className="text-muted mt-1 block text-2xs leading-relaxed">
                    {link.body}
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap gap-2">
            <Link href="/essential" className="btn">
              Back to the start
            </Link>
            <a href={directionsHref} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
              Just give me directions
            </a>
          </div>

          <p className="text-faint mt-6 text-2xs">
            Still stuck? Call {brand.contact.phoneDisplay} — someone will pick up.
          </p>
        </div>
      </div>
    </div>
  );
}
