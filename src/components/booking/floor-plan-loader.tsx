'use client';

import { useEffect, useState } from 'react';
import { FloorPlan, type PlanTable } from '@/components/booking/floor-plan';
import type { Locale } from '@/lib/i18n/dictionaries';

/**
 * Fetches the room for a chosen slot and hands it to the plan.
 *
 * Split from `FloorPlan` so the drawing stays a pure function of its props —
 * which is what makes it testable, and what let the plan be written without
 * any opinion about where tables come from.
 *
 * The request is aborted on every change, so dragging through time slots
 * cannot land an old response on top of a newer one.
 */
export function FloorPlanLoader({
  slotIso,
  partySize,
  selectedTableId,
  onSelect,
  locale,
}: {
  slotIso: string;
  partySize: number;
  selectedTableId: string | null;
  onSelect: (tableId: string | null) => void;
  locale: Locale;
}) {
  const ar = locale === 'ar';

  /**
   * Both results are stamped with the request they answer, and `loading` is
   * *derived* from whether the stamp matches what is being asked for now.
   *
   * The obvious shape — `setLoading(true)` at the top of the effect — is the
   * cascading-render pattern `react-hooks/set-state-in-effect` exists to
   * catch, and it also races: an aborted request's cleanup cannot un-set a
   * flag a newer request has already set. Comparing keys has neither problem.
   */
  const key = `${slotIso}|${partySize}`;
  const [loaded, setLoaded] = useState<{ key: string; tables: readonly PlanTable[] } | null>(null);
  const [failedKey, setFailedKey] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ slot: slotIso, partySize: String(partySize) });

    fetch(`/api/tables?${params}`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error('bad status'))))
      .then((data: { tables?: PlanTable[] }) => setLoaded({ key, tables: data.tables ?? [] }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setFailedKey(key);
      });

    return () => controller.abort();
  }, [key, slotIso, partySize]);

  const tables = loaded?.key === key ? loaded.tables : (loaded?.tables ?? []);
  const failed = failedKey === key;
  const loading = !failed && loaded?.key !== key;

  if (failed) {
    // The plan is an upgrade on choosing a slot, never a gate in front of it,
    // so a failure here must not block the booking.
    return (
      <p className="text-muted text-sm">
        {ar
          ? 'تعذّر عرض مخطط الصالة الآن. تابع الحجز وسنختار لك أنسب طاولة.'
          : 'The floor plan is not loading right now. Carry on booking and we will give you the best fit.'}
      </p>
    );
  }

  if (loading && tables.length === 0) {
    return (
      <div
        className="border-line bg-bg-subtle aspect-square w-full animate-pulse rounded-[var(--radius-lg)] border"
        role="status"
        aria-label={ar ? 'جارٍ تحميل مخطط الصالة' : 'Loading the floor plan'}
      />
    );
  }

  return (
    <FloorPlan
      tables={tables}
      selectedTableId={selectedTableId}
      onSelect={onSelect}
      locale={locale}
      loading={loading}
    />
  );
}
