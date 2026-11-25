import Link from "next/link";
import { connectDB } from "@/lib/db";
import { formatINR } from "@/lib/payments";
import { siteConfig } from "@/config/site";
import { AdminAction } from "@/components/admin/admin-controls";
import { PaymentRequestForm } from "@/components/admin/payment-request-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { Payment } from "@/models/Payment";
import { razorpayConfigured } from "@/lib/razorpay";

const badge: Record<string, string> = {
  paid: "badge-success",
  requested: "badge-warning",
  pending: "badge-info",
  failed: "badge-error",
  cancelled: "badge-ghost",
  refunded: "badge-neutral",
};

interface Row {
  _id: unknown;
  receiptNo: string;
  purpose: string;
  description: string;
  amountPaise: number;
  status: string;
  razorpayPaymentId?: string;
  createdAt: Date;
  user?: { name: string; email?: string; role?: string } | null;
}

export default async function AdminPayments() {
  await connectDB();
  const rows = (await Payment.find().sort({ createdAt: -1 }).limit(100).populate("user", "name email role").lean()) as unknown as Row[];

  return (
    <div className="space-y-6">
      {!razorpayConfigured() && (
        <Notice tone="info">Razorpay keys are not set, so users cannot pay online yet. Add <code>RAZORPAY_KEY_ID</code> and <code>RAZORPAY_KEY_SECRET</code> to <code>.env</code>.</Notice>
      )}
      {!siteConfig.candidateFeesEnabled && (
        <Notice tone="info">Teacher fees are <strong>disabled</strong> (legal approval pending): payment requests for teacher accounts are refused by the server.</Notice>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Raise a payment request</CardTitle>
          <CardDescription>The user sees it on their dashboard and pays by UPI, card or net banking through Razorpay.</CardDescription>
        </CardHeader>
        <CardContent><PaymentRequestForm /></CardContent>
      </Card>

      <div className="overflow-x-auto rounded-box border border-base-300 bg-base-100">
        <table className="table">
          <thead>
            <tr><th>Receipt</th><th>User</th><th>For</th><th>Amount</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={String(p._id)}>
                <td className="whitespace-nowrap text-sm">
                  <code>{p.receiptNo}</code>
                  <div className="text-xs text-base-content/60">{new Date(p.createdAt).toLocaleDateString("en-IN")}</div>
                </td>
                <td className="text-sm">{p.user?.name ?? "—"}<div className="text-xs text-base-content/60">{p.user?.email}</div></td>
                <td className="max-w-xs text-sm">{p.description}<div className="text-xs text-base-content/60">{p.purpose}</div></td>
                <td className="whitespace-nowrap font-semibold">{formatINR(p.amountPaise)}</td>
                <td><span className={`badge ${badge[p.status] ?? ""}`}>{p.status}</span>{p.razorpayPaymentId && <div className="mt-1 text-xs text-base-content/50">{p.razorpayPaymentId}</div>}</td>
                <td>
                  <div className="flex flex-wrap gap-2">
                    {p.status === "paid" && <Link href={`/receipt/${p._id}`} className="btn btn-xs btn-outline">Receipt</Link>}
                    {["requested", "pending", "failed"].includes(p.status) && (
                      <AdminAction endpoint={`/api/admin/payments/${p._id}`} body={{ status: "cancelled" }} label="Cancel" confirmText="Cancel this payment request?" />
                    )}
                    {p.status === "paid" && (
                      <AdminAction endpoint={`/api/admin/payments/${p._id}`} body={{ status: "refunded" }} label="Mark refunded" confirmText="Only mark as refunded AFTER you have refunded the money in the Razorpay dashboard. Continue?" />
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={6} className="text-center text-base-content/60">No payments yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
