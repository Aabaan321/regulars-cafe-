import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { TierJournalPost } from '@/components/pages/tier-journal';
import { getPost, journalPosts } from '@/lib/content/journal';
import { requireImage } from '@/lib/content/images';
import { buildMetadata } from '@/lib/seo/metadata';

/** Every post is known at build time, so all of them prerender. */
export function generateStaticParams() {
  return journalPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return buildMetadata({ title: 'Not found', description: '', path: '/ar/signature/journal' });

  return buildMetadata({
    title: post.titleAr,
    description: post.excerptAr,
    path: `/ar/signature/journal/${post.slug}`,
    locale: 'ar',
    alternateLocales: ['en', 'ar'],
    type: 'article',
    publishedTime: post.publishedAt,
    modifiedTime: post.updatedAt ?? post.publishedAt,
    authors: [post.author.name],
    keywords: post.keywords,
    ogImagePath: requireImage(post.heroImageKey).src,
  });
}

export const revalidate = 3600;

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!getPost(slug)) notFound();
  return <TierJournalPost tier="signature" locale="ar" slug={slug} />;
}
