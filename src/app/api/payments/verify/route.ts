import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { fail, handleError, ok, readJson } from "@/lib/api";
import { markPaid } from "@/lib/payments";
import { verifyCheckoutSignature } from "@/lib/razorpay";
import { Payment } from "@/models/Payment";

const bodySchema = z.object({
  razorpay_order_id: z.string().min(5).max(64),
  razorpay_payment_id: z.string().min(5).max(64),
  razorpay_signature: z.string().min(10).max(128),
});

/**
 * Called by the browser right after Razorpay Checkout succeeds. Nothing is trusted until the
 * HMAC signature is verified with our secret. The webhook is the independent second path.
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return fail("Please log in first.", 401);
    const b = bodySchema.parse(await readJson(req));

    await connectDB();
    const payment = await Payment.findOne({ razorpayOrderId: b.razorpay_order_id, user: session.user.id });
    if (!payment) return fail("Payment not found.", 404);
    if (payment.status === "paid") return ok({ status: "paid" }); // idempotent

    if (!verifyCheckoutSignature(b.razorpay_order_id, b.razorpay_payment_id, b.razorpay_signature)) {
      console.warn("[payments] invalid checkout signature for order", b.razorpay_order_id);
      return fail("We could not verify this payment. If money was deducted, it will be confirmed automatically; otherwise contact us.", 400);
    }

    const updated = await markPaid({ orderId: b.razorpay_order_id, paymentId: b.razorpay_payment_id });
    if (!updated) {
      const current = await Payment.findById(payment._id).select("status").lean();
      if (current?.status === "paid") return ok({ status: "paid" }); // the webhook got there first
      return fail("This payment can no longer be completed.", 409);
    }
    return ok({ status: "paid", receiptNo: updated.receiptNo });
  } catch (err) {
    return handleError(err);
  }
}
