import Link from 'next/link';
import { brand, directionsHref, telHref, whatsappHref } from '@/lib/config/brand';
import { footerNavFor, navFor, tierBase, type TierId } from '@/lib/config/navigation';
import { weeklyHoursRows } from '@/lib/utils/hours';
import { NewsletterForm } from '@/components/forms/newsletter-form';
import { Logo } from '@/components/ui/logo';
import type { Dictionary, Locale } from '@/lib/i18n/dictionaries';

/**
 * The footer, and the site's canonical NAP block.
 *
 * Name, address and phone are rendered from `brand.ts` — the same object the
 * JSON-LD is built from — and marked up so a crawler can read them without
 * guessing. If the café moves, this and the structured data move together or
 * not at all.
 */
export function SiteFooter({
  tier,
  locale,
  dict,
}: {
  tier: TierId;
  locale: Locale;
  dict: Dictionary;
}) {
  const base = tierBase(tier, locale);
  const rows = weeklyHoursRows(locale);
  const primary = navFor(tier).filter((i) => !i.cta);
  const secondary = footerNavFor(tier);
  const year = new Date().getFullYear();

  return (
    <footer className="border-line bg-bg-subtle mt-auto border-t" data-print="hide">
      <div className="container-wide grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-12 lg:gap-8">
        {/* Identity + newsletter */}
        <div className="lg:col-span-4">
          <Link href={base} className="text-xl no-underline">
            <Logo />
          </Link>
          <p className="text-muted measure mt-3 text-xs leading-relaxed">{brand.positioning}</p>
          <div className="mt-6">
            <NewsletterForm dict={dict} locale={locale} tier={tier} source="footer" />
          </div>
        </div>

        {/* NAP — the machine-readable one */}
        <address className="not-italic lg:col-span-3">
          <h2 className="eyebrow mb-3">{dict.footer.findUs}</h2>
          <p className="text-muted text-xs leading-relaxed">
            <span className="text-ink block font-semibold">{brand.name}</span>
            <span className="block">{brand.address.unit}</span>
            <span className="block">{brand.address.street}</span>
            <span className="block">{brand.address.district}</span>
            <span className="block">
              {brand.address.city}, {brand.address.country}
            </span>
          </p>
          <ul className="mt-4 flex flex-col text-xs">
            <li>
              <a
                href={telHref}
                className="hover:text-accent inline-flex min-h-6 items-center py-1 font-semibold no-underline"
              >
                {brand.contact.phoneDisplay}
              </a>
            </li>
            <li>
              <a
                href={`mailto:${brand.contact.email}`}
                className="text-muted hover:text-accent inline-flex min-h-6 items-center py-1 no-underline"
              >
                {brand.contact.email}
              </a>
            </li>
            <li>
              <a
                href={directionsHref}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted hover:text-accent inline-flex min-h-6 items-center py-1 no-underline"
              >
                {dict.common.directions}
                <span className="sr-only"> ({dict.a11y.externalLink})</span>
              </a>
            </li>
            <li>
              <a
                href={whatsappHref()}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted hover:text-accent inline-flex min-h-6 items-center py-1 no-underline"
              >
                {dict.common.whatsapp}
                <span className="sr-only"> ({dict.a11y.externalLink})</span>
              </a>
            </li>
          </ul>
        </address>

        {/* Hours */}
        <div className="lg:col-span-3">
          <h2 className="eyebrow mb-3">{dict.footer.hours}</h2>
          <table className="w-full text-xs">
            <caption className="sr-only">{dict.footer.hours}</caption>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label}>
                  <th scope="row" className="text-muted py-0.5 pe-3 text-start font-medium">
                    {locale === 'ar' ? row.labelAr : row.label}
                  </th>
                  <td className="text-ink py-0.5 text-end font-semibold tabular-nums">
                    {row.display}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Links */}
        <nav aria-label={dict.footer.contact} className="lg:col-span-2">
          <h2 className="eyebrow mb-3">{brand.name}</h2>
          <ul className="flex flex-col text-xs">
            {[...primary, ...secondary].map((item) => (
              <li key={item.path}>
                <Link
                  href={`${base}${item.path}`}
                  className="text-muted hover:text-accent inline-flex min-h-6 items-center py-1 no-underline"
                >
                  {dict.nav[item.key]}
                </Link>
              </li>
            ))}
            <li>
              <a
                href={brand.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted hover:text-accent inline-flex min-h-6 items-center py-1 no-underline"
              >
                {brand.social.instagramHandle}
              </a>
            </li>
          </ul>
        </nav>
      </div>

      <div className="border-line border-t">
        <div className="container-wide text-faint text-2xs flex flex-col gap-2 py-5 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {brand.legalName}. {dict.footer.rights}
          </p>
          <p>
            {dict.footer.builtBy}{' '}
            <a
              href={brand.agency.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-accent font-semibold underline"
            >
              {brand.agency.name}
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
