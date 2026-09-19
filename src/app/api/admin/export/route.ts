import { NextResponse } from 'next/server';
import { asAdmin } from '@/lib/db/client';
import { getCurrentAdmin } from '@/lib/auth/session';

/**
 * CSV export for the admin lists.
 *
 * Runs as the signed-in staff member, so RLS decides what can be exported —
 * an export endpoint that quietly uses the service role is how guest data
 * leaks. Rows are escaped per RFC 4180 and prefixed against CSV injection:
 * a subscriber whose "name" is `=cmd|'/c calc'!A0` must not execute when the
 * café opens the file in Excel.
 */

export const dynamic = 'force-dynamic';

type ExportType = 'enquiries' | 'subscribers';

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  let text = value instanceof Date ? value.toISOString() : String(value);

  // Neutralise spreadsheet formula injection.
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;

  if (/["\n\r,]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function toCsv(headers: readonly string[], rows: readonly Record<string, unknown>[]): string {
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((header) => csvCell(row[header])).join(','));
  }
  // CRLF and a BOM so Excel opens UTF-8 correctly on Windows.
  return `﻿${lines.join('\r\n')}\r\n`;
}

export async function GET(request: Request) {
  const identity = await getCurrentAdmin();
  if (!identity) {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  }

  const url = new URL(request.url);
  const requested = url.searchParams.get('type');
  if (requested !== 'enquiries' && requested !== 'subscribers') {
    return NextResponse.json(
      { error: 'Unknown export. Use ?type=enquiries or ?type=subscribers.' },
      { status: 400 },
    );
  }
  const type: ExportType = requested;

  const { csv, filename } = await asAdmin(identity, async (tx) => {
    if (type === 'enquiries') {
      const rows = await tx<Record<string, unknown>[]>`
        select name, email::text as email, phone, topic::text as topic,
               message, status::text as status, source_tier, locale, created_at
          from enquiries
         order by created_at desc
      `;
      return {
        csv: toCsv(
          [
            'created_at',
            'name',
            'email',
            'phone',
            'topic',
            'status',
            'source_tier',
            'locale',
            'message',
          ],
          rows,
        ),
        filename: 'regulars-enquiries',
      };
    }

    const rows = await tx<Record<string, unknown>[]>`
      select email::text as email, name, status::text as status, source, source_tier,
             locale, created_at, confirmed_at, unsubscribed_at
        from subscribers
       order by created_at desc
    `;
    return {
      csv: toCsv(
        [
          'created_at',
          'email',
          'name',
          'status',
          'source',
          'source_tier',
          'locale',
          'confirmed_at',
          'unsubscribed_at',
        ],
        rows,
      ),
      filename: 'regulars-subscribers',
    };
  });

  const stamp = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}-${stamp}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
