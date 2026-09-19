/**
 * What each tier actually includes — the sales matrix.
 *
 * This is the page a café owner reads before they decide, so it is written
 * the way an honest quote is written: what is in, what is out, and what costs
 * extra, with the exclusions as prominent as the inclusions. A comparison
 * table that only says yes is one nobody believes, and it is also the one
 * that produces an argument at invoice time.
 *
 * Everything here is data rather than markup, so changing an offer — a price,
 * a support window, whether a tier gets the admin panel — is one edit in one
 * file, and the table, the tier cards and the FAQ all move together.
 */

export type Inclusion =
  | { kind: 'yes' }
  /** Included, with a qualifier worth reading. */
  | { kind: 'yes'; detail: string }
  | { kind: 'no' }
  /** Not included as standard, available as a paid add-on. */
  | { kind: 'option'; detail: string }
  /** Scoped per engagement. */
  | { kind: 'custom'; detail?: string };

export const YES: Inclusion = { kind: 'yes' };
export const NO: Inclusion = { kind: 'no' };

export interface MatrixRow {
  readonly id: string;
  readonly label: string;
  readonly labelAr: string;
  /** One line of plain English on why this matters. */
  readonly note?: string;
  readonly essential: Inclusion;
  readonly signature: Inclusion;
  readonly immersive: Inclusion;
  readonly bespoke: Inclusion;
}

export interface MatrixGroup {
  readonly id: string;
  readonly title: string;
  readonly titleAr: string;
  readonly rows: readonly MatrixRow[];
}

export const tierMatrix: readonly MatrixGroup[] = [
  {
    id: 'pages',
    title: 'Pages and content',
    titleAr: 'الصفحات والمحتوى',
    rows: [
      {
        id: 'pages-count',
        label: 'Pages of real written content',
        labelAr: 'صفحات بمحتوى مكتوب فعلي',
        note: 'Written for your café, not lorem ipsum swapped for your name.',
        essential: { kind: 'yes', detail: '6 pages' },
        signature: { kind: 'yes', detail: '12+ pages' },
        immersive: { kind: 'yes', detail: '14+ pages' },
        bespoke: { kind: 'custom' },
      },
      {
        id: 'menu',
        label: 'Menu with prices, dietary tags and allergens',
        labelAr: 'قائمة بالأسعار والوسوم الغذائية ومسببات الحساسية',
        essential: YES,
        signature: YES,
        immersive: YES,
        bespoke: YES,
      },
      {
        id: 'menu-editable',
        label: 'You edit the menu yourself',
        labelAr: 'تحرّر القائمة بنفسك',
        note: 'Tier 1 menus are changed by us; from Tier 2 the menu is yours.',
        essential: { kind: 'option', detail: 'We change it for you' },
        signature: YES,
        immersive: YES,
        bespoke: YES,
      },
      {
        id: 'allergen-grid',
        label: 'Full allergen grid',
        labelAr: 'جدول كامل لمسببات الحساسية',
        essential: NO,
        signature: YES,
        immersive: YES,
        bespoke: YES,
      },
      {
        id: 'sourcing',
        label: 'Coffee sourcing page with per-lot detail',
        labelAr: 'صفحة مصادر القهوة بتفاصيل كل دفعة',
        essential: NO,
        signature: YES,
        immersive: YES,
        bespoke: YES,
      },
      {
        id: 'journal',
        label: 'Journal / blog you can post to',
        labelAr: 'مدوّنة يمكنك النشر فيها',
        essential: NO,
        signature: YES,
        immersive: YES,
        bespoke: YES,
      },
      {
        id: 'photography',
        label: 'Photography',
        labelAr: 'التصوير',
        note: 'We art-direct either way. A shoot is quoted separately.',
        essential: { kind: 'yes', detail: 'Your existing photos' },
        signature: { kind: 'option', detail: 'Half-day shoot' },
        immersive: { kind: 'option', detail: 'Full-day shoot + film' },
        bespoke: { kind: 'custom' },
      },
    ],
  },
  {
    id: 'bookings',
    title: 'Bookings, orders and money',
    titleAr: 'الحجوزات والطلبات والمدفوعات',
    rows: [
      {
        id: 'contact',
        label: 'Contact form to a real inbox',
        labelAr: 'نموذج تواصل يصل إلى بريد حقيقي',
        essential: YES,
        signature: YES,
        immersive: YES,
        bespoke: YES,
      },
      {
        id: 'reservations',
        label: 'Table reservations with live availability',
        labelAr: 'حجز الطاولات بتوافر مباشر',
        note: 'A real availability engine, not a form that emails you a request.',
        essential: NO,
        signature: YES,
        immersive: YES,
        bespoke: YES,
      },
      {
        id: 'no-double',
        label: 'Double-booking made impossible',
        labelAr: 'استحالة الحجز المزدوج',
        note: 'Enforced by a database constraint, so it holds even under a race.',
        essential: NO,
        signature: YES,
        immersive: YES,
        bespoke: YES,
      },
      {
        id: 'pickup',
        label: 'Pickup ordering',
        labelAr: 'الطلب للاستلام',
        essential: NO,
        signature: YES,
        immersive: YES,
        bespoke: YES,
      },
      {
        id: 'payments',
        label: 'Card payments',
        labelAr: 'الدفع بالبطاقة',
        note: 'Stripe. You need your own merchant account either way.',
        essential: NO,
        signature: { kind: 'yes', detail: 'Stripe checkout' },
        immersive: { kind: 'yes', detail: 'Stripe + saved cards' },
        bespoke: { kind: 'custom' },
      },
      {
        id: 'qr-order',
        label: 'QR order-at-table',
        labelAr: 'الطلب من الطاولة عبر رمز QR',
        note: 'Guest scans, orders on their phone, it lands on the server’s device.',
        essential: NO,
        signature: NO,
        immersive: YES,
        bespoke: YES,
      },
      {
        id: 'loyalty',
        label: 'Loyalty and gift cards',
        labelAr: 'الولاء وبطاقات الهدايا',
        essential: NO,
        signature: YES,
        immersive: YES,
        bespoke: YES,
      },
      {
        id: 'events',
        label: 'Events and private-hire enquiries',
        labelAr: 'الفعاليات وطلبات الحجز الخاص',
        essential: NO,
        signature: YES,
        immersive: YES,
        bespoke: YES,
      },
    ],
  },
  {
    id: 'experience',
    title: 'How it looks and feels',
    titleAr: 'الشكل والإحساس',
    rows: [
      {
        id: 'design',
        label: 'Design',
        labelAr: 'التصميم',
        essential: { kind: 'yes', detail: 'Clean and restrained' },
        signature: { kind: 'yes', detail: 'Editorial, art-directed' },
        immersive: { kind: 'yes', detail: 'Cinematic, dark-first' },
        bespoke: { kind: 'custom', detail: 'From scratch' },
      },
      {
        id: 'motion',
        label: 'Motion and scroll animation',
        labelAr: 'الحركة والتأثيرات عند التمرير',
        essential: { kind: 'no' },
        signature: { kind: 'yes', detail: 'Sections reveal on scroll' },
        immersive: { kind: 'yes', detail: 'Scroll-driven film throughout' },
        bespoke: { kind: 'custom' },
      },
      {
        id: 'film',
        label: 'Scroll-scrubbed film sequence',
        labelAr: 'مشهد سينمائي يتحرك مع التمرير',
        note: 'Real footage, cut to frames, scrubbed against the scroll wheel.',
        essential: NO,
        signature: NO,
        immersive: YES,
        bespoke: YES,
      },
      {
        id: 'webgl',
        label: '3D / WebGL layer',
        labelAr: 'طبقة ثلاثية الأبعاد',
        essential: NO,
        signature: NO,
        immersive: YES,
        bespoke: YES,
      },
      {
        id: 'floorplan',
        label: 'Pick your table from a live floor plan',
        labelAr: 'اختر طاولتك من مخطط مباشر للصالة',
        essential: NO,
        signature: NO,
        immersive: YES,
        bespoke: YES,
      },
      {
        id: 'dark',
        label: 'Designed dark mode',
        labelAr: 'وضع داكن مصمَّم',
        essential: YES,
        signature: YES,
        immersive: YES,
        bespoke: YES,
      },
    ],
  },
  {
    id: 'ai',
    title: 'AI',
    titleAr: 'الذكاء الاصطناعي',
    rows: [
      {
        id: 'ai-assistant',
        label: 'AI ordering assistant',
        labelAr: 'مساعد ذكي للطلب',
        note: 'Describe what you feel like and it builds the order.',
        essential: NO,
        signature: NO,
        immersive: YES,
        bespoke: YES,
      },
      {
        id: 'ai-voice',
        label: 'Voice ordering',
        labelAr: 'الطلب بالصوت',
        note: 'Speak the order instead of tapping through the menu.',
        essential: NO,
        signature: NO,
        immersive: YES,
        bespoke: YES,
      },
      {
        id: 'ai-recs',
        label: 'Personalised recommendations',
        labelAr: 'توصيات مخصّصة',
        essential: NO,
        signature: NO,
        immersive: YES,
        bespoke: YES,
      },
    ],
  },
  {
    id: 'ops',
    title: 'Running it day to day',
    titleAr: 'التشغيل اليومي',
    rows: [
      {
        id: 'admin',
        label: 'Admin back office',
        labelAr: 'لوحة الإدارة',
        note: 'Bookings, orders, menu, enquiries — all in one place.',
        essential: { kind: 'option', detail: 'Available on request' },
        signature: YES,
        immersive: YES,
        bespoke: YES,
      },
      {
        id: 'server-app',
        label: 'Server / floor-staff view',
        labelAr: 'واجهة طاقم الصالة',
        note: 'Incoming table orders on the staff phone, with an accept flow.',
        essential: NO,
        signature: NO,
        immersive: YES,
        bespoke: YES,
      },
      {
        id: 'roles',
        label: 'Staff accounts and roles',
        labelAr: 'حسابات الموظفين والصلاحيات',
        essential: NO,
        signature: { kind: 'yes', detail: 'Admin' },
        immersive: { kind: 'yes', detail: 'Admin + server' },
        bespoke: { kind: 'custom' },
      },
      {
        id: 'exports',
        label: 'CSV exports',
        labelAr: 'تصدير البيانات CSV',
        essential: YES,
        signature: YES,
        immersive: YES,
        bespoke: YES,
      },
    ],
  },
  {
    id: 'reach',
    title: 'Reach and reliability',
    titleAr: 'الانتشار والموثوقية',
    rows: [
      {
        id: 'arabic',
        label: 'Full Arabic with true right-to-left layout',
        labelAr: 'العربية بالكامل مع تخطيط من اليمين لليسار',
        note: 'Not a translation plugin — a genuinely mirrored layout.',
        essential: { kind: 'option', detail: 'Add-on' },
        signature: YES,
        immersive: YES,
        bespoke: YES,
      },
      {
        id: 'seo',
        label: 'Technical SEO and schema.org',
        labelAr: 'تحسين محركات البحث وبيانات schema.org',
        essential: YES,
        signature: YES,
        immersive: YES,
        bespoke: YES,
      },
      {
        id: 'a11y',
        label: 'WCAG 2.2 AA accessibility',
        labelAr: 'إتاحة وفق WCAG 2.2 AA',
        essential: YES,
        signature: YES,
        immersive: YES,
        bespoke: YES,
      },
      {
        id: 'speed',
        label: 'Performance target',
        labelAr: 'هدف الأداء',
        essential: { kind: 'yes', detail: 'Lighthouse 95+' },
        signature: { kind: 'yes', detail: 'Lighthouse 95+' },
        immersive: { kind: 'yes', detail: 'Lighthouse 85+' },
        bespoke: { kind: 'custom' },
      },
      {
        id: 'analytics',
        label: 'Privacy-friendly analytics',
        labelAr: 'تحليلات تحترم الخصوصية',
        essential: { kind: 'option', detail: 'Add-on' },
        signature: YES,
        immersive: YES,
        bespoke: YES,
      },
    ],
  },
  {
    id: 'handover',
    title: 'What happens at handover',
    titleAr: 'ما يحدث عند التسليم',
    rows: [
      {
        id: 'delivery',
        label: 'Deployment and domain setup',
        labelAr: 'النشر وإعداد النطاق',
        note: 'We put it live on your domain and hand you the keys.',
        essential: YES,
        signature: YES,
        immersive: YES,
        bespoke: YES,
      },
      {
        id: 'support',
        label: 'Support after launch',
        labelAr: 'الدعم بعد الإطلاق',
        note: 'Fixes, changes and questions answered, included in the price.',
        essential: { kind: 'no' },
        signature: { kind: 'yes', detail: '2 weeks' },
        immersive: { kind: 'yes', detail: '1 month' },
        bespoke: { kind: 'custom', detail: 'Agreed with you' },
      },
      {
        id: 'training',
        label: 'Training session for your team',
        labelAr: 'جلسة تدريب لفريقك',
        essential: NO,
        signature: { kind: 'yes', detail: '1 session' },
        immersive: { kind: 'yes', detail: '2 sessions' },
        bespoke: { kind: 'custom' },
      },
      {
        id: 'retainer',
        label: 'Ongoing care plan',
        labelAr: 'خطة رعاية مستمرة',
        note: 'Monthly. Optional on every tier, and cancellable.',
        essential: { kind: 'option', detail: 'From AED 450/mo' },
        signature: { kind: 'option', detail: 'From AED 900/mo' },
        immersive: { kind: 'option', detail: 'From AED 1,600/mo' },
        bespoke: { kind: 'custom' },
      },
      {
        id: 'ownership',
        label: 'You own the code and the data',
        labelAr: 'تملك الكود والبيانات',
        note: 'No lock-in. If you leave, it all comes with you.',
        essential: YES,
        signature: YES,
        immersive: YES,
        bespoke: YES,
      },
    ],
  },
];

/** The honest one-liner on what a tier is *not*, shown on its card. */
export const tierCaveats: Record<string, { en: string; ar: string }> = {
  essential: {
    en: 'No bookings, no ordering, no Arabic, and no support window after we hand it over. It is a brochure — a fast, findable, well-written one.',
    ar: 'بلا حجوزات ولا طلبات ولا عربية ولا فترة دعم بعد التسليم. إنه موقع تعريفي — سريع وواضح ومكتوب جيداً.',
  },
  signature: {
    en: 'No 3D, no film, no AI, no order-at-table. Everything that makes the café *run* on the site is here; the cinema is not.',
    ar: 'بلا ثلاثي الأبعاد ولا مشاهد سينمائية ولا ذكاء اصطناعي ولا طلب من الطاولة. كل ما يجعل المقهى يعمل عبر الموقع موجود هنا، أما السينما فلا.',
  },
  immersive: {
    en: 'The longest build and the most to maintain. Worth it if people photograph your room; overkill if they come for the parking.',
    ar: 'أطول مدة تنفيذ وأكثرها احتياجاً للصيانة. يستحق إن كان الناس يصوّرون مكانك؛ ومبالغ فيه إن كانوا يأتون لسهولة الموقف.',
  },
};
