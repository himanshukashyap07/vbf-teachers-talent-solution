"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";

/** Confirms the token from the emailed link by POSTing it once when the page opens. */
export function VerifyEmailClient({ token }: { token: string | null }) {
  const [state, setState] = useState<"working" | "ok" | "error">(token ? "working" : "error");
  const [message, setMessage] = useState(token ? "" : "This link is missing its code. Open the link from your email again.");
  const started = useRef(false);

  useEffect(() => {
    if (!token || started.current) return; // ref guard: React strict mode runs effects twice in dev
    started.current = true;
    fetch("/api/account/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const json = await res.json().catch(() => null);
        if (res.ok) setState("ok");
        else {
          setState("error");
          setMessage(json?.error ?? "We could not confirm your email.");
        }
      })
      .catch(() => {
        setState("error");
        setMessage("Network problem. Please try again.");
      });
  }, [token]);

  if (state === "working") {
    return (
      <p className="flex items-center gap-2 text-base-content/70">
        <Loader2 className="size-4 animate-spin" aria-hidden /> Confirming your email…
      </p>
    );
  }
  if (state === "ok") {
    return (
      <div className="space-y-4">
        <Notice tone="success">Your email address is confirmed. Thank you.</Notice>
        <Button asChild><Link href="/dashboard">Go to dashboard</Link></Button>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <Notice tone="error">{message}</Notice>
      <Button asChild variant="outline"><Link href="/dashboard">Go to dashboard to resend the link</Link></Button>
    </div>
  );
}
