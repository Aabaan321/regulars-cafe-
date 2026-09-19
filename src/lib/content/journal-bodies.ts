import type { ComponentType } from 'react';

/**
 * Maps a post slug to its MDX body.
 *
 * Static imports rather than reading the filesystem at request time: the MDX
 * is compiled at build time, the bodies are code-split per route, and an
 * unknown slug is a build error rather than a 500. The registry in
 * `journal.ts` holds the metadata; this holds the prose.
 */
type MdxComponent = ComponentType<Record<string, unknown>>;

import GujiUraga from '~/content/journal/guji-uraga-the-lot-we-nearly-did-not-buy.mdx';
import BrunchGuide from '~/content/journal/how-to-order-brunch-in-dubai.mdx';
import JoyKarak from '~/content/journal/joy-mendoza-eleven-minutes-of-karak.mdx';
import SaturdayAlQuoz from '~/content/journal/a-saturday-in-al-quoz.mdx';

export const journalBodies: Record<string, MdxComponent> = {
  'guji-uraga-the-lot-we-nearly-did-not-buy': GujiUraga as MdxComponent,
  'how-to-order-brunch-in-dubai': BrunchGuide as MdxComponent,
  'joy-mendoza-eleven-minutes-of-karak': JoyKarak as MdxComponent,
  'a-saturday-in-al-quoz': SaturdayAlQuoz as MdxComponent,
};
