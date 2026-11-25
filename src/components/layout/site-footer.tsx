import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { mainNav, siteConfig } from "@/config/site";
import { Brand } from "./brand";

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-primary text-primary-content print:hidden">
      <div className="container-page grid gap-10 py-12 md:grid-cols-12">
        <div className="md:col-span-5">
          <Brand inverted />
          <p className="mt-4 max-w-sm text-sm leading-6 text-primary-content/80">
            {siteConfig.description}
          </p>
          <ul className="mt-5 space-y-2 text-sm text-primary-content/85">
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden /> <span>{siteConfig.address}</span>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="size-4 shrink-0" aria-hidden /> {siteConfig.email}
            </li>
            <li className="flex items-center gap-2">
              <Phone className="size-4 shrink-0" aria-hidden /> {siteConfig.phoneDisplay}
            </li>
          </ul>
        </div>

        <nav aria-label="Footer" className="md:col-span-3">
          <h2 className="font-sans text-sm font-semibold uppercase tracking-wider text-primary-content/70">
            Explore
          </h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            {mainNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-primary-content/90 hover:underline">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Account and legal" className="md:col-span-4">
          <h2 className="font-sans text-sm font-semibold uppercase tracking-wider text-primary-content/70">
            Account &amp; legal
          </h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link href="/signup" className="text-primary-content/90 hover:underline">Create an account</Link></li>
            <li><Link href="/login" className="text-primary-content/90 hover:underline">Log in</Link></li>
            <li><Link href="/working-methods" className="text-primary-content/90 hover:underline">How we work</Link></li>
            <li><Link href="/payment-policy" className="text-primary-content/90 hover:underline">Payment &amp; refund policy</Link></li>
            <li><Link href="/candidate-agreement" className="text-primary-content/90 hover:underline">Candidate agreement</Link></li>
            <li><Link href="/terms" className="text-primary-content/90 hover:underline">Terms &amp; conditions</Link></li>
            <li><Link href="/rules" className="text-primary-content/90 hover:underline">Rules &amp; regulations</Link></li>
            <li><Link href="/privacy" className="text-primary-content/90 hover:underline">Privacy policy</Link></li>
          </ul>
        </nav>
      </div>

      <div className="border-t border-primary-content/15">
        <div className="container-page flex flex-col gap-2 py-5 text-xs text-primary-content/70 sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} {siteConfig.name}. All rights reserved.</p>
          <p>We do not guarantee employment or selection. Placement depends on each school&apos;s decision.</p>
        </div>
      </div>
    </footer>
  );
}
