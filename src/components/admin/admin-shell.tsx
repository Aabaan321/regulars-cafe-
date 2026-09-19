import Link from 'next/link';
import { signOutAction } from '@/lib/actions/auth';
import { Logo } from '@/components/ui/logo';
import type { AdminIdentity } from '@/lib/auth/session';

export interface AdminNavItem {
  readonly href: string;
  readonly label: string;
  /** Shown as a count badge, e.g. new enquiries. */
  readonly badge?: number;
}

/**
 * Admin chrome.
 *
 * Deliberately plainer than the public site: this is a tool someone uses at
 * 7am with one hand while steaming milk, not a brochure. Dense type, high
 * contrast, no decoration that is not load-bearing.
 */
export function AdminShell({
  identity,
  nav,
  current,
  title,
  subtitle,
  actions,
  loginPath,
  publicHref,
  children,
}: {
  identity: AdminIdentity;
  nav: readonly AdminNavItem[];
  current: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  loginPath: string;
  publicHref: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-line bg-surface sticky top-0 z-40 border-b">
        <div className="container-wide flex h-14 items-center gap-4">
          <Link href={publicHref} className="text-lg no-underline">
            <Logo showRing={false} />
          </Link>
          <span className="text-faint border-line text-2xs hidden border-s ps-4 font-bold tracking-wider uppercase sm:inline">
            Staff
          </span>

          <div className="ms-auto flex items-center gap-3">
            <span className="text-muted hidden text-xs sm:inline">
              {identity.name}
              <span className="text-faint text-2xs ms-2 rounded-[var(--radius-xs)] border border-[var(--c-border)] px-1.5 py-0.5 font-bold uppercase">
                {identity.role}
              </span>
            </span>
            <form action={signOutAction}>
              <input type="hidden" name="redirectTo" value={loginPath} />
              <button type="submit" className="btn btn-ghost btn-sm border-line border">
                Sign out
              </button>
            </form>
          </div>
        </div>

        <nav aria-label="Admin sections" className="border-line border-t">
          <ul className="container-wide -mb-px flex [scrollbar-width:none] gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden">
            {nav.map((item) => {
              const active = current === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={[
                      'inline-flex items-center gap-2 border-b-2 px-3 py-2.5 text-xs font-semibold whitespace-nowrap no-underline transition-colors',
                      active
                        ? 'border-accent text-ink'
                        : 'text-muted hover:text-ink border-transparent',
                    ].join(' ')}
                  >
                    {item.label}
                    {typeof item.badge === 'number' && item.badge > 0 ? (
                      <span className="bg-accent text-accent-ink text-2xs inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 font-bold tabular-nums">
                        {item.badge}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>

      <main id="main" className="container-wide flex-1 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="display-3">{title}</h1>
            {subtitle ? <p className="text-muted mt-1 text-xs">{subtitle}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </div>
        {children}
      </main>
    </div>
  );
}

/** A labelled figure for the top-of-page stat row. */
export function StatTile({
  label,
  value,
  hint,
  tone = 'default',
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: 'default' | 'accent' | 'warning';
}) {
  return (
    <div className="border-line bg-surface rounded-[var(--radius-md)] border p-4">
      <p className="text-faint text-2xs font-bold tracking-wider uppercase">{label}</p>
      <p
        className={[
          'font-display mt-1 text-2xl leading-none font-semibold tabular-nums',
          tone === 'accent' ? 'text-accent' : tone === 'warning' ? 'text-warning' : 'text-ink',
        ].join(' ')}
      >
        {value}
      </p>
      {hint ? <p className="text-faint text-2xs mt-1.5">{hint}</p> : null}
    </div>
  );
}

/** Designed empty state — every list in the admin gets one. */
export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="border-line bg-bg-subtle rounded-[var(--radius-lg)] border border-dashed p-12 text-center">
      <p className="font-display text-ink text-xl">{title}</p>
      <p className="text-muted mx-auto mt-2 max-w-[34rem] text-xs leading-relaxed">{body}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}
