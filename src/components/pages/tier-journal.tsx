import Image from 'next/image';
import Link from 'next/link';
import { Hero } from '@/components/sections/hero';
import { Section } from '@/components/sections/section';
import { JsonLd } from '@/components/seo/json-ld';
import { journalBodies } from '@/lib/content/journal-bodies';
import {
  getPost,
  journalCategories,
  journalPosts,
  readingMinutes,
  relatedPosts,
} from '@/lib/content/journal';
import { requireImage } from '@/lib/content/images';
import { articleSchema, breadcrumbSchema } from '@/lib/seo/jsonld';
import { featuresFor, tierHref, type TierId } from '@/lib/config/navigation';
import { formatDate, type Locale } from '@/lib/i18n/dictionaries';

/**
 * The journal — the SEO engine of Tier 2.
 *
 * Four posts, each on a search term a Dubai café can realistically own, each
 * written to be worth reading on its own rather than to hold keywords. The
 * index is statically generated; posts carry `Article` structured data and a
 * breadcrumb.
 */
export function TierJournalIndex({ tier, locale }: { tier: TierId; locale: Locale }) {
  const ar = locale === 'ar';
  const posts = [...journalPosts].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  return (
    <>
      <JsonLd
        id="ld-crumbs"
        data={breadcrumbSchema([
          { name: 'Home', path: tierHref(tier, '', locale) },
          { name: 'Journal', path: tierHref(tier, '/journal', locale) },
        ])}
      />

      <Hero
        layout={featuresFor(tier).heroLayout}
        imageKey="spaceShelf"
        size="short"
        locale={locale}
        eyebrow={ar ? 'المدوّنة' : 'Journal'}
        heading={ar ? 'ما نفكّر فيه' : 'What we are thinking about'}
        lede={
          ar
            ? 'القهوة والطعام والحي. نكتب حين يكون لدينا ما نقوله، لا وفق جدول.'
            : 'Coffee, food and the neighbourhood. We write when we have something to say rather than to a schedule.'
        }
      />

      <div className="container-page pt-[var(--space-xl)] pb-[var(--section-y)]">
        <ul className="flex flex-col gap-10">
          {posts.map((post, index) => {
            const image = requireImage(post.heroImageKey);
            return (
              <li key={post.slug}>
                <article className="grid items-center gap-6 md:grid-cols-[1fr_1.3fr]">
                  <Link
                    href={tierHref(tier, `/journal/${post.slug}`, locale)}
                    className="relative block aspect-[4/3] overflow-hidden rounded-[var(--radius-lg)]"
                    tabIndex={-1}
                    aria-hidden="true"
                  >
                    <Image
                      src={image.src}
                      alt=""
                      fill
                      sizes="(max-width: 48rem) 100vw, 36vw"
                      placeholder="blur"
                      blurDataURL={image.blurDataURL}
                      loading={index < 2 ? 'eager' : 'lazy'}
                      quality={66}
                      className="object-cover transition-transform duration-500 hover:scale-[1.03]"
                    />
                  </Link>

                  <div>
                    <p className="eyebrow mb-2">
                      {post.category} ·{' '}
                      {formatDate(new Date(post.publishedAt), locale, {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}{' '}
                      · {readingMinutes(post.wordCount)} min
                    </p>
                    <h2 className="display-3">
                      <Link
                        href={tierHref(tier, `/journal/${post.slug}`, locale)}
                        className="hover:text-accent no-underline"
                      >
                        {ar ? post.titleAr : post.title}
                      </Link>
                    </h2>
                    <p className="prose-body measure mt-3">{ar ? post.excerptAr : post.excerpt}</p>
                    <p className="text-faint text-2xs mt-3">
                      {post.author.name} · {post.author.role}
                    </p>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>

        <div className="border-line mt-14 border-t pt-8">
          <p className="eyebrow mb-3">{ar ? 'التصنيفات' : 'Categories'}</p>
          <ul className="flex flex-wrap gap-2">
            {journalCategories.map((category) => (
              <li key={category}>
                <span className="chip cursor-default">{category}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}

/** A single post. */
export function TierJournalPost({
  tier,
  locale,
  slug,
}: {
  tier: TierId;
  locale: Locale;
  slug: string;
}) {
  const post = getPost(slug);
  const Body = journalBodies[slug];
  if (!post || !Body) return null;

  const ar = locale === 'ar';
  const image = requireImage(post.heroImageKey);
  const related = relatedPosts(slug, 3);
  const path = tierHref(tier, `/journal/${slug}`, locale);

  return (
    <>
      <JsonLd
        id="ld-article"
        data={articleSchema({
          title: post.title,
          description: post.excerpt,
          path,
          imagePath: image.src,
          publishedAt: post.publishedAt,
          updatedAt: post.updatedAt,
          authorName: post.author.name,
          section: post.category,
          wordCount: post.wordCount,
        })}
      />
      <JsonLd
        id="ld-crumbs"
        data={breadcrumbSchema([
          { name: 'Home', path: tierHref(tier, '', locale) },
          { name: 'Journal', path: tierHref(tier, '/journal', locale) },
          { name: post.title, path },
        ])}
      />

      <article className="container-page pt-[calc(var(--header-h)+var(--space-xl))] pb-[var(--section-y)]">
        <div className="mx-auto max-w-[44rem]">
          <p className="eyebrow mb-3">
            {post.category} ·{' '}
            {formatDate(new Date(post.publishedAt), locale, {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}{' '}
            · {readingMinutes(post.wordCount)} min read
          </p>
          <h1 className="display-1">{ar ? post.titleAr : post.title}</h1>
          <p className="lede mt-5">{ar ? post.excerptAr : post.excerpt}</p>
          <p className="text-faint border-line mt-6 border-b pb-6 text-xs">
            {post.author.name} · {post.author.role}
          </p>
        </div>

        <figure className="my-10">
          <Image
            src={image.src}
            alt={image.alt}
            width={image.width}
            height={image.height}
            sizes="(max-width: 76rem) 100vw, 76rem"
            placeholder="blur"
            blurDataURL={image.blurDataURL}
            priority
            quality={70}
            className="w-full rounded-[var(--radius-xl)] object-cover"
          />
        </figure>

        <div className="mx-auto max-w-[44rem]">
          <Body />
        </div>
      </article>

      {related.length > 0 ? (
        <Section
          tone="subtle"
          eyebrow={ar ? 'اقرأ أيضاً' : 'Read next'}
          heading={ar ? 'مقالات ذات صلة' : 'Related posts'}
        >
          <ul className="grid gap-5 md:grid-cols-3">
            {related.map((other) => {
              const otherImage = requireImage(other.heroImageKey);
              return (
                <li key={other.slug}>
                  <Link
                    href={tierHref(tier, `/journal/${other.slug}`, locale)}
                    className="card block h-full overflow-hidden no-underline"
                  >
                    <span className="relative block aspect-[3/2]">
                      <Image
                        src={otherImage.src}
                        alt=""
                        fill
                        sizes="(max-width: 48rem) 100vw, 30vw"
                        placeholder="blur"
                        blurDataURL={otherImage.blurDataURL}
                        loading="lazy"
                        quality={60}
                        className="object-cover"
                      />
                    </span>
                    <span className="block p-4">
                      <span className="eyebrow mb-1 block">{other.category}</span>
                      <span className="font-display text-ink block text-base leading-snug font-semibold">
                        {ar ? other.titleAr : other.title}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Section>
      ) : null}
    </>
  );
}
