import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/json-ld";
import { organizationLd, pageMetadata } from "@/lib/seo";
import { ArrowRight, ClipboardList, FileCheck2, MessagesSquare, ShieldCheck, UserCheck, Users } from "lucide-react";
import { fees, siteConfig, teacherCategories, upDistricts } from "@/config/site";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckList, CtaBand, FaqItem, SampleSummary, Section, StepList } from "@/components/sections";

const launchDistricts = upDistricts.filter((d) => !d.startsWith("Other") && !d.startsWith("Outside"));

export const metadata: Metadata = {
  ...pageMetadata({ title: siteConfig.tagline, description: siteConfig.description, path: "/" }),
  title: { absolute: `${siteConfig.name} — ${siteConfig.tagline}` },
};

export default function HomePage() {
  return (
    <>
      <JsonLd data={organizationLd()} />
      {/* Hero */}
      <section className="border-b border-base-300 bg-base-100">
        <div className="container-page grid items-center gap-10 py-12 lg:grid-cols-12 lg:py-20">
          <div className="lg:col-span-7">
            <p className="text-sm font-semibold uppercase tracking-wider text-accent">
              Teacher recruitment · {siteConfig.region}
            </p>
            <h1 className="mt-3 text-3xl font-bold leading-[1.15] sm:text-5xl sm:leading-[1.1]">
              Screened teachers for schools. Genuine vacancies for teachers.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-base-content/75">
              {siteConfig.name} speaks to schools about what they actually need, interviews teachers
              properly, and sends each school a short written summary alongside the resume, so
              hiring decisions are quicker and better informed.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/signup">
                  Register as a school or teacher <ArrowRight className="size-4" aria-hidden />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/how-it-works">See how it works</Link>
              </Button>
            </div>
            <p className="mt-5 max-w-xl text-sm leading-6 text-base-content/60">
              We are a recruitment service, not an employer. We cannot promise selection or a job;
              the decision always rests with the school.
            </p>
          </div>
          <div className="lg:col-span-5">
            <SampleSummary />
          </div>
        </div>
      </section>

      {/* Two audiences */}
      <Section
        eyebrow="Who we work with"
        title="Built for both sides of the hiring table"
        intro="Most schools in Uttar Pradesh still hire through walk-ins, word of mouth and piles of unsorted resumes. Most teachers never learn about vacancies outside their own circle. We sit in the middle and do the legwork."
      >
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-2xl">For schools</CardTitle>
              <CardDescription>Principals, directors and HR teams</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <CheckList
                items={[
                  "We record your exact requirement: subject, level, qualification, salary range and joining date.",
                  "You receive a short list, not a stack: each candidate comes with a written interview summary.",
                  "Candidates are interviewed before you see them, so your time goes to people worth meeting.",
                  "If a candidate is not selected, we bring you other profiles for the same vacancy.",
                ]}
              />
              <Button asChild variant="outline">
                <Link href="/schools">How we work with schools</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-2xl">For teachers</CardTitle>
              <CardDescription>Fresh graduates to experienced subject specialists</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <CheckList
                items={[
                  "Register once and be considered for vacancies that match your subject, level and district.",
                  "We interview you and present your strengths clearly, beyond what a resume can show.",
                  "You decide who sees your profile. Nothing is shared without your consent.",
                  siteConfig.candidateFeesEnabled
                    ? fees.teacherShort
                    : "No fee is charged to teachers at present. If that changes you will see it in writing first.",
                ]}
              />
              <Button asChild variant="outline">
                <Link href="/teachers">How we work with teachers</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* Process */}
      <Section
        tone="paper"
        eyebrow="Process"
        title="From vacancy to joining, step by step"
        intro="Every placement follows the same path, and every person on it knows what happens next."
      >
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <StepList
              steps={[
                {
                  title: "We understand the vacancy",
                  body: "A recruiter calls the school and records the subject, level, qualifications, salary range, joining date and who makes the decision. We confirm the vacancy is real before we advertise it.",
                },
                {
                  title: "Teachers register with consent",
                  body: "Candidates share their qualifications, experience and preferences, and tell us who their profile may be shared with.",
                },
                {
                  title: "We interview and summarise",
                  body: "Interviews are taken by our team, virtually or in person. We then prepare a written summary report of the teacher's profile.",
                },
                {
                  title: "The school gets resume + summary",
                  body: "The school receives a short list with a one-page summary for each candidate, and decides whom to interview.",
                },
                {
                  title: "Selection, joining and follow-up",
                  body: "We track the outcome, confirm joining with both sides, and if a candidate is not selected we move on to other suitable matches.",
                },
              ]}
            />
            <div className="mt-8">
              <Button asChild variant="outline">
                <Link href="/how-it-works">Read the full process</Link>
              </Button>
            </div>
          </div>

          <div className="space-y-4 lg:col-span-5">
            {[
              { icon: ClipboardList, title: "Structured requirements", text: "Every vacancy is recorded in the same format, so nothing depends on memory." },
              { icon: UserCheck, title: "Consistent screening", text: "Candidates are assessed against role-related criteria, not impressions." },
              { icon: FileCheck2, title: "Evidence-based summaries", text: "Summaries describe what was observed in the interview, not unsupported opinions." },
              { icon: MessagesSquare, title: "Follow-up that continues", text: "We keep both sides informed from first call to first day." },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex gap-4 rounded-box border border-base-300 bg-base-200/60 p-4">
                <Icon className="mt-0.5 size-6 shrink-0 text-primary" aria-hidden />
                <div>
                  <h3 className="text-base font-semibold">{title}</h3>
                  <p className="mt-0.5 text-sm leading-6 text-base-content/70">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Roles */}
      <Section
        eyebrow="Roles"
        title="Teaching roles we recruit for"
        intro="We start with school teaching positions, from the earliest classes to senior secondary."
      >
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teacherCategories.map((c) => (
            <li key={c} className="flex items-center gap-3 rounded-box border border-base-300 bg-base-100 p-4">
              <Users className="size-5 shrink-0 text-secondary" aria-hidden />
              <span className="text-[0.9375rem] font-medium">{c}</span>
            </li>
          ))}
        </ul>
      </Section>

      {/* Commitments */}
      <Section
        tone="paper"
        eyebrow="Our commitments"
        title="How we handle people and their information"
      >
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Consent first",
              text: "A teacher's resume is shared only with the schools they have agreed to, and they are told which school receives it.",
            },
            {
              title: "People, not software",
              text: "Interviews are taken by our team and every summary report is prepared by a person. The final hiring decision is always the school's.",
            },
            {
              title: "Plain terms, no guarantees",
              text: "We tell you what we charge and when, in writing. We never promise a job, a selection, or a salary we cannot control.",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-box border border-base-300 bg-base-200/50 p-5">
              <ShieldCheck className="size-6 text-secondary" aria-hidden />
              <h3 className="mt-3 text-lg font-semibold">{item.title}</h3>
              <p className="mt-1.5 text-[0.9375rem] leading-7 text-base-content/75">{item.text}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Geography */}
      <Section
        eyebrow="Where we work"
        title="Starting in Uttar Pradesh"
        intro="We are beginning with schools in these districts and will widen the list as we grow. If your district is not shown, register anyway and tell us where you are."
      >
        <ul className="flex flex-wrap gap-2">
          {launchDistricts.map((d) => (
            <li key={d} className="badge badge-outline h-auto px-3 py-1.5 text-sm font-normal">
              {d}
            </li>
          ))}
        </ul>
      </Section>

      {/* FAQ */}
      <Section tone="paper" eyebrow="Questions" title="Quick answers">
        <div className="max-w-3xl space-y-3">
          <FaqItem q="Do you guarantee a job?">
            No. We introduce teachers to schools and support the process. Whether a teacher is hired is entirely the school&apos;s decision.
          </FaqItem>
          <FaqItem q="Is there a fee for teachers?">
            {siteConfig.candidateFeesEnabled
              ? fees.teacherAnswer
              : "No fee is being charged to teachers at this time. If we ever introduce one, we will show you the full terms in writing before you agree."}
          </FaqItem>
          <FaqItem q="Who sees my resume?">
            Only the schools you have consented to, and only the resume and the interview summary we prepare. Never public groups or social media.
          </FaqItem>
        </div>
        <p className="mt-6 text-sm">
          <Link href="/faq" className="font-semibold text-primary underline underline-offset-2">
            See all questions
          </Link>
        </p>
      </Section>

      <CtaBand
        title="Ready to hire or to be hired?"
        body="Create an account in about two minutes, or talk to us first."
        primary={{ href: "/signup", label: "Create an account" }}
        secondary={{ href: "/contact", label: "Talk to us" }}
      />
    </>
  );
}
