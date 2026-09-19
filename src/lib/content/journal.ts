/**
 * Journal index.
 *
 * Post bodies are MDX files in `content/journal/`; their metadata lives here
 * so it is typed, so the index page does not have to parse four files to
 * render a list, and so a post can be reordered or unpublished without
 * touching its prose.
 */

export interface JournalAuthor {
  readonly name: string;
  readonly role: string;
}

export type JournalCategory = 'Coffee' | 'Food' | 'People' | 'Neighbourhood';

export interface JournalPost {
  readonly slug: string;
  readonly title: string;
  readonly titleAr: string;
  readonly excerpt: string;
  readonly excerptAr: string;
  readonly category: JournalCategory;
  readonly publishedAt: string;
  readonly updatedAt?: string;
  readonly author: JournalAuthor;
  readonly heroImageKey: string;
  /** Words in the MDX body — used for reading time and Article schema. */
  readonly wordCount: number;
  readonly keywords: readonly string[];
}

export const journalPosts: readonly JournalPost[] = [
  {
    slug: 'guji-uraga-the-lot-we-nearly-did-not-buy',
    title: 'Guji Uraga: the lot we nearly did not buy',
    titleAr: 'قوجي أوراقا: الدفعة التي كدنا لا نشتريها',
    excerpt:
      'A cupping table in Addis, a score we disagreed about for two hours, and why the best coffee we have ever put on filter almost went to somebody else.',
    excerptAr:
      'طاولة تذوّق في أديس أبابا، ودرجة اختلفنا حولها ساعتين، ولماذا كادت أفضل قهوة قدّمناها أن تذهب إلى غيرنا.',
    category: 'Coffee',
    publishedAt: '2026-08-14',
    author: { name: 'Nadia Haddad', role: 'Founder and head roaster' },
    heroImageKey: 'beansTexture',
    wordCount: 643,
    keywords: ['Ethiopian coffee', 'Guji Uraga', 'specialty coffee sourcing', 'natural process'],
  },
  {
    slug: 'how-to-order-brunch-in-dubai',
    title: 'How to order brunch in Dubai without wasting the meal',
    titleAr: 'كيف تطلب البرانش في دبي دون أن تُهدر الوجبة',
    excerpt:
      'Dubai brunch has meant free-flowing buffets for so long that people have forgotten how to order three good plates. A short, opinionated guide.',
    excerptAr:
      'ارتبط البرانش في دبي بالبوفيهات المفتوحة حتى نسي الناس كيف يطلبون ثلاثة أطباق جيدة. دليل قصير وصريح.',
    category: 'Food',
    publishedAt: '2026-07-02',
    author: { name: 'Rami Kassab', role: 'Head chef' },
    heroImageKey: 'brunchSpread',
    wordCount: 634,
    keywords: ['Dubai brunch', 'brunch guide Dubai', 'where to brunch Al Quoz'],
  },
  {
    slug: 'joy-mendoza-eleven-minutes-of-karak',
    title: 'Joy Mendoza and the eleven minutes of karak',
    titleAr: 'جوي ميندوزا وإحدى عشرة دقيقة من الكرك',
    excerpt:
      'Our bar lead came third in the UAE Brewers Cup and still thinks the hardest drink on our menu costs AED 18. A conversation about the cheapest thing we sell.',
    excerptAr:
      'حلّت مسؤولة البار ثالثة في بطولة الإمارات للتقطير، ولا تزال ترى أن أصعب مشروب في قائمتنا سعره ١٨ درهماً.',
    category: 'People',
    publishedAt: '2026-06-11',
    author: { name: 'Nadia Haddad', role: 'Founder and head roaster' },
    heroImageKey: 'karak',
    wordCount: 599,
    keywords: ['karak Dubai', 'UAE Brewers Cup', 'barista profile Dubai'],
  },
  {
    slug: 'a-saturday-in-al-quoz',
    title: 'A Saturday in Al Quoz, in the right order',
    titleAr: 'يوم سبت في القوز، بالترتيب الصحيح',
    excerpt:
      'Galleries open at ten, the good parking goes by eleven, and the light in Concrete is best at four. How to spend a day on the Avenue without queuing for any of it.',
    excerptAr:
      'تفتح الغاليريهات عند العاشرة، وتمتلئ المواقف الجيدة عند الحادية عشرة، وأجمل ضوء في «كونكريت» عند الرابعة.',
    category: 'Neighbourhood',
    publishedAt: '2026-05-20',
    author: { name: 'Nadia Haddad', role: 'Founder and head roaster' },
    heroImageKey: 'spaceMorning',
    wordCount: 641,
    keywords: ['Alserkal Avenue guide', 'things to do Al Quoz', 'Dubai art district'],
  },
];

/** ~230 words a minute, rounded up, never less than one. */
export function readingMinutes(wordCount: number): number {
  return Math.max(1, Math.round(wordCount / 230));
}

export function getPost(slug: string): JournalPost | undefined {
  return journalPosts.find((p) => p.slug === slug);
}

/** Same category first, then most recent. */
export function relatedPosts(slug: string, limit = 3): readonly JournalPost[] {
  const post = getPost(slug);
  if (!post) return journalPosts.slice(0, limit);
  return journalPosts
    .filter((p) => p.slug !== slug)
    .sort((a, b) => {
      const sameA = a.category === post.category ? 0 : 1;
      const sameB = b.category === post.category ? 0 : 1;
      if (sameA !== sameB) return sameA - sameB;
      return b.publishedAt.localeCompare(a.publishedAt);
    })
    .slice(0, limit);
}

export const journalCategories: readonly JournalCategory[] = [
  'Coffee',
  'Food',
  'People',
  'Neighbourhood',
];
