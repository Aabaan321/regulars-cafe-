import { brand } from '@/lib/config/brand';

/**
 * Minimal RFC 5545 generator for the booking confirmation attachment.
 *
 * Hand-rolled rather than pulled from a dependency: the spec surface we need
 * is one VEVENT, and the fold-at-75-octets rule is the only fiddly part.
 */

export interface CalendarEvent {
  readonly uid: string;
  readonly start: Date;
  readonly end: Date;
  readonly summary: string;
  readonly description: string;
  readonly location: string;
  readonly url?: string;
  readonly organizerEmail?: string;
  readonly attendeeEmail?: string;
  readonly sequence?: number;
  readonly cancelled?: boolean;
}

function stamp(date: Date): string {
  return `${date.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`;
}

/** Escapes the four characters iCalendar treats as syntax. */
function escapeText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/** Content lines must be folded at 75 octets with a leading space. */
function fold(line: string): string {
  if (Buffer.byteLength(line, 'utf8') <= 75) return line;

  const out: string[] = [];
  let current = '';
  for (const char of line) {
    if (Buffer.byteLength(current + char, 'utf8') > 74) {
      out.push(current);
      current = ' ';
    }
    current += char;
  }
  if (current.trim().length > 0) out.push(current);
  return out.join('\r\n');
}

export function buildIcs(event: CalendarEvent): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:-//${brand.name}//Reservations//EN`,
    'CALSCALE:GREGORIAN',
    `METHOD:${event.cancelled ? 'CANCEL' : 'REQUEST'}`,
    'BEGIN:VEVENT',
    `UID:${event.uid}`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(event.start)}`,
    `DTEND:${stamp(event.end)}`,
    `SEQUENCE:${event.sequence ?? 0}`,
    `STATUS:${event.cancelled ? 'CANCELLED' : 'CONFIRMED'}`,
    `SUMMARY:${escapeText(event.summary)}`,
    `DESCRIPTION:${escapeText(event.description)}`,
    `LOCATION:${escapeText(event.location)}`,
    `GEO:${brand.geo.latitude};${brand.geo.longitude}`,
    `ORGANIZER;CN=${escapeText(brand.name)}:mailto:${event.organizerEmail ?? brand.contact.bookingsEmail}`,
  ];

  if (event.attendeeEmail) {
    lines.push(`ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;RSVP=FALSE:mailto:${event.attendeeEmail}`);
  }
  if (event.url) lines.push(`URL:${event.url}`);

  lines.push(
    'BEGIN:VALARM',
    'TRIGGER:-PT2H',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeText(`Your table at ${brand.name} is in 2 hours`)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  );

  return lines.map(fold).join('\r\n');
}
