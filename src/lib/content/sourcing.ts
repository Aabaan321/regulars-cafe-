/**
 * What is on the brew bar, and what we paid for it.
 *
 * The café's whole positioning is that it names its farms and prints the
 * price it paid on the bag, so this is not decoration — it is the claim the
 * brand is making, in numbers a buyer could check. Everything here is the
 * kind of detail a roastery genuinely knows about its own lots: producer,
 * altitude, varietal, process, the FOB price, and the date it landed.
 *
 * This is Tier 2 and above. Tier 1 names the farms in prose on the story
 * page; from Tier 2 the café can keep the lots current itself.
 */

export interface CoffeeLot {
  readonly id: string;
  readonly origin: string;
  readonly originAr: string;
  readonly farm: string;
  readonly farmAr: string;
  readonly producer: string;
  readonly region: string;
  readonly regionAr: string;
  /** Metres above sea level. */
  readonly altitude: string;
  readonly varietal: string;
  readonly varietalAr: string;
  readonly process: string;
  readonly processAr: string;
  /** Free On Board price per kilo, in USD, as paid to the exporter. */
  readonly fobUsdPerKg: number;
  /** Roughly what the commodity ("C") price was that week, for contrast. */
  readonly cPriceUsdPerKg: number;
  readonly landed: string;
  readonly tastingNotes: readonly string[];
  readonly tastingNotesAr: readonly string[];
  /** Which brew methods the bar is running it on. */
  readonly servedAs: readonly string[];
  readonly servedAsAr: readonly string[];
}

export const coffeeLots: readonly CoffeeLot[] = [
  {
    id: 'guji-uraga',
    origin: 'Ethiopia',
    originAr: 'إثيوبيا',
    farm: 'Uraga Washing Station',
    farmAr: 'محطة أوراغا للغسيل',
    producer: 'Tesfaye Bekele and 340 smallholders',
    region: 'Guji, Oromia',
    regionAr: 'غوجي، أوروميا',
    altitude: '1,950–2,150m',
    varietal: 'Heirloom (Kurume, Dega)',
    varietalAr: 'أصناف محلية (كوروميه، ديغا)',
    process: 'Washed, 36h fermentation',
    processAr: 'مغسولة، تخمير 36 ساعة',
    fobUsdPerKg: 8.4,
    cPriceUsdPerKg: 3.1,
    landed: 'March 2026',
    tastingNotes: ['Bergamot', 'White peach', 'Jasmine'],
    tastingNotesAr: ['برغموت', 'خوخ أبيض', 'ياسمين'],
    servedAs: ['V60', 'Batch brew'],
    servedAsAr: ['في60', 'تقطير بالدفعات'],
  },
  {
    id: 'guji-shakiso',
    origin: 'Ethiopia',
    originAr: 'إثيوبيا',
    farm: 'Shakiso Estate, Lot 14',
    farmAr: 'مزرعة شاكيسو، الدفعة 14',
    producer: 'Mulugeta Dinka',
    region: 'Guji, Oromia',
    regionAr: 'غوجي، أوروميا',
    altitude: '2,050m',
    varietal: '74110, 74112',
    varietalAr: '74110، 74112',
    process: 'Natural, 21 days on raised beds',
    processAr: 'طبيعية، 21 يوماً على أسرّة مرتفعة',
    fobUsdPerKg: 9.8,
    cPriceUsdPerKg: 3.1,
    landed: 'February 2026',
    tastingNotes: ['Strawberry', 'Cacao nib', 'Rosewater'],
    tastingNotesAr: ['فراولة', 'حبيبات كاكاو', 'ماء ورد'],
    servedAs: ['Espresso', 'Cold brew'],
    servedAsAr: ['إسبريسو', 'قهوة باردة'],
  },
  {
    id: 'cauca-inza',
    origin: 'Colombia',
    originAr: 'كولومبيا',
    farm: 'Finca El Mirador',
    farmAr: 'مزرعة إل ميرادور',
    producer: 'Luz Dary Chate',
    region: 'Inzá, Cauca',
    regionAr: 'إنسا، كاوكا',
    altitude: '1,780m',
    varietal: 'Caturra, Colombia',
    varietalAr: 'كاتورا، كولومبيا',
    process: 'Washed, 18h dry ferment',
    processAr: 'مغسولة، تخمير جاف 18 ساعة',
    fobUsdPerKg: 7.6,
    cPriceUsdPerKg: 3.1,
    landed: 'January 2026',
    tastingNotes: ['Red apple', 'Panela', 'Almond'],
    tastingNotesAr: ['تفاح أحمر', 'سكر قصب', 'لوز'],
    servedAs: ['House espresso', 'Flat white'],
    servedAsAr: ['إسبريسو البيت', 'فلات وايت'],
  },
  {
    id: 'karnataka-baba',
    origin: 'India',
    originAr: 'الهند',
    farm: 'Baba Budangiri, Block C',
    farmAr: 'بابا بودانغيري، القطاع سي',
    producer: 'Kalyan and Anita Rao',
    region: 'Chikmagalur, Karnataka',
    regionAr: 'تشيكماغالور، كارناتاكا',
    altitude: '1,500m',
    varietal: 'S795, Sln-9',
    varietalAr: 'إس795، إس إل إن-9',
    process: 'Monsooned, 12 weeks',
    processAr: 'معالجة موسمية، 12 أسبوعاً',
    fobUsdPerKg: 5.9,
    cPriceUsdPerKg: 3.1,
    landed: 'Seasonal — on the bar until May',
    tastingNotes: ['Toasted barley', 'Cardamom', 'Dark sugar'],
    tastingNotesAr: ['شعير محمّص', 'هيل', 'سكر داكن'],
    servedAs: ['Karak base', 'Turkish'],
    servedAsAr: ['أساس الكرك', 'تركية'],
  },
];

/** The premium paid over the commodity price, as a whole percentage. */
export function premiumOverC(lot: CoffeeLot): number {
  return Math.round(((lot.fobUsdPerKg - lot.cPriceUsdPerKg) / lot.cPriceUsdPerKg) * 100);
}
