import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbLd, pageMetadata } from "@/lib/seo";
import Link from "next/link";
import { fees, siteConfig, teacherCategories } from "@/config/site";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { CheckList, CtaBand, PageHeader, Section, StepList } from "@/components/sections";

export const metadata: Metadata = pageMetadata({
  title: "Find Teaching Jobs in Uttar Pradesh",
  description:
    "Register to be introduced to schools in Uttar Pradesh that are hiring. We interview you, write up your strengths and share your profile only with your consent.",
  path: "/teachers",
});

export default function TeachersPage() {
  return (
    <>
      <JsonLd data={breadcrumbLd([{ name: "For Teachers", path: "/teachers" }])} />
      <PageHeader
        eyebrow="For teachers"
        title="Be introduced to schools that are actually hiring."
        lead="Register once. We interview you, write up your strengths, and put your profile in front of schools with matching vacancies. And only those you have agreed to."
      >
        <Button asChild size="lg"><Link href="/signup">Register as a teacher</Link></Button>
        <Button asChild size="lg" variant="outline"><Link href="/faq">Read the FAQ</Link></Button>
      </PageHeader>

      <Section eyebrow="Who can register" title="Teachers at every level">
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <ul className="space-y-2.5">
              {teacherCategories.map((c) => (
                <li key={c} className="rounded-field border border-base-300 bg-base-100 px-4 py-3 text-[0.9375rem] font-medium">
                  {c}
                </li>
              ))}
            </ul>
          </div>
          <div className="prose-content">
            <p>
              Freshers with a B.Ed. or D.El.Ed. are welcome, as are experienced teachers looking for
              a better-matched school or a different city. If you are certified (CTET, UPTET or equivalent),
              mention it when you register: many schools ask for it.
            </p>
            <p>
              We are starting in Uttar Pradesh. If you are willing to relocate within the state, tell us in your
              preferences and we will consider vacancies in other districts too.
            </p>
          </div>
        </div>
      </Section>

      <Section tone="paper" eyebrow="Your journey" title="What happens after you register">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <StepList
              steps={[
                {
                  title: "Create your account",
                  body: "Give us your qualifications, subjects, experience, district and expected salary. You can use email and password, or sign in with Google or LinkedIn.",
                },
                {
                  title: "A recruiter calls you",
                  body: "We confirm your details, explain the process, and answer your questions. Nothing is shared with any school at this stage.",
                },
                {
                  title: "Short interview",
                  body: "A conversation about your subject, teaching approach and availability, held virtually or in person by our team.",
                  note: "Our team takes the interview and writes your summary report. No software interviews or judges you.",
                },
                {
                  title: "Review and agree",
                  body: "You read and agree to the Candidate Agreement, and the role, before we send your profile anywhere.",
                },
                {
                  title: "Profile goes to the school",
                  body: "The school gets your resume with a one-page summary. You are told which school received it and kept updated on every response.",
                },
                {
                  title: "Interview, offer, joining",
                  body: "If the school wants to meet you, we coordinate. If you are not selected, we look for the next suitable vacancy, always with your consent.",
                },
              ]}
            />
          </div>

          <aside className="space-y-5 lg:col-span-5">
            <div className="rounded-box border border-base-300 bg-base-200/60 p-5">
              <h3 className="text-lg font-semibold">Keep these ready</h3>
              <CheckList
                className="mt-3"
                items={[
                  "Updated resume (PDF or Word)",
                  "Degree and B.Ed. / D.El.Ed. certificates",
                  "CTET / UPTET certificate, if you have one",
                  "Experience letters from previous schools",
                  "A government photo ID (for verification, only when a school asks)",
                ]}
              />
            </div>
            <div className="rounded-box border border-base-300 bg-base-200/60 p-5">
              <h3 className="text-lg font-semibold">Your rights</h3>
              <CheckList
                className="mt-3"
                items={[
                  "Know which schools receive your profile.",
                  "Correct any information we hold about you.",
                  "Withdraw your consent and your profile at any time.",
                  "Decline an interview or an offer without penalty.",
                ]}
              />
            </div>
          </aside>
        </div>
      </Section>

      <Section eyebrow="Fees" title="What it costs you">
        <div className="max-w-3xl space-y-4">
          {siteConfig.candidateFeesEnabled ? (
            <>
              <CheckList
                items={[
                  `Registration fee: ${fees.registration}, one time. Paid at the start, after you share your resume. It covers registration and resume screening. Non-refundable.`,
                  `Placement fee: ${fees.percent} of your first month's in-hand salary, charged only when you are placed, and payable within ${fees.dueDays} days after you receive your first salary.`,
                  "Schools pay nothing.",
                  "If you are not placed, you pay no placement fee.",
                ]}
              />
              <Notice tone="info">
                Please read the <Link href="/payment-policy" className="font-semibold underline">payment, fee and refund policy</Link> and
                the <Link href="/candidate-agreement" className="font-semibold underline">candidate agreement</Link> before you register.
              </Notice>
            </>
          ) : (
            <Notice tone="info">
              <strong>No fee is being charged to teachers at this time.</strong> If we introduce any
              teacher-side fee in future, it will be explained in writing before you agree to anything
              and will comply with the law that applies to recruitment agencies in Uttar Pradesh.
            </Notice>
          )}
          <p className="text-[0.9375rem] leading-7 text-base-content/75">
            Be careful of anyone who asks for money in return for a guaranteed job. We do not guarantee
            employment, and we never ask you to pay a school or an individual for a vacancy.
          </p>
        </div>
      </Section>

      <CtaBand
        title="Start with a two-minute registration"
        body="Tell us what you teach and where. We will take it from there."
        primary={{ href: "/signup", label: "Register as a teacher" }}
        secondary={{ href: "/contact", label: "Ask a question" }}
      />
    </>
  );
}
