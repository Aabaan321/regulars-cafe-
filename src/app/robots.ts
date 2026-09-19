import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/config/brand';

/**
 * Admin areas and API routes are disallowed — not as a security control (they
 * are behind auth and RLS), but so crawl budget is not spent on a login form.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/essential/admin',
          '/signature/admin',
          '/immersive/admin',
          '/ar/signature/admin',
          '/ar/immersive/admin',
          '/signature/book/manage',
          '/ar/signature/book/manage',
          '/signature/order/success',
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
