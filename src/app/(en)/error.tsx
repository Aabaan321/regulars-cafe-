'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { brand } from '@/lib/config/brand';

/**
 * The 500 page.
 *
 * Route-level error boundary: a thrown error in any page below this replaces
 * that page rather than the whole app, and the visitor gets a way out plus a
 * phone number. The digest is shown because it is the one thing that makes a
 * bug report actionable.
 */
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[route error]', error);
  }, [error]);

  return (
    <main id="main" className="container-page section-y flex flex-1 items-center">
      <div className="mx-auto max-w-[44rem] text-center">
        <p className="eyebrow mb-3">Something broke</p>
        <h1 className="display-2">That is on us, not on you.</h1>
        <p className="lede mx-auto mt-4 max-w-[34rem]">
          The page failed to load. Trying again usually fixes it. If it does not, the phone
          definitely works.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-2">
          <button type="button" onClick={reset} className="btn btn-lg">
            Try again
          </button>
          <Link href="/" className="btn btn-secondary btn-lg">
            Back to the start
          </Link>
          <a href={`tel:${brand.contact.phone}`} className="btn btn-ghost btn-lg">
            {brand.contact.phoneDisplay}
          </a>
        </div>

        {error.digest ? (
          <p className="text-faint mt-8 font-mono text-2xs">
            Reference: {error.digest}
          </p>
        ) : null}
      </div>
    </main>
  );
}
