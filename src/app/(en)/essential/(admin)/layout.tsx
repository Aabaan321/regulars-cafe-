import type { ReactNode } from 'react';

/**
 * The admin branch.
 *
 * This is a sibling route group to `(site)`, not a child of it, so the staff
 * area inherits none of the marketing chrome — no hero header, no footer
 * newsletter form, no tier-switcher pill floating over the bookings board.
 * Route groups do not appear in the URL, so the path is still
 * `/essential/admin`.
 */
export default function EssentialAdminLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
