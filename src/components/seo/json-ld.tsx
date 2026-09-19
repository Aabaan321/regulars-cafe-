import type { JsonLdNode } from '@/lib/seo/jsonld';

/**
 * Renders structured data into the document.
 *
 * `JSON.stringify` cannot emit an unescaped `</script`, and escaping `<`
 * closes the remaining hole (a string value containing that literal
 * sequence), so the payload is safe to inject.
 */
export function JsonLd({ data, id }: { data: JsonLdNode | readonly JsonLdNode[]; id?: string }) {
  const payload = JSON.stringify(data).replace(/</g, '\\u003c');
  return (
    <script
      type="application/ld+json"
      id={id}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: payload }}
    />
  );
}
