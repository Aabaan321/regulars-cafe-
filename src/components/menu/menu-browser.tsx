'use client';

import { useMemo, useState } from 'react';
import { MenuItemCard, type MenuItemView } from '@/components/menu/menu-item-card';
import { dietaryLabels, type DietaryTag } from '@/lib/content/menu-display';
import { fill, type Dictionary, type Locale } from '@/lib/i18n/dictionaries';

export interface MenuCategoryView {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly serviceNote?: string | null;
  readonly items: readonly MenuItemView[];
}

/**
 * The filterable menu.
 *
 * Category tabs are anchors, not buttons: with JavaScript off they jump to the
 * section, and with it on they filter in place. Dietary filters are toggle
 * chips with `aria-pressed`, and the result count is announced politely so a
 * screen-reader user knows the list changed under them.
 */
export function MenuBrowser({
  categories,
  dict,
  locale = 'en',
  showImages = true,
  renderAction,
}: {
  categories: readonly MenuCategoryView[];
  dict: Dictionary;
  locale?: Locale;
  showImages?: boolean;
  renderAction?: (item: MenuItemView) => React.ReactNode;
}) {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [diets, setDiets] = useState<readonly DietaryTag[]>([]);

  const availableDiets = useMemo(() => {
    const set = new Set<DietaryTag>();
    for (const c of categories) for (const i of c.items) for (const d of i.dietary) set.add(d);
    return [...set].sort();
  }, [categories]);

  const filtered = useMemo(() => {
    return categories
      .filter((c) => activeCategory === 'all' || c.id === activeCategory)
      .map((c) => ({
        ...c,
        items: c.items.filter((i) => diets.every((d) => i.dietary.includes(d))),
      }))
      .filter((c) => c.items.length > 0);
  }, [categories, activeCategory, diets]);

  const total = filtered.reduce((sum, c) => sum + c.items.length, 0);

  function toggleDiet(tag: DietaryTag) {
    setDiets((current) =>
      current.includes(tag) ? current.filter((d) => d !== tag) : [...current, tag],
    );
  }

  return (
    <div>
      <div className="border-line bg-bg/92 sticky top-[var(--header-h)] z-20 -mx-[var(--gutter)] border-b px-[var(--gutter)] py-3 backdrop-blur-md">
        <h2 className="sr-only">{dict.menu.filterHeading}</h2>

        {/*
          `max-w-full min-w-0` is what stops this row widening the document.
          `overflow-x-auto` alone does not: a flex or grid item defaults to
          `min-width: auto`, so the box grows to fit its content and the
          scroll never engages — the page just gets wider. On a 390px phone
          that rendered the whole menu at 654px, every other section squeezed
          to accommodate a row of chips.
        */}
        <div className="-mx-1 flex max-w-full min-w-0 snap-x [scrollbar-width:none] gap-1.5 overflow-x-auto px-1 pb-1 [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            className="chip snap-start"
            aria-pressed={activeCategory === 'all'}
            onClick={() => setActiveCategory('all')}
          >
            {dict.menu.all}
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              className="chip snap-start whitespace-nowrap"
              aria-pressed={activeCategory === category.id}
              onClick={() => setActiveCategory(category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>

        {availableDiets.length > 0 ? (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="text-faint text-2xs me-1 font-bold tracking-wide uppercase">
              {dict.menu.dietaryHeading}
            </span>
            {availableDiets.map((tag) => (
              <button
                key={tag}
                type="button"
                className="chip"
                aria-pressed={diets.includes(tag)}
                onClick={() => toggleDiet(tag)}
              >
                {dietaryLabels[tag][locale]}
              </button>
            ))}
            {diets.length > 0 ? (
              <button
                type="button"
                className="text-accent text-2xs ms-1 font-bold underline"
                onClick={() => setDiets([])}
              >
                {dict.menu.clearFilters}
              </button>
            ) : null}
          </div>
        ) : null}

        <p aria-live="polite" className="sr-only">
          {fill(dict.menu.itemsCount, { count: total }, locale)}
        </p>
      </div>

      {filtered.length === 0 ? (
        <div className="border-line bg-bg-subtle mt-10 rounded-[var(--radius-lg)] border border-dashed p-10 text-center">
          <p className="font-display text-xl">{dict.menu.noResults}</p>
          <p className="text-muted mx-auto mt-2 max-w-[28rem] text-xs">{dict.menu.noResultsHint}</p>
          <button
            type="button"
            className="btn btn-secondary btn-sm mt-5"
            onClick={() => {
              setDiets([]);
              setActiveCategory('all');
            }}
          >
            {dict.menu.clearFilters}
          </button>
        </div>
      ) : (
        <div className="mt-10 flex flex-col gap-[var(--space-2xl)]">
          {filtered.map((category) => (
            <section
              key={category.id}
              id={`category-${category.id}`}
              aria-labelledby={`h-${category.id}`}
            >
              <header className="mb-4">
                <h3 id={`h-${category.id}`} className="display-3">
                  {category.name}
                </h3>
                {category.description ? (
                  <p className="text-muted measure mt-2 text-xs leading-relaxed">
                    {category.description}
                  </p>
                ) : null}
                {category.serviceNote ? (
                  <p className="text-accent text-2xs mt-2 font-bold">{category.serviceNote}</p>
                ) : null}
              </header>
              <ul className="flex flex-col">
                {category.items.map((item) => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    locale={locale}
                    showImage={showImages}
                    action={renderAction?.(item)}
                  />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <p className="text-faint measure text-2xs mt-[var(--space-xl)] leading-relaxed">
        {dict.menu.allergenNote}
      </p>
    </div>
  );
}
