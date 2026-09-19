import { renderOgImage, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/seo/og-image';
import { brand } from '@/lib/config/brand';

export const alt = `${brand.name} — ${brand.descriptor}`;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image() {
  return renderOgImage({
    eyebrow: 'Essential',
    title: 'Come twice. You’re a regular.',
    subtitle: brand.positioning,
    variant: 'essential',
  });
}
