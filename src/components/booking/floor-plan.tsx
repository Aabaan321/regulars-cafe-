'use client';

import { useEffect, useId, useState } from 'react';
import type { Locale } from '@/lib/i18n/dictionaries';

/**
 * Pick your actual table.
 *
 * Tier 3 only. Tiers 1 and 2 let you say "a table for four at seven" and the
 * database picks the best fit; this shows you the room and lets you choose
 * the one by the window — which is the difference between booking a slot and
 * booking a *seat*, and is most of why anyone pays for Tier 3.
 *
 * The plan coordinates are real columns on `restaurant_tables` (`plan_x`,
 * `plan_y`, `plan_w`, `plan_h`), so the café can move a table in the admin
 * and the drawing moves. Nothing here is hand-positioned.
 *
 * Accessibility is the whole design problem with a picture like this, and it
 * is solved rather than apologised for:
 *
 *  • It is a radio group, not a canvas of click targets. Arrow keys move
 *    between tables, space selects, and the focus ring is visible on the SVG.
 *  • Every table's accessible name says everything the picture says — "Window
 *    4, seats 2 to 4, step-free, free at this time" — so the plan is usable
 *    with the screen off.
 *  • Availability is never colour alone: a taken table is also hatched and
 *    its label struck through.
 */

export interface PlanTable {
  readonly id: string;
  readonly code: string;
  readonly label: string;
  readonly zone: string;
  readonly shape: string;
  readonly seatsMin: number;
  readonly seatsMax: number;
  readonly accessible: boolean;
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly fits: boolean;
  readonly free: boolean;
}

/** The room, in the same units the plan columns use. */
const ROOM = { width: 100, height: 100 } as const;

const ZONE_LABELS: Record<string, { en: string; ar: string }> = {
  window: { en: 'Window run', ar: 'صف النافذة' },
  main: { en: 'Main room', ar: 'القاعة الرئيسية' },
  counter: { en: 'Brew bar', ar: 'بار التقطير' },
  courtyard: { en: 'Courtyard', ar: 'الفناء' },
  mezzanine: { en: 'Mezzanine', ar: 'الميزانين' },
};

export function FloorPlan({
  tables,
  selectedTableId,
  onSelect,
  locale,
  loading = false,
}: {
  tables: readonly PlanTable[];
  selectedTableId: string | null;
  onSelect: (tableId: string | null) => void;
  locale: Locale;
  loading?: boolean;
}) {
  const ar = locale === 'ar';
  const groupId = useId();
  const [hovered, setHovered] = useState<string | null>(null);

  const selectable = tables.filter((t) => t.free && t.fits);

  // If the slot changes under a chosen table and it is no longer offered,
  // drop the selection rather than silently booking something else.
  useEffect(() => {
    if (!selectedTableId) return;
    if (!selectable.some((t) => t.id === selectedTableId)) onSelect(null);
  }, [selectable, selectedTableId, onSelect]);

  function describe(table: PlanTable): string {
    const zone = ZONE_LABELS[table.zone];
    const parts = [
      table.label,
      zone ? (ar ? zone.ar : zone.en) : table.zone,
      ar
        ? `يتسع ${table.seatsMin} إلى ${table.seatsMax}`
        : `seats ${table.seatsMin} to ${table.seatsMax}`,
    ];
    if (table.accessible) parts.push(ar ? 'بلا درجات' : 'step-free');
    if (!table.free) parts.push(ar ? 'محجوزة في هذا الوقت' : 'already taken at this time');
    else if (!table.fits) parts.push(ar ? 'لا تناسب حجم مجموعتك' : 'too small for your party');
    else parts.push(ar ? 'متاحة' : 'free');
    return parts.join(', ');
  }

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <p className="eyebrow">{ar ? 'اختر طاولتك' : 'Choose your table'}</p>
        <p className="text-faint text-2xs tabular-nums">
          {ar
            ? `${selectable.length} طاولة متاحة`
            : `${selectable.length} of ${tables.length} free`}
        </p>
      </div>

      <div
        role="radiogroup"
        aria-label={ar ? 'مخطط الصالة' : 'Floor plan'}
        aria-busy={loading}
        className="border-line bg-bg-subtle relative mt-3 overflow-hidden rounded-[var(--radius-lg)] border"
      >
        <svg
          viewBox={`0 0 ${ROOM.width} ${ROOM.height}`}
          className="block h-auto w-full"
          style={{ opacity: loading ? 0.5 : 1, transition: 'opacity var(--dur-base)' }}
        >
          <defs>
            {/* Taken tables get a hatch as well as a colour. */}
            <pattern
              id={`${groupId}-taken`}
              width="3"
              height="3"
              patternTransform="rotate(45)"
              patternUnits="userSpaceOnUse"
            >
              <line
                x1="0"
                y1="0"
                x2="0"
                y2="3"
                stroke="var(--c-text-faint)"
                strokeWidth="1.1"
                opacity="0.5"
              />
            </pattern>
          </defs>

          {/* The shell: glazing along the top, the bar down the right. */}
          <rect
            x="1"
            y="1"
            width="98"
            height="98"
            rx="2"
            fill="var(--c-surface)"
            stroke="var(--c-border)"
            strokeWidth="0.6"
          />
          <line
            x1="3"
            y1="4"
            x2="60"
            y2="4"
            stroke="var(--c-accent)"
            strokeWidth="1.2"
            opacity="0.55"
          />
          <text x="3" y="2.6" fontSize="2.4" fill="var(--c-text-faint)" letterSpacing="0.3">
            {ar ? 'زجاج' : 'GLAZING'}
          </text>
          <rect
            x="68"
            y="8"
            width="11"
            height="34"
            rx="1"
            fill="var(--c-bg-subtle)"
            stroke="var(--c-border)"
            strokeWidth="0.5"
          />
          <text x="73.5" y="46" fontSize="2.6" fill="var(--c-text-faint)" textAnchor="middle">
            {ar ? 'البار' : 'BAR'}
          </text>
          <rect
            x="66"
            y="48"
            width="32"
            height="46"
            rx="2"
            fill="none"
            stroke="var(--c-border)"
            strokeWidth="0.5"
            strokeDasharray="1.5 1.5"
          />
          <text x="82" y="97" fontSize="2.6" fill="var(--c-text-faint)" textAnchor="middle">
            {ar ? 'الفناء' : 'COURTYARD'}
          </text>

          {tables.map((table) => {
            const chosen = table.id === selectedTableId;
            const pickable = table.free && table.fits;
            const isHovered = hovered === table.id;
            const rx = table.shape === 'round' ? Math.min(table.w, table.h) / 2 : 1.2;

            const fill = chosen
              ? 'var(--c-accent)'
              : !table.free
                ? `url(#${groupId}-taken)`
                : !table.fits
                  ? 'var(--c-bg-subtle)'
                  : 'var(--c-surface)';

            return (
              <g
                key={table.id}
                role="radio"
                aria-checked={chosen}
                aria-disabled={!pickable}
                aria-label={describe(table)}
                tabIndex={
                  pickable
                    ? chosen || (!selectedTableId && table.id === selectable[0]?.id)
                      ? 0
                      : -1
                    : -1
                }
                className={pickable ? 'cursor-pointer outline-none' : 'cursor-not-allowed'}
                onClick={() => pickable && onSelect(chosen ? null : table.id)}
                onKeyDown={(event) => {
                  if (!pickable) return;
                  if (event.key === ' ' || event.key === 'Enter') {
                    event.preventDefault();
                    onSelect(chosen ? null : table.id);
                    return;
                  }
                  if (!['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].includes(event.key))
                    return;
                  event.preventDefault();
                  const index = selectable.findIndex((t) => t.id === table.id);
                  const forward = event.key === 'ArrowRight' || event.key === 'ArrowDown';
                  const next =
                    selectable[
                      (index + (forward ? 1 : -1) + selectable.length) % selectable.length
                    ];
                  if (next) {
                    onSelect(next.id);
                    // Move focus with the selection, as a radio group does.
                    const node = document.querySelector<SVGGElement>(
                      `[data-table-id="${next.id}"]`,
                    );
                    node?.focus();
                  }
                }}
                onMouseEnter={() => setHovered(table.id)}
                onMouseLeave={() => setHovered(null)}
                data-table-id={table.id}
              >
                <rect
                  x={table.x}
                  y={table.y}
                  width={table.w}
                  height={table.h}
                  rx={rx}
                  fill={fill}
                  stroke={chosen ? 'var(--c-accent)' : 'var(--c-border)'}
                  strokeWidth={chosen || isHovered ? 1.1 : 0.6}
                  style={{ transition: 'fill var(--dur-fast), stroke-width var(--dur-fast)' }}
                />
                <text
                  x={table.x + table.w / 2}
                  y={table.y + table.h / 2 + 1}
                  fontSize="3"
                  textAnchor="middle"
                  fill={chosen ? 'var(--c-accent-contrast)' : 'var(--c-text-muted)'}
                  style={{ pointerEvents: 'none' }}
                  textDecoration={table.free ? undefined : 'line-through'}
                >
                  {table.code}
                </text>
                {table.accessible ? (
                  <text
                    x={table.x + table.w - 1.6}
                    y={table.y + 3.4}
                    fontSize="2.4"
                    textAnchor="end"
                    fill={chosen ? 'var(--c-accent-contrast)' : 'var(--c-accent)'}
                    style={{ pointerEvents: 'none' }}
                    aria-hidden="true"
                  >
                    ♿
                  </text>
                ) : null}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend. Shape and hatch carry the meaning, not just colour. */}
      <ul className="text-faint text-2xs mt-3 flex flex-wrap gap-x-5 gap-y-2">
        <li className="flex items-center gap-1.5">
          <span className="border-line inline-block size-3 rounded-[3px] border bg-[var(--c-surface)]" />
          {ar ? 'متاحة' : 'Free'}
        </li>
        <li className="flex items-center gap-1.5">
          <span className="border-line inline-block size-3 rounded-[3px] border bg-[var(--c-bg-subtle)]" />
          {ar ? 'صغيرة على مجموعتك' : 'Too small for your party'}
        </li>
        <li className="flex items-center gap-1.5">
          <span className="border-line inline-block size-3 rounded-[3px] border bg-[repeating-linear-gradient(45deg,var(--c-text-faint)_0_1px,transparent_1px_3px)]" />
          {ar ? 'محجوزة' : 'Taken'}
        </li>
        <li className="flex items-center gap-1.5">
          <span className="bg-accent inline-block size-3 rounded-[3px]" />
          {ar ? 'اختيارك' : 'Your choice'}
        </li>
      </ul>

      <p aria-live="polite" className="text-muted mt-3 text-sm">
        {selectedTableId
          ? (() => {
              const table = tables.find((t) => t.id === selectedTableId);
              return table
                ? ar
                  ? `اخترت ${table.label}.`
                  : `You have chosen ${table.label}.`
                : '';
            })()
          : ar
            ? 'اختر طاولة، أو تابع وسنختار لك الأنسب.'
            : 'Pick a table, or carry on and we will give you the best fit.'}
      </p>
    </div>
  );
}
