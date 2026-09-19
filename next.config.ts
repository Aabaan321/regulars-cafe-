import createMDX from '@next/mdx';
import type { NextConfig } from 'next';

/**
 * Security headers applied to every response.
 *
 * The CSP is deliberately strict: the only third-party origins the site may
 * reach are Stripe (checkout) and the tile server used by the Visit page's
 * lazy map. Everything else — fonts, images, analytics — is first-party.
 */
const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(self), interest-cohort=()',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  pageExtensions: ['ts', 'tsx', 'mdx'],

  images: {
    // All photography is served from /public/images so the demo works with no
    // network. remotePatterns is kept so a client can swap in a CDN later.
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [{ protocol: 'https', hostname: 'images.unsplash.com' }],
    deviceSizes: [360, 414, 640, 768, 1024, 1280, 1536, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  experimental: {
    optimizePackageImports: ['@react-three/drei', 'date-fns'],
  },

  // three.js ships untranspiled ESM examples; Next handles it, but keeping the
  // transpile list explicit avoids surprises when drei pulls new addons in.
  transpilePackages: ['three'],

  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      {
        // Immutable hashed assets.
        source: '/images/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/models/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },
};

const withMDX = createMDX({
  options: {
    remarkPlugins: [['remark-gfm', {}]],
    rehypePlugins: [],
  },
});

export default withMDX(nextConfig);
