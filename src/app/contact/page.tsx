import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbLd, pageMetadata } from "@/lib/seo";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { siteConfig } from "@/config/site";
import { ContactForm } from "@/components/forms/contact-form";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader, Section } from "@/components/sections";

export const metadata: Metadata = pageMetadata({
  title: "Contact Us",
  description:
    "Contact our team by form, phone or WhatsApp. Tell us whether you are a school or a teacher and a recruiter will reply by phone or email.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <>
      <JsonLd data={breadcrumbLd([{ name: "Contact", path: "/contact" }])} />
      <PageHeader
        eyebrow="Contact"
        title="Talk to a person."
        lead="Tell us whether you are a school or a teacher and what you need. A recruiter will reply by phone or email."
      />
      <Section>
        <div className="grid gap-10 lg:grid-cols-12">
          <Card className="lg:col-span-7">
            <CardContent>
              <ContactForm />
            </CardContent>
          </Card>

          <aside className="space-y-4 lg:col-span-5">
            <div className="rounded-box border border-base-300 bg-base-100 p-5">
              <h2 className="text-lg font-semibold">Other ways to reach us</h2>
              <ul className="mt-4 space-y-4 text-[0.9375rem]">
                <li className="flex gap-3"><Mail className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden /><span>{siteConfig.email}</span></li>
                <li className="flex gap-3"><Phone className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden /><span>{siteConfig.phoneDisplay}</span></li>
                <li className="flex gap-3"><MessageCircle className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden /><span>WhatsApp: use the green button at the bottom right of any page.</span></li>
                <li className="flex gap-3"><MapPin className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden /><span>{siteConfig.region} (we work remotely)</span></li>
              </ul>
            </div>
            <div className="rounded-box border border-base-300 bg-base-200/60 p-5 text-sm leading-6 text-base-content/75">
              Please do not send identity documents or certificates through this form. We will tell you how to share them securely after we speak.
            </div>
          </aside>
        </div>
      </Section>
    </>
  );
}
