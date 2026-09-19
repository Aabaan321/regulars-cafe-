import type { Metadata } from 'next';
import { Hero } from '@/components/sections/hero';
import { GalleryMasonry } from '@/components/gallery/gallery-masonry';
import { JsonLd } from '@/components/seo/json-ld';
import { galleryKeys, requireImage } from '@/lib/content/images';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { buildMetadata } from '@/lib/seo/metadata';
import { breadcrumbSchema } from '@/lib/seo/jsonld';

export const metadata: Metadata = buildMetadata({
  title: 'Gallery — The Room, The Coffee, The Food',
  description:
    'Inside Warehouse 14: the brew bar, the long table, the morning bake and the plates that come out of the open kitchen.',
  path: '/essential/gallery',
});

export const revalidate = 86400;

export default function GalleryPage() {
  const dict = getDictionary('en');
  const images = galleryKeys.map((key) => requireImage(key));

  return (
    <>
      <JsonLd
        id="ld-crumbs"
        data={breadcrumbSchema([
          { name: 'Home', path: '/essential' },
          { name: 'Gallery', path: '/essential/gallery' },
        ])}
      />

      <Hero
        imageKey="heroGallery"
        size="short"
        eyebrow="Photographs"
        heading="The room, and what comes out of it"
        lede="No stock photography of a cappuccino nobody made. These are all shot in Warehouse 14."
      />

      <div className="container-wide pt-[var(--space-xl)] pb-[var(--section-y)]">
        <GalleryMasonry images={images} dict={dict} />
      </div>
    </>
  );
}
