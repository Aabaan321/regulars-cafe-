'use client';

import { useActionState } from 'react';
import { signInAction } from '@/lib/actions/auth';
import { initialFormState } from '@/lib/actions/form-state';
import { Field, FormResult, SubmitButton } from '@/components/forms/form-parts';

export function LoginForm({ redirectTo, demoHint }: { redirectTo: string; demoHint?: string }) {
  const [state, action, pending] = useActionState(signInAction, initialFormState);
  const v = state.values ?? {};

  return (
    <form action={action} noValidate className="flex flex-col gap-5">
      <input type="hidden" name="redirectTo" value={redirectTo} />

      {state.status === 'error' ? (
        <FormResult status="error" title="Could not sign you in" body={state.message} />
      ) : null}

      <Field label="Email" name="email" error={state.fieldErrors?.email} required>
        {(props) => (
          <input
            {...props}
            type="email"
            required
            autoComplete="username"
            defaultValue={v.email ?? ''}
            className="field-input"
          />
        )}
      </Field>

      <Field label="Password" name="password" error={state.fieldErrors?.password} required>
        {(props) => (
          <input
            {...props}
            type="password"
            required
            autoComplete="current-password"
            className="field-input"
          />
        )}
      </Field>

      <SubmitButton
        label="Sign in"
        pendingLabel="Signing in…"
        pending={pending}
        className="btn btn-lg"
      />

      {demoHint ? (
        <p className="text-faint border-line text-2xs mt-2 border-t pt-4 leading-relaxed">
          {demoHint}
        </p>
      ) : null}
    </form>
  );
}
