import Link from "next/link";
import { connectDB } from "@/lib/db";
import { formatINR } from "@/lib/payments";
import { Card, CardContent } from "@/components/ui/card";
import { Inquiry } from "@/models/Inquiry";
import { Payment } from "@/models/Payment";
import { User } from "@/models/User";
import { Vacancy } from "@/models/Vacancy";

export default async function AdminOverview() {
  await connectDB();
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const [teachers, schools, pendingVacancies, openVacancies, newInquiries, awaitingPayment, paidAgg, monthAgg] = await Promise.all([
    User.countDocuments({ role: "candidate" }),
    User.countDocuments({ role: "school" }),
    Vacancy.countDocuments({ status: "pending-verification" }),
    Vacancy.countDocuments({ status: "open" }),
    Inquiry.countDocuments({ status: "new" }),
    Payment.countDocuments({ status: { $in: ["requested", "pending", "failed"] } }),
    Payment.aggregate([{ $match: { status: "paid" } }, { $group: { _id: null, total: { $sum: "$amountPaise" } } }]),
    Payment.aggregate([{ $match: { status: "paid", paidAt: { $gte: monthStart } } }, { $group: { _id: null, total: { $sum: "$amountPaise" } } }]),
  ]);

  const stats: { label: string; value: string | number; href: string; hint?: string; attention?: boolean }[] = [
    { label: "Teachers registered", value: teachers, href: "/admin/users?role=candidate" },
    { label: "Schools registered", value: schools, href: "/admin/users?role=school" },
    { label: "Vacancies to verify", value: pendingVacancies, href: "/admin/vacancies?status=pending-verification", hint: "Call the school, then set to Open", attention: pendingVacancies > 0 },
    { label: "Open vacancies", value: openVacancies, href: "/admin/vacancies?status=open" },
    { label: "New inquiries", value: newInquiries, href: "/admin/inquiries?status=new", attention: newInquiries > 0 },
    { label: "Awaiting payment", value: awaitingPayment, href: "/admin/payments" },
    { label: "Collected this month", value: formatINR(monthAgg[0]?.total ?? 0), href: "/admin/payments" },
    { label: "Collected all time", value: formatINR(paidAgg[0]?.total ?? 0), href: "/admin/payments" },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((s) => (
        <Link key={s.label} href={s.href} className="block">
          <Card className={`h-full transition-colors hover:border-primary/60 ${s.attention ? "border-accent/60" : ""}`}>
            <CardContent className="!p-5">
              <p className="text-sm text-base-content/65">{s.label}</p>
              <p className="mt-1 font-serif text-3xl font-bold">{s.value}</p>
              {s.hint && <p className="mt-1 text-xs text-base-content/60">{s.hint}</p>}
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
