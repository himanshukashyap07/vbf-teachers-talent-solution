import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions, googleConfigured, linkedinConfigured } from "@/lib/auth";
import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "@/components/forms/login-form";

export const metadata: Metadata = pageMetadata({
  title: "Log in",
  description: "Log in to your account with your email or mobile number to manage your profile, vacancies, payments and notifications.",
  path: "/login",
  noindex: true,
});

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session?.user) redirect(session.user.profileComplete ? "/dashboard" : "/onboarding");

  return (
    <AuthShell title="Log in" subtitle="Use the email or mobile number you registered with.">
      <Suspense>
        <LoginForm googleEnabled={googleConfigured} linkedinEnabled={linkedinConfigured} />
      </Suspense>
    </AuthShell>
  );
}
