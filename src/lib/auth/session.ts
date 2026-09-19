import 'server-only';
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { asService } from '@/lib/db/client';
import { verifyPassword } from '@/lib/auth/password';

/**
 * Staff sessions.
 *
 * A signed JWT in an httpOnly, SameSite=Lax cookie. The claim set is shaped
 * like a standard OIDC token (`sub`, `email`, `role`) and is handed straight
 * to Postgres as `request.jwt.claims`, so the RLS policies in
 * `0006_rls.sql` — written against `public.jwt_email()` — work unchanged if
 * this module is later swapped for a hosted auth provider.
 *
 * See README § "Swapping in a hosted auth provider".
 */

export type AdminRole = 'owner' | 'manager' | 'staff';

export interface AdminIdentity {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly role: AdminRole;
}

const COOKIE_NAME = 'regulars_staff_session';
const MAX_AGE_SECONDS = 60 * 60 * 8; // one shift

function secret(): Uint8Array {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) {
    throw new Error('AUTH_SECRET must be set to at least 32 characters. See .env.example.');
  }
  return new TextEncoder().encode(value);
}

export async function createSession(identity: AdminIdentity): Promise<string> {
  return new SignJWT({
    email: identity.email,
    name: identity.name,
    role: 'authenticated',
    admin_role: identity.role,
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(identity.id)
    .setIssuedAt()
    .setIssuer('regulars-cafe')
    .setAudience('regulars-admin')
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secret());
}

export async function setSessionCookie(token: string): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

/**
 * The signed-in staff member, or null.
 *
 * Verifies the signature and then re-reads the row, so deactivating an account
 * takes effect on the next request rather than when the token expires.
 */
export async function getCurrentAdmin(): Promise<AdminIdentity | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;

  let email: string;
  try {
    const { payload } = await jwtVerify(token, secret(), {
      issuer: 'regulars-cafe',
      audience: 'regulars-admin',
    });
    email = typeof payload.email === 'string' ? payload.email : '';
  } catch {
    return null;
  }
  if (!email) return null;

  const rows = await asService(
    async (tx) => tx<{ id: string; email: string; name: string; role: AdminRole }[]>`
      select id, email::text, name, role::text as role
        from admin_users
       where email = ${email} and is_active
       limit 1
    `,
  );

  const row = rows[0];
  return row ? { id: row.id, email: row.email, name: row.name, role: row.role } : null;
}

export type SignInResult =
  | { ok: true; identity: AdminIdentity }
  | { ok: false; error: 'invalid_credentials' | 'inactive' };

/**
 * Verifies credentials. Always runs a hash comparison, even for an unknown
 * email, so response timing does not reveal which addresses are staff.
 */
export async function signIn(email: string, password: string): Promise<SignInResult> {
  const normalised = email.trim().toLowerCase();

  const rows = await asService(
    async (tx) => tx<
      { id: string; email: string; name: string; role: AdminRole; password_hash: string; is_active: boolean }[]
    >`
      select id, email::text, name, role::text as role, password_hash, is_active
        from admin_users
       where email = ${normalised}
       limit 1
    `,
  );

  const row = rows[0];
  // A dummy hash of the same shape keeps the work constant for unknown users.
  const hash =
    row?.password_hash ??
    'scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA==$' +
      'Y2Fubm90bWF0Y2hhbnl0aGluZ2V2ZXJiZWNhdXNldGhpc2lzbm90YXJlYWxrZXlhdGFsbHNvcnJ5AAAA';

  const valid = await verifyPassword(password, hash);
  if (!row || !valid) return { ok: false, error: 'invalid_credentials' };
  if (!row.is_active) return { ok: false, error: 'inactive' };

  await asService(
    async (tx) => tx`update admin_users set last_login_at = now() where id = ${row.id}`,
  );

  return {
    ok: true,
    identity: { id: row.id, email: row.email, name: row.name, role: row.role },
  };
}

/** Role hierarchy: owner ⊇ manager ⊇ staff. */
const RANK: Record<AdminRole, number> = { staff: 1, manager: 2, owner: 3 };

export function hasAtLeast(role: AdminRole, required: AdminRole): boolean {
  return RANK[role] >= RANK[required];
}
