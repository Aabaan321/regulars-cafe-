'use client';

import { useActionState, useState } from 'react';
import { submitEnquiry } from '@/lib/actions/forms';
import { initialFormState } from '@/lib/actions/form-state';
import { BotFields, Field, FormResult, SubmitButton } from '@/components/forms/form-parts';
import type { Dictionary, Locale } from '@/lib/i18n/dictionaries';
import type { TierId } from '@/lib/config/navigation';

const TOPICS = [
  { value: 'general', en: 'A general question', ar: 'سؤال عام' },
  { value: 'feedback', en: 'Feedback about a visit', ar: 'ملاحظات عن زيارة' },
  { value: 'private_hire', en: 'Private hire or an event', ar: 'حجز خاص أو مناسبة' },
  { value: 'wholesale', en: 'Wholesale beans', ar: 'بيع الحبوب بالجملة' },
  { value: 'press', en: 'Press', ar: 'إعلام' },
  { value: 'careers', en: 'Working here', ar: 'التوظيف' },
] as const;

/**
 * The contact form.
 *
 * Posts to a server action, so validation and persistence are server-side. On
 * error the guest's input is echoed back from the server rather than relying
 * on the browser having preserved it.
 *
 * Requires JavaScript — see the note in `lib/actions/forms.ts`.
 */
export function ContactForm({
  dict,
  locale,
  tier,
}: {
  dict: Dictionary;
  locale: Locale;
  tier: TierId;
}) {
  const [state, action, pending] = useActionState(submitEnquiry, initialFormState);
  const [resetKey, setResetKey] = useState(0);

  if (state.status === 'success') {
    return (
      <FormResult
        status="success"
        title={dict.forms.successTitle}
        body={state.message ?? dict.forms.successBody}
        onReset={() => {
          setResetKey((k) => k + 1);
          window.location.hash = '#contact';
          window.location.reload();
        }}
        resetLabel={dict.forms.sendAnother}
      />
    );
  }

  const v = state.values ?? {};

  return (
    <form key={resetKey} action={action} noValidate className="flex flex-col gap-5">
      <BotFields />
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="sourceTier" value={tier} />

      {state.status === 'error' && !state.fieldErrors ? (
        <FormResult status="error" title={dict.forms.errorTitle} body={state.message} />
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={dict.forms.name} name="name" error={state.fieldErrors?.name} required>
          {(props) => (
            <input
              {...props}
              type="text"
              required
              autoComplete="name"
              defaultValue={v.name ?? ''}
              className="field-input"
            />
          )}
        </Field>

        <Field label={dict.forms.email} name="email" error={state.fieldErrors?.email} required>
          {(props) => (
            <input
              {...props}
              type="email"
              required
              inputMode="email"
              autoComplete="email"
              defaultValue={v.email ?? ''}
              className="field-input"
            />
          )}
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label={dict.forms.phone}
          name="phone"
          error={state.fieldErrors?.phone}
          optionalLabel={dict.common.optional}
        >
          {(props) => (
            <input
              {...props}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="+971 50 000 0000"
              defaultValue={v.phone ?? ''}
              className="field-input"
            />
          )}
        </Field>

        <Field label={dict.forms.topic} name="topic" error={state.fieldErrors?.topic} required>
          {(props) => (
            <select {...props} defaultValue={v.topic ?? 'general'} className="field-input">
              {TOPICS.map((topic) => (
                <option key={topic.value} value={topic.value}>
                  {locale === 'ar' ? topic.ar : topic.en}
                </option>
              ))}
            </select>
          )}
        </Field>
      </div>

      <Field label={dict.forms.message} name="message" error={state.fieldErrors?.message} required>
        {(props) => (
          <textarea
            {...props}
            required
            rows={6}
            minLength={10}
            maxLength={2000}
            defaultValue={v.message ?? ''}
            className="field-input resize-y"
          />
        )}
      </Field>

      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton
          label={dict.forms.send}
          pendingLabel={dict.forms.sending}
          pending={pending}
          className="btn btn-lg"
        />
        <p className="text-faint text-2xs">
          {locale === 'ar' ? 'نردّ خلال يوم عمل واحد.' : 'We reply within one working day.'}
        </p>
      </div>
    </form>
  );
}
