import type { Metadata } from "next";
import { AuthShell } from "@/components/auth-shell";
import { VerifyEmailClient } from "@/components/forms/verify-email-client";

export const metadata: Metadata = { title: "Confirm your email", robots: { index: false } };

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <AuthShell title="Confirm your email">
      <VerifyEmailClient token={token ?? null} />
    </AuthShell>
  );
}
