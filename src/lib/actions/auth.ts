'use server';

import { redirect } from 'next/navigation';
import {
  clearSessionCookie,
  createSession,
  setSessionCookie,
  signIn as verifyCredentials,
} from '@/lib/auth/session';
import { rateLimit } from '@/lib/utils/rate-limit';
import { signInSchema, toFieldErrors } from '@/lib/validation/schemas';
import type { FormState } from '@/lib/actions/form-state';

/**
 * Staff sign-in and sign-out.
 *
 * Failures are deliberately vague — "those details do not match" for both an
 * unknown address and a wrong password — so the form cannot be used to
 * enumerate which addresses are staff. The timing is levelled in `signIn()`
 * for the same reason.
 */
export async function signInAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const parsed = signInSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    redirectTo: formData.get('redirectTo') || undefined,
  });

  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Check the details below.',
      fieldErrors: toFieldErrors(parsed.error),
      values: { email: String(formData.get('email') ?? '') },
    };
  }

  // Five attempts per fifteen minutes, keyed by IP and address together.
  const limit = await rateLimit({
    bucket: 'admin-signin',
    limit: 5,
    windowSeconds: 900,
    extraIdentity: parsed.data.email,
  });
  if (!limit.allowed) {
    return {
      status: 'error',
      message: `Too many attempts. Try again in ${Math.ceil(limit.retryAfterSeconds / 60)} minutes.`,
      values: { email: parsed.data.email },
    };
  }

  const result = await verifyCredentials(parsed.data.email, parsed.data.password);
  if (!result.ok) {
    return {
      status: 'error',
      message:
        result.error === 'inactive'
          ? 'That account has been deactivated. Ask an owner to re-enable it.'
          : 'Those details do not match an active account.',
      values: { email: parsed.data.email },
    };
  }

  await setSessionCookie(await createSession(result.identity));

  // Only ever redirect within this site.
  const target = parsed.data.redirectTo?.startsWith('/')
    ? parsed.data.redirectTo
    : '/signature/admin';
  redirect(target);
}

export async function signOutAction(formData: FormData): Promise<void> {
  await clearSessionCookie();
  const target = String(formData.get('redirectTo') ?? '/signature/admin/login');
  redirect(target.startsWith('/') ? target : '/signature/admin/login');
}
