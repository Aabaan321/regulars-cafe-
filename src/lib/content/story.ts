/**
 * The Our Story page content.
 *
 * Written as data rather than JSX so Tier 2 can render the same narrative in
 * Arabic, and so the founder's quote can be pulled into the home page and the
 * journal without being copy-pasted.
 *
 * It has a point of view. A café story that could be any café's story is worse
 * than no story at all.
 */

export interface StorySection {
  readonly id: string;
  readonly eyebrow: string;
  readonly eyebrowAr: string;
  readonly heading: string;
  readonly headingAr: string;
  readonly body: readonly string[];
  readonly bodyAr: readonly string[];
  readonly imageKey?: string;
}

export const founder = {
  name: 'Nadia Haddad',
  nameAr: 'نادية حداد',
  role: 'Founder and head roaster',
  roleAr: 'المؤسِّسة ورئيسة التحميص',
  imageKey: 'founder',
  quote:
    'I did not want to open a café that was good “for Dubai”. I wanted to open one that would hold its own in Melbourne, and then make it feel like it belonged in Al Quoz.',
  quoteAr:
    'لم أُرد افتتاح مقهى جيد «بمقاييس دبي». أردت مقهى يصمد في ملبورن، ثم أجعله ينتمي إلى القوز.',
} as const;

export const storyIntro = {
  heading: 'We opened because the good coffee was always somewhere else.',
  headingAr: 'افتتحنا لأن القهوة الجيدة كانت دائماً في مكان آخر.',
  lede: 'Regulars started as a 5kg roaster in a warehouse nobody wanted, and a stubborn idea about what a neighbourhood café owes the people who walk into it.',
  ledeAr:
    'بدأت ريقيولرز بمحمصة سعة ٥ كجم في مستودع لم يرغب به أحد، وبفكرة عنيدة عمّا يدين به مقهى الحي لروّاده.',
} as const;

export const storySections: readonly StorySection[] = [
  {
    id: 'beginning',
    eyebrow: '2024 — The warehouse',
    eyebrowAr: '٢٠٢٤ — المستودع',
    heading: 'Nobody wanted Warehouse 14.',
    headingAr: 'لم يرغب أحد بالمستودع رقم ١٤.',
    body: [
      'It had no plumbing on the east wall, a roller door that stuck, and a landlord who was honest enough to say so. What it did have was eleven metres of north light and a ceiling high enough to vent a roaster — which, if you are opening a coffee roastery in a city that reaches 48°C in August, are the only two things that matter.',
      'Nadia had spent six years on bars in Melbourne and two running quality control for a green importer in Dubai. She had watched a lot of good coffee get ruined in the last ninety seconds of its life, and she had opinions about it.',
      'We opened in October 2024 with nine tables, one grinder, and a hand-written sign apologising that the pastry case was empty until the baker started in January. Somebody photographed the sign. That was the first hundred customers.',
    ],
    bodyAr: [
      'لم يكن فيه تمديدات صحية على الجدار الشرقي، وباب متحرك عالق، ومالك صريح بما يكفي ليقول ذلك. لكن كان فيه أحد عشر متراً من الضوء الشمالي وسقف مرتفع يكفي لتهوية محمصة — وهما الشيئان الوحيدان المهمّان حين تفتتح محمصة في مدينة تبلغ حرارتها ٤٨ درجة في أغسطس.',
      'قضت نادية ست سنوات خلف بارات ملبورن وسنتين في مراقبة الجودة لدى مستورد بن أخضر في دبي. رأت الكثير من القهوة الجيدة تفسد في التسعين ثانية الأخيرة من عمرها، وكان لها رأي في ذلك.',
      'افتتحنا في أكتوبر ٢٠٢٤ بتسع طاولات ومطحنة واحدة ولافتة مكتوبة بخط اليد تعتذر عن خلوّ واجهة المعجنات حتى يبدأ الخبّاز في يناير. صوّر أحدهم اللافتة. وكان ذلك أول مئة زبون.',
    ],
    imageKey: 'spaceDining',
  },
  {
    id: 'sourcing',
    eyebrow: 'Sourcing',
    eyebrowAr: 'المصدر',
    heading: 'We buy from four farms and we name all of them.',
    headingAr: 'نشتري من أربع مزارع ونذكر أسماءها جميعاً.',
    body: [
      'Two in Ethiopia through a Guji cooperative we visit every February, one in Cauca in Colombia, and a seasonal lot from Karnataka that lands in March. That is the whole list. We could buy more cheaply through a broker and nobody would taste the difference for the first week — but they would by the third.',
      'Every price we pay is above the Fairtrade floor and, on the Guji lots, roughly double the C-market. We publish what we paid on the bag. It is not a moral flourish; it is the only way a farm can plan a year.',
      'What we will not do is pretend that a 250g bag from a warehouse in Al Quoz changes an industry. It changes four farms. That is a real number and we are content with it.',
    ],
    bodyAr: [
      'اثنتان في إثيوبيا عبر تعاونية في قوجي نزورها كل فبراير، وواحدة في كاوكا بكولومبيا، ودفعة موسمية من كارناتاكا تصل في مارس. هذه هي القائمة كاملة. يمكننا الشراء بسعر أقل عبر وسيط ولن يلاحظ أحد الفرق في الأسبوع الأول — لكنهم سيلاحظونه في الثالث.',
      'كل سعر ندفعه يفوق الحد الأدنى للتجارة العادلة، ويبلغ في دفعات قوجي نحو ضعف سعر السوق. ونطبع ما دفعناه على الكيس. ليس هذا تباهياً أخلاقياً، بل الطريقة الوحيدة التي تتيح لمزرعة أن تخطط لعامها.',
      'وما لن نفعله هو الادعاء بأن كيساً سعة ٢٥٠ غراماً من مستودع في القوز يغيّر صناعة بأكملها. إنه يغيّر أربع مزارع. رقم حقيقي، ونحن راضون به.',
    ],
    imageKey: 'beansTexture',
  },
  {
    id: 'roasting',
    eyebrow: 'Roasting',
    eyebrowAr: 'التحميص',
    heading: 'Tuesdays and Fridays, with the door open.',
    headingAr: 'كل ثلاثاء وجمعة، والباب مفتوح.',
    body: [
      'The Giesen runs twice a week and the roastery door stays open while it does, which means the whole street smells like it for about four hours and the seats by the glass are the first to go.',
      'We roast light enough to keep the fruit and long enough to keep the sweetness, which is a sentence every roaster says and almost nobody means. In practice: a development time around 22% and a drop temperature we argue about on a whiteboard that has never once been wiped clean.',
      'Bags are stamped with the roast date. Filter coffee is at its best between seven and twenty-one days after that date. Espresso wants a little longer. If you buy a bag that is four days old we will tell you to wait, and we will mean it.',
    ],
    bodyAr: [
      'تعمل محمصة جيسن مرتين أسبوعياً، ويبقى باب المحمصة مفتوحاً أثناء ذلك، فتفوح رائحة التحميص في الشارع كله نحو أربع ساعات، وتكون المقاعد المطلّة على الزجاج أول ما يُشغل.',
      'نحمّص تحميصاً فاتحاً بما يكفي للحفاظ على النكهة الفاكهية، وطويلاً بما يكفي للحفاظ على الحلاوة — وهي جملة يقولها كل محمّص ولا يعنيها أحد تقريباً. عملياً: زمن تطوير نحو ٢٢٪ ودرجة إنزال نتجادل حولها على لوح لم يُمسح يوماً.',
      'تُختم الأكياس بتاريخ التحميص. القهوة المقطّرة في أفضل حالاتها بين اليوم السابع والحادي والعشرين بعد التاريخ. أما الإسبريسو فيحتاج وقتاً أطول قليلاً. وإن اشتريت كيساً عمره أربعة أيام سنطلب منك الانتظار، ونعني ذلك.',
    ],
    imageKey: 'pourOver',
  },
  {
    id: 'kitchen',
    eyebrow: 'The kitchen',
    eyebrowAr: 'المطبخ',
    heading: 'Breakfast, treated like dinner.',
    headingAr: 'إفطار يُعامَل كعشاء.',
    body: [
      'Chef Rami Kassab came to us from a fine-dining room on the Palm and has spent two years quietly refusing to let anything leave the pass that he would not eat standing up. The shakshuka takes forty minutes to build and eleven to cook, and it is the only dish we have never taken off.',
      'Bread is baked here at five in the morning. The labneh is strained overnight. The za’atar comes from a regular’s mother in Jenin, four kilos at a time, and when she cannot send it we say so on the board rather than substituting it.',
      'Nothing on the menu exists because it photographs well. Several things stayed because they did.',
    ],
    bodyAr: [
      'جاءنا الشيف رامي كسّاب من مطعم فاخر في نخلة جميرا، وأمضى عامين يرفض بهدوء أن يخرج من المطبخ أي طبق لا يأكله هو واقفاً. تستغرق الشكشوكة أربعين دقيقة في التحضير وإحدى عشرة في الطهي، وهي الطبق الوحيد الذي لم نرفعه يوماً.',
      'يُخبز الخبز هنا عند الخامسة فجراً، وتُصفّى اللبنة طوال الليل. أما الزعتر فترسله والدة أحد زبائننا من جنين، أربعة كيلوغرامات في كل مرة، وحين يتعذّر ذلك نكتبه على اللوح بدل أن نستبدله.',
      'لا شيء في القائمة موجود لأنه يظهر جميلاً في الصور. لكن عدة أطباق بقيت لأنها كذلك.',
    ],
    imageKey: 'brunchSpread',
  },
  {
    id: 'name',
    eyebrow: 'The name',
    eyebrowAr: 'الاسم',
    heading: 'Why “Regulars”.',
    headingAr: 'لماذا «ريقيولرز».',
    body: [
      'A café is not judged by the people who visit once. It is judged by the forty or so who come twice a week, know which table they want, and will tell you honestly when the milk is too hot.',
      'We wrote the name on the roller door in the first week as a note to ourselves. It stayed.',
      'Come twice and somebody will remember your order. Come three times and we will probably start it when we see you park.',
    ],
    bodyAr: [
      'لا يُقاس المقهى بمن يزوره مرة واحدة، بل بالأربعين الذين يأتون مرتين أسبوعياً، ويعرفون أي طاولة يريدون، ويخبرونك بصراحة حين يكون الحليب ساخناً أكثر من اللازم.',
      'كتبنا الاسم على الباب المتحرك في الأسبوع الأول كملاحظة لأنفسنا. وبقي.',
      'تعال مرتين وسيتذكّر أحدهم طلبك. تعال ثلاث مرات وسنبدأ بتحضيره على الأرجح حين نراك تركن سيارتك.',
    ],
    imageKey: 'spaceShelf',
  },
];

export const team: readonly {
  name: string;
  role: string;
  roleAr: string;
  note: string;
  noteAr: string;
}[] = [
  {
    name: 'Nadia Haddad',
    role: 'Founder, head roaster',
    roleAr: 'المؤسِّسة ورئيسة التحميص',
    note: 'Six years on Melbourne bars. Will re-dial the grinder mid-conversation.',
    noteAr: 'ست سنوات خلف بارات ملبورن. تعيد ضبط المطحنة في منتصف الحديث.',
  },
  {
    name: 'Rami Kassab',
    role: 'Head chef',
    roleAr: 'رئيس الطهاة',
    note: 'Came from fine dining. Stayed for the freedom to put foul on a brunch menu.',
    noteAr: 'جاء من المطاعم الفاخرة، وبقي من أجل حرية وضع الفول في قائمة البرانش.',
  },
  {
    name: 'Joy Mendoza',
    role: 'Bar lead',
    roleAr: 'مسؤولة البار',
    note: 'UAE Brewers Cup finalist, 2026. Makes the karak everyone argues about.',
    noteAr: 'متأهلة لنهائي بطولة الإمارات للتقطير ٢٠٢٦. تُعدّ الكرك الذي يتجادل الجميع حوله.',
  },
  {
    name: 'Tomas Silva',
    role: 'Baker',
    roleAr: 'الخبّاز',
    note: 'Starts at 04:30. Has never once been late. We do not know how.',
    noteAr: 'يبدأ عند الرابعة والنصف فجراً. لم يتأخر يوماً. ولا نعرف كيف.',
  },
];
