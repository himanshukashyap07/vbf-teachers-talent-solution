import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbLd, pageMetadata } from "@/lib/seo";
import { siteConfig } from "@/config/site";
import { CtaBand, PageHeader, Section } from "@/components/sections";

export const metadata: Metadata = pageMetadata({
  title: "About Us",
  description:
    "Meet the small team behind this teacher recruitment service, connecting schools and teachers across Uttar Pradesh through direct conversations.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <>
      <JsonLd data={breadcrumbLd([{ name: "About", path: "/about" }])} />
      <PageHeader
        eyebrow="About us"
        title="A small team that makes school hiring less of a guessing game."
        lead={`${siteConfig.name} is a teacher recruitment service for ${siteConfig.region}. We connect schools with teachers through direct conversations, structured interviews and honest written summaries.`}
      />

      <Section>
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="prose-content lg:col-span-7">
            <h2 className="!mt-0">Why we exist</h2>
            <p>
              Schools in smaller cities and towns often find hiring harder than it should be. Good teachers
              are not always visible, vacancies are not always advertised, and a resume rarely tells a principal
              what they really want to know. Teachers, in turn, often hear about openings only through personal
              contacts and have no way to present themselves beyond a piece of paper.
            </p>
            <p>
              We are a bridge. We talk to the school first to understand what is needed. We then talk to the
              teacher to understand what they can do. We write down what we learn and share it with the people who
              need it, with permission.
            </p>

            <h2>How we operate</h2>
            <p>
              We are deliberately small. Our team handles every school and every candidate
              personally, from the first phone call to the day of joining. We would rather handle fewer vacancies well than
              many badly, so we limit how many we work on at once and keep a clear owner and next step against each.
            </p>
            <p>
              We work remotely, over phone, WhatsApp and video, and keep records in a structured system so that nothing is lost between
              conversations.
            </p>

            <h2>What we do not do</h2>
            <ul>
              <li>We are not an employer, and we do not decide who a school hires.</li>
              <li>We do not guarantee employment, selection or a particular salary.</li>
              <li>We do not let software decide whom to shortlist or hire.</li>
              <li>We do not share a teacher&apos;s details in public groups or posts.</li>
            </ul>
          </div>

          <aside className="space-y-5 lg:col-span-5">
            <div className="rounded-box border border-base-300 bg-base-100 p-5">
              <h3 className="text-lg font-semibold">Our values</h3>
              <dl className="mt-3 space-y-4 text-[0.9375rem] leading-6">
                <div>
                  <dt className="font-semibold">Honesty</dt>
                  <dd className="text-base-content/70">Real vacancies, real summaries, clear terms.</dd>
                </div>
                <div>
                  <dt className="font-semibold">Respect for candidates</dt>
                  <dd className="text-base-content/70">Consent, privacy and a say in where their profile goes.</dd>
                </div>
                <div>
                  <dt className="font-semibold">Usefulness to schools</dt>
                  <dd className="text-base-content/70">Short lists and facts, so decisions are quicker.</dd>
                </div>
                <div>
                  <dt className="font-semibold">Fairness</dt>
                  <dd className="text-base-content/70">Role-related criteria, applied the same way every time.</dd>
                </div>
              </dl>
            </div>
          </aside>
        </div>
      </Section>

      <CtaBand
        title="Talk to us about your needs"
        body="We are happy to explain the process before you register."
        primary={{ href: "/contact", label: "Contact us" }}
        secondary={{ href: "/how-it-works", label: "How it works" }}
      />
    </>
  );
}
