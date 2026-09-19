/**
 * Interface copy, in both languages.
 *
 * Arabic here is a translation, not a transliteration: the booking flow reads
 * as Arabic written for Gulf readers, dates and numerals use the conventions a
 * Dubai guest expects, and nothing is left in English because it was easier.
 *
 * Content (menu items, the founder's story, journal posts) lives with the
 * content, not here — see `menu.ts` and `content/journal`.
 */

export type Locale = 'en' | 'ar';
export const LOCALES: readonly Locale[] = ['en', 'ar'];

export const localeMeta: Record<
  Locale,
  { label: string; nativeLabel: string; dir: 'ltr' | 'rtl'; htmlLang: string }
> = {
  en: { label: 'English', nativeLabel: 'English', dir: 'ltr', htmlLang: 'en-AE' },
  ar: { label: 'Arabic', nativeLabel: 'العربية', dir: 'rtl', htmlLang: 'ar-AE' },
};

const en = {
  nav: {
    home: 'Home',
    menu: 'Menu',
    story: 'Our Story',
    gallery: 'Gallery',
    visit: 'Visit Us',
    book: 'Book a Table',
    order: 'Order Pickup',
    events: 'Events',
    journal: 'Journal',
    loyalty: 'Loyalty',
    giftCards: 'Gift Cards',
    admin: 'Admin',
    primaryLabel: 'Primary',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    skipToContent: 'Skip to main content',
  },
  common: {
    call: 'Call',
    directions: 'Directions',
    whatsapp: 'WhatsApp',
    email: 'Email',
    openNow: 'Open now',
    closed: 'Closed',
    closingSoon: 'Closing soon',
    openingSoon: 'Opening soon',
    viewMenu: 'View the menu',
    bookTable: 'Book a table',
    orderNow: 'Order for pickup',
    seeAll: 'See all',
    back: 'Back',
    next: 'Next',
    continue: 'Continue',
    confirm: 'Confirm',
    cancel: 'Cancel',
    change: 'Change',
    close: 'Close',
    loading: 'Loading…',
    submitting: 'Sending…',
    required: 'required',
    optional: 'optional',
    from: 'from',
    perPerson: 'per person',
    soldOut: 'Sold out',
    new: 'New',
    signature: 'Signature',
    readMore: 'Read more',
    copied: 'Copied',
    copyAddress: 'Copy address',
    today: 'Today',
    tomorrow: 'Tomorrow',
    language: 'Language',
    theme: 'Theme',
    lightTheme: 'Light',
    darkTheme: 'Dark',
    systemTheme: 'System',
  },
  menu: {
    title: 'Menu',
    all: 'Everything',
    filterHeading: 'Filter the menu',
    dietaryHeading: 'Dietary',
    clearFilters: 'Clear filters',
    noResults: 'Nothing matches those filters.',
    noResultsHint: 'Try clearing one of them — or ask us, most plates can be adapted.',
    allergenNote:
      'Allergens are listed per dish. Our kitchen handles nuts, gluten, sesame and dairy, so we cannot promise zero cross-contact — please tell us and we will do our best.',
    unavailable: 'Unavailable',
    /** Template — see `fill()`. */
    itemsCount: '{count} items',
  },
  forms: {
    name: 'Your name',
    email: 'Email address',
    phone: 'Phone number',
    message: 'Message',
    topic: 'What is this about?',
    send: 'Send message',
    sending: 'Sending…',
    successTitle: 'Thank you — that reached us.',
    successBody: 'We read every message ourselves and reply within one working day.',
    errorTitle: 'That did not send.',
    errorBody: 'Something went wrong at our end. Please try again, or call us.',
    rateLimited: 'That is a few too many messages in a row. Please try again shortly.',
    fixErrors: 'Please check the highlighted fields.',
    sendAnother: 'Send another message',
  },
  newsletter: {
    heading: 'The Regulars letter',
    body: 'One email a month: what we are roasting, what is new on the menu, and first refusal on events. No more than that.',
    placeholder: 'you@example.com',
    subscribe: 'Subscribe',
    pendingTitle: 'Almost there — check your inbox.',
    pendingBody:
      'We have sent you a confirmation link. Click it and you are on the list. If it does not arrive in a few minutes, check your spam folder.',
    confirmedTitle: 'You are on the list.',
    confirmedBody: 'Thank you. The next letter goes out at the start of the month.',
    alreadyTitle: 'You are already subscribed.',
    unsubscribedTitle: 'You are unsubscribed.',
    unsubscribedBody: 'No hard feelings. You can join again any time.',
    invalidToken: 'That confirmation link is not valid or has already been used.',
  },
  booking: {
    title: 'Book a table',
    step: 'Step',
    of: 'of',
    stepParty: 'Party size',
    stepDate: 'Date',
    stepTime: 'Time',
    stepDetails: 'Your details',
    stepConfirm: 'Confirmed',
    guests: 'guests',
    guest: 'guest',
    chooseParty: 'How many of you?',
    choosePartyHint:
      'Up to 8 online. For 9 or more we will look after you properly — use private hire.',
    chooseDate: 'Which day?',
    chooseTime: 'What time?',
    chooseTimeHint: 'Times shown are for a table of',
    noSlots: 'Nothing free that day.',
    noSlotsHint: 'Try another date, or join the waitlist and we will text you if something opens.',
    yourDetails: 'Who should we put the table under?',
    occasion: 'Any occasion?',
    specialRequests: 'Anything we should know?',
    specialRequestsHint: 'Allergies, a pram, a quiet corner — tell us and we will try.',
    highChairs: 'High chairs',
    accessibility: 'Accessibility needs',
    marketingOptIn: 'Send me the monthly letter',
    confirmBooking: 'Confirm booking',
    confirmedTitle: 'Your table is booked.',
    confirmedBody: 'We have emailed you the details and a calendar invite.',
    reference: 'Reference',
    addToCalendar: 'Add to calendar',
    manageBooking: 'Change or cancel',
    joinWaitlist: 'Join the waitlist',
    waitlistTitle: 'We will let you know.',
    waitlistBody: 'If a table frees up in your window we will email you straight away.',
    slotTaken: 'Someone took that slot a moment ago. Please choose another.',
    reasons: {
      available: 'Available',
      fully_booked: 'Fully booked',
      no_table_for_party_size: 'No table that size',
      kitchen_at_capacity: 'Kitchen at capacity',
      blackout: 'Closed',
      past: 'Already passed',
      too_soon: 'Too soon to book online',
      closed: 'Closed',
    },
  },
  order: {
    title: 'Order for pickup',
    addToBag: 'Add to bag',
    bag: 'Your bag',
    emptyBag: 'Your bag is empty.',
    emptyBagHint: 'Add something from the menu and it will show up here.',
    subtotal: 'Subtotal',
    vat: 'VAT (5%)',
    total: 'Total',
    pickupTime: 'Collection time',
    checkout: 'Go to payment',
    remove: 'Remove',
    quantity: 'Quantity',
    notes: 'Notes for the kitchen',
    orderPlaced: 'Order confirmed.',
    orderPlacedBody: 'We are on it. You will get an email when it is ready to collect.',
    orderRef: 'Order',
    testMode: 'Stripe test mode — no money moves. Card 4242 4242 4242 4242 works.',
  },
  loyalty: {
    title: 'The stamp card',
    body: 'Nine coffees, the tenth is ours. No app, no plastic card — just your email.',
    lookup: 'Find my card',
    stamps: 'stamps',
    toGo: 'to go',
    rewardReady: 'Your free coffee is waiting.',
    notFound: 'No card yet under that address.',
    notFoundHint: 'Ask for one next time you are in — it takes five seconds.',
  },
  giftCards: {
    title: 'Gift cards',
    body: 'Sent by email, redeemable at the counter, no expiry within a year.',
    amount: 'Amount',
    buy: 'Buy gift card',
    checkBalance: 'Check a balance',
    balance: 'Balance',
    codeLabel: 'Gift card code',
  },
  footer: {
    findUs: 'Find us',
    hours: 'Hours',
    contact: 'Contact',
    followUs: 'Follow',
    rights: 'All rights reserved.',
    builtBy: 'Demo site by',
  },
  a11y: {
    galleryLightbox: 'Image viewer',
    previousImage: 'Previous image',
    nextImage: 'Next image',
    closeLightbox: 'Close viewer',
    imageCounter: 'Image {index} of {total}',
    externalLink: 'opens in a new tab',
  },
};

/** The Arabic dictionary mirrors the English one key for key. */
const ar: typeof en = {
  nav: {
    home: 'الرئيسية',
    menu: 'القائمة',
    story: 'قصتنا',
    gallery: 'الصور',
    visit: 'زورونا',
    book: 'احجز طاولة',
    order: 'اطلب للاستلام',
    events: 'الفعاليات',
    journal: 'المدوّنة',
    loyalty: 'بطاقة الولاء',
    giftCards: 'بطاقات الهدايا',
    admin: 'الإدارة',
    primaryLabel: 'القائمة الرئيسية',
    openMenu: 'فتح القائمة',
    closeMenu: 'إغلاق القائمة',
    skipToContent: 'تخطَّ إلى المحتوى',
  },
  common: {
    call: 'اتصل',
    directions: 'الاتجاهات',
    whatsapp: 'واتساب',
    email: 'البريد',
    openNow: 'مفتوح الآن',
    closed: 'مغلق',
    closingSoon: 'على وشك الإغلاق',
    openingSoon: 'سيفتح قريباً',
    viewMenu: 'تصفّح القائمة',
    bookTable: 'احجز طاولة',
    orderNow: 'اطلب للاستلام',
    seeAll: 'عرض الكل',
    back: 'رجوع',
    next: 'التالي',
    continue: 'متابعة',
    confirm: 'تأكيد',
    cancel: 'إلغاء',
    change: 'تعديل',
    close: 'إغلاق',
    loading: 'جارٍ التحميل…',
    submitting: 'جارٍ الإرسال…',
    required: 'مطلوب',
    optional: 'اختياري',
    from: 'ابتداءً من',
    perPerson: 'للشخص',
    soldOut: 'نفدت',
    new: 'جديد',
    signature: 'مميّز',
    readMore: 'اقرأ المزيد',
    copied: 'تم النسخ',
    copyAddress: 'نسخ العنوان',
    today: 'اليوم',
    tomorrow: 'غداً',
    language: 'اللغة',
    theme: 'المظهر',
    lightTheme: 'فاتح',
    darkTheme: 'داكن',
    systemTheme: 'حسب النظام',
  },
  menu: {
    title: 'القائمة',
    all: 'الكل',
    filterHeading: 'تصفية القائمة',
    dietaryHeading: 'الخيارات الغذائية',
    clearFilters: 'مسح التصفية',
    noResults: 'لا يوجد ما يطابق هذه التصفية.',
    noResultsHint: 'جرّب إزالة أحد الخيارات — أو اسألنا، فمعظم الأطباق قابلة للتعديل.',
    allergenNote:
      'مسبّبات الحساسية مذكورة لكل طبق. مطبخنا يتعامل مع المكسرات والغلوتين والسمسم والألبان، لذا لا يمكننا ضمان انعدام التلامس — أخبرنا وسنبذل ما بوسعنا.',
    unavailable: 'غير متوفر',
    itemsCount: '{count} صنف',
  },
  forms: {
    name: 'الاسم',
    email: 'البريد الإلكتروني',
    phone: 'رقم الهاتف',
    message: 'الرسالة',
    topic: 'موضوع الرسالة',
    send: 'إرسال',
    sending: 'جارٍ الإرسال…',
    successTitle: 'شكراً لك — وصلتنا رسالتك.',
    successBody: 'نقرأ كل رسالة بأنفسنا ونردّ خلال يوم عمل واحد.',
    errorTitle: 'تعذّر الإرسال.',
    errorBody: 'حدث خلل لدينا. يُرجى المحاولة مجدداً أو الاتصال بنا.',
    rateLimited: 'عدد كبير من الرسائل المتتالية. يُرجى المحاولة بعد قليل.',
    fixErrors: 'يُرجى مراجعة الحقول المظللة.',
    sendAnother: 'إرسال رسالة أخرى',
  },
  newsletter: {
    heading: 'رسالة ريقيولرز',
    body: 'رسالة واحدة شهرياً: ما نحمّصه، وما الجديد في القائمة، وأولوية الحجز في الفعاليات. لا أكثر.',
    placeholder: 'you@example.com',
    subscribe: 'اشترك',
    pendingTitle: 'بقيت خطوة — تحقّق من بريدك.',
    pendingBody:
      'أرسلنا لك رابط تأكيد. اضغط عليه لتنضمّ إلى القائمة. إن لم يصلك خلال دقائق فتحقّق من مجلد الرسائل غير المرغوبة.',
    confirmedTitle: 'أنت الآن على القائمة.',
    confirmedBody: 'شكراً لك. الرسالة القادمة مطلع الشهر.',
    alreadyTitle: 'أنت مشترك بالفعل.',
    unsubscribedTitle: 'تم إلغاء اشتراكك.',
    unsubscribedBody: 'لا بأس. يمكنك العودة في أي وقت.',
    invalidToken: 'رابط التأكيد غير صالح أو سبق استخدامه.',
  },
  booking: {
    title: 'احجز طاولة',
    step: 'الخطوة',
    of: 'من',
    stepParty: 'عدد الضيوف',
    stepDate: 'التاريخ',
    stepTime: 'الوقت',
    stepDetails: 'بياناتك',
    stepConfirm: 'تم التأكيد',
    guests: 'ضيوف',
    guest: 'ضيف',
    chooseParty: 'كم عددكم؟',
    choosePartyHint: 'حتى ٨ أشخاص عبر الموقع. لتسعة فأكثر يسعدنا استقبالكم عبر الحجز الخاص.',
    chooseDate: 'أي يوم؟',
    chooseTime: 'أي وقت؟',
    chooseTimeHint: 'الأوقات المعروضة لطاولة تتسع لـ',
    noSlots: 'لا تتوفر طاولات في ذلك اليوم.',
    noSlotsHint: 'جرّب تاريخاً آخر، أو انضم إلى قائمة الانتظار وسنراسلك فور توفّر طاولة.',
    yourDetails: 'باسم من نسجّل الطاولة؟',
    occasion: 'هل من مناسبة؟',
    specialRequests: 'هل من شيء ينبغي أن نعرفه؟',
    specialRequestsHint: 'حساسية، عربة أطفال، ركن هادئ — أخبرنا وسنحاول.',
    highChairs: 'كراسي أطفال',
    accessibility: 'احتياجات الوصول',
    marketingOptIn: 'أرسلوا لي الرسالة الشهرية',
    confirmBooking: 'تأكيد الحجز',
    confirmedTitle: 'تم حجز طاولتك.',
    confirmedBody: 'أرسلنا التفاصيل ودعوة التقويم إلى بريدك.',
    reference: 'الرقم المرجعي',
    addToCalendar: 'أضف إلى التقويم',
    manageBooking: 'تعديل أو إلغاء',
    joinWaitlist: 'انضم لقائمة الانتظار',
    waitlistTitle: 'سنعلمك فوراً.',
    waitlistBody: 'إن تحرّرت طاولة ضمن الوقت الذي اخترته سنراسلك مباشرة.',
    slotTaken: 'حُجز هذا الوقت قبل لحظات. يُرجى اختيار وقت آخر.',
    reasons: {
      available: 'متاح',
      fully_booked: 'محجوز بالكامل',
      no_table_for_party_size: 'لا توجد طاولة بهذا الحجم',
      kitchen_at_capacity: 'المطبخ في كامل طاقته',
      blackout: 'مغلق',
      past: 'وقت مضى',
      too_soon: 'قريب جداً للحجز عبر الموقع',
      closed: 'مغلق',
    },
  },
  order: {
    title: 'اطلب للاستلام',
    addToBag: 'أضف إلى السلة',
    bag: 'سلّتك',
    emptyBag: 'سلّتك فارغة.',
    emptyBagHint: 'أضف صنفاً من القائمة وسيظهر هنا.',
    subtotal: 'المجموع الفرعي',
    vat: 'ضريبة القيمة المضافة (٥٪)',
    total: 'الإجمالي',
    pickupTime: 'وقت الاستلام',
    checkout: 'إتمام الدفع',
    remove: 'إزالة',
    quantity: 'الكمية',
    notes: 'ملاحظات للمطبخ',
    orderPlaced: 'تم تأكيد طلبك.',
    orderPlacedBody: 'بدأنا التحضير. سيصلك بريد عند جهوزية الطلب.',
    orderRef: 'رقم الطلب',
    testMode: 'وضع الاختبار في سترايب — لا تُخصم أي مبالغ. استخدم البطاقة ٤٢٤٢ ٤٢٤٢ ٤٢٤٢ ٤٢٤٢.',
  },
  loyalty: {
    title: 'بطاقة الأختام',
    body: 'تسع قهوات، والعاشرة علينا. بلا تطبيق وبلا بطاقة بلاستيكية — بريدك الإلكتروني يكفي.',
    lookup: 'ابحث عن بطاقتي',
    stamps: 'أختام',
    toGo: 'متبقّية',
    rewardReady: 'قهوتك المجانية بانتظارك.',
    notFound: 'لا توجد بطاقة بهذا البريد.',
    notFoundHint: 'اطلب واحدة في زيارتك القادمة — لا تستغرق سوى ثوانٍ.',
  },
  giftCards: {
    title: 'بطاقات الهدايا',
    body: 'تُرسل بالبريد الإلكتروني وتُستخدم عند الكاشير، وصالحة لمدة سنة.',
    amount: 'القيمة',
    buy: 'شراء البطاقة',
    checkBalance: 'الاستعلام عن الرصيد',
    balance: 'الرصيد',
    codeLabel: 'رمز البطاقة',
  },
  footer: {
    findUs: 'موقعنا',
    hours: 'ساعات العمل',
    contact: 'تواصل معنا',
    followUs: 'تابعنا',
    rights: 'جميع الحقوق محفوظة.',
    builtBy: 'موقع تجريبي من',
  },
  a11y: {
    galleryLightbox: 'عارض الصور',
    previousImage: 'الصورة السابقة',
    nextImage: 'الصورة التالية',
    closeLightbox: 'إغلاق العارض',
    imageCounter: 'الصورة {index} من {total}',
    externalLink: 'يفتح في نافذة جديدة',
  },
};

export type Dictionary = typeof en;

/**
 * Fills `{placeholders}` in a dictionary string.
 *
 * Dictionary values are plain strings rather than functions on purpose: a
 * Server Component hands the whole dictionary to Client Components as a prop,
 * and functions are not serialisable across that boundary. Numbers are
 * formatted for the locale on the way in, so Arabic gets Eastern Arabic
 * numerals without every call site remembering to ask for them.
 */
export function fill(
  template: string,
  values: Record<string, string | number>,
  locale: Locale = 'en',
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = values[key];
    if (value === undefined) return match;
    return typeof value === 'number' ? formatNumber(value, locale) : value;
  });
}

const dictionaries: Record<Locale, Dictionary> = { en, ar };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? en;
}

export function isRtl(locale: Locale): boolean {
  return localeMeta[locale].dir === 'rtl';
}

/** Locale-correct number formatting — Arabic uses Eastern Arabic numerals. */
export function formatNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-AE' : 'en-AE').format(value);
}

/** Long date, in the café's timezone. */
export function formatDate(
  date: Date,
  locale: Locale,
  options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' },
): string {
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-AE' : 'en-AE', {
    timeZone: 'Asia/Dubai',
    ...options,
  }).format(date);
}
