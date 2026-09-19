import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { LoginForm } from '@/components/admin/login-form';
import { Logo } from '@/components/ui/logo';
import { getCurrentAdmin } from '@/lib/auth/session';
import { isDatabaseConfigured } from '@/lib/db/client';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildMetadata({
  title: 'Staff sign-in',
  description: 'Sign in to the Regulars staff area.',
  path: '/essential/admin/login',
  noIndex: true,
});

export const dynamic = 'force-dynamic';

export default async function EssentialLoginPage() {
  // Without a database there is nothing to sign in against; the admin page
  // itself explains what is missing.
  if (isDatabaseConfigured() && (await getCurrentAdmin())) redirect('/essential/admin');

  return (
    <main id="main" className="flex min-h-dvh items-center justify-center p-[var(--gutter)]">
      <div className="w-full max-w-[26rem]">
        <div className="mb-8 text-center">
          <Logo className="text-2xl" />
          <p className="text-faint text-2xs mt-2 font-bold tracking-wider uppercase">
            Staff area — Essential
          </p>
        </div>

        <div className="card p-6">
          <h1 className="display-3 mb-1">Sign in</h1>
          <p className="text-muted mb-6 text-xs">
            Enquiries and subscribers for the Essential tier.
          </p>
          <LoginForm
            redirectTo="/essential/admin"
            demoHint="Demo logins — owner@regulars.ae, manager@regulars.ae or floor@regulars.ae, password RegularsDemo!2026. Sessions last one shift (8 hours)."
          />
        </div>
      </div>
    </main>
  );
}
