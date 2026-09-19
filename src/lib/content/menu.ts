/**
 * The menu, as structured data.
 *
 * This file is the source of truth for Tier 1 (which renders it directly) and
 * the seed source for Tier 2 (where the admin menu editor writes to Postgres
 * and the site reads from the database instead). `npm run seed` copies these
 * rows into `menu_categories`, `menu_items`, `modifier_groups` and
 * `modifier_options`.
 *
 * Prices are integer **fils** — 1 AED = 100 fils — so carts, Stripe line items
 * and loyalty maths never touch a float. Use `formatPrice()` to display.
 */

import {
  dietaryLabels,
  formatPrice,
  type DietaryTag,
  type MenuBadge,
} from '@/lib/content/menu-display';

// Re-exported so server-side callers can keep importing everything menu-shaped
// from one place. Client components must import from `menu-display` directly —
// importing from here pulls the whole catalogue into the browser bundle.
export { formatPrice, dietaryLabels };
export type { DietaryTag, MenuBadge };

export interface ModifierOption {
  readonly id: string;
  readonly label: string;
  readonly labelAr: string;
  /** Added to the line price, in fils. May be 0. */
  readonly priceDeltaFils: number;
  readonly isDefault?: boolean;
}

export interface ModifierGroup {
  readonly id: string;
  readonly label: string;
  readonly labelAr: string;
  /** `single` renders radios, `multi` renders checkboxes. */
  readonly select: 'single' | 'multi';
  /** Minimum number of options the guest must pick. 0 = optional. */
  readonly min: number;
  /** Maximum number of options the guest may pick. */
  readonly max: number;
  readonly options: readonly ModifierOption[];
}

export interface MenuCategory {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly nameAr: string;
  readonly description: string;
  readonly descriptionAr: string;
  readonly sortOrder: number;
  /** Shown under the category heading, e.g. service-window caveats. */
  readonly serviceNote?: string;
  readonly serviceNoteAr?: string;
}

export interface MenuItem {
  readonly id: string;
  readonly slug: string;
  readonly categoryId: string;
  readonly name: string;
  readonly nameAr: string;
  readonly description: string;
  readonly descriptionAr: string;
  readonly priceFils: number;
  readonly dietary: readonly DietaryTag[];
  /** Plain-language allergen list shown in the item detail sheet. */
  readonly allergens: readonly string[];
  readonly badges: readonly MenuBadge[];
  /** False keeps the item on the menu but greyed out with a reason. */
  readonly available: boolean;
  readonly unavailableReason?: string;
  /** Tier 2 online ordering. Some items (Chemex for two) are dine-in only. */
  readonly orderable: boolean;
  readonly modifierGroupIds: readonly string[];
  /** Key into `src/lib/content/images.ts` → `menuImages`. */
  readonly imageKey?: string;
  readonly sortOrder: number;
}

/* ── Modifier groups ──────────────────────────────────────────────────────── */

export const modifierGroups: readonly ModifierGroup[] = [
  {
    id: 'milk',
    label: 'Milk',
    labelAr: 'الحليب',
    select: 'single',
    min: 1,
    max: 1,
    options: [
      {
        id: 'milk-full',
        label: 'Full fat',
        labelAr: 'كامل الدسم',
        priceDeltaFils: 0,
        isDefault: true,
      },
      { id: 'milk-skim', label: 'Skimmed', labelAr: 'خالي الدسم', priceDeltaFils: 0 },
      { id: 'milk-oat', label: 'Barista oat', labelAr: 'شوفان', priceDeltaFils: 400 },
      { id: 'milk-almond', label: 'Almond', labelAr: 'لوز', priceDeltaFils: 400 },
      { id: 'milk-lactose', label: 'Lactose free', labelAr: 'خالي اللاكتوز', priceDeltaFils: 300 },
      { id: 'milk-camel', label: 'Camel milk', labelAr: 'حليب الإبل', priceDeltaFils: 600 },
    ],
  },
  {
    id: 'size',
    label: 'Size',
    labelAr: 'الحجم',
    select: 'single',
    min: 1,
    max: 1,
    options: [
      {
        id: 'size-regular',
        label: 'Regular — 240ml',
        labelAr: 'عادي — ٢٤٠ مل',
        priceDeltaFils: 0,
        isDefault: true,
      },
      { id: 'size-large', label: 'Large — 350ml', labelAr: 'كبير — ٣٥٠ مل', priceDeltaFils: 600 },
    ],
  },
  {
    id: 'shots',
    label: 'Extra shots',
    labelAr: 'جرعات إضافية',
    select: 'single',
    min: 0,
    max: 1,
    options: [
      {
        id: 'shots-none',
        label: 'As it comes',
        labelAr: 'بدون إضافة',
        priceDeltaFils: 0,
        isDefault: true,
      },
      { id: 'shots-one', label: 'One extra shot', labelAr: 'جرعة إضافية', priceDeltaFils: 600 },
      {
        id: 'shots-two',
        label: 'Two extra shots',
        labelAr: 'جرعتان إضافيتان',
        priceDeltaFils: 1100,
      },
    ],
  },
  {
    id: 'temp',
    label: 'Hot or iced',
    labelAr: 'ساخن أو مثلج',
    select: 'single',
    min: 1,
    max: 1,
    options: [
      { id: 'temp-hot', label: 'Hot', labelAr: 'ساخن', priceDeltaFils: 0, isDefault: true },
      { id: 'temp-iced', label: 'Iced', labelAr: 'مثلج', priceDeltaFils: 200 },
    ],
  },
  {
    id: 'syrup',
    label: 'Syrup',
    labelAr: 'شراب محلى',
    select: 'multi',
    min: 0,
    max: 2,
    options: [
      { id: 'syrup-date', label: 'House date syrup', labelAr: 'دبس التمر', priceDeltaFils: 400 },
      { id: 'syrup-vanilla', label: 'Madagascan vanilla', labelAr: 'فانيلا', priceDeltaFils: 400 },
      { id: 'syrup-cardamom', label: 'Cardamom', labelAr: 'هيل', priceDeltaFils: 400 },
    ],
  },
  {
    id: 'bread',
    label: 'Bread',
    labelAr: 'الخبز',
    select: 'single',
    min: 1,
    max: 1,
    options: [
      {
        id: 'bread-sourdough',
        label: 'House sourdough',
        labelAr: 'ساوردو',
        priceDeltaFils: 0,
        isDefault: true,
      },
      {
        id: 'bread-gf',
        label: 'Gluten-free seeded',
        labelAr: 'خالٍ من الغلوتين',
        priceDeltaFils: 600,
      },
    ],
  },
  {
    id: 'plate-adds',
    label: 'Add to the plate',
    labelAr: 'إضافات',
    select: 'multi',
    min: 0,
    max: 4,
    options: [
      { id: 'add-avocado', label: 'Smashed avocado', labelAr: 'أفوكادو', priceDeltaFils: 1400 },
      {
        id: 'add-halloumi',
        label: 'Grilled halloumi',
        labelAr: 'حلومي مشوي',
        priceDeltaFils: 1600,
      },
      { id: 'add-egg', label: 'Extra egg, any style', labelAr: 'بيضة إضافية', priceDeltaFils: 800 },
      { id: 'add-salmon', label: 'Smoked salmon', labelAr: 'سلمون مدخن', priceDeltaFils: 2200 },
      {
        id: 'add-zaatar',
        label: 'Za’atar & olive oil',
        labelAr: 'زعتر وزيت زيتون',
        priceDeltaFils: 500,
      },
    ],
  },
  {
    id: 'grind',
    label: 'Grind',
    labelAr: 'الطحن',
    select: 'single',
    min: 1,
    max: 1,
    options: [
      {
        id: 'grind-whole',
        label: 'Whole bean',
        labelAr: 'حبوب كاملة',
        priceDeltaFils: 0,
        isDefault: true,
      },
      {
        id: 'grind-filter',
        label: 'Ground for filter',
        labelAr: 'مطحون للتقطير',
        priceDeltaFils: 0,
      },
      {
        id: 'grind-espresso',
        label: 'Ground for espresso',
        labelAr: 'مطحون للإسبريسو',
        priceDeltaFils: 0,
      },
      {
        id: 'grind-moka',
        label: 'Ground for moka pot',
        labelAr: 'مطحون للموكا',
        priceDeltaFils: 0,
      },
    ],
  },
] as const;

/* ── Categories ───────────────────────────────────────────────────────────── */

export const menuCategories: readonly MenuCategory[] = [
  {
    id: 'espresso',
    slug: 'espresso-bar',
    name: 'Espresso Bar',
    nameAr: 'بار الإسبريسو',
    description:
      'Our house blend runs on the left-hand grinder all day. The right-hand grinder rotates a single origin every fortnight — ask what is on, it is usually the better cup.',
    descriptionAr:
      'الخلطة الخاصة تُطحن على اليسار طوال اليوم، وعلى اليمين قهوة أحادية المصدر تتغيّر كل أسبوعين. اسأل الباريستا عمّا هو متاح اليوم.',
    sortOrder: 1,
  },
  {
    id: 'brew',
    slug: 'brew-bar',
    name: 'Brew Bar',
    nameAr: 'بار التقطير',
    description:
      'Filter coffee, brewed to order on the bar you can see. Four to six minutes, and worth the wait.',
    descriptionAr: 'قهوة مقطّرة تُحضّر أمامك على البار. من أربع إلى ست دقائق، وتستحق الانتظار.',
    sortOrder: 2,
    serviceNote: 'Brewed to order — allow 6 minutes at peak.',
    serviceNoteAr: 'تُحضّر عند الطلب — يُرجى إتاحة ٦ دقائق في أوقات الذروة.',
  },
  {
    id: 'not-coffee',
    slug: 'not-coffee',
    name: 'Not Coffee',
    nameAr: 'مشروبات أخرى',
    description:
      'Made with the same fuss as the coffee. The karak is a proper one — boiled, not steamed.',
    descriptionAr: 'تُحضّر بالعناية نفسها. الكرك لدينا يُغلى على النار، لا يُبخّر.',
    sortOrder: 3,
  },
  {
    id: 'breakfast',
    slug: 'breakfast',
    name: 'Breakfast',
    nameAr: 'الإفطار',
    description: 'Served from open until close. Breakfast at 4pm is a human right.',
    descriptionAr: 'يُقدّم من الافتتاح حتى الإغلاق. الإفطار في الرابعة عصراً حق مكفول.',
    sortOrder: 4,
  },
  {
    id: 'brunch',
    slug: 'brunch-plates',
    name: 'Brunch Plates',
    nameAr: 'أطباق البرانش',
    description:
      'The bigger plates. Everything is cooked to order in an open kitchen eight metres from your table.',
    descriptionAr:
      'الأطباق الرئيسية، تُطهى عند الطلب في مطبخ مفتوح على بُعد ثمانية أمتار من طاولتك.',
    sortOrder: 5,
    serviceNote: 'Kitchen closes 45 minutes before the café — see today’s hours.',
    serviceNoteAr: 'يغلق المطبخ قبل إغلاق المقهى بـ ٤٥ دقيقة — راجع مواعيد اليوم.',
  },
  {
    id: 'sandwiches',
    slug: 'sandwiches-and-toasts',
    name: 'Sandwiches & Toasts',
    nameAr: 'السندويتشات والتوست',
    description: 'Pressed to order on bread baked here at 5am.',
    descriptionAr: 'تُحضّر عند الطلب بخبزٍ يُخبز هنا عند الخامسة فجراً.',
    sortOrder: 6,
  },
  {
    id: 'bakery',
    slug: 'bakery',
    name: 'Bakery',
    nameAr: 'المخبوزات',
    description:
      'Laminated overnight, baked at dawn. When it is gone it is gone — we do not bake twice.',
    descriptionAr: 'تُحضّر ليلاً وتُخبز فجراً. وعندما تنفد، تنفد — لا نخبز مرتين في اليوم.',
    sortOrder: 7,
  },
  {
    id: 'retail',
    slug: 'beans-to-take-home',
    name: 'Beans to Take Home',
    nameAr: 'حبوب للمنزل',
    description:
      'Roasted in the back on a 5kg Giesen, every Tuesday and Friday. Bags are stamped with the roast date, not a best-before.',
    descriptionAr:
      'تُحمّص في الخلف على محمصة جيسن سعة ٥ كجم كل ثلاثاء وجمعة. يُختم على كل كيس تاريخ التحميص لا تاريخ الانتهاء.',
    sortOrder: 8,
  },
] as const;

/* ── Items ────────────────────────────────────────────────────────────────── */

export const menuItems: readonly MenuItem[] = [
  /* Espresso Bar */
  {
    id: 'espresso',
    slug: 'espresso',
    categoryId: 'espresso',
    name: 'Espresso',
    nameAr: 'إسبريسو',
    description:
      'House blend — Brazil Cerrado and Ethiopia Guji. Cocoa, dried apricot, a long sweet finish.',
    descriptionAr: 'الخلطة الخاصة من البرازيل وإثيوبيا. كاكاو ومشمش مجفف ونهاية حلوة طويلة.',
    priceFils: 1800,
    dietary: ['vegan', 'gluten-free'],
    allergens: [],
    badges: [],
    available: true,
    orderable: true,
    modifierGroupIds: ['shots'],
    imageKey: 'espresso',
    sortOrder: 1,
  },
  {
    id: 'macchiato',
    slug: 'macchiato',
    categoryId: 'espresso',
    name: 'Macchiato',
    nameAr: 'ماكياتو',
    description:
      'A double ristretto marked with a thumb of milk. The barista’s own order, most mornings.',
    descriptionAr: 'ريستريتو مزدوج مع قليل من الحليب. طلب الباريستا المفضّل في معظم الصباحات.',
    priceFils: 2000,
    dietary: ['vegetarian', 'gluten-free'],
    allergens: ['Milk'],
    badges: [],
    available: true,
    orderable: true,
    modifierGroupIds: ['milk', 'shots'],
    sortOrder: 2,
  },
  {
    id: 'cortado',
    slug: 'cortado',
    categoryId: 'espresso',
    name: 'Cortado',
    nameAr: 'كورتادو',
    description: 'Equal parts espresso and milk in a 120ml glass. Nothing to hide behind.',
    descriptionAr: 'إسبريسو وحليب بنسب متساوية في كوب ١٢٠ مل. لا شيء يختبئ خلفه.',
    priceFils: 2200,
    dietary: ['vegetarian', 'gluten-free'],
    allergens: ['Milk'],
    badges: [],
    available: true,
    orderable: true,
    modifierGroupIds: ['milk', 'shots'],
    sortOrder: 3,
  },
  {
    id: 'flat-white',
    slug: 'flat-white',
    categoryId: 'espresso',
    name: 'Flat White',
    nameAr: 'فلات وايت',
    description:
      'Two ristretto shots, 150ml of milk stretched to a glossy 60°C. Our most-ordered drink by a distance.',
    descriptionAr: 'جرعتا ريستريتو مع ١٥٠ مل حليب عند ٦٠ درجة. المشروب الأكثر طلباً بفارق كبير.',
    priceFils: 2600,
    dietary: ['vegetarian', 'gluten-free'],
    allergens: ['Milk'],
    badges: ['signature'],
    available: true,
    orderable: true,
    modifierGroupIds: ['milk', 'shots'],
    imageKey: 'flatWhite',
    sortOrder: 4,
  },
  {
    id: 'cappuccino',
    slug: 'cappuccino',
    categoryId: 'espresso',
    name: 'Cappuccino',
    nameAr: 'كابتشينو',
    description:
      'The traditional 180ml, with the foam depth an Italian would recognise. Cocoa on request, not by default.',
    descriptionAr: 'كابتشينو تقليدي ١٨٠ مل برغوة بالسماكة الصحيحة. الكاكاو عند الطلب فقط.',
    priceFils: 2600,
    dietary: ['vegetarian', 'gluten-free'],
    allergens: ['Milk'],
    badges: [],
    available: true,
    orderable: true,
    modifierGroupIds: ['milk', 'shots'],
    sortOrder: 5,
  },
  {
    id: 'latte',
    slug: 'latte',
    categoryId: 'espresso',
    name: 'Latte',
    nameAr: 'لاتيه',
    description:
      'Long, milky, gentle. Ask for it on the single origin if you want the fruit to come through.',
    descriptionAr: 'طويل وحليبي وهادئ. اطلبه بالقهوة أحادية المصدر إن أردت نكهة الفاكهة.',
    priceFils: 2800,
    dietary: ['vegetarian', 'gluten-free'],
    allergens: ['Milk'],
    badges: [],
    available: true,
    orderable: true,
    modifierGroupIds: ['milk', 'size', 'shots', 'syrup', 'temp'],
    sortOrder: 6,
  },
  {
    id: 'spanish-latte',
    slug: 'spanish-latte',
    categoryId: 'espresso',
    name: 'Spanish Latte',
    nameAr: 'لاتيه إسباني',
    description:
      'Condensed milk, espresso, a pinch of salt to keep it from cloying. Dubai’s drink, made properly.',
    descriptionAr:
      'حليب مكثّف وإسبريسو ورشّة ملح تمنع الإفراط في الحلاوة. مشروب دبي، محضّر كما يجب.',
    priceFils: 3000,
    dietary: ['vegetarian', 'gluten-free'],
    allergens: ['Milk'],
    badges: [],
    available: true,
    orderable: true,
    modifierGroupIds: ['size', 'shots', 'temp'],
    sortOrder: 7,
  },
  {
    id: 'date-cardamom-latte',
    slug: 'date-cardamom-latte',
    categoryId: 'espresso',
    name: 'Date & Cardamom Latte',
    nameAr: 'لاتيه التمر والهيل',
    description:
      'Khalas dates from Liwa, simmered down with green cardamom into a syrup we make on Sundays. Sweet without sugar.',
    descriptionAr:
      'تمر خلاص من ليوا يُطهى مع الهيل الأخضر ليصبح دبساً نحضّره كل أحد. حلاوة بلا سكر مضاف.',
    priceFils: 3400,
    dietary: ['vegetarian', 'gluten-free'],
    allergens: ['Milk'],
    badges: ['signature', 'new'],
    available: true,
    orderable: true,
    modifierGroupIds: ['milk', 'size', 'shots', 'temp'],
    sortOrder: 8,
  },
  {
    id: 'iced-latte',
    slug: 'iced-latte',
    categoryId: 'espresso',
    name: 'Iced Latte',
    nameAr: 'لاتيه مثلج',
    description: 'Poured over coffee ice cubes so the last mouthful tastes like the first.',
    descriptionAr: 'يُسكب على مكعبات ثلج من القهوة، فتبقى الرشفة الأخيرة بطعم الأولى.',
    priceFils: 3000,
    dietary: ['vegetarian', 'gluten-free'],
    allergens: ['Milk'],
    badges: [],
    available: true,
    orderable: true,
    modifierGroupIds: ['milk', 'size', 'shots', 'syrup'],
    sortOrder: 9,
  },
  {
    id: 'affogato',
    slug: 'affogato',
    categoryId: 'espresso',
    name: 'Affogato',
    nameAr: 'أفوجاتو',
    description: 'A double shot over Sicilian pistachio gelato from Al Quoz. Eat it fast.',
    descriptionAr: 'جرعة مزدوجة فوق جيلاتو الفستق الصقلي. تناوله بسرعة.',
    priceFils: 3200,
    dietary: ['vegetarian', 'contains-nuts'],
    allergens: ['Milk', 'Pistachio'],
    badges: [],
    available: true,
    orderable: false,
    modifierGroupIds: [],
    sortOrder: 10,
  },

  /* Brew Bar */
  {
    id: 'batch-filter',
    slug: 'batch-filter',
    categoryId: 'brew',
    name: 'Batch Filter',
    nameAr: 'قهوة مقطرة',
    description:
      'Brewed every 40 minutes and dumped if it sits longer. Free refills before 9am, because we like you.',
    descriptionAr:
      'تُحضّر كل ٤٠ دقيقة وتُستبدل إن تجاوزت ذلك. إعادة تعبئة مجانية قبل التاسعة صباحاً.',
    priceFils: 2400,
    dietary: ['vegan', 'gluten-free'],
    allergens: [],
    badges: [],
    available: true,
    orderable: true,
    modifierGroupIds: ['size', 'temp'],
    sortOrder: 1,
  },
  {
    id: 'v60',
    slug: 'v60-single-origin',
    categoryId: 'brew',
    name: 'V60 Single Origin',
    nameAr: 'في٦٠ أحادي المصدر',
    description:
      'One coffee, 15g in, 250g out, brewed on the bar while you watch. The card next to the grinder tells you the farm, the altitude and what we taste.',
    descriptionAr:
      'قهوة واحدة، ١٥ غراماً تُنتج ٢٥٠ غراماً، تُحضّر أمامك. البطاقة بجانب المطحنة تذكر المزرعة والارتفاع والنكهات.',
    priceFils: 3400,
    dietary: ['vegan', 'gluten-free'],
    allergens: [],
    badges: ['signature'],
    available: true,
    orderable: true,
    modifierGroupIds: [],
    imageKey: 'pourOver',
    sortOrder: 2,
  },
  {
    id: 'chemex-two',
    slug: 'chemex-for-two',
    categoryId: 'brew',
    name: 'Chemex for Two',
    nameAr: 'كيمكس لشخصين',
    description: '600ml on a carafe with two cups. The most civilised thing on this menu.',
    descriptionAr: '٦٠٠ مل في دورق مع كوبين. أرقى ما في هذه القائمة.',
    priceFils: 5800,
    dietary: ['vegan', 'gluten-free'],
    allergens: [],
    badges: [],
    available: true,
    orderable: false,
    modifierGroupIds: [],
    sortOrder: 3,
  },
  {
    id: 'cold-brew',
    slug: 'cold-brew',
    categoryId: 'brew',
    name: 'Cold Brew',
    nameAr: 'قهوة باردة التحضير',
    description: 'Eighteen hours at 4°C on a Colombian washed lot. Low acidity, high consequence.',
    descriptionAr: 'ثمانية عشر ساعة عند ٤ درجات على قهوة كولومبية مغسولة. حموضة منخفضة وأثر قوي.',
    priceFils: 3000,
    dietary: ['vegan', 'gluten-free'],
    allergens: [],
    badges: [],
    available: true,
    orderable: true,
    modifierGroupIds: ['size'],
    imageKey: 'coldBrew',
    sortOrder: 4,
  },
  {
    id: 'nitro',
    slug: 'nitro-cold-brew',
    categoryId: 'brew',
    name: 'Nitro Cold Brew',
    nameAr: 'نيترو كولد برو',
    description:
      'The same cold brew, pushed through nitrogen. Arrives looking like a stout and drinks like cream.',
    descriptionAr: 'القهوة الباردة نفسها مع النيتروجين. تبدو كالبيرة الداكنة ومذاقها كالقشدة.',
    priceFils: 3600,
    dietary: ['vegan', 'gluten-free'],
    allergens: [],
    badges: ['new'],
    available: true,
    orderable: true,
    modifierGroupIds: [],
    sortOrder: 5,
  },
  {
    id: 'espresso-tonic',
    slug: 'espresso-tonic',
    categoryId: 'brew',
    name: 'Espresso Tonic',
    nameAr: 'إسبريسو تونيك',
    description:
      'Fever-Tree, a double ristretto, and a strip of orange peel. Order it at 4pm in July and thank us.',
    descriptionAr: 'ماء تونيك مع ريستريتو مزدوج وقشر برتقال. اطلبه في الرابعة عصراً في يوليو.',
    priceFils: 3400,
    dietary: ['vegan', 'gluten-free'],
    allergens: [],
    badges: [],
    available: true,
    orderable: true,
    modifierGroupIds: [],
    sortOrder: 6,
  },

  /* Not Coffee */
  {
    id: 'matcha-latte',
    slug: 'ceremonial-matcha-latte',
    categoryId: 'not-coffee',
    name: 'Ceremonial Matcha Latte',
    nameAr: 'ماتشا لاتيه',
    description: 'First-harvest Uji matcha, whisked not blended. Grassy and sweet, never bitter.',
    descriptionAr: 'ماتشا أوجي من الحصاد الأول، تُخفق يدوياً. عشبية وحلوة، وليست مرّة.',
    priceFils: 3200,
    dietary: ['vegetarian', 'gluten-free'],
    allergens: ['Milk'],
    badges: [],
    available: true,
    orderable: true,
    modifierGroupIds: ['milk', 'size', 'temp'],
    sortOrder: 1,
  },
  {
    id: 'iced-matcha-orange',
    slug: 'iced-matcha-orange-blossom',
    categoryId: 'not-coffee',
    name: 'Iced Matcha with Orange Blossom',
    nameAr: 'ماتشا مثلجة بماء الزهر',
    description:
      'Matcha, oat milk and two drops of Lebanese orange blossom water. Tastes like a Gulf summer evening.',
    descriptionAr: 'ماتشا وحليب الشوفان وقطرتان من ماء الزهر اللبناني. بطعم أمسية خليجية صيفية.',
    priceFils: 3600,
    dietary: ['vegan', 'dairy-free', 'gluten-free'],
    allergens: [],
    badges: ['new'],
    available: true,
    orderable: true,
    modifierGroupIds: ['size'],
    sortOrder: 2,
  },
  {
    id: 'karak',
    slug: 'karak-chai',
    categoryId: 'not-coffee',
    name: 'Karak Chai',
    nameAr: 'كرك',
    description:
      'Boiled on the stove for eleven minutes with evaporated milk, cardamom and saffron. Sold at a cafeteria price on purpose.',
    descriptionAr:
      'يُغلى على النار إحدى عشرة دقيقة مع الحليب المبخّر والهيل والزعفران. بسعر الكافتيريا عن قصد.',
    priceFils: 1800,
    dietary: ['vegetarian', 'gluten-free'],
    allergens: ['Milk'],
    badges: ['signature'],
    available: true,
    orderable: true,
    modifierGroupIds: ['size'],
    imageKey: 'karak',
    sortOrder: 3,
  },
  {
    id: 'black-tea',
    slug: 'single-estate-black-tea',
    categoryId: 'not-coffee',
    name: 'Single Estate Black Tea',
    nameAr: 'شاي أسود',
    description: 'A second-flush Assam, leaf not bag, with a three-minute timer on the saucer.',
    descriptionAr: 'شاي آسام من القطفة الثانية، أوراق لا أكياس، مع مؤقّت ثلاث دقائق.',
    priceFils: 2200,
    dietary: ['vegan', 'gluten-free'],
    allergens: [],
    badges: [],
    available: true,
    orderable: true,
    modifierGroupIds: ['temp'],
    sortOrder: 4,
  },
  {
    id: 'mint-liquorice',
    slug: 'mint-and-liquorice-tisane',
    categoryId: 'not-coffee',
    name: 'Mint & Liquorice Tisane',
    nameAr: 'نعناع وعرق سوس',
    description:
      'Caffeine free, naturally sweet, and the thing we give you when you say you are off coffee.',
    descriptionAr: 'خالٍ من الكافيين وحلو بطبيعته. ما نقدّمه لك حين تقول إنك تركت القهوة.',
    priceFils: 2200,
    dietary: ['vegan', 'gluten-free'],
    allergens: [],
    badges: [],
    available: true,
    orderable: true,
    modifierGroupIds: [],
    sortOrder: 5,
  },
  {
    id: 'hot-chocolate',
    slug: 'dark-hot-chocolate',
    categoryId: 'not-coffee',
    name: '70% Dark Hot Chocolate',
    nameAr: 'شوكولاتة ساخنة',
    description:
      'Valrhona melted into milk, no powder anywhere near it. Thick enough to coat the spoon.',
    descriptionAr: 'شوكولاتة فالرونا تذوب في الحليب، بلا أي مسحوق. كثيفة بما يكفي لتغلّف الملعقة.',
    priceFils: 3000,
    dietary: ['vegetarian'],
    allergens: ['Milk', 'Soya'],
    badges: [],
    available: true,
    orderable: true,
    modifierGroupIds: ['milk', 'size'],
    sortOrder: 6,
  },

  /* Breakfast */
  {
    id: 'sourdough-zaatar',
    slug: 'sourdough-butter-zaatar',
    categoryId: 'breakfast',
    name: 'Sourdough, Cultured Butter & Za’atar',
    nameAr: 'ساوردو بالزبدة والزعتر',
    description:
      'Two thick slices from the morning bake, salted cultured butter, and a za’atar blend a regular’s mother sends us from Jenin.',
    descriptionAr:
      'شريحتان سميكتان من خبز الصباح مع زبدة مملّحة وخلطة زعتر ترسلها لنا والدة أحد زبائننا من جنين.',
    priceFils: 3200,
    dietary: ['vegetarian'],
    allergens: ['Gluten', 'Milk', 'Sesame'],
    badges: [],
    available: true,
    orderable: true,
    modifierGroupIds: ['bread', 'plate-adds'],
    sortOrder: 1,
  },
  {
    id: 'bircher',
    slug: 'bircher-date-molasses',
    categoryId: 'breakfast',
    name: 'Bircher with Date Molasses',
    nameAr: 'بيرشر بدبس التمر',
    description:
      'Oats soaked overnight in apple juice, date molasses, toasted almonds, a spoon of labneh on top.',
    descriptionAr: 'شوفان منقوع ليلة كاملة في عصير التفاح مع دبس التمر واللوز المحمّص وملعقة لبنة.',
    priceFils: 4200,
    dietary: ['vegetarian', 'contains-nuts'],
    allergens: ['Gluten', 'Milk', 'Almond'],
    badges: [],
    available: true,
    orderable: true,
    modifierGroupIds: [],
    sortOrder: 2,
  },
  {
    id: 'omelette',
    slug: 'three-egg-omelette',
    categoryId: 'breakfast',
    name: 'Three-Egg Omelette',
    nameAr: 'أومليت ثلاث بيضات',
    description: 'Free-range eggs, gruyère, chives, and a dressed leaf salad. Folded, not browned.',
    descriptionAr: 'بيض طليق مع جبن الغرويير والثوم المعمّر وسلطة خضراء. مطوي وغير محمّر.',
    priceFils: 5200,
    dietary: ['vegetarian', 'gluten-free'],
    allergens: ['Egg', 'Milk'],
    badges: [],
    available: true,
    orderable: true,
    modifierGroupIds: ['plate-adds'],
    sortOrder: 3,
  },
  {
    id: 'shakshuka',
    slug: 'regulars-shakshuka',
    categoryId: 'breakfast',
    name: 'Regulars Shakshuka',
    nameAr: 'شكشوكة ريقيولرز',
    description:
      'Slow-cooked San Marzano and roasted red pepper, two eggs baked in, feta, and a whole lot of bread. The plate we are known for.',
    descriptionAr:
      'طماطم سان مارزانو وفلفل أحمر مشوي يُطهى ببطء، مع بيضتين وجبن الفيتا وكثير من الخبز. الطبق الذي نُعرف به.',
    priceFils: 6200,
    dietary: ['vegetarian', 'spicy'],
    allergens: ['Egg', 'Milk', 'Gluten'],
    badges: ['signature'],
    available: true,
    orderable: true,
    modifierGroupIds: ['bread', 'plate-adds'],
    sortOrder: 4,
  },
  {
    id: 'labneh-bowl',
    slug: 'labneh-bowl',
    categoryId: 'breakfast',
    name: 'Labneh Bowl',
    nameAr: 'طبق لبنة',
    description:
      'House-strained labneh, olive oil pooled in the middle, cucumber, mint, sumac, warm khubz.',
    descriptionAr: 'لبنة مصفّاة في المطبخ مع زيت الزيتون والخيار والنعناع والسماق وخبز دافئ.',
    priceFils: 4800,
    dietary: ['vegetarian'],
    allergens: ['Milk', 'Gluten'],
    badges: [],
    available: true,
    orderable: true,
    modifierGroupIds: ['plate-adds'],
    sortOrder: 5,
  },
  {
    id: 'foul',
    slug: 'foul-medames',
    categoryId: 'breakfast',
    name: 'Foul Medames',
    nameAr: 'فول مدمس',
    description:
      'Fava beans crushed at the table with lemon, cumin and green chilli. Vegan without trying to be.',
    descriptionAr: 'فول يُهرس على الطاولة مع الليمون والكمون والفلفل الأخضر. نباتي بطبيعته.',
    priceFils: 4400,
    dietary: ['vegan', 'spicy'],
    allergens: ['Gluten'],
    badges: [],
    available: true,
    orderable: true,
    modifierGroupIds: ['plate-adds'],
    sortOrder: 6,
  },

  /* Brunch Plates */
  {
    id: 'truffle-mushrooms',
    slug: 'truffle-mushrooms-on-toast',
    categoryId: 'brunch',
    name: 'Truffle Mushrooms on Toast',
    nameAr: 'توست الفطر بالكمأة',
    description:
      'Shimeji, chestnut and oyster mushrooms in a cream reduction, black truffle shaved at the pass, on sourdough that holds up.',
    descriptionAr:
      'فطر شيميجي وكستنائي ومحاري في صلصة كريمية مع كمأة سوداء تُبشر عند التقديم، على خبز ساوردو متماسك.',
    priceFils: 6800,
    dietary: ['vegetarian'],
    allergens: ['Gluten', 'Milk'],
    badges: ['signature'],
    available: true,
    orderable: true,
    modifierGroupIds: ['bread', 'plate-adds'],
    sortOrder: 1,
  },
  {
    id: 'pancakes',
    slug: 'buttermilk-pancakes',
    categoryId: 'brunch',
    name: 'Buttermilk Pancakes',
    nameAr: 'بان كيك',
    description: 'Three of them, maple from Quebec, whipped mascarpone, and a handful of berries.',
    descriptionAr: 'ثلاث قطع مع شراب القيقب الكندي وكريمة الماسكاربوني والتوت.',
    priceFils: 5800,
    dietary: ['vegetarian'],
    allergens: ['Gluten', 'Egg', 'Milk'],
    badges: [],
    available: true,
    orderable: true,
    modifierGroupIds: [],
    imageKey: 'pancakes',
    sortOrder: 2,
  },
  {
    id: 'kunafa-french-toast',
    slug: 'kunafa-french-toast',
    categoryId: 'brunch',
    name: 'Kunafa French Toast',
    nameAr: 'فرنش توست بالكنافة',
    description:
      'Brioche soaked in cardamom custard, crusted in shredded kataifi, fried until it crackles. Ashta cream, pistachio, orange blossom syrup.',
    descriptionAr:
      'بريوش منقوع في كاسترد الهيل ومغلّف بالكنافة، يُقلى حتى يصبح مقرمشاً. قشطة وفستق وقطر ماء الزهر.',
    priceFils: 6400,
    dietary: ['vegetarian', 'contains-nuts'],
    allergens: ['Gluten', 'Egg', 'Milk', 'Pistachio'],
    badges: ['new', 'signature'],
    available: true,
    orderable: true,
    modifierGroupIds: [],
    imageKey: 'kunafaToast',
    sortOrder: 3,
  },
  {
    id: 'smoked-salmon',
    slug: 'smoked-salmon-dill-creme',
    categoryId: 'brunch',
    name: 'Smoked Salmon & Dill Crème',
    nameAr: 'سلمون مدخن بكريمة الشبت',
    description: 'Cold-smoked Faroese salmon, dill crème fraîche, pickled shallot, capers, rye.',
    descriptionAr: 'سلمون فارويّ مدخّن بارد مع كريم الشبت والبصل المخلّل والكبر وخبز الجاودار.',
    priceFils: 7800,
    dietary: [],
    allergens: ['Fish', 'Milk', 'Gluten'],
    badges: [],
    available: true,
    orderable: true,
    modifierGroupIds: ['plate-adds'],
    sortOrder: 4,
  },
  {
    id: 'chilli-eggs',
    slug: 'chilli-scrambled-eggs',
    categoryId: 'brunch',
    name: 'Chilli Scrambled Eggs',
    nameAr: 'بيض مخفوق حار',
    description:
      'Soft scramble, green chilli, coriander, crispy shallots, on buttered toast. Properly hot.',
    descriptionAr:
      'بيض مخفوق طري مع الفلفل الأخضر والكزبرة والبصل المقرمش على توست بالزبدة. حار فعلاً.',
    priceFils: 5600,
    dietary: ['vegetarian', 'spicy'],
    allergens: ['Egg', 'Milk', 'Gluten'],
    badges: [],
    available: true,
    orderable: true,
    modifierGroupIds: ['bread', 'plate-adds'],
    sortOrder: 5,
  },
  {
    id: 'short-rib-hash',
    slug: 'braised-short-rib-hash',
    categoryId: 'brunch',
    name: 'Braised Short Rib Hash',
    nameAr: 'هاش لحم الضلع المطهو',
    description:
      'Twelve-hour beef short rib, crushed potato, a fried egg, and a chimichurri that cuts through all of it.',
    descriptionAr:
      'ضلع بقري مطهو اثنتي عشرة ساعة مع البطاطس المهروسة وبيضة مقلية وصلصة تشيميتشوري.',
    priceFils: 8600,
    dietary: [],
    allergens: ['Egg'],
    badges: ['new'],
    available: true,
    orderable: true,
    modifierGroupIds: ['plate-adds'],
    sortOrder: 6,
  },
  {
    id: 'green-bowl',
    slug: 'green-bowl',
    categoryId: 'brunch',
    name: 'Green Bowl',
    nameAr: 'الطبق الأخضر',
    description:
      'Charred broccolini, freekeh, avocado, herbs, toasted seeds, green tahini. Vegan, and not an afterthought.',
    descriptionAr:
      'بروكليني مشوي مع الفريكة والأفوكادو والأعشاب والبذور المحمّصة وطحينة خضراء. نباتي بالكامل.',
    priceFils: 5400,
    dietary: ['vegan', 'dairy-free'],
    allergens: ['Sesame', 'Gluten'],
    badges: [],
    available: true,
    orderable: true,
    modifierGroupIds: ['plate-adds'],
    sortOrder: 7,
  },

  /* Sandwiches & Toasts */
  {
    id: 'halloumi-focaccia',
    slug: 'halloumi-harissa-focaccia',
    categoryId: 'sandwiches',
    name: 'Halloumi & Harissa Focaccia',
    nameAr: 'فوكاتشيا الحلومي والهريسة',
    description:
      'Grilled halloumi, rose harissa, roasted pepper and rocket, pressed on rosemary focaccia.',
    descriptionAr: 'حلومي مشوي مع هريسة الورد والفلفل المشوي والجرجير على فوكاتشيا بإكليل الجبل.',
    priceFils: 4800,
    dietary: ['vegetarian', 'spicy'],
    allergens: ['Gluten', 'Milk'],
    badges: [],
    available: true,
    orderable: true,
    modifierGroupIds: [],
    sortOrder: 1,
  },
  {
    id: 'shawarma-toastie',
    slug: 'chicken-shawarma-toastie',
    categoryId: 'sandwiches',
    name: 'Chicken Shawarma Toastie',
    nameAr: 'توستي شاورما الدجاج',
    description:
      'Marinated thigh meat off our own vertical grill, toum, pickles, melted akkawi. A Dubai sandwich.',
    descriptionAr:
      'أفخاذ دجاج متبّلة من السيخ مع الثوم والمخللات وجبن العكاوي الذائب. سندويتش دبيّ.',
    priceFils: 5200,
    dietary: [],
    allergens: ['Gluten', 'Milk'],
    badges: [],
    available: true,
    orderable: true,
    modifierGroupIds: [],
    sortOrder: 2,
  },
  {
    id: 'tuna-melt',
    slug: 'tuna-melt-on-sourdough',
    categoryId: 'sandwiches',
    name: 'Tuna Melt on Sourdough',
    nameAr: 'تونا ملت',
    description:
      'Line-caught tuna, celery, dill, aged cheddar, griddled in butter until the edges go lacy.',
    descriptionAr: 'تونا مصطادة بالصنارة مع الكرفس والشبت وجبن الشيدر المعتّق، تُحمّص بالزبدة.',
    priceFils: 4600,
    dietary: [],
    allergens: ['Fish', 'Gluten', 'Milk', 'Egg'],
    badges: [],
    available: true,
    orderable: true,
    modifierGroupIds: ['bread'],
    sortOrder: 3,
  },

  /* Bakery */
  {
    id: 'croissant',
    slug: 'butter-croissant',
    categoryId: 'bakery',
    name: 'Butter Croissant',
    nameAr: 'كرواسون بالزبدة',
    description:
      'Seventy-two hours, three folds, French butter at 82% fat. Best before 10am, honestly.',
    descriptionAr:
      'اثنتان وسبعون ساعة وثلاث طيّات وزبدة فرنسية بنسبة دسم ٨٢٪. الأفضل قبل العاشرة صباحاً.',
    priceFils: 1600,
    dietary: ['vegetarian'],
    allergens: ['Gluten', 'Milk', 'Egg'],
    badges: [],
    available: true,
    orderable: true,
    modifierGroupIds: [],
    imageKey: 'croissant',
    sortOrder: 1,
  },
  {
    id: 'pistachio-danish',
    slug: 'pistachio-rose-danish',
    categoryId: 'bakery',
    name: 'Pistachio & Rose Danish',
    nameAr: 'دانش الفستق والورد',
    description:
      'A pinwheel of pistachio frangipane with a rose-water glaze and crushed Iranian pistachios.',
    descriptionAr: 'دوّامة من كريمة الفستق مع تزجيج ماء الورد وفستق إيراني مجروش.',
    priceFils: 2400,
    dietary: ['vegetarian', 'contains-nuts'],
    allergens: ['Gluten', 'Milk', 'Egg', 'Pistachio'],
    badges: ['signature'],
    available: true,
    orderable: true,
    modifierGroupIds: [],
    sortOrder: 2,
  },
  {
    id: 'date-tahini-cookie',
    slug: 'date-tahini-cookie',
    categoryId: 'bakery',
    name: 'Date & Tahini Cookie',
    nameAr: 'كوكيز التمر والطحينة',
    description:
      'Chewy in the middle, crisp at the rim, salty from the tahini. Vegan, and the staff’s favourite.',
    descriptionAr:
      'طريّ من الداخل ومقرمش من الأطراف ومالح بفضل الطحينة. نباتي، والمفضّل لدى الفريق.',
    priceFils: 1400,
    dietary: ['vegan', 'contains-nuts'],
    allergens: ['Gluten', 'Sesame'],
    badges: [],
    available: true,
    orderable: true,
    modifierGroupIds: [],
    sortOrder: 3,
  },
  {
    id: 'basque-cheesecake',
    slug: 'basque-cheesecake',
    categoryId: 'bakery',
    name: 'Basque Cheesecake',
    nameAr: 'تشيز كيك باسك',
    description:
      'Burnt on top, barely set in the middle, served at room temperature as it should be.',
    descriptionAr: 'محروق من الأعلى وطريّ في الوسط، يُقدّم بحرارة الغرفة كما ينبغي.',
    priceFils: 3400,
    dietary: ['vegetarian', 'gluten-free'],
    allergens: ['Milk', 'Egg'],
    badges: ['signature'],
    available: true,
    orderable: true,
    modifierGroupIds: [],
    sortOrder: 4,
  },

  /* Retail */
  {
    id: 'beans-ethiopia',
    slug: 'ethiopia-guji-uraga-250g',
    categoryId: 'retail',
    name: 'Ethiopia Guji Uraga — 250g',
    nameAr: 'إثيوبيا قوجي أوراقا — ٢٥٠غ',
    description:
      'Natural process, 2,050 masl. Blueberry, jasmine, a syrupy body. Our filter coffee of the season.',
    descriptionAr:
      'معالجة طبيعية على ارتفاع ٢٠٥٠ متراً. توت أزرق وياسمين وقوام كثيف. قهوة الموسم للتقطير.',
    priceFils: 9200,
    dietary: ['vegan', 'gluten-free'],
    allergens: [],
    badges: [],
    available: true,
    orderable: true,
    modifierGroupIds: ['grind'],
    sortOrder: 1,
  },
  {
    id: 'beans-colombia',
    slug: 'colombia-el-paraiso-250g',
    categoryId: 'retail',
    name: 'Colombia El Paraíso — 250g',
    nameAr: 'كولومبيا إل بارايسو — ٢٥٠غ',
    description:
      'Thermal-shock lychee lot from Cauca. Divisive, tropical, unforgettable. Filter only.',
    descriptionAr:
      'دفعة الليتشي من كاوكا بمعالجة الصدمة الحرارية. مثيرة للجدل واستوائية ولا تُنسى. للتقطير فقط.',
    priceFils: 10500,
    dietary: ['vegan', 'gluten-free'],
    allergens: [],
    badges: ['new'],
    available: false,
    unavailableReason: 'Sold out — next roast lands Friday',
    orderable: false,
    modifierGroupIds: ['grind'],
    sortOrder: 2,
  },
  {
    id: 'beans-house',
    slug: 'house-blend-250g',
    categoryId: 'retail',
    name: 'Regulars House Blend — 250g',
    nameAr: 'خلطة ريقيولرز — ٢٥٠غ',
    description:
      'Brazil Cerrado and Ethiopia Guji, roasted for milk. The bag most of our regulars leave with.',
    descriptionAr:
      'برازيل سيرادو وإثيوبيا قوجي، محمّصة لتناسب الحليب. الكيس الذي يغادر به معظم زبائننا.',
    priceFils: 7800,
    dietary: ['vegan', 'gluten-free'],
    allergens: [],
    badges: ['signature'],
    available: true,
    orderable: true,
    modifierGroupIds: ['grind'],
    imageKey: 'beansHouse',
    sortOrder: 3,
  },
  {
    id: 'brewers-bundle',
    slug: 'brewers-bundle',
    categoryId: 'retail',
    name: 'Brewer’s Bundle',
    nameAr: 'حزمة التحضير',
    description:
      'A V60 02, 100 filters, and a 250g bag of your choice. Everything you need, nothing you do not.',
    descriptionAr: 'قمع في٦٠ مقاس ٠٢ ومئة فلتر وكيس ٢٥٠ غراماً من اختيارك. كل ما تحتاجه، لا أكثر.',
    priceFils: 16500,
    dietary: ['vegan', 'gluten-free'],
    allergens: [],
    badges: [],
    available: true,
    orderable: true,
    modifierGroupIds: ['grind'],
    sortOrder: 4,
  },
] as const;

/* ── Helpers ──────────────────────────────────────────────────────────────── */

export function itemsByCategory(categoryId: string): readonly MenuItem[] {
  return menuItems
    .filter((i) => i.categoryId === categoryId)
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getMenuItem(slug: string): MenuItem | undefined {
  return menuItems.find((i) => i.slug === slug);
}

export function getModifierGroup(id: string): ModifierGroup | undefined {
  return modifierGroups.find((g) => g.id === id);
}

/** Lowest and highest price on the menu — feeds schema.org priceRange. */
export const menuPriceRange = {
  minFils: Math.min(...menuItems.map((i) => i.priceFils)),
  maxFils: Math.max(...menuItems.map((i) => i.priceFils)),
};
