'use client';

import { useActionState, useId, useState } from 'react';
import { subscribeToNewsletter } from '@/lib/actions/forms';
import { initialFormState } from '@/lib/actions/form-state';
import { BotFields, SubmitButton } from '@/components/forms/form-parts';
import type { Dictionary, Locale } from '@/lib/i18n/dictionaries';
import type { TierId } from '@/lib/config/navigation';

/**
 * Newsletter sign-up.
 *
 * A plain <form> posting to a server action, so it works before hydration and
 * with JavaScript off entirely. `useActionState` upgrades it to an inline
 * submit once React is running.
 */
export function NewsletterForm({
  dict,
  locale,
  tier,
  source = 'footer',
  compact = true,
}: {
  dict: Dictionary;
  locale: Locale;
  tier: TierId;
  source?: string;
  compact?: boolean;
}) {
  const [state, action, pending] = useActionState(subscribeToNewsletter, initialFormState);
  const [email, setEmail] = useState('');
  // This component appears twice on the newsletter page — once in the body and
  // once in the footer. A hard-coded id would duplicate, which silently breaks
  // every <label for> on the page.
  const fieldId = useId();
  const errorId = `${fieldId}-error`;

  if (state.status === 'success') {
    return (
      <div
        role="status"
        className="border-line bg-surface rounded-[var(--radius-md)] border p-4"
      >
        <p className="flex items-start gap-2 text-xs font-bold">
          <span aria-hidden="true" className="text-success">
            ✓
          </span>
          {dict.newsletter.pendingTitle}
        </p>
        <p className="text-muted mt-1 ps-6 text-2xs leading-relaxed">
          {state.message ?? dict.newsletter.pendingBody}
        </p>
      </div>
    );
  }

  return (
    <form action={action} noValidate>
      {!compact ? (
        <>
          <h2 className="display-3 mb-2">{dict.newsletter.heading}</h2>
          <p className="text-muted measure mb-4 text-xs">{dict.newsletter.body}</p>
        </>
      ) : (
        <p className="eyebrow mb-2">{dict.newsletter.heading}</p>
      )}

      <BotFields />
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="sourceTier" value={tier} />
      <input type="hidden" name="source" value={source} />

      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor={fieldId} className="sr-only">
          {dict.forms.email}
        </label>
        <input
          id={fieldId}
          type="email"
          name="email"
          required
          autoComplete="email"
          inputMode="email"
          placeholder={dict.newsletter.placeholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={state.fieldErrors?.email ? true : undefined}
          aria-describedby={state.fieldErrors?.email ? errorId : undefined}
          className="field-input flex-1"
        />
        <SubmitButton
          label={dict.newsletter.subscribe}
          pendingLabel={dict.forms.sending}
          pending={pending}
          className="btn btn-secondary shrink-0"
        />
      </div>

      {state.status === 'error' ? (
        <p id={errorId} className="field-error" role="alert">
          <span aria-hidden="true">⚠</span>
          {state.fieldErrors?.email ?? state.message}
        </p>
      ) : (
        <p className="text-faint mt-2 text-2xs">
          {compact ? dict.newsletter.body : ''}
        </p>
      )}
    </form>
  );
}
