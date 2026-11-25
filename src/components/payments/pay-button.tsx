"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}
interface RazorpayInstance {
  open: () => void;
  on: (event: string, cb: (r: { error?: { description?: string } }) => void) => void;
}
declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

function loadCheckoutScript(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.async = true;
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

/**
 * Opens Razorpay Checkout for an existing payment row. `registration` first asks the server
 * to create the teacher's registration-fee row (only works when teacher fees are enabled).
 */
export function PayButton({
  paymentId,
  registration,
  label = "Pay now",
  variant = "primary",
}: {
  paymentId?: string;
  registration?: boolean;
  label?: string;
  variant?: "primary" | "accent";
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function pay() {
    setBusy(true);
    try {
      let id = paymentId;
      if (registration) {
        const r = await fetch("/api/payments/registration", { method: "POST" });
        const j = await r.json().catch(() => null);
        if (!r.ok) throw new Error(j?.error ?? "Could not start the payment.");
        id = j.data.id as string;
      }

      const res = await fetch(`/api/payments/${id}/order`, { method: "POST" });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error ?? "Could not start the payment.");
      const o = json.data;

      if (!(await loadCheckoutScript()) || !window.Razorpay) {
        throw new Error("Could not load the payment window. Check your internet connection and try again.");
      }

      const rzp = new window.Razorpay({
        key: o.keyId,
        order_id: o.orderId,
        amount: o.amount,
        currency: o.currency,
        name: o.name,
        description: o.description,
        prefill: o.prefill,
        theme: { color: "#1f3a5f" },
        modal: { ondismiss: () => setBusy(false) },
        handler: async (resp: RazorpayResponse) => {
          const v = await fetch("/api/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(resp),
          });
          const vj = await v.json().catch(() => null);
          if (v.ok) toast.success("Payment received. Thank you.");
          else toast.error(vj?.error ?? "Payment could not be verified.");
          setBusy(false);
          router.refresh();
        },
      });
      rzp.on("payment.failed", (r) => {
        toast.error(r.error?.description ?? "The payment failed. You have not been charged, or it will be refunded by your bank.");
        setBusy(false);
        router.refresh();
      });
      rzp.open();
    } catch (e) {
      toast.error((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <Button size="sm" variant={variant} onClick={pay} loading={busy}>
      {label}
    </Button>
  );
}
