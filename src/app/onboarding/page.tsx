import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AuthShell } from "@/components/auth-shell";
import { OnboardingForm } from "@/components/forms/onboarding-form";

export const metadata: Metadata = { title: "Complete your profile", robots: { index: false } };

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/onboarding");
  if (session.user.profileComplete) redirect("/dashboard");

  return (
    <AuthShell wide title="Complete your profile" subtitle="One last step before you can use your account.">
      <OnboardingForm name={session.user.name ?? "there"} />
    </AuthShell>
  );
}
