import type { FieldErrors } from '@/lib/validation/schemas';

/**
 * The shape every form action returns.
 *
 * This lives outside `forms.ts` because a `'use server'` module may only
 * export async functions — exporting a plain object from one fails the build
 * at runtime with "can only export async functions, found object". Types are
 * erased so they would be fine, but `initialFormState` is a real value.
 */

export type FormStatus = 'idle' | 'success' | 'error';

export interface FormState {
  readonly status: FormStatus;
  readonly message?: string;
  readonly fieldErrors?: FieldErrors;
  /** Echoed back so the client can re-render what the guest typed. */
  readonly values?: Record<string, string>;
}

export const initialFormState: FormState = { status: 'idle' };
