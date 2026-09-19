'use client';

import { useEffect, useId, useRef, useState } from 'react';

/**
 * Form building blocks shared by every public form.
 *
 * The two anti-spam controls live here so no form can forget them: a honeypot
 * field that is hidden from people but not from bots, and a hidden timestamp
 * of when the form was rendered. Both are checked server-side in
 * `looksAutomated()`.
 */

/**
 * Honeypot + timing. Hidden with clip-path rather than `display:none` because
 * some form-fillers skip display:none but not clipped content, and marked
 * `aria-hidden` + `tabIndex={-1}` so it is genuinely invisible to assistive
 * technology and to keyboard users.
 */
export function BotFields() {
  const [renderedAt, setRenderedAt] = useState<number>(0);
  const id = useId();

  useEffect(() => setRenderedAt(Date.now()), []);

  return (
    <>
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          overflow: 'hidden',
          clipPath: 'inset(50%)',
          whiteSpace: 'nowrap',
        }}
      >
        <label htmlFor={`${id}-website`}>Leave this field empty</label>
        <input
          id={`${id}-website`}
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          defaultValue=""
        />
      </div>
      <input type="hidden" name="renderedAt" value={renderedAt || ''} readOnly />
    </>
  );
}

export function Field({
  label,
  name,
  error,
  hint,
  children,
  required,
  optionalLabel,
}: {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  children: (props: {
    id: string;
    name: string;
    'aria-invalid': boolean | undefined;
    'aria-describedby': string | undefined;
  }) => React.ReactNode;
  required?: boolean;
  optionalLabel?: string;
}) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ');

  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
        {!required && optionalLabel ? (
          <span className="text-faint ms-1.5 font-normal">({optionalLabel})</span>
        ) : null}
      </label>
      {children({
        id,
        name,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': describedBy || undefined,
      })}
      {hint ? (
        <p id={hintId} className="field-hint">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="field-error" role="alert">
          <span aria-hidden="true">⚠</span>
          {error}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Result banner. `role="status"` rather than `alert` for success so a screen
 * reader announces it without interrupting, and `alert` for errors so it does.
 */
export function FormResult({
  status,
  title,
  body,
  onReset,
  resetLabel,
}: {
  status: 'success' | 'error';
  title: string;
  body?: string;
  onReset?: () => void;
  resetLabel?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  const success = status === 'success';

  return (
    <div
      ref={ref}
      tabIndex={-1}
      role={success ? 'status' : 'alert'}
      className={[
        'rounded-[var(--radius-md)] border p-5 outline-none',
        success
          ? 'border-[color-mix(in_oklab,var(--c-success)_40%,transparent)] bg-[color-mix(in_oklab,var(--c-success)_10%,transparent)]'
          : 'border-[color-mix(in_oklab,var(--c-danger)_40%,transparent)] bg-[color-mix(in_oklab,var(--c-danger)_8%,transparent)]',
      ].join(' ')}
    >
      <p className="flex items-start gap-2 font-bold">
        <span aria-hidden="true" className={success ? 'text-success' : 'text-danger'}>
          {success ? '✓' : '⚠'}
        </span>
        {title}
      </p>
      {body ? <p className="text-muted mt-1.5 ps-6 text-xs">{body}</p> : null}
      {onReset && resetLabel ? (
        <button type="button" onClick={onReset} className="btn btn-secondary btn-sm mt-4 ms-6">
          {resetLabel}
        </button>
      ) : null}
    </div>
  );
}

export function SubmitButton({
  label,
  pendingLabel,
  pending,
  className = 'btn',
}: {
  label: string;
  pendingLabel: string;
  pending: boolean;
  className?: string;
}) {
  return (
    <button type="submit" className={className} disabled={pending} data-loading={pending}>
      <span aria-live="polite">{pending ? pendingLabel : label}</span>
    </button>
  );
}
