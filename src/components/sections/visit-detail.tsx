import { Section } from '@/components/sections/section';
import { transport, accessibility, rooms } from '@/lib/content/visiting';
import type { Locale } from '@/lib/i18n/dictionaries';

/**
 * The three sections that turn a Tier 1 visit page into a Tier 2 one.
 *
 * Tier 1 tells you where the café is and when it is open, which is what a
 * guest needs to decide to come. These answer what actually stops people
 * coming — parking on a Saturday, whether a wheelchair gets in, whether the
 * roaster makes the back of the room unusable for a call.
 *
 * Every one of them says at least one inconvenient thing, and that is the
 * point: the accessibility list marks what the café does *not* provide as
 * plainly as what it does. A venue page that only flatters itself is one
 * nobody trusts twice, and for access information it is worse than useless —
 * someone plans a trip on it.
 */

export function TransportSection({ locale }: { locale: Locale }) {
  const ar = locale === 'ar';
  return (
    <Section
      id="getting-here"
      eyebrow={ar ? 'الوصول' : 'Getting here'}
      heading={ar ? 'أربع طرق للوصول' : 'Four ways in'}
      lede={
        ar
          ? 'القوز منطقة صناعية، والوصول إليها ليس بديهياً في المرة الأولى. هذه هي الطرق الفعلية.'
          : 'Al Quoz is an industrial district and it is not obvious the first time. These are the routes that actually work.'
      }
    >
      <ul className="grid gap-[var(--space-m)] sm:grid-cols-2">
        {transport.map((option) => (
          <li key={option.id} className="card flex gap-4 p-[var(--space-l)]">
            <span aria-hidden="true" className="text-accent mt-0.5 shrink-0 text-xl leading-none">
              {option.icon}
            </span>
            <div>
              <h3 className="text-lg font-bold">{ar ? option.modeAr : option.mode}</h3>
              <p className="text-accent text-2xs mt-0.5 font-bold tracking-[0.1em] uppercase">
                {ar ? option.timeAr : option.time}
              </p>
              <p className="text-muted mt-2 text-sm leading-[1.65]">
                {ar ? option.detailAr : option.detail}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}

export function RoomsSection({ locale }: { locale: Locale }) {
  const ar = locale === 'ar';
  return (
    <Section
      id="rooms"
      tone="subtle"
      eyebrow={ar ? 'أين تجلس' : 'Where to sit'}
      heading={ar ? 'الغرفة ليست واحدة' : 'The room is not one room'}
      lede={
        ar
          ? 'أربع مناطق، لكل منها ما تصلح له وما لا تصلح. اطلب المنطقة بالاسم وسنجهّزها.'
          : 'Four areas, each good for something different and bad for something else. Ask for one by name and we will sort it.'
      }
    >
      <ul className="grid gap-[var(--space-m)] lg:grid-cols-2">
        {rooms.map((room) => (
          <li key={room.id} className="card p-[var(--space-l)]">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="display-3">{ar ? room.nameAr : room.name}</h3>
              <p className="text-faint text-2xs font-bold tracking-[0.1em] uppercase tabular-nums">
                {room.seats}
              </p>
            </div>
            <p className="text-muted mt-3 text-sm leading-[1.7]">{ar ? room.bestAr : room.best}</p>
            <p className="border-line text-faint text-2xs mt-4 border-t pt-3">
              <span className="font-bold">{ar ? 'لكن: ' : 'But: '}</span>
              {ar ? room.caveatAr : room.caveat}
            </p>
          </li>
        ))}
      </ul>
    </Section>
  );
}

export function AccessibilitySection({ locale }: { locale: Locale }) {
  const ar = locale === 'ar';
  return (
    <Section
      id="accessibility"
      eyebrow={ar ? 'إمكانية الوصول' : 'Accessibility'}
      heading={ar ? 'ما نوفّره وما لا نوفّره' : 'What we have, and what we do not'}
      lede={
        ar
          ? 'مستودع من السبعينيات فيه محمصة. بعض الأمور مُحلّة جيداً وبعضها لا — وهذه قائمة صادقة بالاثنين.'
          : 'A 1970s warehouse with a roaster in it. Some of this is solved well and some of it is not, and the list says which is which.'
      }
    >
      <ul className="grid gap-px overflow-hidden rounded-[var(--radius-lg)] border border-[var(--c-border)] bg-[var(--c-border)] sm:grid-cols-2">
        {accessibility.map((note) => (
          <li key={note.id} className="bg-surface p-[var(--space-l)]">
            <div className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className={[
                  'mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-[11px] font-bold',
                  note.provided
                    ? 'bg-accent/15 text-accent'
                    : 'bg-[var(--c-text-faint)]/15 text-[var(--c-text-faint)]',
                ].join(' ')}
              >
                {note.provided ? '✓' : '—'}
              </span>
              <div>
                <h3 className="font-bold">
                  {ar ? note.titleAr : note.title}
                  <span className="sr-only">
                    {note.provided
                      ? ar
                        ? ' — متوفر'
                        : ' — provided'
                      : ar
                        ? ' — غير متوفر'
                        : ' — not provided'}
                  </span>
                </h3>
                <p className="text-muted mt-1.5 text-sm leading-[1.65]">
                  {ar ? note.bodyAr : note.body}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}
