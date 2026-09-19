import blurMap from './image-blur.json';

/**
 * Every photograph used anywhere on the site, in one place.
 *
 * Photos are sourced from Unsplash but **served from our own origin**
 * (`/public/images`). That is deliberate: the demo is presented on a laptop in
 * a client's office where the wifi may not cooperate, and a hero image behind
 * a third-party CDN is the easiest way to lose an LCP budget.
 *
 * `npm run images:fetch` re-downloads and re-optimises every entry from its
 * `unsplashId` and regenerates `image-blur.json`. To swap in the real café's
 * photography: drop files into `public/images/`, point `src` at them, rewrite
 * the alt text, and re-run the fetch script to regenerate the blur map.
 *
 * Alt text describes **the photograph**, not the product beside it. Where an
 * image is purely decorative it is marked `decorative` and rendered with
 * `alt=""` so a screen reader skips it rather than reading scenery.
 */

export interface SiteImage {
  readonly key: string;
  /** Served path, relative to the origin. */
  readonly src: string;
  /** Intrinsic dimensions of the file on disk — required to reserve space. */
  readonly width: number;
  readonly height: number;
  readonly alt: string;
  readonly decorative: boolean;
  /** Unsplash photo id, kept so the fetch script can re-pull the original. */
  readonly unsplashId: string;
  /** Source page, for the credits list. */
  readonly credit: string;
}

export interface ResolvedImage extends SiteImage {
  readonly blurDataURL: string;
}

/** A 4×3 warm-grey rectangle. Used until the blur map has been generated. */
export const FALLBACK_BLUR =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjMiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjMiIGZpbGw9IiNjZGJmYWUiLz48L3N2Zz4=';

const blurs = blurMap as Record<string, string>;

/* Landscape hero crops — 16:9. */
const HERO_W = 2000;
const HERO_H = 1125;
/* Editorial / gallery crops — 4:3. */
const WIDE_W = 1400;
const WIDE_H = 1050;
/* Portrait crops — 3:4. */
const PORT_W = 1000;
const PORT_H = 1333;
/* Square menu and grid thumbs. */
const SQ = 900;

function img(
  key: string,
  unsplashId: string,
  width: number,
  height: number,
  alt: string,
  decorative = false,
): SiteImage {
  return {
    key,
    src: `/images/${key}.jpg`,
    width,
    height,
    alt,
    decorative,
    unsplashId,
    credit: `https://unsplash.com/photos/${unsplashId}`,
  };
}

const catalogue: readonly SiteImage[] = [
  /* ── Page heroes ────────────────────────────────────────────────────── */
  img('heroHome', '1600093463592-8e36ae95ef56', HERO_W, HERO_H,
    'The main room at Regulars — trailing plants above timber tables, brass pendants, and glazed roof lights letting the afternoon down onto the bar.'),
  img('heroMenu', '1509042239860-f550ce710b93', HERO_W, HERO_H,
    'Two cappuccinos with rosette latte art on a dark table, a sprig of rosemary and a potted herb beside them.'),
  img('heroStory', '1610632380989-680fe40816c6', HERO_W, HERO_H,
    'A cup of coffee on a dark ground with roasted beans falling into frame and steam lifting off the surface.'),
  img('heroGallery', '1495474472287-4d71bcdd2085', HERO_W, HERO_H,
    'Three pairs of hands raising cappuccinos and a cold brew together over a wooden table.'),
  img('heroVisit', '1481833761820-0509d3217039', HERO_W, HERO_H,
    'The café window after dark, warm interior light spilling out onto the pavement.'),

  /* ── The space ──────────────────────────────────────────────────────── */
  img('spaceCounter', '1453614512568-c4024d13c247', WIDE_W, WIDE_H,
    'The service counter: an espresso machine on polished timber, retail bags on open shelves, filament pendants above the pass.'),
  img('spaceRoom', '1517248135467-4c7edcad34c4', WIDE_W, WIDE_H,
    'The back dining room — oak two-tops and black bentwood chairs beneath a slatted timber ceiling.'),
  img('spaceMorning', '1554118811-1e0d58224f24', WIDE_W, WIDE_H,
    'The front room in the morning: rattan chairs pulled up to pale tables beneath a wall of hanging plants.'),
  img('spaceEvening', '1559305616-3f99cd43e353', WIDE_W, WIDE_H,
    'The room in the evening with the lights down and the chalkboard menu lit above the counter.'),
  img('spaceSign', '1501339847302-ac426a4a7cbb', WIDE_W, WIDE_H,
    'An illuminated CAFE sign mounted above the pass, pendant lamps hanging either side.'),
  img('spaceDining', '1521017432531-fbd92d768814', WIDE_W, WIDE_H,
    'A wide view down the room: long timber tables, exposed ceiling services, guests working and talking.'),
  img('spaceShelf', '1513475382585-d06e58bcb0e0', WIDE_W, WIDE_H,
    'A guest reaching for a cookbook from the shelf beside the window seats, against a deep green wall.'),

  /* ── Coffee ─────────────────────────────────────────────────────────── */
  img('espresso', '1559496417-e7f25cb247f3', SQ, SQ,
    'A glass of espresso on a pale surface with dappled leaf shadows falling across it.'),
  img('flatWhite', '1541167760496-1628856ab772', SQ, SQ,
    'Milk being poured into a white cup held in one hand, a rosette forming in the crema.'),
  img('pourOver', '1442512595331-e89e73853f31', SQ, SQ,
    'A gooseneck kettle pouring into a Chemex on the brew bar, a second brewer waiting alongside.'),
  img('karak', '1521302080334-4bebac2763a6', SQ, SQ,
    'A glass cup of dark spiced tea on a wooden coaster, throwing a long shadow across a white surface.'),
  img('coldBrew', '1461023058943-07fcbe16d735', SQ, SQ,
    'Cold brew in a tall glass over ice, the café blurred warm behind it.'),
  img('beansTexture', '1447933601403-0c6688de566e', WIDE_W, WIDE_H,
    'Freshly roasted coffee beans filling the whole frame.'),
  img('beansHouse', '1524350876685-274059332603', SQ, SQ,
    'An open hessian sack spilling roasted coffee beans across a wooden bench.'),

  /* ── Food ───────────────────────────────────────────────────────────── */
  img('pancakes', '1528207776546-365bb710ee93', SQ, SQ,
    'A stack of buttermilk pancakes with banana slices, blueberries and syrup.'),
  img('syrupPour', '1567620905732-2d1ec7ab7445', SQ, SQ,
    'Syrup being poured over a tall stack of pancakes, lit from the side against a dark background.'),
  img('kunafaToast', '1484723091739-30a097e8f929', SQ, SQ,
    'Thick-cut French toast stacked with banana and blueberries, dusted with icing sugar.'),
  img('eggsToast', '1525351484163-7529414344d8', SQ, SQ,
    'A fried egg with a soft yolk on smashed avocado toast, scattered with chilli flakes.'),
  img('croissant', '1555507036-ab1f4038808a', SQ, SQ,
    'A butter croissant on a dark counter with flour dusting the air around it.'),
  img('bread', '1509440159596-0249088772ff', WIDE_W, WIDE_H,
    'Round sourdough loaves and seeded rolls cooling beside a sheaf of wheat.'),
  img('brunchSpread', '1600891964599-f61ba0e24092', WIDE_W, WIDE_H,
    'An overhead shot of a shared brunch table — several plates, dips, flatbread and coffee.'),
  img('bowls', '1504674900247-0877df9cc836', WIDE_W, WIDE_H,
    'Three sharing bowls dressed with herbs, chilli and toasted seeds on a grey stone surface.'),
  img('brunchTable', '1466978913421-dad2ebd01d17', WIDE_W, WIDE_H,
    'Two people eating brunch at a patterned tile table, photographed from above.'),

  /* ── People ─────────────────────────────────────────────────────────── */
  img('founder', '1516224498413-84ecf3a1e7fd', PORT_W, PORT_H,
    'A black and white portrait of Nadia Haddad, who founded Regulars, photographed in the roastery doorway.'),
] as const;

const index: ReadonlyMap<string, SiteImage> = new Map(catalogue.map((e) => [e.key, e]));

export type ImageKey = (typeof catalogue)[number]['key'];

function resolve(base: SiteImage): ResolvedImage {
  return { ...base, blurDataURL: blurs[base.key] ?? FALLBACK_BLUR };
}

export function getImage(key: string): ResolvedImage | undefined {
  const base = index.get(key);
  return base ? resolve(base) : undefined;
}

/** Throws on an unknown key — a missing hero should fail loudly, not silently. */
export function requireImage(key: string): ResolvedImage {
  const found = getImage(key);
  if (!found) {
    throw new Error(
      `Unknown image key "${key}". Add it to src/lib/content/images.ts and run: npm run images:fetch`,
    );
  }
  return found;
}

export const allImages: readonly ResolvedImage[] = catalogue.map(resolve);

/* ── Curated sets ─────────────────────────────────────────────────────── */

/** Masonry gallery, in display order. Mixed aspect ratios on purpose. */
export const galleryKeys: readonly string[] = [
  'spaceMorning',
  'flatWhite',
  'brunchSpread',
  'spaceCounter',
  'pancakes',
  'spaceSign',
  'pourOver',
  'bread',
  'spaceRoom',
  'eggsToast',
  'coldBrew',
  'spaceShelf',
  'croissant',
  'brunchTable',
  'spaceEvening',
  'bowls',
  'syrupPour',
  'spaceDining',
];

/**
 * The Instagram strip. A static, curated list — no client-side scraper, no
 * third-party embed, and none of someone else's JavaScript on our LCP path.
 * Swap captions and permalinks when the real account is connected.
 */
export interface InstagramPost {
  readonly imageKey: string;
  readonly caption: string;
  readonly permalink: string;
  readonly likes: number;
}

export const instagramPosts: readonly InstagramPost[] = [
  { imageKey: 'flatWhite', caption: 'Thirty seconds of someone’s whole morning.', permalink: 'https://www.instagram.com/regulars.dxb', likes: 842 },
  { imageKey: 'kunafaToast', caption: 'Kunafa french toast. Weekends only until we find more hands.', permalink: 'https://www.instagram.com/regulars.dxb', likes: 1291 },
  { imageKey: 'pourOver', caption: 'Guji Uraga on filter this fortnight. Blueberry, jasmine, no notes.', permalink: 'https://www.instagram.com/regulars.dxb', likes: 604 },
  { imageKey: 'spaceMorning', caption: '7am. The best hour in the building.', permalink: 'https://www.instagram.com/regulars.dxb', likes: 977 },
  { imageKey: 'croissant', caption: 'Out by 10:30 again. Sorry. Set an alarm.', permalink: 'https://www.instagram.com/regulars.dxb', likes: 1544 },
  { imageKey: 'brunchTable', caption: 'Table six on a Saturday is the whole point of this.', permalink: 'https://www.instagram.com/regulars.dxb', likes: 731 },
  { imageKey: 'beansHouse', caption: 'Roast day. Tuesdays and Fridays, always.', permalink: 'https://www.instagram.com/regulars.dxb', likes: 488 },
  { imageKey: 'espresso', caption: 'Alserkal light doing the work for us.', permalink: 'https://www.instagram.com/regulars.dxb', likes: 1103 },
  { imageKey: 'karak', caption: 'Karak at cafeteria prices. On purpose. Forever.', permalink: 'https://www.instagram.com/regulars.dxb', likes: 2260 },
];
