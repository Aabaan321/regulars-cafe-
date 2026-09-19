'use client';

import { useActionState } from 'react';
import { submitEventEnquiry } from '@/lib/actions/forms';
import { initialFormState } from '@/lib/actions/form-state';
import { BotFields, Field, FormResult, SubmitButton } from '@/components/forms/form-parts';
import type { Dictionary, Locale } from '@/lib/i18n/dictionaries';

const EVENT_TYPES = [
  { value: 'private_hire', en: 'Private hire', ar: 'حجز خاص' },
  { value: 'launch', en: 'Product or book launch', ar: 'إطلاق منتج أو كتاب' },
  { value: 'supper_club', en: 'Supper club or dinner', ar: 'عشاء خاص' },
  { value: 'workshop', en: 'Workshop or training', ar: 'ورشة أو تدريب' },
  { value: 'cupping', en: 'Coffee cupping', ar: 'جلسة تذوّق' },
  { value: 'community', en: 'Community event', ar: 'فعالية مجتمعية' },
] as const;

const BUDGETS = [
  { value: '', en: 'Not sure yet', ar: 'غير محدد بعد' },
  { value: '500000', en: 'Up to AED 5,000', ar: 'حتى ٥٬٠٠٠ درهم' },
  { value: '1000000', en: 'AED 5,000 – 10,000', ar: '٥٬٠٠٠ – ١٠٬٠٠٠ درهم' },
  { value: '2000000', en: 'AED 10,000 – 20,000', ar: '١٠٬٠٠٠ – ٢٠٬٠٠٠ درهم' },
  { value: '4000000', en: 'AED 20,000+', ar: 'أكثر من ٢٠٬٠٠٠ درهم' },
] as const;

/** Private-hire enquiry. Routed server-side by headcount, budget and type. */
export function EventEnquiryForm({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const [state, action, pending] = useActionState(submitEventEnquiry, initialFormState);
  const ar = locale === 'ar';
  const v = state.values ?? {};

  if (state.status === 'success') {
    return (
      <FormResult
        status="success"
        title={ar ? 'وصلنا طلبك' : 'That reached us'}
        body={state.message}
      />
    );
  }

  return (
    <form action={action} noValidate className="flex flex-col gap-5">
      <BotFields />
      <input type="hidden" name="locale" value={locale} />

      {state.status === 'error' && !state.fieldErrors ? (
        <FormResult status="error" title={dict.forms.errorTitle} body={state.message} />
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={dict.forms.name} name="name" required error={state.fieldErrors?.name}>
          {(p) => <input {...p} type="text" required autoComplete="name" defaultValue={v.name ?? ''} className="field-input" />}
        </Field>
        <Field label={dict.forms.email} name="email" required error={state.fieldErrors?.email}>
          {(p) => <input {...p} type="email" required autoComplete="email" defaultValue={v.email ?? ''} className="field-input" />}
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={dict.forms.phone} name="phone" required error={state.fieldErrors?.phone}>
          {(p) => <input {...p} type="tel" required autoComplete="tel" defaultValue={v.phone ?? ''} className="field-input" />}
        </Field>
        <Field label={ar ? 'الجهة' : 'Company'} name="company" optionalLabel={dict.common.optional}>
          {(p) => <input {...p} type="text" defaultValue={v.company ?? ''} className="field-input" />}
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <Field label={ar ? 'التاريخ' : 'Date'} name="eventDate" required error={state.fieldErrors?.eventDate}>
          {(p) => <input {...p} type="date" required defaultValue={v.eventDate ?? ''} className="field-input" />}
        </Field>
        <Field label={ar ? 'عدد الضيوف' : 'Guests'} name="headcount" required error={state.fieldErrors?.headcount}>
          {(p) => <input {...p} type="number" required min={1} max={400} defaultValue={v.headcount ?? ''} className="field-input" />}
        </Field>
        <Field label={ar ? 'الميزانية' : 'Budget'} name="budgetFils" optionalLabel={dict.common.optional}>
          {(p) => (
            <select {...p} defaultValue="" className="field-input">
              {BUDGETS.map((b) => (
                <option key={b.value} value={b.value}>
                  {ar ? b.ar : b.en}
                </option>
              ))}
            </select>
          )}
        </Field>
      </div>

      <Field label={ar ? 'نوع الفعالية' : 'Type of event'} name="eventType" required>
        {(p) => (
          <select {...p} defaultValue="private_hire" className="field-input">
            {EVENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {ar ? t.ar : t.en}
              </option>
            ))}
          </select>
        )}
      </Field>

      <Field
        label={ar ? 'أخبرنا عن الفكرة' : 'Tell us about it'}
        name="message"
        required
        error={state.fieldErrors?.message}
      >
        {(p) => <textarea {...p} rows={4} required minLength={10} maxLength={1500} defaultValue={v.message ?? ''} className="field-input resize-y" />}
      </Field>

      <SubmitButton
        label={ar ? 'أرسل الطلب' : 'Send the enquiry'}
        pendingLabel={dict.forms.sending}
        pending={pending}
        className="btn btn-lg self-start"
      />
    </form>
  );
}
