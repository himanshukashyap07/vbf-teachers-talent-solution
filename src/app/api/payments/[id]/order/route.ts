import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { assertSameOrigin, fail, handleError, ok } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { emailConfigured } from "@/lib/email";
import { createRazorpayOrder, PaymentGatewayError, razorpayConfigured, razorpayKeyId } from "@/lib/razorpay";
import { siteConfig } from "@/config/site";
import { Payment } from "@/models/Payment";
import { User } from "@/models/User";

/**
 * Prepares a Razorpay Checkout for one of the logged-in user's own payments.
 * Returns what the browser needs to open the checkout; the amount is read from OUR database.
 */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(req);
    const { id } = await ctx.params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return fail("Please log in first.", 401);
    if (!/^[a-f0-9]{24}$/.test(id)) return fail("Payment not found.", 404);
    if (!rateLimit(`order:${session.user.id}`, 20, 60 * 60 * 1000)) return fail("Too many attempts. Try later.", 429);
    if (!razorpayConfigured()) return fail("Online payment is not switched on yet. Please contact us.", 503);

    await connectDB();
    const [user, payment] = await Promise.all([
      User.findById(session.user.id).select("name email phone role emailVerified").lean(),
      Payment.findOne({ _id: id, user: session.user.id }),
    ]);
    if (!user || !payment) return fail("Payment not found.", 404);

    if (payment.status === "paid") return fail("This payment is already completed.", 409);
    if (payment.status === "cancelled" || payment.status === "refunded") return fail("This payment is no longer active.", 409);

    // Legal gate: no money is taken from a teacher while candidate fees are disabled.
    if (user.role === "candidate" && !siteConfig.candidateFeesEnabled) {
      return fail("No fee is being charged to teachers at this time.", 403);
    }
    // Receipts and disputes go to the email on file, so it must be confirmed (when email is set up).
    if (emailConfigured && !user.emailVerified) {
      return fail("Please confirm your email address before paying. Check your inbox or resend the link from your dashboard.", 403);
    }

    let orderId = payment.razorpayOrderId;
    if (!orderId) {
      const order = await createRazorpayOrder({
        amountPaise: payment.amountPaise,
        receipt: payment.receiptNo,
        notes: { paymentId: String(payment._id), purpose: payment.purpose },
      });
      // If two clicks raced, keep the first order and discard ours.
      const saved = await Payment.findOneAndUpdate(
        { _id: payment._id, razorpayOrderId: { $exists: false } },
        { $set: { razorpayOrderId: order.id, status: "pending" } },
        { returnDocument: "after" },
      );
      orderId = saved?.razorpayOrderId ?? (await Payment.findById(payment._id).select("razorpayOrderId").lean())?.razorpayOrderId;
    } else if (payment.status !== "pending") {
      await Payment.updateOne({ _id: payment._id }, { $set: { status: "pending" } });
    }

    return ok({
      keyId: razorpayKeyId(),
      orderId,
      amount: payment.amountPaise,
      currency: payment.currency ?? "INR",
      description: payment.description,
      name: siteConfig.name,
      prefill: { name: user.name, email: user.email ?? "", contact: user.phone ?? "" },
    });
  } catch (err) {
    if (err instanceof PaymentGatewayError) return fail("We could not start the payment. Please try again.", 502);
    return handleError(err);
  }
}
