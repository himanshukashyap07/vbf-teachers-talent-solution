"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { GraduationCap, School } from "lucide-react";
import {
  candidateDetailsSchema,
  schoolDetailsSchema,
  type CandidateDetailsInput,
  type Role,
  type SchoolDetailsInput,
} from "@/lib/validations/auth";
import { normalizePhone } from "@/lib/validations/common";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form-controls";
import { Notice } from "@/components/ui/notice";
import { cn } from "@/lib/utils";
import { CandidateFields, SchoolFields } from "./role-fields";

/** Shown once to people who signed in with Google/LinkedIn and have no role yet. */
export function OnboardingForm({ name }: { name: string }) {
  const [role, setRole] = useState<Role | null>(null);
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);

  function checkPhone() {
    if (!normalizePhone(phone)) {
      setPhoneError("Enter a valid 10-digit Indian mobile number");
      return false;
    }
    setPhoneError(null);
    return true;
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-base-content/70">
        Welcome, <strong>{name}</strong>. Tell us who you are so we can set up your account.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {([
          { value: "candidate", title: "I am a teacher", icon: GraduationCap },
          { value: "school", title: "I represent a school", icon: School },
        ] as const).map(({ value, title, icon: Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => setRole(value)}
            aria-pressed={role === value}
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-box border bg-base-100 p-4 text-left text-sm font-semibold hover:border-primary/60",
              role === value ? "border-primary ring-1 ring-primary" : "border-base-300",
            )}
          >
            <Icon className="size-5 text-primary" aria-hidden /> {title}
          </button>
        ))}
      </div>

      <Field label="Mobile number" htmlFor="phone" error={phoneError ?? undefined} hint="10 digits, we may call you" required>
        <Input
          id="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          aria-invalid={!!phoneError}
        />
      </Field>

      {role === "candidate" && <CandidateOnboarding phone={phone} checkPhone={checkPhone} />}
      {role === "school" && <SchoolOnboarding phone={phone} checkPhone={checkPhone} />}
    </div>
  );
}

function useComplete() {
  const router = useRouter();
  const { update } = useSession();
  const [error, setError] = useState<string | null>(null);

  async function complete(role: Role, phone: string, details: unknown) {
    setError(null);
    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, phone, details }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      setError(json?.error ?? "Could not save your details.");
      return;
    }
    await update(); // refresh role/profileComplete in the session token
    toast.success("All set. Welcome aboard.");
    router.push("/dashboard");
    router.refresh();
  }
  return { error, complete };
}

function CandidateOnboarding({ phone, checkPhone }: { phone: string; checkPhone: () => boolean }) {
  const { error, complete } = useComplete();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CandidateDetailsInput>({ resolver: zodResolver(candidateDetailsSchema) });

  return (
    <form
      noValidate
      className="space-y-5"
      onSubmit={handleSubmit(async (details) => {
        if (checkPhone()) await complete("candidate", phone, details);
      })}
    >
      {error && <Notice tone="error">{error}</Notice>}
      <CandidateFields register={register} errors={errors} />
      <Button type="submit" className="w-full sm:w-auto" loading={isSubmitting}>Finish setup</Button>
    </form>
  );
}

function SchoolOnboarding({ phone, checkPhone }: { phone: string; checkPhone: () => boolean }) {
  const { error, complete } = useComplete();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SchoolDetailsInput>({ resolver: zodResolver(schoolDetailsSchema) });

  return (
    <form
      noValidate
      className="space-y-5"
      onSubmit={handleSubmit(async (details) => {
        if (checkPhone()) await complete("school", phone, details);
      })}
    >
      {error && <Notice tone="error">{error}</Notice>}
      <SchoolFields register={register} errors={errors} />
      <Button type="submit" className="w-full sm:w-auto" loading={isSubmitting}>Finish setup</Button>
    </form>
  );
}
