import { randomBytes } from "node:crypto";
import { Payment } from "@/models/Payment";
import { notifyUser } from "./notifications";

export function formatINR(paise: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: paise % 100 ? 2 : 0 }).format(
    paise / 100,
  );
}

/** e.g. SS-202611-K3F9ZQ — human-readable, unique-indexed in the database. */
export function newReceiptNo(): string {
  const d = new Date();
  const ym = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`;
  const rand = Array.from(randomBytes(6), (b) => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[b % 32]).join("");
  return `SS-${ym}-${rand}`;
}

/**
 * Marks a payment as paid exactly once. Safe to call from both the browser callback and the
 * webhook, in any order, any number of times: the filter refuses to touch an already-paid or
 * refunded row, and (when given) the amount must match what we asked Razorpay to collect.
 */
export async function markPaid(args: { orderId: string; paymentId: string; amountPaise?: number }) {
  const filter: Record<string, unknown> = {
    razorpayOrderId: args.orderId,
    // "cancelled" is included on purpose: if money was actually collected, the record must say so.
    status: { $in: ["requested", "pending", "failed", "cancelled"] },
  };
  if (args.amountPaise !== undefined) filter.amountPaise = args.amountPaise;
  const paid = await Payment.findOneAndUpdate(
    filter,
    { $set: { status: "paid", razorpayPaymentId: args.paymentId, paidAt: new Date() }, $unset: { failureReason: "" } },
    { returnDocument: "after" },
  );
  // Only the call that actually flips the row to "paid" gets here, so this fires exactly once.
  if (paid) {
    await notifyUser(paid.user, {
      title: "Payment received",
      body: `Thank you. We received ${formatINR(paid.amountPaise)} for: ${paid.description}. Receipt ${paid.receiptNo}.`,
      level: "success",
      link: `/receipt/${paid._id}`,
    });
  }
  return paid;
}
