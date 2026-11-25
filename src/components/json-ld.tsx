/**
 * Renders schema.org structured data. "<" is escaped so that no string in the data can ever
 * close the script tag early (script-injection safe even if text later comes from user content).
 */
export function JsonLd({ data }: { data: unknown }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
