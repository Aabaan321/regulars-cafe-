import { brand, siteUrl } from '@/lib/config/brand';

/**
 * Email chrome.
 *
 * Table-based, inline-styled, 600px, light-background only — the boring
 * choices are the ones that survive Outlook, Gmail's clipping and the UAE's
 * still-considerable Samsung Mail install base. Colours come from the brand
 * config so an email rebrand is the same one-file edit as the site.
 */

const c = brand.colors.light;

export interface EmailButton {
  readonly label: string;
  readonly href: string;
}

export interface EmailLayoutOptions {
  readonly preheader: string;
  readonly heading: string;
  readonly bodyHtml: string;
  readonly button?: EmailButton;
  readonly secondary?: EmailButton;
  readonly footnote?: string;
  readonly dir?: 'ltr' | 'rtl';
}

export function renderEmail(options: EmailLayoutOptions): string {
  const dir = options.dir ?? 'ltr';
  const align = dir === 'rtl' ? 'right' : 'left';

  return `<!doctype html>
<html lang="${dir === 'rtl' ? 'ar' : 'en'}" dir="${dir}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<title>${escapeHtml(options.heading)}</title>
</head>
<body style="margin:0;padding:0;background:${c.bgSubtle};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(options.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${c.bgSubtle};padding:24px 12px;">
<tr><td align="center">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${c.surface};border:1px solid ${c.border};border-radius:14px;overflow:hidden;">
    <tr>
      <td style="padding:28px 32px 0;text-align:${align};">
        <span style="font-size:20px;font-weight:700;letter-spacing:-0.02em;color:${c.text};">${escapeHtml(brand.name)}</span>
        <span style="font-size:12px;color:${c.textFaint};margin-inline-start:8px;">${escapeHtml(brand.address.district)}, ${escapeHtml(brand.address.city)}</span>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 32px 0;text-align:${align};">
        <h1 style="margin:0 0 14px;font-size:24px;line-height:1.2;color:${c.text};font-weight:700;">${escapeHtml(options.heading)}</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:0 32px;text-align:${align};font-size:15px;line-height:1.65;color:${c.textMuted};">
        ${options.bodyHtml}
      </td>
    </tr>
    ${
      options.button
        ? `<tr><td style="padding:26px 32px 0;text-align:${align};">
             <a href="${escapeAttr(options.button.href)}" style="display:inline-block;background:${c.accent};color:${c.accentContrast};text-decoration:none;font-weight:700;font-size:15px;padding:13px 26px;border-radius:999px;">${escapeHtml(options.button.label)}</a>
           </td></tr>`
        : ''
    }
    ${
      options.secondary
        ? `<tr><td style="padding:12px 32px 0;text-align:${align};">
             <a href="${escapeAttr(options.secondary.href)}" style="color:${c.textMuted};font-size:13px;text-decoration:underline;">${escapeHtml(options.secondary.label)}</a>
           </td></tr>`
        : ''
    }
    ${
      options.footnote
        ? `<tr><td style="padding:22px 32px 0;text-align:${align};font-size:12px;line-height:1.6;color:${c.textFaint};">${options.footnote}</td></tr>`
        : ''
    }
    <tr>
      <td style="padding:28px 32px 30px;">
        <hr style="border:0;border-top:1px solid ${c.border};margin:0 0 16px;">
        <p style="margin:0 0 4px;font-size:12px;line-height:1.6;color:${c.textFaint};text-align:${align};">
          <strong style="color:${c.textMuted};">${escapeHtml(brand.name)}</strong><br>
          ${escapeHtml(brand.address.formatted)}<br>
          <a href="tel:${brand.contact.phone}" style="color:${c.textFaint};">${escapeHtml(brand.contact.phoneDisplay)}</a> ·
          <a href="${siteUrl}" style="color:${c.textFaint};">${escapeHtml(siteUrl.replace(/^https?:\/\//, ''))}</a>
        </p>
      </td>
    </tr>
  </table>
</td></tr>
</table>
</body>
</html>`;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function escapeAttr(value: string): string {
  return escapeHtml(value);
}

/** Crude but reliable HTML → text for the multipart alternative. */
export function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<head[\s\S]*?<\/head>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|tr|h1|h2|h3|div|li)>/gi, '\n')
    .replace(/<li>/gi, '• ')
    .replace(/<a [^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, '$2 ($1)')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    .trim();
}
