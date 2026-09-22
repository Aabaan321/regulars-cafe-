import type { ReactNode } from 'react';
import { ScrollReveal } from '@/components/immersive/narrative';
import { PourReadout } from '@/components/immersive/pour-readout';

/**
 * The narrative chapters.
 *
 * These used to be four identical blocks — eyebrow, heading, one paragraph —
 * each centred in its own full screen behind a photograph. On a 1440px
 * display that is a caption floating in a very large picture, and on a phone
 * it is four lines of text and an otherwise empty screen. The footage was
 * doing all the work and the layout was doing none, which is exactly what
 * "does not feel like a premium tier" looks like.
 *
 * So each chapter now has its own composition and, more importantly, its own
 * *substance*: a specification list, a live readout of the technique the
 * paragraph is describing, the actual four farms, the actual numbers. None of
 * it is invented — it is all already asserted in `lib/content/story.ts` and
 * on the story page, and it was simply not being used here.
 *
 * Everything is server-rendered HTML. The only client component is the frame
 * readout, which is decoration and marked `aria-hidden`.
 */

/* ── The frame every chapter shares ─────────────────────────────────────── */

/**
 * Asymmetric on purpose: prose on the left at a readable measure, the
 * supporting material on the right and dropped a little, so the two columns
 * are related rather than aligned. A symmetrical two-up of equal blocks is
 * the layout you get when nobody chose one.
 */
export function Chapter({
  index,
  eyebrow,
  heading,
  body,
  aside,
  dir,
}: {
  index: string;
  eyebrow: string;
  heading: string;
  body: string;
  aside: ReactNode;
  dir: 'ltr' | 'rtl';
}) {
  return (
    <section
      className="relative flex min-h-[100svh] items-center py-24"
      aria-labelledby={`chapter-${index}`}
    >
      <div className="container-wide">
        <ScrollReveal className="grid gap-x-10 gap-y-12 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7 xl:col-span-6">
            <p className="text-2xs mb-4 flex items-center gap-3 font-bold tracking-[0.22em] text-[#E3894A] uppercase">
              <span className="tabular-nums">{index}</span>
              <span aria-hidden="true" className="h-px w-8 bg-[#E3894A]/50" />
              {eyebrow}
            </p>
            <h2
              id={`chapter-${index}`}
              className="display-1 text-[#FFFBF4] [text-shadow:0_2px_28px_rgba(0,0,0,0.6)]"
            >
              {heading}
            </h2>
            <p className="mt-7 max-w-[36rem] text-lg leading-[1.65] text-[#E8DCCC] [text-shadow:0_1px_14px_rgba(0,0,0,0.7)]">
              {body}
            </p>
          </div>

          <div
            className={`lg:col-span-5 xl:col-span-5 ${dir === 'rtl' ? 'xl:col-start-1' : 'xl:col-start-8'}`}
          >
            {aside}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

/* ── Asides ─────────────────────────────────────────────────────────────── */

/**
 * A specification list.
 *
 * Hairline-ruled rows, label left, value right — the way a spec sheet or a
 * menu's small print is set. It reads as *information* rather than as more
 * body copy, which is what stops a chapter feeling like a caption.
 */
export function SpecList({ rows }: { rows: readonly (readonly [string, string])[] }) {
  return (
    <dl className="border-t border-white/15">
      {rows.map(([label, value]) => (
        <div
          key={label}
          className="flex items-baseline justify-between gap-6 border-b border-white/15 py-3.5"
        >
          <dt className="text-2xs font-bold tracking-[0.16em] text-[#C9B9A4] uppercase">{label}</dt>
          <dd className="text-right text-[0.95rem] text-[#F1E7D9]">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * The farms, as a table rather than as a sentence.
 *
 * The paragraph says "four farms and we name all of them"; this is the page
 * actually naming them. A claim followed by the evidence for it is the whole
 * difference between marketing copy and a brand that means it, and it is a
 * difference a client can see from across a room.
 */
export function FarmTable({
  rows,
  columns,
}: {
  rows: readonly (readonly [string, string, string])[];
  columns: readonly [string, string, string];
}) {
  return (
    <table className="w-full border-collapse text-left">
      <caption className="sr-only">Where our coffee comes from</caption>
      <thead>
        <tr className="border-b border-white/25">
          {columns.map((column, i) => (
            <th
              key={column}
              scope="col"
              className={`text-2xs pb-2.5 font-bold tracking-[0.16em] text-[#C9B9A4] uppercase ${
                i === 2 ? 'text-right' : ''
              }`}
            >
              {column}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map(([origin, region, lands]) => (
          <tr key={`${origin}-${region}`} className="border-b border-white/12">
            <th scope="row" className="py-3.5 pr-4 font-medium text-[#FFFBF4]">
              {origin}
            </th>
            <td className="py-3.5 pr-4 text-[0.95rem] text-[#D9CBB8]">{region}</td>
            <td className="py-3.5 text-right text-[0.95rem] text-[#D9CBB8] tabular-nums">
              {lands}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * Numbers, set large.
 *
 * A warehouse story is made of measurements — metres of glass, tables then
 * and now, the temperature outside — and measurements set at display size are
 * both the most confident thing a page can do and the most useful. The unit
 * is a separate, smaller span so "18" is the thing you see.
 */
export function StatGrid({
  stats,
}: {
  stats: readonly { readonly value: string; readonly unit?: string; readonly label: string }[];
}) {
  return (
    <ul className="grid grid-cols-2 gap-x-8 gap-y-7">
      {stats.map((stat) => (
        <li key={stat.label} className="border-t border-white/15 pt-4">
          <p className="font-display text-[clamp(2.4rem,5vw,3.4rem)] leading-[0.95] tracking-[-0.02em] text-[#FFFBF4]">
            <span className="tabular-nums">{stat.value}</span>
            {stat.unit ? (
              <span className="ms-1 align-baseline text-[0.42em] font-bold tracking-[0.1em] text-[#E3894A] uppercase">
                {stat.unit}
              </span>
            ) : null}
          </p>
          <p className="text-2xs mt-2.5 font-bold tracking-[0.16em] text-[#C9B9A4] uppercase">
            {stat.label}
          </p>
        </li>
      ))}
    </ul>
  );
}

/**
 * The pour chapter's aside: the technique, demonstrating itself.
 *
 * The paragraph next to it says the pour is a real shot, filmed once and cut
 * into frames, and that the pace belongs to the reader. This shows the frame
 * number moving as they scroll. It is the one piece of self-reference on the
 * page and it earns its place, because a claim you can watch being true is
 * worth more than a claim.
 */
export function PourMeta({
  labels,
}: {
  labels: { readonly frame: string; readonly source: string; readonly note: string };
}) {
  return (
    <div className="border-t border-white/15 pt-5">
      <PourReadout label={labels.frame} />
      <p className="mt-5 max-w-[22rem] text-sm leading-[1.6] text-[#C9B9A4]">{labels.note}</p>
      <p className="text-2xs mt-4 font-bold tracking-[0.16em] text-[#8F8070] uppercase">
        {labels.source}
      </p>
    </div>
  );
}
