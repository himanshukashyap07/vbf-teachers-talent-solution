import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import { LegalDocument } from "@/components/legal/legal-document";
import { getLegalDoc } from "@/lib/legal";
import { breadcrumbLd, pageMetadata } from "@/lib/seo";

const doc = getLegalDoc("candidate-agreement");

export const metadata: Metadata = pageMetadata({
  title: doc.title.en,
  description: doc.description.en,
  path: "/candidate-agreement",
});

export default function Page() {
  return (
    <>
      <JsonLd data={breadcrumbLd([{ name: doc.title.en, path: "/candidate-agreement" }])} />
      <LegalDocument doc={doc} />
    </>
  );
}
