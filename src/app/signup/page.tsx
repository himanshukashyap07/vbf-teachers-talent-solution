import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions, googleConfigured, linkedinConfigured } from "@/lib/auth";
import { AuthShell } from "@/components/auth-shell";
import { SignupForm } from "@/components/forms/signup-form";

export const metadata: Metadata = pageMetadata({
  title: "Register as a School or Teacher",
  description: "Create your account as a school or a teacher. It takes about two minutes, and our team will call to confirm your details.",
  path: "/signup",
});

export default async function SignupPage() {
  const session = await getServerSession(authOptions);
  if (session?.user) redirect(session.user.profileComplete ? "/dashboard" : "/onboarding");

  return (
    <AuthShell
      wide
      title="Create your account"
      subtitle="Schools and teachers both start here. It takes about two minutes."
    >
      <SignupForm googleEnabled={googleConfigured} linkedinEnabled={linkedinConfigured} />
    </AuthShell>
  );
}
