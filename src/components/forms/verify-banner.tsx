"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";

export function VerifyBanner({ email }: { email: string }) {
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function resend() {
    setBusy(true);
    const res = await fetch("/api/account/send-verification", { method: "POST" });
    const json = await res.json().catch(() => null);
    setBusy(false);
    if (res.ok) {
      setSent(true);
      toast.success(json?.data?.sent ? "Verification email sent." : "Email is not set up on this server yet.");
    } else toast.error(json?.error ?? "Could not send the email.");
  }

  return (
    <Notice tone="info" className="mb-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span>
          Please confirm your email address <strong>{email}</strong>. We sent you a link when you registered.
        </span>
        <Button size="sm" variant="outline" onClick={resend} loading={busy} disabled={sent}>
          {sent ? "Link sent" : "Resend link"}
        </Button>
      </div>
    </Notice>
  );
}
