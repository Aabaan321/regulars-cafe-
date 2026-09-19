import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { ImageResponse } from 'next/og';
import { brand } from '@/lib/config/brand';

/**
 * Open Graph card rendering.
 *
 * Every route exports an `opengraph-image` that calls `renderOgImage()`, so
 * a link to any page anywhere unfurls with the brand on it rather than a grey
 * rectangle. Type is set in the real display and body faces — the TTFs in
 * `og-fonts/` are committed so this works offline and at build time with no
 * network call.
 */

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = 'image/png';

const FONT_DIR = path.join(process.cwd(), 'src', 'lib', 'seo', 'og-fonts');

let fontCache: Promise<
  { name: string; data: ArrayBuffer; weight: 400 | 600 | 700; style: 'normal' }[]
> | null = null;

async function loadFonts() {
  fontCache ??= (async () => {
    const read = async (file: string) => {
      const buffer = await readFile(path.join(FONT_DIR, file));
      return new Uint8Array(buffer).buffer as ArrayBuffer;
    };
    return [
      { name: 'Fraunces', data: await read('fraunces-600.ttf'), weight: 600 as const, style: 'normal' as const },
      { name: 'Karla', data: await read('karla-700.ttf'), weight: 700 as const, style: 'normal' as const },
      { name: 'Karla', data: await read('karla-400.ttf'), weight: 400 as const, style: 'normal' as const },
    ];
  })();
  return fontCache;
}

export type OgVariant = 'essential' | 'signature' | 'immersive' | 'pitch';

const VARIANT_ACCENT: Record<OgVariant, string> = {
  essential: brand.colors.light.accent,
  signature: brand.colors.light.secondary,
  immersive: brand.colors.light.highlight,
  pitch: brand.colors.light.text,
};

export interface OgImageOptions {
  readonly title: string;
  readonly subtitle?: string;
  readonly eyebrow?: string;
  readonly variant?: OgVariant;
  readonly dir?: 'ltr' | 'rtl';
}

export async function renderOgImage(options: OgImageOptions): Promise<ImageResponse> {
  const { title, subtitle, eyebrow, variant = 'essential', dir = 'ltr' } = options;
  const accent = VARIANT_ACCENT[variant];
  const c = brand.colors.light;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: c.bg,
          padding: '72px 80px',
          fontFamily: 'Karla',
          direction: dir,
          position: 'relative',
        }}
      >
        {/* A warm wash in the corner, so the card is not a flat rectangle. */}
        <div
          style={{
            position: 'absolute',
            top: -180,
            right: -140,
            width: 620,
            height: 620,
            borderRadius: 999,
            background: accent,
            opacity: 0.12,
            display: 'flex',
          }}
        />

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 999,
                border: `5px solid ${accent}`,
                display: 'flex',
              }}
            />
            <div style={{ fontSize: 30, fontWeight: 700, color: c.text, letterSpacing: '-0.02em' }}>
              {brand.name}
            </div>
            {eyebrow ? (
              <div
                style={{
                  fontSize: 21,
                  color: c.textFaint,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  marginLeft: 10,
                  display: 'flex',
                }}
              >
                {eyebrow}
              </div>
            ) : null}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 940 }}>
          <div
            style={{
              fontFamily: 'Fraunces',
              fontWeight: 600,
              fontSize: title.length > 46 ? 68 : 84,
              lineHeight: 1.04,
              letterSpacing: '-0.03em',
              color: c.text,
              display: 'flex',
            }}
          >
            {title}
          </div>
          {subtitle ? (
            <div
              style={{
                fontSize: 30,
                lineHeight: 1.42,
                color: c.textMuted,
                marginTop: 26,
                maxWidth: 860,
                display: 'flex',
              }}
            >
              {subtitle}
            </div>
          ) : null}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: `2px solid ${c.border}`,
            paddingTop: 26,
            fontSize: 23,
            color: c.textFaint,
          }}
        >
          <div style={{ display: 'flex' }}>
            {brand.address.district}, {brand.address.city}
          </div>
          <div style={{ display: 'flex', color: accent, fontWeight: 700 }}>
            {brand.contact.phoneDisplay}
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: await loadFonts() },
  );
}
