import { tierMatrix, type Inclusion, type MatrixRow } from '@/lib/content/tier-matrix';
import { tiers, tierOrder, type TierId } from '@/lib/config/navigation';

/**
 * The comparison matrix.
 *
 * What this has to survive is a café owner reading it on a phone in a noisy
 * room, so it renders twice: a real `<table>` from `md` up, and a stack of
 * per-tier cards below that. Same data, one source, and the cards are not a
 * summary — a phone reader gets every row the desktop reader does.
 *
 * Two things it refuses to do:
 *
 *  • Carry meaning in colour. A green tick against a red cross is unreadable
 *    for roughly one man in twelve, so every cell has a glyph *and* words,
 *    and the words are what a screen reader announces.
 *  • Only say yes. The "not included" rows are as prominent as the rest and
 *    the add-ons say what they cost. A table that flatters every tier equally
 *    is one nobody believes, and it is the one that produces an argument at
 *    invoice time.
 */

const COLUMNS = [...tierOrder, 'bespoke'] as const;
type Column = (typeof COLUMNS)[number];

const COLUMN_LABEL: Record<Column, string> = {
  essential: tiers.essential.name,
  signature: tiers.signature.name,
  immersive: tiers.immersive.name,
  bespoke: 'Bespoke',
};

function columnHeading(column: Column): string {
  return column === 'bespoke' ? 'Tier 4' : `Tier ${tiers[column as TierId].ordinal}`;
}

function cellFor(row: MatrixRow, column: Column): Inclusion {
  if (column === 'essential') return row.essential;
  if (column === 'signature') return row.signature;
  if (column === 'immersive') return row.immersive;
  return row.bespoke;
}

/** Glyph, wording and tone for one cell. Never colour on its own. */
function present(value: Inclusion): { glyph: string; text: string; tone: string } {
  const detail = 'detail' in value ? value.detail : undefined;
  switch (value.kind) {
    case 'yes':
      return { glyph: '✓', text: detail ?? 'Included', tone: 'text-accent' };
    case 'no':
      return { glyph: '—', text: 'Not included', tone: 'text-faint' };
    case 'option':
      return { glyph: '+', text: detail ?? 'Add-on', tone: 'text-ink' };
    default:
      return { glyph: '◇', text: detail ?? 'Scoped with you', tone: 'text-ink' };
  }
}

function Cell({ value }: { value: Inclusion }) {
  const { glyph, text, tone } = present(value);
  const muted = value.kind === 'no';
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span aria-hidden="true" className={`${tone} font-bold`}>
        {glyph}
      </span>
      <span className={muted ? 'text-faint' : ''}>{text}</span>
    </span>
  );
}

export function ComparisonTable() {
  return (
    <>
      {/* ── From md up: one table ──────────────────────────────────────── */}
      <div className="border-line hidden max-w-full min-w-0 overflow-x-auto rounded-[var(--radius-lg)] border md:block">
        <table className="w-full min-w-[54rem] border-collapse text-sm">
          <caption className="sr-only">
            What each tier includes, excludes and offers as a paid add-on
          </caption>
          <thead>
            <tr className="bg-bg-subtle">
              <th scope="col" className="border-line w-[26%] border-b px-4 py-3 text-start">
                <span className="sr-only">Feature</span>
              </th>
              {COLUMNS.map((column) => (
                <th
                  key={column}
                  scope="col"
                  className="border-line border-b px-4 py-3 text-start align-bottom"
                >
                  <span className="eyebrow block">{columnHeading(column)}</span>
                  <span className="font-display text-lg font-semibold">{COLUMN_LABEL[column]}</span>
                </th>
              ))}
            </tr>
          </thead>

          {tierMatrix.map((group) => (
            <tbody key={group.id}>
              <tr>
                <th
                  scope="colgroup"
                  colSpan={COLUMNS.length + 1}
                  className="border-line bg-bg-subtle/60 border-y px-4 py-2.5 text-start"
                >
                  <span className="eyebrow">{group.title}</span>
                </th>
              </tr>
              {group.rows.map((row) => (
                <tr key={row.id} className="align-top">
                  <th
                    scope="row"
                    className="border-line/60 border-b px-4 py-3 text-start font-semibold"
                  >
                    {row.label}
                    {row.note ? (
                      <span className="text-faint text-2xs mt-1 block font-normal">{row.note}</span>
                    ) : null}
                  </th>
                  {COLUMNS.map((column) => (
                    <td key={column} className="border-line/60 border-b px-4 py-3">
                      <Cell value={cellFor(row, column)} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>

      {/* ── Phone: the same rows, one tier at a time ───────────────────── */}
      <div className="flex flex-col gap-[var(--space-l)] md:hidden">
        {COLUMNS.map((column) => (
          <section key={column} className="card overflow-hidden">
            <header className="border-line bg-bg-subtle border-b px-4 py-3">
              <p className="eyebrow">{columnHeading(column)}</p>
              <h3 className="display-3">{COLUMN_LABEL[column]}</h3>
            </header>
            <div className="px-4 py-1">
              {tierMatrix.map((group) => (
                <div key={group.id} className="border-line/60 border-b py-3 last:border-0">
                  <p className="eyebrow mb-2">{group.title}</p>
                  <dl className="flex flex-col gap-2">
                    {group.rows.map((row) => (
                      <div
                        key={row.id}
                        className="flex flex-wrap items-baseline justify-between gap-x-4"
                      >
                        <dt className="text-muted min-w-[9rem] flex-1 text-sm">{row.label}</dt>
                        <dd className="text-sm font-semibold">
                          <Cell value={cellFor(row, column)} />
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <ul className="text-faint text-2xs mt-[var(--space-l)] flex flex-wrap gap-x-6 gap-y-2">
        <li>
          <span aria-hidden="true" className="text-accent font-bold">
            ✓
          </span>{' '}
          Included in the price
        </li>
        <li>
          <span aria-hidden="true" className="font-bold">
            +
          </span>{' '}
          Available as a paid add-on
        </li>
        <li>
          <span aria-hidden="true" className="font-bold">
            —
          </span>{' '}
          Not included at this tier
        </li>
        <li>
          <span aria-hidden="true" className="font-bold">
            ◇
          </span>{' '}
          Scoped with you
        </li>
      </ul>
    </>
  );
}
