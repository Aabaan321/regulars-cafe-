import type { Metadata } from 'next';
import { Hero } from '@/components/sections/hero';
import { MenuBrowser, type MenuCategoryView } from '@/components/menu/menu-browser';
import { JsonLd } from '@/components/seo/json-ld';
import { menuCategories, itemsByCategory, menuItems } from '@/lib/content/menu';
import { getImage } from '@/lib/content/images';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { buildMetadata } from '@/lib/seo/metadata';
import { breadcrumbSchema, menuSchema } from '@/lib/seo/jsonld';

export const metadata: Metadata = buildMetadata({
  title: 'Menu — Coffee, Brunch & Bakery',
  description:
    'Single-origin filter, an espresso bar, all-day brunch and a bakery that sells out by eleven. Full menu with AED prices, dietary tags and allergens.',
  path: '/essential/menu',
  keywords: ['Dubai brunch menu', 'specialty coffee menu Dubai', 'vegan brunch Al Quoz'],
});

export const revalidate = 3600;

export default function MenuPage() {
  const dict = getDictionary('en');

  const categories: readonly MenuCategoryView[] = menuCategories
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((category) => ({
      id: category.id,
      name: category.name,
      description: category.description,
      serviceNote: category.serviceNote ?? null,
      items: itemsByCategory(category.id).map(toMenuItemView),
    }));

  return (
    <>
      <JsonLd id="ld-menu" data={menuSchema()} />
      <JsonLd
        id="ld-crumbs"
        data={breadcrumbSchema([
          { name: 'Home', path: '/essential' },
          { name: 'Menu', path: '/essential/menu' },
        ])}
      />

      <Hero
        layout="panel"
        imageKey="heroMenu"
        size="short"
        eyebrow="Updated weekly"
        heading="The menu"
        lede="Prices in AED and include VAT. The single origin on the brew bar changes every fortnight — the card by the grinder tells you what is on."
      />

      <div className="container-page pt-[var(--space-xl)] pb-[var(--section-y)]">
        <MenuBrowser categories={categories} dict={dict} showImages />
      </div>
    </>
  );
}

/** Builds the client-safe view model, resolving photography on the server. */
function toMenuItemView(item: (typeof menuItems)[number]) {
  const image = item.imageKey ? getImage(item.imageKey) : undefined;
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    priceFils: item.priceFils,
    dietary: item.dietary,
    allergens: item.allergens,
    badges: item.badges,
    available: item.available,
    unavailableReason: item.unavailableReason ?? null,
    image: image
      ? {
          src: image.src,
          width: image.width,
          height: image.height,
          blurDataURL: image.blurDataURL,
          alt: image.alt,
        }
      : null,
  };
}
