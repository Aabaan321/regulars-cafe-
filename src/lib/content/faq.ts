import { brand } from '@/lib/config/brand';

/**
 * The ten questions people actually type.
 *
 * Chosen from what a Dubai café gets asked on WhatsApp and what the
 * "People also ask" box shows for "specialty coffee Dubai" and "brunch Al
 * Quoz" — not ten questions invented to fill a FAQPage. Each answer is
 * complete on its own, because Google may show it without the page.
 */

export interface Faq {
  readonly question: string;
  readonly questionAr: string;
  readonly answer: string;
  readonly answerAr: string;
  /** Used to place the question on the most relevant page. */
  readonly topics: readonly ('visit' | 'menu' | 'booking' | 'general')[];
}

export const faqs: readonly Faq[] = [
  {
    question: 'Do you take reservations?',
    questionAr: 'هل تقبلون الحجوزات؟',
    answer:
      'Yes, for parties of one to eight, up to 30 days ahead. Weekends between 9am and 1pm book out several days in advance, so book early if you want a window table. For nine or more, use the private hire form and we will arrange the room properly.',
    answerAr:
      'نعم، لمجموعات من شخص إلى ثمانية أشخاص، وحتى ٣٠ يوماً مقدماً. عطلة نهاية الأسبوع بين التاسعة والواحدة تُحجز قبل أيام، لذا احجز مبكراً إن أردت طاولة عند النافذة. لتسعة أشخاص فأكثر، استخدم نموذج الحجز الخاص.',
    topics: ['booking', 'visit'],
  },
  {
    question: 'Where exactly are you, and is there parking?',
    questionAr: 'أين موقعكم بالضبط، وهل يتوفر موقف سيارات؟',
    answer: `${brand.address.unit}, ${brand.address.street}, ${brand.address.district}. ${brand.service.parking} ${brand.service.metro}`,
    answerAr:
      'مستودع ١٤، شارع ١٧، جادة السركال، القوز الصناعية الأولى. يتوفر موقف مجاني على شارع ١٧ وفي موقف زوّار جادة السركال. أقرب محطة مترو هي إكويتي على الخط الأحمر، وتبعد نحو سبع دقائق بالسيارة.',
    topics: ['visit'],
  },
  {
    question: 'What time do you open?',
    questionAr: 'ما هي ساعات العمل؟',
    answer:
      'Monday to Wednesday 7am–10pm, Thursday and Friday 7am–11pm, Saturday 8am–11pm, Sunday 8am–9pm. The kitchen closes 45 minutes before the café. Holiday hours differ — the live indicator at the top of the Visit page is always right.',
    answerAr:
      'من الاثنين إلى الأربعاء ٧ صباحاً – ١٠ مساءً، الخميس والجمعة ٧ صباحاً – ١١ مساءً، السبت ٨ صباحاً – ١١ مساءً، والأحد ٨ صباحاً – ٩ مساءً. يغلق المطبخ قبل المقهى بـ ٤٥ دقيقة. تختلف مواعيد العطلات — والمؤشر المباشر في صفحة الزيارة دائماً محدّث.',
    topics: ['visit', 'general'],
  },
  {
    question: 'Do you serve brunch all day?',
    questionAr: 'هل تقدمون البرانش طوال اليوم؟',
    answer:
      'Yes. Everything on the breakfast and brunch menus is available from opening until the kitchen closes — including the shakshuka at 6pm. We think a set brunch window is an admin decision dressed up as a culinary one.',
    answerAr:
      'نعم. كل ما في قائمتي الإفطار والبرانش متاح من الافتتاح حتى إغلاق المطبخ — بما في ذلك الشكشوكة في السادسة مساءً. نرى أن تحديد وقت للبرانش قرار إداري لا علاقة له بالطهي.',
    topics: ['menu'],
  },
  {
    question: 'Is there vegan and gluten-free food?',
    questionAr: 'هل توجد خيارات نباتية وخالية من الغلوتين؟',
    answer:
      'Yes to both, and they are real dishes rather than substitutions — the green bowl, the foul medames and the date and tahini cookie are vegan by design. Gluten-free seeded bread is available on any toast for AED 6. Our kitchen handles gluten, nuts and sesame, so we cannot promise zero cross-contact; tell us and we will take every precaution we can.',
    answerAr:
      'نعم لكليهما، وهي أطباق قائمة بذاتها لا بدائل — الطبق الأخضر والفول المدمس وكوكيز التمر والطحينة نباتية بالكامل. يتوفر خبز خالٍ من الغلوتين مع أي توست مقابل ٦ دراهم. مطبخنا يتعامل مع الغلوتين والمكسرات والسمسم، لذا لا يمكننا ضمان انعدام التلامس؛ أخبرنا وسنتخذ كل الاحتياطات.',
    topics: ['menu'],
  },
  {
    question: 'Can I work from there? Is the Wi-Fi any good?',
    questionAr: 'هل يمكنني العمل من عندكم؟ وهل الإنترنت جيد؟',
    answer:
      'Yes — fibre, free, and there are power points at the communal table and along the window bench. We only ask that you order something every couple of hours, and that the long table is shared from noon on a weekend.',
    answerAr:
      'نعم — إنترنت ألياف مجاني، مع منافذ كهرباء عند الطاولة المشتركة وعلى امتداد مقعد النافذة. نرجو فقط أن تطلب شيئاً كل ساعتين، وأن تكون الطاولة الطويلة مشتركة بعد الظهر في عطلة نهاية الأسبوع.',
    topics: ['visit', 'general'],
  },
  {
    question: 'Do you roast your own coffee?',
    questionAr: 'هل تحمّصون قهوتكم بأنفسكم؟',
    answer:
      'Yes, on a 5kg Giesen in the back of the warehouse, every Tuesday and Friday. You can watch through the glass, and the retail bags are stamped with the roast date rather than a best-before — coffee has a peak, not an expiry.',
    answerAr:
      'نعم، على محمصة جيسن سعة ٥ كجم في مؤخرة المستودع، كل ثلاثاء وجمعة. يمكنك مشاهدة العملية عبر الزجاج، وتُختم أكياس البيع بتاريخ التحميص لا بتاريخ الانتهاء — فللقهوة ذروة لا صلاحية.',
    topics: ['menu', 'general'],
  },
  {
    question: 'Is it child friendly? Do you have high chairs?',
    questionAr: 'هل المكان مناسب للأطفال؟ وهل تتوفر كراسي أطفال؟',
    answer:
      'Very. We keep four high chairs, there is a changing table in the accessible WC, and prams fit between the floor tables. Ask for a half portion of the pancakes — it is not on the menu but it exists.',
    answerAr:
      'بالتأكيد. لدينا أربعة كراسي أطفال، وطاولة تغيير في دورة المياه المجهّزة، وتتسع المسافات بين الطاولات لعربات الأطفال. اطلب نصف حصة من البان كيك — ليست في القائمة لكنها متاحة.',
    topics: ['visit'],
  },
  {
    question: 'Is the café wheelchair accessible?',
    questionAr: 'هل المقهى مهيأ لمستخدمي الكراسي المتحركة؟',
    answer: brand.service.accessibility,
    answerAr:
      'نعم. مدخل خالٍ من الدرجات من فناء شارع ١٧، ودورة مياه مجهّزة، ومسافة ٩٠ سم بين جميع الطاولات الأرضية. أخبرنا عند الحجز وسنخصص لك طاولة قريبة من المدخل.',
    topics: ['visit'],
  },
  {
    question: 'Can I book the whole place for an event?',
    questionAr: 'هل يمكن حجز المكان بالكامل لمناسبة؟',
    answer:
      'Yes. The courtyard seats 40 standing or 24 seated, and the whole warehouse takes 70 standing. We do launches, cuppings, supper clubs and the occasional wedding brunch. Minimum spend applies at weekends — send the private hire form and we will come back within a day with real numbers.',
    answerAr:
      'نعم. يتسع الفناء لـ ٤٠ شخصاً واقفاً أو ٢٤ جالساً، ويستوعب المستودع بالكامل ٧٠ شخصاً واقفاً. ننظّم إطلاقات المنتجات وجلسات التذوق والعشاءات الخاصة وأحياناً برانش الأعراس. يُطبّق حد أدنى للإنفاق في عطلة نهاية الأسبوع — أرسل نموذج الحجز الخاص وسنعود إليك خلال يوم بأرقام واضحة.',
    topics: ['booking', 'general'],
  },
];

export function faqsFor(topic: Faq['topics'][number]): readonly Faq[] {
  return faqs.filter((f) => f.topics.includes(topic));
}
