import { Hero } from '@/components/sections/hero';
import { GalleryMasonry } from '@/components/gallery/gallery-masonry';
import { JsonLd } from '@/components/seo/json-ld';
import { galleryKeys, requireImage } from '@/lib/content/images';
import { getDictionary, type Locale } from '@/lib/i18n/dictionaries';
import { breadcrumbSchema } from '@/lib/seo/jsonld';
import { featuresFor, tierHref, type TierId } from '@/lib/config/navigation';

export function TierGalleryPage({ tier, locale }: { tier: TierId; locale: Locale }) {
  const dict = getDictionary(locale);
  const ar = locale === 'ar';
  const images = galleryKeys.map((key) => requireImage(key));

  return (
    <>
      <JsonLd
        id="ld-crumbs"
        data={breadcrumbSchema([
          { name: 'Home', path: tierHref(tier, '', locale) },
          { name: 'Gallery', path: tierHref(tier, '/gallery', locale) },
        ])}
      />
      <Hero
        layout={featuresFor(tier).heroLayout}
        imageKey="heroGallery"
        size="short"
        locale={locale}
        eyebrow={ar ? 'صور' : 'Photographs'}
        heading={ar ? 'المكان، وما يخرج منه' : 'The room, and what comes out of it'}
        lede={
          ar
            ? 'لا صور أرشيفية لكابتشينو لم يصنعه أحد. كل هذه الصور من داخل المستودع ١٤.'
            : 'No stock photography of a cappuccino nobody made. These are all shot in Warehouse 14.'
        }
      />
      <div className="container-wide pt-[var(--space-xl)] pb-[var(--section-y)]">
        <GalleryMasonry images={images} dict={dict} locale={locale} />
      </div>
    </>
  );
}
