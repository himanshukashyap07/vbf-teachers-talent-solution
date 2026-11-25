import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Page title block used at the top of inner pages. */
export function PageHeader({
  eyebrow,
  title,
  lead,
  children,
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="border-b border-base-300 bg-base-100">
      <div className="container-page py-12 lg:py-16">
        {eyebrow && <p className="text-sm font-semibold uppercase tracking-wider text-accent">{eyebrow}</p>}
        <h1 className="mt-2 max-w-3xl text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">{title}</h1>
        {lead && <p className="mt-4 max-w-2xl text-lg leading-8 text-base-content/75">{lead}</p>}
        {children && <div className="mt-6 flex flex-wrap gap-3">{children}</div>}
      </div>
    </section>
  );
}

export function Section({
  title,
  intro,
  eyebrow,
  tone = "plain",
  children,
  className,
  id,
}: {
  title?: string;
  intro?: string;
  eyebrow?: string;
  tone?: "plain" | "paper";
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn("py-12 lg:py-16", tone === "paper" && "border-y border-base-300 bg-base-100", className)}>
      <div className="container-page">
        {(title || intro) && (
          <div className="mb-8 max-w-2xl">
            {eyebrow && <p className="text-sm font-semibold uppercase tracking-wider text-accent">{eyebrow}</p>}
            {title && <h2 className="mt-1 text-2xl font-bold sm:text-3xl">{title}</h2>}
            {intro && <p className="mt-3 text-base leading-7 text-base-content/75">{intro}</p>}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}

export function CheckList({ items, className }: { items: readonly string[]; className?: string }) {
  return (
    <ul className={cn("space-y-2.5", className)}>
      {items.map((item) => (
        <li key={item} className="flex gap-3 text-[0.9375rem] leading-6 text-base-content/85">
          <Check className="mt-1 size-4 shrink-0 text-secondary" aria-hidden />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export interface StepItem {
  title: string;
  body: string;
  note?: string;
}

/** Numbered vertical process list with a rule on the left. */
export function StepList({ steps }: { steps: readonly StepItem[] }) {
  return (
    <ol className="relative space-y-7 border-l border-base-300 pl-8">
      {steps.map((step, i) => (
        <li key={step.title} className="relative">
          <span
            aria-hidden
            className="absolute -left-[2.9rem] top-0 grid size-9 place-items-center rounded-full border border-base-300 bg-base-100 font-serif text-base font-bold text-primary"
          >
            {i + 1}
          </span>
          <h3 className="text-lg font-semibold leading-7">{step.title}</h3>
          <p className="mt-1 max-w-2xl text-[0.9375rem] leading-7 text-base-content/75">{step.body}</p>
          {step.note && <p className="mt-2 max-w-2xl text-sm leading-6 text-base-content/60">{step.note}</p>}
        </li>
      ))}
    </ol>
  );
}

export function FaqItem({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <details className="collapse collapse-arrow rounded-box border border-base-300 bg-base-100">
      <summary className="collapse-title text-base font-semibold">{q}</summary>
      <div className="collapse-content text-[0.9375rem] leading-7 text-base-content/80">{children}</div>
    </details>
  );
}

export function CtaBand({
  title,
  body,
  primary,
  secondary,
}: {
  title: string;
  body: string;
  primary: { href: string; label: string };
  secondary?: { href: string; label: string };
}) {
  return (
    <section className="bg-primary text-primary-content">
      <div className="container-page flex flex-col gap-6 py-12 md:flex-row md:items-center md:justify-between">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold sm:text-3xl">{title}</h2>
          <p className="mt-2 text-primary-content/80">{body}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="accent" size="lg">
            <Link href={primary.href}>
              {primary.label} <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
          {secondary && (
            <Button asChild variant="outline" size="lg" className="border-primary-content/40 bg-transparent text-primary-content hover:bg-primary-content/10">
              <Link href={secondary.href}>{secondary.label}</Link>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}

/** Illustrative one-page summary — shows schools what they receive. Clearly marked as a sample. */
export function SampleSummary() {
  const rows: [string, string][] = [
    ["Qualification", "M.Sc. Mathematics, B.Ed."],
    ["Teaches", "Mathematics · Classes 6–10"],
    ["Experience", "6 years · CBSE affiliated school"],
    ["Location", "Lucknow · can join within 30 days"],
    ["Expected salary", "₹32,000 – ₹36,000 / month (gross)"],
  ];
  return (
    <figure className="rounded-box border border-base-300 bg-base-100 shadow-sm">
      <div className="flex items-center justify-between border-b border-base-300 px-5 py-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-base-content/60">Candidate summary</span>
        <span className="badge badge-outline badge-sm">Illustrative sample</span>
      </div>
      <div className="space-y-4 p-5">
        <div>
          <p className="font-serif text-xl font-bold">Candidate ID: SS-0000</p>
          <p className="text-sm text-base-content/60">Name shared with the candidate&apos;s permission</p>
        </div>
        <dl className="divide-y divide-base-300 text-sm">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 py-2">
              <dt className="text-base-content/60">{k}</dt>
              <dd className="text-right font-medium">{v}</dd>
            </div>
          ))}
        </dl>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-base-content/60">Interview observations</p>
          <ul className="mt-2 space-y-1.5 text-sm leading-6 text-base-content/85">
            <li>Explained a Class 8 algebra concept step by step with a worked example.</li>
            <li>Clear spoken English and Hindi; comfortable with parent communication.</li>
            <li>Documents: degree and B.Ed. certificates seen; experience letter awaited.</li>
          </ul>
        </div>
        <p className="border-t border-base-300 pt-3 text-xs text-base-content/55">
          Interviewed by an agency recruiter. Every observation is tied to what was said in the interview.
        </p>
      </div>
      <figcaption className="sr-only">Example of the one-page summary sent to schools. Not a real candidate.</figcaption>
    </figure>
  );
}
