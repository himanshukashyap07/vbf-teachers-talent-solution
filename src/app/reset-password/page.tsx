import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { ResetPasswordForm } from "@/components/forms/reset-password-form";
import { Notice } from "@/components/ui/notice";

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false } };

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <AuthShell title="Choose a new password" subtitle="Pick a password you have not used elsewhere.">
      {token ? (
        <ResetPasswordForm token={token} />
      ) : (
        <Notice tone="error">
          This link is missing its code. <Link href="/forgot-password" className="underline">Request a new reset link</Link>.
        </Notice>
      )}
    </AuthShell>
  );
}
