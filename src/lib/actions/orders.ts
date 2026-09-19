'use server';

import { brand } from '@/lib/config/brand';
import { asService, isDatabaseConfigured } from '@/lib/db/client';
import { sendEmailDetached } from '@/lib/email/send';
import { getMenuItem, menuItems } from '@/lib/content/menu';
import { formatPrice } from '@/lib/content/menu-display';
import { isOfferedSlot, orderTotals, slotToInstant } from '@/lib/orders/pickup';
import { looksAutomated, rateLimit } from '@/lib/utils/rate-limit';
import type { Locale } from '@/lib/i18n/dictionaries';
import type { OrderResult, SubmittedLine } from '@/lib/orders/result';

/**
 * Placing a pickup order.
 *
 * The rule that shapes this whole module: **the cart is a claim, not a
 * price.** Everything the browser sends about money is thrown away and
 * recomputed here from the menu. A client that posts `{ id: 'flat-white',
 * unitPriceFils: 1 }` gets charged 26 dirhams, because the only number that
 * counts is the one this file looks up. Trusting a posted total is the single
 * most common way a checkout gets robbed, and it is avoided by never reading
 * the field rather than by validating it.
 *
 * Same principle for the pickup time: the slot is re-derived from trading
 * hours server-side, so a hand-crafted request cannot book a collection for
 * 3am or for next Thursday.
 */

const MAX_LINES = 20;
const MAX_QTY_PER_LINE = 10;

export async function placePickupOrder(formData: FormData): Promise<OrderResult> {
  const locale = ((formData.get('locale') as Locale) ?? 'en') satisfies Locale;
  const ar = locale === 'ar';

  // Honeypot and time-to-submit, same guard the other public forms use.
  if (
    looksAutomated({
      honeypot: formData.get('website') as string | null,
      renderedAt: Number(formData.get('renderedAt')) || null,
    })
  ) {
    // Bots are told it worked. They are not told a reference, because there
    // is not one — nothing was written.
    return {
      ok: false,
      code: 'rejected',
      message: ar ? 'تعذّر إرسال الطلب.' : 'Could not place that order.',
    };
  }

  if (!isDatabaseConfigured()) {
    return {
      ok: false,
      code: 'no_database',
      message: ar
        ? 'الطلب عبر الموقع غير متاح في هذه النسخة التجريبية. اتصل بنا وسنجهّزه.'
        : 'Online ordering is not connected in this preview. Call us and we will make it.',
    };
  }

  const name = String(formData.get('name') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  const phone = String(formData.get('phone') ?? '').trim();
  const pickupAt = String(formData.get('pickupAt') ?? '').trim();
  const notes = String(formData.get('notes') ?? '').trim();
  const sourceTier = String(formData.get('sourceTier') ?? 'signature');

  if (name.length < 2 || !email.includes('@') || phone.length < 7) {
    return {
      ok: false,
      code: 'invalid',
      message: ar
        ? 'تحقّق من الاسم والبريد ورقم الهاتف.'
        : 'Check the name, email and phone number.',
    };
  }

  if (!isOfferedSlot(pickupAt)) {
    return {
      ok: false,
      code: 'slot_gone',
      message: ar
        ? 'لم يعد وقت الاستلام هذا متاحاً. اختر وقتاً آخر.'
        : 'That collection time has passed. Pick another one.',
    };
  }
  const pickupInstant = slotToInstant(pickupAt);
  if (!pickupInstant) {
    return {
      ok: false,
      code: 'slot_gone',
      message: ar ? 'وقت استلام غير صالح.' : 'Invalid collection time.',
    };
  }

  /* ── Rebuild the basket from the menu, ignoring every price sent ──────── */

  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get('lines') ?? '[]'));
  } catch {
    return {
      ok: false,
      code: 'invalid',
      message: ar ? 'سلة غير صالحة.' : 'That basket could not be read.',
    };
  }
  if (!Array.isArray(raw) || raw.length === 0) {
    return { ok: false, code: 'empty', message: ar ? 'السلة فارغة.' : 'Your basket is empty.' };
  }
  if (raw.length > MAX_LINES) {
    return {
      ok: false,
      code: 'invalid',
      message: ar
        ? 'طلب كبير جداً للاستلام — تواصل معنا.'
        : 'That is too large for a pickup order — talk to us.',
    };
  }

  const lines: SubmittedLine[] = [];
  for (const entry of raw) {
    if (typeof entry !== 'object' || entry === null) continue;
    const id = String((entry as { id?: unknown }).id ?? '');
    const quantity = Math.floor(Number((entry as { quantity?: unknown }).quantity ?? 0));
    if (!id || !Number.isFinite(quantity) || quantity < 1) continue;
    if (quantity > MAX_QTY_PER_LINE) {
      return {
        ok: false,
        code: 'invalid',
        message: ar
          ? `الحد ${MAX_QTY_PER_LINE} لكل صنف.`
          : `Maximum ${MAX_QTY_PER_LINE} of any one item.`,
      };
    }

    const item = getMenuItem(id) ?? menuItems.find((m) => m.id === id);
    if (!item) continue;
    if (!item.available) {
      return {
        ok: false,
        code: 'unavailable',
        message: ar ? `${item.nameAr} غير متوفر اليوم.` : `${item.name} is not available today.`,
      };
    }

    // The price comes from here and nowhere else.
    lines.push({
      id: item.id,
      name: item.name,
      nameAr: item.nameAr,
      unitPriceFils: item.priceFils,
      quantity,
      lineTotalFils: item.priceFils * quantity,
    });
  }

  if (lines.length === 0) {
    return { ok: false, code: 'empty', message: ar ? 'السلة فارغة.' : 'Your basket is empty.' };
  }

  const gross = lines.reduce((sum, line) => sum + line.lineTotalFils, 0);
  const totals = orderTotals(gross);

  const limit = await rateLimit({
    bucket: 'pickup-order',
    limit: 5,
    windowSeconds: 3600,
    extraIdentity: email,
  });
  if (!limit.allowed) {
    return {
      ok: false,
      code: 'rate_limited',
      message: ar
        ? 'طلبات كثيرة خلال وقت قصير. حاول بعد قليل.'
        : 'Too many orders in a short time. Try again shortly.',
    };
  }

  /* ── Write the order and its lines in one transaction ─────────────────── */

  let reference: string;
  try {
    reference = await asService(async (tx) => {
      const [order] = await tx<{ id: string; reference: string }[]>`
        insert into orders (
          guest_name, email, phone, status, payment_status, pickup_at,
          subtotal_fils, vat_fils, total_fils, notes, locale, source_tier
        ) values (
          ${name}, ${email}, ${phone},
          'awaiting_payment'::public.order_status, 'unpaid'::public.payment_status,
          ${pickupInstant},
          ${totals.subtotalFils}, ${totals.vatFils}, ${totals.totalFils},
          ${notes || null}, ${locale}, ${sourceTier}
        )
        returning id, reference
      `;
      if (!order) throw new Error('order insert returned no row');

      // One statement for every line — a per-line round trip inside a
      // transaction is a lock held open for no reason.
      await tx`
        insert into order_items ${tx(
          lines.map((line, index) => ({
            order_id: order.id,
            menu_item_id: line.id,
            name_snapshot: line.name,
            name_ar_snapshot: line.nameAr,
            unit_price_fils: line.unitPriceFils,
            quantity: line.quantity,
            line_total_fils: line.lineTotalFils,
            sort_order: index,
          })),
          'order_id',
          'menu_item_id',
          'name_snapshot',
          'name_ar_snapshot',
          'unit_price_fils',
          'quantity',
          'line_total_fils',
          'sort_order',
        )}
      `;

      return order.reference;
    });
  } catch (error) {
    console.error('[pickup-order] insert failed', error);
    return {
      ok: false,
      code: 'failed',
      message: ar ? 'تعذّر حفظ الطلب. حاول مرة أخرى.' : 'That order could not be saved. Try again.',
    };
  }

  const when = new Intl.DateTimeFormat(ar ? 'ar-AE' : 'en-AE', {
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: brand.timezone,
  }).format(pickupInstant);

  sendEmailDetached({
    to: brand.contact.bookingsEmail,
    replyTo: email,
    subject: `[${reference}] Pickup order — ${when}`,
    html:
      `<p><strong>${name}</strong> · ${phone} · ${email}</p>` +
      `<p>Collection: <strong>${when}</strong></p>` +
      `<ul>${lines
        .map((l) => `<li>${l.quantity} × ${l.name} — ${formatPrice(l.lineTotalFils)}</li>`)
        .join('')}</ul>` +
      `<p>Total <strong>${formatPrice(totals.totalFils)}</strong> ` +
      `(incl. VAT ${formatPrice(totals.vatFils)})</p>` +
      (notes ? `<p>Notes: ${notes}</p>` : ''),
    template: 'pickup-order-alert',
    meta: { reference, totalFils: totals.totalFils, lines: lines.length },
  });

  return {
    ok: true,
    reference,
    pickupLabel: when,
    totalFils: totals.totalFils,
    vatFils: totals.vatFils,
  };
}
