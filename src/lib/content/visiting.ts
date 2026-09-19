/**
 * The practical detail of actually getting to Warehouse 14 and being in it.
 *
 * Tier 1's visit page answers "where are you and when are you open". From
 * Tier 2 it answers the questions that actually stop people coming: whether
 * there is parking on a Saturday, whether a wheelchair can get in, whether
 * the room with the roaster in it is too loud to take a call.
 *
 * Written the way the café would answer them at the counter — including the
 * parts that are inconvenient, because a visit page that only says flattering
 * things is one nobody trusts twice.
 */

export interface TransportOption {
  readonly id: string;
  readonly mode: string;
  readonly modeAr: string;
  readonly detail: string;
  readonly detailAr: string;
  /** Door-to-door, honestly. */
  readonly time: string;
  readonly timeAr: string;
  readonly icon: string;
}

export const transport: readonly TransportOption[] = [
  {
    id: 'metro',
    mode: 'Metro',
    modeAr: 'المترو',
    detail:
      'Equiti or Noor Bank on the Red Line, then a 12-minute taxi. Al Quoz has no metro stop of its own and the walk is not one we would recommend in summer.',
    detailAr:
      'محطة إكويتي أو نور بنك على الخط الأحمر، ثم 12 دقيقة بالأجرة. لا توجد محطة مترو في القوز نفسها، ولا ننصح بالمشي في الصيف.',
    time: '12 min from Equiti',
    timeAr: '12 دقيقة من إكويتي',
    icon: '◉',
  },
  {
    id: 'taxi',
    mode: 'Taxi or Careem',
    modeAr: 'أجرة أو كريم',
    detail:
      'Ask for Alserkal Avenue, not the street address — every driver in the city knows it. We are Warehouse 14, on the left past the courtyard.',
    detailAr:
      'اطلب جادة السركال وليس عنوان الشارع — يعرفها كل سائق في المدينة. نحن المستودع 14، على اليسار بعد الساحة.',
    time: '18 min from Downtown',
    timeAr: '18 دقيقة من وسط المدينة',
    icon: '▭',
  },
  {
    id: 'car',
    mode: 'Driving',
    modeAr: 'بالسيارة',
    detail:
      'Free parking in the Alserkal lot, roughly 180 spaces. It fills by 10:30 on Saturdays and during exhibition openings; the overflow on 8th Street is a four-minute walk.',
    detailAr:
      'مواقف مجانية في ساحة السركال، نحو 180 موقفاً. تمتلئ بحلول 10:30 صباح السبت وخلال افتتاحات المعارض؛ والمواقف الإضافية في الشارع الثامن على بعد أربع دقائق مشياً.',
    time: 'Free, 180 spaces',
    timeAr: 'مجانية، 180 موقفاً',
    icon: '⬡',
  },
  {
    id: 'bike',
    mode: 'Bike',
    modeAr: 'دراجة',
    detail:
      'Racks by the courtyard entrance, shaded from about 2pm. There is no secure cage, so bring a lock you trust.',
    detailAr:
      'حوامل بجانب مدخل الساحة، مظللة من حوالي الثانية ظهراً. لا يوجد قفص آمن، لذا أحضر قفلاً تثق به.',
    time: 'Racks at the courtyard',
    timeAr: 'حوامل عند الساحة',
    icon: '◎',
  },
];

export interface AccessNote {
  readonly id: string;
  readonly title: string;
  readonly titleAr: string;
  readonly body: string;
  readonly bodyAr: string;
  /** `true` where we meet the need, `false` where we honestly do not. */
  readonly provided: boolean;
}

export const accessibility: readonly AccessNote[] = [
  {
    id: 'step-free',
    title: 'Step-free from the car park',
    titleAr: 'دخول بلا درجات من الموقف',
    body: 'Level all the way from the Alserkal lot through the courtyard to our door. The door is 92cm wide and is propped open during service.',
    bodyAr:
      'مستوٍ تماماً من ساحة السركال عبر الفناء حتى بابنا. عرض الباب 92 سم ويبقى مفتوحاً أثناء الخدمة.',
    provided: true,
  },
  {
    id: 'wc',
    title: 'Accessible WC',
    titleAr: 'دورة مياه مهيأة',
    body: 'Shared with the Avenue, 40 metres from our door in the central block. Ours is not accessible — the warehouse plumbing would not allow it without moving the roaster.',
    bodyAr:
      'مشتركة مع الجادة، على بعد 40 متراً من بابنا في المبنى المركزي. دورة المياه لدينا غير مهيأة — سباكة المستودع لا تسمح بذلك دون نقل المحمصة.',
    provided: false,
  },
  {
    id: 'seating',
    title: 'Table height and movable seating',
    titleAr: 'ارتفاع الطاولات ومقاعد متحركة',
    body: 'Six of the eighteen tables are 74cm with no crossbar and chairs that move. Ask for the window side and we will clear one.',
    bodyAr:
      'ست طاولات من أصل ثماني عشرة بارتفاع 74 سم بلا عارضة، بكراسٍ متحركة. اطلب جهة النافذة وسنجهّز واحدة.',
    provided: true,
  },
  {
    id: 'noise',
    title: 'Noise',
    titleAr: 'الضوضاء',
    body: 'The roaster runs Tuesday and Thursday mornings and it is genuinely loud — around 78dB at the back tables. The mezzanine is the quiet room; we will tell you honestly if it is a bad morning for a call.',
    bodyAr:
      'تعمل المحمصة صباح الثلاثاء والخميس وهي مرتفعة الصوت فعلاً — نحو 78 ديسيبل عند الطاولات الخلفية. الميزانين هي الغرفة الهادئة؛ وسنخبرك بصراحة إن كان الصباح غير مناسب لمكالمة.',
    provided: false,
  },
  {
    id: 'guide',
    title: 'Guide dogs',
    titleAr: 'كلاب الإرشاد',
    body: 'Welcome anywhere in the room, including the mezzanine. Water bowl at the counter, ask and we will fill it.',
    bodyAr: 'مرحب بها في كل أنحاء المكان، بما فيها الميزانين. وعاء ماء عند البار، اطلبه وسنملؤه.',
    provided: true,
  },
  {
    id: 'menu-formats',
    title: 'Menu in other formats',
    titleAr: 'القائمة بصيغ أخرى',
    body: 'Large-print cards behind the till, and this site reads cleanly on a screen reader — it was built that way rather than retrofitted.',
    bodyAr:
      'بطاقات بخط كبير خلف الصندوق، وهذا الموقع يُقرأ بوضوح عبر قارئ الشاشة — بُني هكذا منذ البداية لا لاحقاً.',
    provided: true,
  },
];

export interface RoomNote {
  readonly id: string;
  readonly name: string;
  readonly nameAr: string;
  readonly seats: string;
  readonly best: string;
  readonly bestAr: string;
  readonly caveat: string;
  readonly caveatAr: string;
}

export const rooms: readonly RoomNote[] = [
  {
    id: 'window',
    name: 'The window run',
    nameAr: 'صف النافذة',
    seats: '6 tables · 2–4 each',
    best: 'North light until about 3pm, and the only part of the room where you can see the courtyard. Where most people end up staying longer than they meant to.',
    bestAr:
      'ضوء شمالي حتى الثالثة تقريباً، والجزء الوحيد الذي ترى منه الفناء. هنا يبقى معظم الناس أطول مما نووا.',
    caveat: 'Warmest seats in the room from June to September.',
    caveatAr: 'أكثر المقاعد دفئاً من يونيو إلى سبتمبر.',
  },
  {
    id: 'bar',
    name: 'The brew bar',
    nameAr: 'بار التقطير',
    seats: '8 stools',
    best: 'Sit here if you want to watch the V60 being made and ask what the lot is. The card by the grinder tells you the farm, the altitude and what we paid.',
    bestAr:
      'اجلس هنا إن أردت مشاهدة تحضير الـV60 والسؤال عن الدفعة. البطاقة بجانب المطحنة تخبرك بالمزرعة والارتفاع وما دفعناه.',
    caveat: 'No table service and nowhere to put a laptop.',
    caveatAr: 'لا خدمة طاولات ولا مكان لحاسوب محمول.',
  },
  {
    id: 'mezzanine',
    name: 'The mezzanine',
    nameAr: 'الميزانين',
    seats: '4 tables · seats 14',
    best: 'The quiet room, up eleven steps. Power at every table, and the only place we will take a booking for a group of eight.',
    bestAr:
      'الغرفة الهادئة، فوق إحدى عشرة درجة. كهرباء عند كل طاولة، والمكان الوحيد الذي نقبل فيه حجزاً لثمانية أشخاص.',
    caveat: 'Stairs only — there is no lift to it.',
    caveatAr: 'بالدرج فقط — لا يوجد مصعد إليها.',
  },
  {
    id: 'long-table',
    name: 'The long table',
    nameAr: 'الطاولة الطويلة',
    seats: 'Seats 12, shared',
    best: 'Communal, first-come, and where the regulars who know each other end up. Good for one person with a book.',
    bestAr: 'مشتركة، بالأسبقية، وحيث ينتهي المطاف بالرواد الذين يعرفون بعضهم. مناسبة لشخص مع كتاب.',
    caveat: 'Never reservable, including for groups.',
    caveatAr: 'غير قابلة للحجز أبداً، حتى للمجموعات.',
  },
];
