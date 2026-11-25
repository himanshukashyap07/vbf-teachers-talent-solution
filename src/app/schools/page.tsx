import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbLd, pageMetadata } from "@/lib/seo";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckList, CtaBand, PageHeader, SampleSummary, Section, StepList } from "@/components/sections";

export const metadata: Metadata = pageMetadata({
  title: "Hire Screened Teachers for Your School",
  description:
    "Hire screened teachers for your school in Uttar Pradesh. We take your requirement, interview candidates and send each resume with a written summary.",
  path: "/schools",
});

export default function SchoolsPage() {
  return (
    <>
      <JsonLd data={breadcrumbLd([{ name: "For Schools", path: "/schools" }])} />
      <PageHeader
        eyebrow="For schools"
        title="Fewer resumes. Better-informed hiring decisions."
        lead="You tell us the teacher you need. We find, interview and summarise suitable candidates, so your principal meets people who are already worth meeting."
      >
        <Button asChild size="lg"><Link href="/signup">Register your school</Link></Button>
        <Button asChild size="lg" variant="outline"><Link href="/contact">Speak to us first</Link></Button>
      </PageHeader>

      <Section eyebrow="The problem" title="Why hiring teachers is slower than it should be">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="prose-content">
            <p>
              Hiring a good teacher in a small or mid-sized school usually means asking around, sorting
              through resumes that all look alike, and spending hours on first-round conversations that go nowhere.
              Mid-session resignations make it worse, because the school needs a replacement quickly.
            </p>
            <p>
              A resume says very little about how someone explains a concept, handles a classroom or
              communicates with parents. That information only comes out in a conversation, and that
              conversation is what we do first.
            </p>
          </div>
          <div>
            <h3 className="mb-3 text-lg font-semibold">What changes with us</h3>
            <CheckList
              items={[
                "A recruiter takes your requirement by phone and writes it up in a standard format.",
                "Candidates are matched on subject, level, qualification, district and salary expectations.",
                "Each shortlisted candidate is interviewed before the profile reaches you.",
                "You receive the resume plus a one-page written summary of the interview.",
                "You choose whom to interview and tell us the outcome. We handle the follow-up.",
              ]}
            />
          </div>
        </div>
      </Section>

      <Section
        tone="paper"
        eyebrow="What you receive"
        title="A short written summary with every resume"
        intro="The summary is the difference between a resume and a recommendation. It is written from what the candidate said in the interview, with the interviewer named, and it does not include opinions we cannot support."
      >
        <div className="grid items-start gap-8 lg:grid-cols-2">
          <SampleSummary />
          <div>
            <h3 className="mb-3 text-lg font-semibold">Each summary covers</h3>
            <CheckList
              items={[
                "Qualifications and relevant certifications, and which documents we have seen.",
                "Subjects, levels taught and years of experience.",
                "Availability, notice period and salary expectation.",
                "Observations from the interview on subject knowledge, teaching approach and communication.",
                "Who interviewed the candidate and when, and how to reach us for follow-up.",
              ]}
            />
            <p className="mt-5 text-sm leading-6 text-base-content/65">
              We leave out sensitive personal information, speculative personality labels, and
              anything that is not relevant to doing the job.
            </p>
          </div>
        </div>
      </Section>

      <Section eyebrow="Working together" title="How a requirement moves forward">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <StepList
              steps={[
                {
                  title: "Share the requirement",
                  body: "Register your school and post the vacancy, or simply call us. Either way, a recruiter will phone you to confirm the details.",
                  note: "We only advertise a vacancy after we have confirmed it with you and have your permission to represent it.",
                },
                {
                  title: "We source and screen",
                  body: "We shortlist from registered teachers and reach out to new ones. Candidates are interviewed against the criteria you gave us.",
                },
                {
                  title: "You review the profiles",
                  body: "You get a resume and summary for each candidate. You can request an interview, hold, or reject.",
                },
                {
                  title: "Interview and decide",
                  body: "Interview directly at your school or by video. Tell us the outcome and we update the candidate and, if needed, send more profiles.",
                },
                {
                  title: "Offer and joining",
                  body: "The offer is made by you. We help coordinate acceptance and confirm the joining date with both sides.",
                },
              ]}
            />
          </div>
          <aside className="space-y-5 lg:col-span-5">
            <div className="rounded-box border border-base-300 bg-base-100 p-5">
              <h3 className="text-lg font-semibold">What we need from you</h3>
              <CheckList
                className="mt-3"
                items={[
                  "Subject and class level",
                  "Minimum qualification and experience",
                  "Salary range, stated as gross or take-home",
                  "Full-time or part-time, and working hours",
                  "Expected joining date",
                  "Who decides, and how you interview",
                ]}
              />
            </div>
            <div className="rounded-box border border-base-300 bg-base-100 p-5">
              <h3 className="text-lg font-semibold">Fees for schools</h3>
              <p className="mt-2 text-[0.9375rem] leading-7 text-base-content/75">
                Posting a requirement is free. Any fee for a successful placement is explained and
                agreed with you in writing before we send you any profile. Nothing is charged for
                interviews that do not lead to a hire unless we have agreed otherwise in advance.
              </p>
            </div>
          </aside>
        </div>
      </Section>

      <CtaBand
        title="Have a vacancy right now?"
        body="Register your school and post the requirement. A recruiter will call to confirm it."
        primary={{ href: "/signup", label: "Register your school" }}
        secondary={{ href: "/contact", label: "Contact us" }}
      />
    </>
  );
}
