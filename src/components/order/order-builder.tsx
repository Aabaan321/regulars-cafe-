'use client';

import { useId, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { placePickupOrder } from '@/lib/actions/orders';
import { formatPrice } from '@/lib/content/menu-display';
import { orderTotals } from '@/lib/orders/pickup';
import type { PickupSlot } from '@/lib/orders/pickup';
import type { OrderResult } from '@/lib/orders/result';
import type { Locale } from '@/lib/i18n/dictionaries';

/**
 * The pickup basket.
 *
 * State lives here and nowhere else — no context, no store, no URL. The cart
 * is one page's worth of ephemeral state and it does not survive a reload on
 * purpose: a stale basket with yesterday's prices in it is worse than an
 * empty one.
 *
 * The totals shown here are computed client-side for responsiveness, and are
 * then **recomputed from scratch on the server**, which is the number the
 * guest is actually charged. This component could lie about every price on
 * the page and it would change nothing.
 */

export interface OrderableItem {
  readonly id: string;
  readonly name: string;
  readonly priceFils: number;
  readonly categoryId: string;
  readonly categoryName: string;
  readonly available: boolean;
}

export function OrderBuilder({
  items,
  slots,
  locale,
  sourceTier,
  menuHref,
}: {
  items: readonly OrderableItem[];
  slots: readonly PickupSlot[];
  locale: Locale;
  sourceTier: string;
  menuHref: string;
}) {
  const ar = locale === 'ar';
  const formId = useId();
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [result, setResult] = useState<OrderResult | null>(null);
  const [pending, startTransition] = useTransition();
  const [renderedAt] = useState(() => Date.now());

  const lines = useMemo(
    () =>
      items
        .map((item) => ({ item, quantity: quantities[item.id] ?? 0 }))
        .filter((line) => line.quantity > 0),
    [items, quantities],
  );

  const gross = lines.reduce((sum, l) => sum + l.item.priceFils * l.quantity, 0);
  const totals = orderTotals(gross);

  const grouped = useMemo(() => {
    const map = new Map<string, { name: string; items: OrderableItem[] }>();
    for (const item of items) {
      const bucket = map.get(item.categoryId) ?? { name: item.categoryName, items: [] };
      bucket.items.push(item);
      map.set(item.categoryId, bucket);
    }
    return [...map.entries()];
  }, [items]);

  function setQuantity(id: string, next: number): void {
    setQuantities((current) => {
      const clamped = Math.max(0, Math.min(10, next));
      if (clamped === 0) {
        const { [id]: _removed, ...rest } = current;
        return rest;
      }
      return { ...current, [id]: clamped };
    });
  }

  function submit(formData: FormData): void {
    formData.set(
      'lines',
      JSON.stringify(lines.map((l) => ({ id: l.item.id, quantity: l.quantity }))),
    );
    formData.set('renderedAt', String(renderedAt));
    formData.set('locale', locale);
    formData.set('sourceTier', sourceTier);
    startTransition(async () => {
      const outcome = await placePickupOrder(formData);
      setResult(outcome);
      if (outcome.ok) setQuantities({});
    });
  }

  if (result?.ok) {
    return (
      <div className="card mx-auto max-w-[36rem] p-[var(--space-xl)] text-center">
        <p className="eyebrow mb-3">{ar ? 'تم الطلب' : 'Order placed'}</p>
        <p className="font-display text-4xl tracking-tight tabular-nums">{result.reference}</p>
        <p className="text-muted mt-4 leading-[1.7]">
          {ar
            ? `سيكون جاهزاً للاستلام ${result.pickupLabel}. ادفع عند البار عند الاستلام.`
            : `Ready for collection ${result.pickupLabel}. Pay at the bar when you collect.`}
        </p>
        <p className="border-line text-faint mt-5 border-t pt-5 text-sm tabular-nums">
          {ar ? 'الإجمالي' : 'Total'} {formatPrice(result.totalFils, locale)} ·{' '}
          {ar ? 'شامل ضريبة' : 'incl. VAT'} {formatPrice(result.vatFils, locale)}
        </p>
        <button type="button" className="btn btn-secondary mt-6" onClick={() => setResult(null)}>
          {ar ? 'اطلب مرة أخرى' : 'Order something else'}
        </button>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="card mx-auto max-w-[36rem] p-[var(--space-xl)] text-center">
        <p className="eyebrow mb-3">{ar ? 'مغلق الآن' : 'Closed right now'}</p>
        <p className="text-muted leading-[1.7]">
          {ar
            ? 'لا نقبل طلبات الاستلام خارج ساعات العمل. تصفّح القائمة وعُد عندما نفتح.'
            : 'We are not taking pickup orders outside trading hours. Have a look at the menu and come back when we open.'}
        </p>
        <Link href={menuHref} className="btn btn-secondary mt-6">
          {ar ? 'تصفّح القائمة' : 'Browse the menu'}
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-[var(--space-xl)] lg:grid-cols-[1fr_22rem] lg:items-start">
      {/* ── Pick items ─────────────────────────────────────────────────── */}
      <div>
        {grouped.map(([categoryId, group]) => (
          <section key={categoryId} className="mb-[var(--space-xl)]">
            <h2 className="display-3 border-line mb-[var(--space-m)] border-b pb-3">
              {group.name}
            </h2>
            <ul className="flex flex-col">
              {group.items.map((item) => {
                const quantity = quantities[item.id] ?? 0;
                return (
                  <li
                    key={item.id}
                    className="border-line/60 flex items-center gap-4 border-b py-3 last:border-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-faint text-sm tabular-nums">
                        {formatPrice(item.priceFils, locale)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm border-line size-9 border p-0"
                        onClick={() => setQuantity(item.id, quantity - 1)}
                        disabled={quantity === 0}
                        aria-label={ar ? `أنقص ${item.name}` : `Remove one ${item.name}`}
                      >
                        −
                      </button>
                      <output
                        className="w-8 text-center text-sm font-bold tabular-nums"
                        aria-live="polite"
                        aria-label={ar ? `كمية ${item.name}` : `Quantity of ${item.name}`}
                      >
                        {quantity}
                      </output>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm border-line size-9 border p-0"
                        onClick={() => setQuantity(item.id, quantity + 1)}
                        aria-label={ar ? `أضف ${item.name}` : `Add one ${item.name}`}
                      >
                        +
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      {/* ── Basket and details ─────────────────────────────────────────── */}
      <form action={submit} className="card lg:sticky lg:top-[calc(var(--header-h)+1rem)]">
        <div className="p-[var(--space-l)]">
          <h2 className="display-3">{ar ? 'سلتك' : 'Your basket'}</h2>

          {lines.length === 0 ? (
            <p className="text-faint mt-4 text-sm">
              {ar ? 'لم تختر شيئاً بعد.' : 'Nothing chosen yet.'}
            </p>
          ) : (
            <ul className="mt-4 flex flex-col gap-2 text-sm">
              {lines.map(({ item, quantity }) => (
                <li key={item.id} className="flex justify-between gap-3">
                  <span className="text-muted">
                    {quantity} × {item.name}
                  </span>
                  <span className="font-semibold tabular-nums">
                    {formatPrice(item.priceFils * quantity, locale)}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <dl className="border-line mt-[var(--space-m)] border-t pt-[var(--space-m)] text-sm">
            <div className="flex justify-between">
              <dt className="text-faint">{ar ? 'قبل الضريبة' : 'Before VAT'}</dt>
              <dd className="tabular-nums">{formatPrice(totals.subtotalFils, locale)}</dd>
            </div>
            <div className="mt-1 flex justify-between">
              <dt className="text-faint">{ar ? 'ضريبة 5%' : 'VAT 5%'}</dt>
              <dd className="tabular-nums">{formatPrice(totals.vatFils, locale)}</dd>
            </div>
            <div className="mt-2.5 flex justify-between text-base font-bold">
              <dt>{ar ? 'الإجمالي' : 'Total'}</dt>
              <dd className="tabular-nums">{formatPrice(totals.totalFils, locale)}</dd>
            </div>
          </dl>
        </div>

        <div className="border-line border-t p-[var(--space-l)]">
          <label className="field-label" htmlFor={`${formId}-slot`}>
            {ar ? 'وقت الاستلام' : 'Collection time'}
          </label>
          <select id={`${formId}-slot`} name="pickupAt" required className="input w-full">
            {slots.map((slot) => (
              <option key={slot.value} value={slot.value}>
                {slot.dayLabel} · {slot.label}
              </option>
            ))}
          </select>

          <label className="field-label mt-4" htmlFor={`${formId}-name`}>
            {ar ? 'الاسم' : 'Name'}
          </label>
          <input
            id={`${formId}-name`}
            name="name"
            required
            className="input w-full"
            autoComplete="name"
          />

          <label className="field-label mt-4" htmlFor={`${formId}-email`}>
            {ar ? 'البريد الإلكتروني' : 'Email'}
          </label>
          <input
            id={`${formId}-email`}
            name="email"
            type="email"
            required
            className="input w-full"
            autoComplete="email"
          />

          <label className="field-label mt-4" htmlFor={`${formId}-phone`}>
            {ar ? 'رقم الهاتف' : 'Phone'}
          </label>
          <input
            id={`${formId}-phone`}
            name="phone"
            type="tel"
            required
            className="input w-full"
            autoComplete="tel"
          />

          <label className="field-label mt-4" htmlFor={`${formId}-notes`}>
            {ar ? 'ملاحظات (اختياري)' : 'Notes (optional)'}
          </label>
          <textarea id={`${formId}-notes`} name="notes" rows={2} className="input w-full" />

          {/* Honeypot — off-screen, never announced, never tabbable. */}
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="absolute -left-[9999px] size-px opacity-0"
          />

          {result && !result.ok ? (
            <p role="alert" className="text-danger mt-4 text-sm font-semibold">
              {result.message}
            </p>
          ) : null}

          <button
            type="submit"
            className="btn btn-lg mt-[var(--space-m)] w-full"
            disabled={pending || lines.length === 0}
          >
            {pending ? (ar ? 'جارٍ الإرسال…' : 'Placing…') : ar ? 'أرسل الطلب' : 'Place the order'}
          </button>
          <p className="text-faint text-2xs mt-3 leading-[1.6]">
            {ar
              ? 'ادفع عند البار عند الاستلام. لا نأخذ بطاقتك على هذا الموقع.'
              : 'Pay at the bar when you collect. We do not take your card on this site.'}
          </p>
        </div>
      </form>
    </div>
  );
}
