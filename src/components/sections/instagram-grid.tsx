import Image from 'next/image';
import { getImage, instagramPosts } from '@/lib/content/images';
import { brand } from '@/lib/config/brand';

/**
 * The Instagram strip.
 *
 * A curated static grid, not an embed and not a client-side scraper. Instagram
 * embeds cost several hundred kilobytes, set third-party cookies, break when
 * the token expires and are the first thing to fail on a slow connection. A
 * nine-image grid the café chooses once a month says the same thing, loads in
 * nothing, and still sends people to the account.
 */
export function InstagramGrid({ heading, cta }: { heading: string; cta: string }) {
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow mb-2">{heading}</p>
          <a
            href={brand.social.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="font-display hover:text-accent text-xl font-semibold no-underline"
          >
            {brand.social.instagramHandle}
          </a>
        </div>
        <a
          href={brand.social.instagram}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary btn-sm"
        >
          {cta}
        </a>
      </div>

      <ul className="grid grid-cols-3 gap-1.5 sm:gap-2 lg:grid-cols-9">
        {instagramPosts.map((post) => {
          const image = getImage(post.imageKey);
          if (!image) return null;
          return (
            <li key={`${post.imageKey}-${post.caption}`} className="relative">
              <a
                href={post.permalink}
                target="_blank"
                rel="noopener noreferrer"
                className="group border-line relative block aspect-square overflow-hidden rounded-[var(--radius-sm)] border"
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  sizes="(max-width: 64rem) 33vw, 11vw"
                  placeholder="blur"
                  blurDataURL={image.blurDataURL}
                  loading="lazy"
                  quality={58}
                  className="object-cover transition-transform duration-500 [transition-timing-function:var(--ease-out-soft)] group-hover:scale-105"
                />
                <span
                  className="absolute inset-0 flex items-end p-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100"
                  style={{
                    backgroundImage:
                      'linear-gradient(to top, rgba(12,9,7,0.85), transparent 58%)',
                  }}
                >
                  <span className="line-clamp-3 text-[10px] leading-tight text-white">
                    {post.caption}
                  </span>
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
