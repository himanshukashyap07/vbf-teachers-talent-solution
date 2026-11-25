"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { safeRedirectPath } from "@/lib/safe-redirect";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.45a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.57-5.17 3.57-8.81z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.88-3a7.2 7.2 0 0 1-4.06 1.13 7.12 7.12 0 0 1-6.7-4.92H1.3v3.09A12 12 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.3a12 12 0 0 0 0 10.8l4-3.1z" />
      <path fill="#EA4335" d="M12 4.75c1.76 0 3.34.6 4.58 1.8l3.43-3.43A11.5 11.5 0 0 0 12 0 12 12 0 0 0 1.3 6.6l4 3.1A7.12 7.12 0 0 1 12 4.75z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden fill="#0A66C2">
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
    </svg>
  );
}

export function OAuthButtons({
  googleEnabled,
  linkedinEnabled,
  callbackUrl = "/dashboard",
}: {
  googleEnabled: boolean;
  linkedinEnabled: boolean;
  callbackUrl?: string;
}) {
  const [pending, setPending] = useState<string | null>(null);

  function go(provider: "google" | "linkedin", enabled: boolean) {
    if (!enabled) {
      toast.info(`${provider === "google" ? "Google" : "LinkedIn"} sign-in is not switched on yet.`);
      return;
    }
    setPending(provider);
    signIn(provider, { callbackUrl: safeRedirectPath(callbackUrl) });
  }

  return (
    <div className="grid gap-2.5 sm:grid-cols-2">
      <Button type="button" variant="outline" loading={pending === "google"} onClick={() => go("google", googleEnabled)}>
        <GoogleIcon /> Google
      </Button>
      <Button type="button" variant="outline" loading={pending === "linkedin"} onClick={() => go("linkedin", linkedinEnabled)}>
        <LinkedInIcon /> LinkedIn
      </Button>
    </div>
  );
}
