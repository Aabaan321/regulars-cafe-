import { Hero } from '@/components/sections/hero';
import { MenuBrowser } from '@/components/menu/menu-browser';
import { JsonLd } from '@/components/seo/json-ld';
import { getMenu } from '@/lib/db/queries';
import { menuCategories, itemsByCategory } from '@/lib/content/menu';
import { getImage } from '@/lib/content/images';
import { getDictionary, type Locale } from '@/lib/i18n/dictionaries';
import { breadcrumbSchema, menuSchema } from '@/lib/seo/jsonld';
import { tierHref, type TierId } from '@/lib/config/navigation';
import { isDatabaseConfigured } from '@/lib/db/client';
import type { MenuItemView } from '@/components/menu/menu-item-card';

/**
 * The menu, from the database.
 *
 * Tier 1 renders the menu from code. From Tier 2 the café owns it, so this
 * reads `menu_items` — which is what the admin menu editor writes to. If there
 * is no database (a preview deployment), it falls back to the same content
 * file Tier 1 uses, so the page is never empty.
 */
export async function TierMenuPage({ tier, locale }: { tier: TierId; locale: Locale }) {
  const dict = getDictionary(locale);
  const ar = locale === 'ar';

  const categories = isDatabaseConfigured()
    ? (await getMenu(locale)).map((category) => ({
        id: category.id,
        name: category.name,
        description: category.description,
        serviceNote: category.serviceNote,
        items: category.items.map((item): MenuItemView => ({
          id: item.id,
          name: item.name,
          description: item.description,
          priceFils: item.priceFils,
          dietary: item.dietary,
          allergens: item.allergens,
          badges: item.badges,
          available: item.available,
          unavailableReason: item.unavailableReason,
          image: item.image,
        })),
      }))
    : menuCategories
        .slice()
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((category) => ({
          id: category.id,
          name: ar ? category.nameAr : category.name,
          description: ar ? category.descriptionAr : category.description,
          serviceNote: (ar ? category.serviceNoteAr : category.serviceNote) ?? null,
          items: itemsByCategory(category.id).map((item): MenuItemView => {
            const image = item.imageKey ? getImage(item.imageKey) : undefined;
            return {
              id: item.id,
              name: ar ? item.nameAr : item.name,
              description: ar ? item.descriptionAr : item.description,
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
          }),
        }));

  return (
    <>
      <JsonLd id="ld-menu" data={menuSchema()} />
      <JsonLd
        id="ld-crumbs"
        data={breadcrumbSchema([
          { name: 'Home', path: tierHref(tier, '', locale) },
          { name: 'Menu', path: tierHref(tier, '/menu', locale) },
        ])}
      />

      <Hero
        imageKey="heroMenu"
        size="short"
        locale={locale}
        eyebrow={ar ? 'تُحدَّث أسبوعياً' : 'Updated weekly'}
        heading={ar ? 'القائمة' : 'The menu'}
        lede={
          ar
            ? 'الأسعار بالدرهم وشاملة الضريبة. القهوة أحادية المصدر على بار التقطير تتغيّر كل أسبوعين.'
            : 'Prices in AED and include VAT. The single origin on the brew bar changes every fortnight — the card by the grinder tells you what is on.'
        }
      />

      <div className="container-page pt-[var(--space-xl)] pb-[var(--section-y)]">
        <MenuBrowser categories={categories} dict={dict} locale={locale} showImages />
      </div>
    </>
  );
}
