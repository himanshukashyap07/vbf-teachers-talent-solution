import { connectDB } from "@/lib/db";
import { fail, handleError, ok, readTextLimited } from "@/lib/api";
import { markPaid } from "@/lib/payments";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { Payment } from "@/models/Payment";

interface RazorpayPaymentEntity {
  id: string;
  order_id?: string;
  amount?: number;
  currency?: string;
  error_description?: string;
}
interface WebhookBody {
  event: string;
  payload?: { payment?: { entity?: RazorpayPaymentEntity } };
}

/**
 * Razorpay → us. Covers the case where the user pays but closes the tab before the browser
 * callback runs. The raw body is signed, so it must be read as text BEFORE any JSON parsing.
 * Configure in Razorpay Dashboard → Webhooks: URL {site}/api/webhooks/razorpay,
 * events payment.captured, order.paid, payment.failed, and the same secret as RAZORPAY_WEBHOOK_SECRET.
 */
export async function POST(req: Request) {
  try {
    const raw = await readTextLimited(req, 256 * 1024); // signed raw body, size-capped
    const signature = req.headers.get("x-razorpay-signature") ?? "";
    if (!verifyWebhookSignature(raw, signature)) return fail("Invalid signature.", 400);

    const body = JSON.parse(raw) as WebhookBody;
    const entity = body.payload?.payment?.entity;
    if (!entity?.order_id) return ok({ ignored: true });

    await connectDB();

    if (body.event === "payment.captured" || body.event === "order.paid") {
      const done = await markPaid({ orderId: entity.order_id, paymentId: entity.id, amountPaise: entity.amount });
      if (!done) {
        const existing = await Payment.findOne({ razorpayOrderId: entity.order_id }).select("status amountPaise").lean();
        if (existing && existing.status !== "paid" && existing.status !== "refunded") {
          // Money arrived for a different amount than we asked for: do not auto-confirm; a human must look.
          console.error("[webhook] amount mismatch", { order: entity.order_id, got: entity.amount, expected: existing.amountPaise });
        }
      }
    } else if (body.event === "payment.failed") {
      await Payment.updateOne(
        { razorpayOrderId: entity.order_id, status: { $in: ["requested", "pending", "failed"] } },
        { $set: { status: "failed", failureReason: entity.error_description?.slice(0, 200) } },
      );
    }
    return ok({ received: true });
  } catch (err) {
    return handleError(err);
  }
}
