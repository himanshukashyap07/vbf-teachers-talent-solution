import type { Metadata } from "next";
import Link from "next/link";
import { fees, siteConfig } from "@/config/site";
import { JsonLd } from "@/components/json-ld";
import { CtaBand, FaqItem, PageHeader, Section } from "@/components/sections";
import { breadcrumbLd, faqLd, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "FAQ for Schools and Teachers",
  description:
    "Answers to common questions from schools and teachers about fees, interviews, privacy, consent and how teacher placement works in Uttar Pradesh.",
  path: "/faq",
});

interface Faq {
  q: string;
  a: string;
  link?: { href: string; label: string };
}

const teacherFee = siteConfig.candidateFeesEnabled
  ? fees.teacherAnswer
  : "No fee is being charged to teachers at present. If we introduce one in future, we will explain it clearly in writing before you agree, and it will comply with the applicable law.";

const schools: Faq[] = [
  { q: "What does it cost to post a vacancy?", a: "Nothing. Schools pay no fee, whether for posting a vacancy or for a successful placement." },
  { q: "How quickly can I get candidates?", a: "It depends on the role and the district. We aim to send a first shortlist as soon as we have candidates who meet your criteria and have been interviewed. We will tell you honestly if a role is hard to fill." },
  { q: "Do you check candidates' documents?", a: "We ask for qualification certificates and tell you which documents we have seen. We do not carry out formal background verification unless that is separately agreed." },
  { q: "Can I interview the candidate myself?", a: "Yes, always. Our summary is there to help you decide whom to meet, not to replace your own interview." },
  { q: "What if the candidate is not selected or leaves quickly?", a: "We send other suitable profiles for the same vacancy." },
];

const teachers: Faq[] = [
  { q: "Is there a fee for teachers?", a: teacherFee },
  { q: "Is the registration fee refundable?", a: "No. The registration fee is non-refundable. A placement fee that has been paid is also not refunded. A payment taken twice by mistake is refunded.", link: { href: "/payment-policy", label: "Read the payment, fee and refund policy" } },
  { q: "Will you guarantee me a job?", a: "No, and be wary of anyone who does. We introduce you to schools; the school decides." },
  { q: "Who can see my resume?", a: "Only schools you have consented to, and you are told which school receives it. We never post resumes publicly." },
  { q: "Who interviews me?", a: "Our team, virtually or in person. A person prepares your summary report; no software interviews or judges you." },
  { q: "Can I change or remove my information?", a: "Yes. Contact us and we will correct it or withdraw your profile.", link: { href: "/privacy", label: "Read our privacy policy" } },
  { q: "I am a fresher. Can I register?", a: "Yes. Freshers with a B.Ed. or D.El.Ed. are welcome, especially for primary and pre-primary roles." },
];

const account: Faq[] = [
  { q: "Can I log in with my mobile number?", a: "Yes. Use either your email address or your 10-digit mobile number with your password. You can also sign in with Google or LinkedIn." },
  { q: "Why do I need to confirm my email?", a: "We send receipts, password-reset links and important updates to your email, so we ask you to confirm it belongs to you. Temporary or disposable email addresses are not accepted." },
  { q: "I signed in with Google. Why am I asked for more details?", a: "The first time you use Google or LinkedIn we need to know whether you are a school or a teacher, and a few basics so we can match you properly." },
];

function List({ items }: { items: Faq[] }) {
  return (
    <div className="space-y-3">
      {items.map((f) => (
        <FaqItem key={f.q} q={f.q}>
          {f.a}
          {f.link && (
            <>
              {" "}
              <Link href={f.link.href} className="text-primary underline">{f.link.label}</Link>.
            </>
          )}
        </FaqItem>
      ))}
    </div>
  );
}

export default function FaqPage() {
  return (
    <>
      <JsonLd data={[breadcrumbLd([{ name: "FAQ", path: "/faq" }]), faqLd([...schools, ...teachers, ...account])]} />
      <PageHeader
        eyebrow="FAQ"
        title="Questions we are asked most often"
        lead="If your question is not here, write to us and we will answer in plain language."
      />

      <Section>
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="mb-4 text-xl font-bold">For schools</h2>
            <List items={schools} />
          </div>
          <div>
            <h2 className="mb-4 text-xl font-bold">For teachers</h2>
            <List items={teachers} />
          </div>
        </div>

        <div className="mt-12 max-w-3xl">
          <h2 className="mb-4 text-xl font-bold">About your account</h2>
          <List items={account} />
        </div>
      </Section>

      <CtaBand
        title="Still have a question?"
        body="Send us a message or message us on WhatsApp."
        primary={{ href: "/contact", label: "Contact us" }}
      />
    </>
  );
}
