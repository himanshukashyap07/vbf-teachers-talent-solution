import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Minimal Razorpay client (Orders API + signature checks) using plain fetch, so there is
 * no SDK to keep in sync. Docs: https://razorpay.com/docs/payments/server-integration/nodejs/
 *
 * RAZORPAY_API_BASE exists only so tests can point at a local mock; leave it unset in real use.
 */
const API_BASE = process.env.RAZORPAY_API_BASE ?? "https://api.razorpay.com";

export const razorpayConfigured = () =>
  Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

export const razorpayKeyId = () => process.env.RAZORPAY_KEY_ID ?? "";

export class PaymentGatewayError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PaymentGatewayError";
  }
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string | null;
  status: string;
}

export async function createRazorpayOrder(input: {
  amountPaise: number;
  receipt: string; // max 40 chars
  notes?: Record<string, string>;
}): Promise<RazorpayOrder> {
  if (!razorpayConfigured()) throw new PaymentGatewayError("Razorpay keys are not configured.");
  const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64");
  const res = await fetch(`${API_BASE}/v1/orders`, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: input.amountPaise,
      currency: "INR",
      receipt: input.receipt.slice(0, 40),
      notes: input.notes,
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error("[razorpay] order creation failed", res.status, body.slice(0, 300));
    throw new PaymentGatewayError("The payment provider rejected the request.");
  }
  return (await res.json()) as RazorpayOrder;
}

function safeEqualHex(a: string, b: string): boolean {
  const ba = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

/** Checkout success callback: HMAC_SHA256(order_id + "|" + payment_id, key_secret). */
export function verifyCheckoutSignature(orderId: string, paymentId: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;
  const expected = createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
  return safeEqualHex(expected, signature);
}

/** Webhook: HMAC_SHA256(raw request body, webhook secret) in the x-razorpay-signature header. */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  return safeEqualHex(expected, signature);
}
