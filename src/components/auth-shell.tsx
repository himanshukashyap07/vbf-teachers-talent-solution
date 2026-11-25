import { ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

/** Two-column frame used by login / signup / onboarding: form left, reassurance right. */
export function AuthShell({
  title,
  subtitle,
  children,
  wide,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="container-page grid gap-10 py-10 lg:grid-cols-12 lg:py-16">
      <div className={wide ? "lg:col-span-8" : "lg:col-span-7"}>
        <h1 className="text-3xl font-bold sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-2 max-w-xl text-base text-base-content/70">{subtitle}</p>}
        <Card className="mt-6 max-w-2xl">
          <CardContent>{children}</CardContent>
        </Card>
      </div>

      <aside className={wide ? "lg:col-span-4" : "lg:col-span-5"}>
        <div className="rounded-box border border-base-300 bg-base-100 p-6">
          <ShieldCheck className="size-6 text-secondary" aria-hidden />
          <h2 className="mt-3 text-lg font-semibold">How we handle your information</h2>
          <ul className="mt-3 space-y-2.5 text-sm leading-6 text-base-content/75">
            <li>Your resume and details are shared only with schools you are matched to.</li>
            <li>Passwords are stored as one-way hashes. We cannot read them.</li>
            <li>You can ask us to correct or delete your information at any time.</li>
            <li>We do not guarantee any job or selection. That decision is the school&apos;s.</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
