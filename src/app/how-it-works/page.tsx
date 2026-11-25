import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbLd, pageMetadata } from "@/lib/seo";
import { CheckList, CtaBand, PageHeader, Section, StepList } from "@/components/sections";

export const metadata: Metadata = pageMetadata({
  title: "How Teacher Recruitment Works",
  description:
    "See the complete process, from taking a school's requirement to screening teachers, sharing profiles with consent and confirming joining.",
  path: "/how-it-works",
});

const stages = [
  ["Open — sourcing", "A confirmed vacancy we are actively filling."],
  ["Registered", "A teacher has signed up and given consent."],
  ["Screened", "The teacher has been interviewed and a summary is written."],
  ["Submitted to school", "The school has received the resume and summary."],
  ["School interview", "The school wants to meet the candidate."],
  ["Offer / Selected", "The school has made an offer."],
  ["Joined", "Joining confirmed with both school and teacher."],
  ["On hold / Rejected", "The school paused or declined. We look for the next match."],
];

export default function HowItWorksPage() {
  return (
    <>
      <JsonLd data={breadcrumbLd([{ name: "How It Works", path: "/how-it-works" }])} />
      <PageHeader
        eyebrow="Process"
        title="How a placement works, from the first call to the first day."
        lead="Every vacancy and every candidate is tracked with an owner and a next step, so nothing stalls because someone forgot to call."
      />

      <Section title="The full process" intro="Six stages, in the order they happen.">
        <div className="max-w-3xl">
          <StepList
            steps={[
              {
                title: "Take the school's requirement",
                body: "We contact the school and record the subject, level, qualification, experience, salary range (gross or take-home), employment type, joining date, working hours and interview process. We also identify who makes the decision.",
                note: "A vacancy is marked 'open' only after we have verified it with the school and have permission to represent it.",
              },
              {
                title: "Register candidates",
                body: "Teachers reach us through referrals, social media and outreach. Before collecting documents, we explain the service, the privacy policy and our fees (a one-time registration fee, and a share of the first month's salary only after placement). The candidate then provides their details and consents to how their profile may be shared.",
              },
              {
                title: "Screen and interview",
                body: "A recruiter checks that the candidate meets the vacancy's minimum criteria, then conducts a structured interview: subject knowledge, teaching approach, communication, availability and role-specific questions.",
                note: "Interviews are taken by our team, virtually or in person. A person prepares every summary and removes anything that is not supported by what was said.",
              },
              {
                title: "Candidate agreement and profile sharing",
                body: "Before a profile is forwarded, the candidate reviews the role and agrees to the Candidate Agreement. We then send the school the approved resume and summary, and tell the candidate which school received it.",
              },
              {
                title: "School review and selection",
                body: "The school can request an interview, hold, or reject. We record the feedback. If a candidate is rejected, we may propose them to another school only when their consent covers it, otherwise we ask again.",
              },
              {
                title: "Offer, joining and follow-up",
                body: "The school communicates the offer. We record the salary basis, the start date and the candidate's acceptance, then verify joining with both parties. Afterwards we check in to see how the placement is going.",
              },
            ]}
          />
        </div>
      </Section>

      <Section tone="paper" title="Where things stand: status you will see" intro="Teachers and schools can see where they are in the process on their dashboard.">
        <div className="overflow-x-auto rounded-box border border-base-300 bg-base-100">
          <table className="table">
            <thead>
              <tr><th>Status</th><th>What it means</th></tr>
            </thead>
            <tbody>
              {stages.map(([s, m]) => (
                <tr key={s}>
                  <td className="whitespace-nowrap font-semibold">{s}</td>
                  <td className="text-base-content/75">{m}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Principles we hold ourselves to">
        <div className="grid gap-8 md:grid-cols-2">
          <CheckList
            items={[
              "We verify vacancies before marketing them.",
              "We share profiles only with a candidate's consent.",
              "We tell candidates which school has their profile.",
              "Screening criteria are role-related and applied consistently.",
            ]}
          />
          <CheckList
            items={[
              "Interviews and summary reports are prepared by people, and the final decision is always the school's.",
              "We do not publish school names or vacancy details without permission.",
              "We never claim guaranteed jobs or guaranteed selection.",
              "Candidates can correct their information or withdraw at any time.",
            ]}
          />
        </div>
      </Section>

      <CtaBand
        title="See it for yourself"
        body="Register and follow your own application, or post a vacancy and watch it move."
        primary={{ href: "/signup", label: "Create an account" }}
        secondary={{ href: "/faq", label: "Read the FAQ" }}
      />
    </>
  );
}
