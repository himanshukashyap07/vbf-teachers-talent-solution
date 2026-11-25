import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { isAdminUser } from "@/lib/roles";
import { formatINR } from "@/lib/payments";
import { siteConfig } from "@/config/site";
import { PrintButton } from "@/components/payments/print-button";
import { Payment } from "@/models/Payment";
import { User } from "@/models/User";

export const metadata: Metadata = { title: "Payment receipt", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!/^[a-f0-9]{24}$/.test(id)) notFound();
  if (!session?.user?.id) redirect(`/login?callbackUrl=${encodeURIComponent(`/receipt/${id}`)}`);

  await connectDB();
  const viewer = await User.findById(session.user.id).select("role email emailVerified").lean();
  const payment = await Payment.findById(id).populate("user", "name email phone").lean();
  if (!viewer || !payment) notFound();

  const payer = payment.user as unknown as { _id: unknown; name: string; email?: string; phone?: string };
  const isOwner = String(payer._id) === session.user.id;
  if (!isOwner && !isAdminUser(viewer)) notFound(); // never reveal that someone else's receipt exists
  if (payment.status !== "paid" && payment.status !== "refunded") notFound();

  const rows: [string, string][] = [
    ["Receipt no.", payment.receiptNo],
    ["Date paid", payment.paidAt ? new Date(payment.paidAt).toLocaleString("en-IN", { dateStyle: "long", timeStyle: "short" }) : "—"],
    ["Received from", `${payer.name}${payer.email ? ` (${payer.email})` : ""}`],
    ["For", payment.description],
    ["Payment reference", payment.razorpayPaymentId ?? "—"],
    ["Status", payment.status === "refunded" ? "Refunded" : "Paid"],
  ];

  return (
    <div className="container-page max-w-2xl py-10">
      <article className="rounded-box border border-base-300 bg-base-100 p-6 sm:p-8">
        <header className="flex items-start justify-between gap-4 border-b border-base-300 pb-5">
          <div>
            <h1 className="text-2xl font-bold">Payment receipt</h1>
            <p className="mt-1 text-sm text-base-content/65">{siteConfig.name} · {siteConfig.region}</p>
            <p className="text-sm text-base-content/65">{siteConfig.email}</p>
          </div>
          <p className="text-right font-serif text-3xl font-bold">{formatINR(payment.amountPaise)}</p>
        </header>
        <dl className="divide-y divide-base-300 text-[0.9375rem]">
          {rows.map(([k, v]) => (
            <div key={k} className="flex flex-col gap-0.5 py-3 sm:flex-row sm:justify-between sm:gap-6">
              <dt className="text-base-content/60">{k}</dt>
              <dd className="font-medium sm:text-right">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 border-t border-base-300 pt-4 text-xs leading-5 text-base-content/55">
          This is an acknowledgement of payment. Any tax invoice that applies to this service is issued separately.
          Payments are processed securely by Razorpay; we never see or store your card or UPI details.
        </p>
      </article>
      <div className="mt-5 print:hidden"><PrintButton /></div>
    </div>
  );
}
