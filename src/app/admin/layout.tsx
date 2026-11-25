import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAdmin } from "@/lib/admin";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const tabs = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/vacancies", label: "Vacancies" },
  { href: "/admin/inquiries", label: "Inquiries" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/notifications", label: "Notifications" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/admin");
  const admin = await getAdmin().catch(() => null);
  if (!admin) redirect("/dashboard");

  return (
    <div className="container-page py-8 lg:py-10">
      <p className="text-sm font-semibold uppercase tracking-wider text-accent">Staff area</p>
      <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Admin</h1>
      <nav aria-label="Admin" className="mt-5 flex gap-1 overflow-x-auto border-b border-base-300">
        {tabs.map((t) => (
          <Link key={t.href} href={t.href} className="whitespace-nowrap border-b-2 border-transparent px-4 py-2.5 text-sm font-semibold text-base-content/70 hover:text-base-content">
            {t.label}
          </Link>
        ))}
      </nav>
      <div className="mt-6">{children}</div>
    </div>
  );
}
