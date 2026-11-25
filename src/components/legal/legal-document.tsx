"use client";

import { useState } from "react";
import { PageHeader } from "@/components/sections";
import { cn } from "@/lib/utils";
import type { LegalDocData } from "@/lib/legal";

type Lang = "en" | "hi";

const labels = {
  en: { eyebrow: "Legal", language: "Language" },
  hi: { eyebrow: "कानूनी", language: "भाषा" },
} as const;

/** Renders a bilingual legal document with an English / Hindi switch. */
export function LegalDocument({ doc }: { doc: LegalDocData }) {
  const [lang, setLang] = useState<Lang>("en");

  return (
    <>
      <PageHeader eyebrow={labels[lang].eyebrow} title={doc.title[lang]} lead={doc.description[lang]} />
      <div className="container-page py-10" lang={lang === "hi" ? "hi" : "en"}>
        <div className="mb-6 flex flex-wrap items-center gap-3 print:hidden">
          <span className="text-sm font-semibold text-base-content/70">{labels[lang].language}:</span>
          {(["en", "hi"] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l)}
              aria-pressed={lang === l}
              className={cn(
                "cursor-pointer rounded-field border px-4 py-1.5 text-sm font-semibold transition-colors",
                lang === l
                  ? "border-primary bg-primary text-primary-content"
                  : "border-base-300 bg-base-100 text-base-content hover:bg-base-200",
              )}
            >
              {l === "en" ? "English" : "हिन्दी"}
            </button>
          ))}
        </div>

        <p className="mb-1 max-w-3xl text-sm text-base-content/60">{doc.updated[lang]}</p>
        <p className="mb-6 max-w-3xl text-sm text-base-content/60">{doc.note[lang]}</p>

        <article className="prose-content max-w-3xl">
          {doc.sections.map((s, i) => (
            <section key={i}>
              <h2 className={i === 0 ? "!mt-0" : undefined}>{s.h[lang]}</h2>
              {s.blocks.map((b, j) =>
                "p" in b ? (
                  <p key={j}>{b.p[lang]}</p>
                ) : (
                  <ul key={j}>
                    {b.ul[lang].map((item, k) => (
                      <li key={k}>{item}</li>
                    ))}
                  </ul>
                ),
              )}
            </section>
          ))}

          {doc.signature && (
            <section>
              <h2>{doc.signature.h[lang]}</h2>
              <ul className="!list-none !pl-0">
                {doc.signature.fields.map((f, i) => (
                  <li key={i} className="flex items-end gap-3">
                    <span className="shrink-0">{f[lang]}:</span>
                    <span className="mb-1 inline-block h-px flex-1 bg-base-content/40" aria-hidden />
                  </li>
                ))}
              </ul>
              {doc.signature.consents.map((c, i) => (
                <p key={i}>{c[lang]}</p>
              ))}
              <p>{doc.signature.signNote[lang]}</p>
              <p>{doc.signature.agencyNote[lang]}</p>
            </section>
          )}
        </article>
      </div>
    </>
  );
}
