import { Section } from '@/components/sections/section';
import type { MenuItemView } from '@/components/menu/menu-item-card';
import type { Locale } from '@/lib/i18n/dictionaries';

/**
 * Every dish against every allergen, in one grid.
 *
 * Tier 2 and above. Tier 1 puts allergen chips on each item, which is fine
 * for someone browsing. This is for the other case: somebody with a real
 * allergy who needs to scan the whole menu at once and find the three things
 * they can actually eat, without opening forty cards.
 *
 * Two structural decisions that matter more than they look:
 *
 *  • It is a real `<table>` with `scope` on every header. A screen reader
 *    announces "Karak Chai, Milk: contains" — which is the entire point, and
 *    which a grid of divs cannot do at any amount of ARIA.
 *  • The mark is never colour alone. A filled dot *and* visually-hidden text
 *    carry the meaning, because roughly one in twelve men cannot rely on the
 *    colour and this is precisely the wrong page to make them guess.
 */

const ALLERGENS = [
  'Gluten',
  'Milk',
  'Egg',
  'Soya',
  'Sesame',
  'Fish',
  'Almond',
  'Pistachio',
] as const;

const ALLERGEN_AR: Record<(typeof ALLERGENS)[number], string> = {
  Gluten: 'غلوتين',
  Milk: 'حليب',
  Egg: 'بيض',
  Soya: 'صويا',
  Sesame: 'سمسم',
  Fish: 'سمك',
  Almond: 'لوز',
  Pistachio: 'فستق',
};

interface MenuCategoryView {
  readonly id: string;
  readonly name: string;
  readonly items: readonly MenuItemView[];
}

export function AllergenMatrix({
  categories,
  locale,
}: {
  categories: readonly MenuCategoryView[];
  locale: Locale;
}) {
  const ar = locale === 'ar';
  const items = categories.flatMap((c) => c.items);
  if (items.length === 0) return null;

  return (
    <Section
      id="allergens"
      eyebrow={ar ? 'الجدول الكامل' : 'The full grid'}
      heading={ar ? 'مسببات الحساسية' : 'Allergens, all of it at once'}
      lede={
        ar
          ? 'كل طبق مقابل كل مادة مسببة للحساسية. مطبخنا ليس خالياً من المكسرات أو الغلوتين — نحضّر كل شيء في غرفة واحدة، ونقولها بوضوح.'
          : 'Every dish against every allergen. Our kitchen is not nut-free or gluten-free — it is one room and everything is made in it — so treat this as information, not a guarantee.'
      }
    >
      <div className="border-line overflow-x-auto rounded-[var(--radius-lg)] border">
        <table className="w-full min-w-[42rem] border-collapse text-sm">
          <caption className="sr-only">
            {ar
              ? 'مسببات الحساسية لكل صنف في القائمة'
              : 'Allergens present in each item on the menu'}
          </caption>
          <thead>
            <tr className="bg-bg-subtle">
              <th
                scope="col"
                className="border-line sticky start-0 z-10 border-b bg-[var(--c-bg-subtle)] px-4 py-3 text-start font-bold"
              >
                {ar ? 'الصنف' : 'Item'}
              </th>
              {ALLERGENS.map((allergen) => (
                <th
                  key={allergen}
                  scope="col"
                  className="border-line text-2xs border-b px-2 py-3 font-bold tracking-[0.06em] uppercase"
                >
                  {ar ? ALLERGEN_AR[allergen] : allergen}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="even:bg-[var(--c-bg-subtle)]/45">
                <th
                  scope="row"
                  className="border-line/60 sticky start-0 z-10 border-b bg-[var(--c-bg)] px-4 py-2.5 text-start font-semibold even:bg-[var(--c-bg-subtle)]"
                >
                  {item.name}
                </th>
                {ALLERGENS.map((allergen) => {
                  const present = item.allergens.includes(allergen);
                  return (
                    <td key={allergen} className="border-line/60 border-b px-2 py-2.5 text-center">
                      {/* The dot is decoration; the words are the data. */}
                      <span
                        aria-hidden="true"
                        className={
                          present
                            ? 'bg-accent inline-block size-2.5 rounded-full'
                            : 'inline-block h-px w-2.5 bg-[var(--c-text-faint)]/25 align-middle'
                        }
                      />
                      <span className="sr-only">
                        {present
                          ? ar
                            ? 'يحتوي'
                            : 'contains'
                          : ar
                            ? 'لا يحتوي'
                            : 'does not contain'}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-faint mt-4 text-xs">
        {ar
          ? 'إن كانت لديك حساسية، أخبر من يخدمك قبل أن تطلب. سنقول لك بصدق إن كنا لا نستطيع تقديم شيء بأمان.'
          : 'If you have an allergy, tell whoever serves you before you order. We will tell you honestly when we cannot serve something safely.'}
      </p>
    </Section>
  );
}
