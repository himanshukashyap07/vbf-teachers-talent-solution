"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { GraduationCap, School } from "lucide-react";
import {
  accountStepSchema,
  candidateDetailsSchema,
  schoolDetailsSchema,
  type AccountStepInput,
  type CandidateDetailsInput,
  type SchoolDetailsInput,
} from "@/lib/validations/auth";
import { useSignupStore } from "@/store/signup-store";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form-controls";
import { Notice } from "@/components/ui/notice";
import { cn } from "@/lib/utils";
import { CandidateFields, SchoolFields } from "./role-fields";
import { OAuthButtons } from "./oauth-buttons";

const roleOptions = [
  { value: "candidate", title: "I am a teacher", desc: "Looking for a teaching job", icon: GraduationCap },
  { value: "school", title: "I represent a school", desc: "Looking to hire teachers", icon: School },
] as const;

export function SignupForm({
  googleEnabled,
  linkedinEnabled,
}: {
  googleEnabled: boolean;
  linkedinEnabled: boolean;
}) {
  const step = useSignupStore((s) => s.step);

  return (
    <div className="space-y-5">
      <ol className="flex items-center gap-3 text-sm" aria-label="Progress">
        {["Account", "Your details"].map((label, i) => {
          const n = i + 1;
          const done = step > n;
          const current = step === n;
          return (
            <li key={label} className="flex items-center gap-2" aria-current={current ? "step" : undefined}>
              <span
                className={cn(
                  "grid size-6 place-items-center rounded-full text-xs font-bold",
                  current || done ? "bg-primary text-primary-content" : "bg-base-300 text-base-content/70",
                )}
              >
                {n}
              </span>
              <span className={cn("font-medium", !current && "text-base-content/60")}>{label}</span>
              {n === 1 && <span className="mx-1 h-px w-8 bg-base-300" aria-hidden />}
            </li>
          );
        })}
      </ol>

      {step === 1 ? (
        <AccountStep googleEnabled={googleEnabled} linkedinEnabled={linkedinEnabled} />
      ) : (
        <DetailsStep />
      )}
    </div>
  );
}

/* ---------------- Step 1 ---------------- */
function AccountStep({
  googleEnabled,
  linkedinEnabled,
}: {
  googleEnabled: boolean;
  linkedinEnabled: boolean;
}) {
  const { account, setAccount, serverError } = useSignupStore();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<AccountStepInput>({
    resolver: zodResolver(accountStepSchema),
    defaultValues: account as AccountStepInput,
  });
  const selectedRole = useWatch({ control, name: "role" });

  return (
    <div className="space-y-5">
      <OAuthButtons googleEnabled={googleEnabled} linkedinEnabled={linkedinEnabled} callbackUrl="/onboarding" />
      <div className="flex items-center gap-3 text-xs uppercase tracking-wider text-base-content/50">
        <span className="h-px flex-1 bg-base-300" /> or sign up with email <span className="h-px flex-1 bg-base-300" />
      </div>

      {serverError && <Notice tone="error">{serverError}</Notice>}

      <form onSubmit={handleSubmit(setAccount)} noValidate className="space-y-4">
        <fieldset>
          <legend className="mb-1.5 text-sm font-semibold">I am signing up as</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {roleOptions.map(({ value, title, desc, icon: Icon }) => (
              <label
                key={value}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-box border bg-base-100 p-4 hover:border-primary/60",
                  selectedRole === value ? "border-primary ring-1 ring-primary" : "border-base-300",
                )}
              >
                <input type="radio" value={value} className="sr-only" {...register("role")} />
                <Icon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                <span>
                  <span className="block text-sm font-semibold">{title}</span>
                  <span className="block text-xs text-base-content/65">{desc}</span>
                </span>
              </label>
            ))}
          </div>
          {errors.role && <p role="alert" className="mt-1 text-xs font-medium text-error">{errors.role.message}</p>}
        </fieldset>

        <Field label="Full name" htmlFor="name" error={errors.name?.message} required>
          <Input id="name" autoComplete="name" aria-invalid={!!errors.name} {...register("name")} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email" htmlFor="email" error={errors.email?.message} required>
            <Input id="email" type="email" autoComplete="email" aria-invalid={!!errors.email} {...register("email")} />
          </Field>
          <Field label="Mobile number" htmlFor="phone" error={errors.phone?.message} hint="10 digits, we may call you" required>
            <Input id="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="98XXXXXXXX" aria-invalid={!!errors.phone} {...register("phone")} />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Password" htmlFor="password" error={errors.password?.message} hint="8+ characters with a letter and a number" required>
            <Input id="password" type="password" autoComplete="new-password" aria-invalid={!!errors.password} {...register("password")} />
          </Field>
          <Field label="Confirm password" htmlFor="confirmPassword" error={errors.confirmPassword?.message} required>
            <Input id="confirmPassword" type="password" autoComplete="new-password" aria-invalid={!!errors.confirmPassword} {...register("confirmPassword")} />
          </Field>
        </div>

        <Button type="submit" className="w-full">
          Continue
        </Button>
      </form>

      <p className="text-center text-sm text-base-content/70">
        Already registered?{" "}
        <Link href="/login" className="font-semibold text-primary underline underline-offset-2">
          Log in
        </Link>
      </p>
    </div>
  );
}

/* ---------------- Step 2 ---------------- */
function DetailsStep() {
  const { account, role } = useSignupStore();
  return role === "candidate" ? <CandidateStep account={account as AccountStepInput} /> : <SchoolStep account={account as AccountStepInput} />;
}

async function submitRegistration(
  account: AccountStepInput,
  details: unknown,
): Promise<{ ok: true } | { ok: false; error: string; backToStep1?: boolean }> {
  const res = await fetch("/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: account.name,
      email: account.email,
      phone: account.phone,
      password: account.password,
      role: account.role,
      details,
    }),
  });
  const json = await res.json().catch(() => null);
  if (res.ok) return { ok: true };
  return {
    ok: false,
    error: json?.error ?? "Could not create your account.",
    // Email/mobile problems belong to step 1, so send the user back there.
    backToStep1: res.status === 409 || Boolean(json?.fieldErrors?.email || json?.fieldErrors?.phone),
  };
}

function useFinish() {
  const router = useRouter();
  const { reset } = useSignupStore();
  return async (account: AccountStepInput) => {
    toast.success("Account created. Signing you in…");
    const res = await signIn("credentials", { identifier: account.email, password: account.password, redirect: false });
    reset();
    router.push(res?.error ? "/login" : "/dashboard");
    router.refresh();
  };
}

function StepFooter({ submitting, onBack }: { submitting: boolean; onBack: () => void }) {
  return (
    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
      <Button type="button" variant="outline" onClick={onBack} disabled={submitting}>
        Back
      </Button>
      <Button type="submit" loading={submitting}>
        Create account
      </Button>
    </div>
  );
}

function CandidateStep({ account }: { account: AccountStepInput }) {
  const { goBack } = useSignupStore();
  const finish = useFinish();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CandidateDetailsInput>({ resolver: zodResolver(candidateDetailsSchema) });

  async function onSubmit(details: CandidateDetailsInput) {
    setError(null);
    const result = await submitRegistration(account, details);
    if (!result.ok) {
      if (result.backToStep1) {
        goBack(result.error);
        return;
      }
      setError(result.error);
      return;
    }
    await finish(account);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <p className="text-sm text-base-content/70">
        A few details so we can match you to suitable vacancies. Hello, <strong>{account.name}</strong>.
      </p>
      {error && (
        <Notice tone="error">{error}</Notice>
      )}
      <CandidateFields register={register} errors={errors} />
      <StepFooter submitting={isSubmitting} onBack={() => goBack()} />
    </form>
  );
}

function SchoolStep({ account }: { account: AccountStepInput }) {
  const { goBack } = useSignupStore();
  const finish = useFinish();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SchoolDetailsInput>({ resolver: zodResolver(schoolDetailsSchema) });

  async function onSubmit(details: SchoolDetailsInput) {
    setError(null);
    const result = await submitRegistration(account, details);
    if (!result.ok) {
      if (result.backToStep1) {
        goBack(result.error);
        return;
      }
      setError(result.error);
      return;
    }
    await finish(account);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <p className="text-sm text-base-content/70">
        Tell us about your school. Hello, <strong>{account.name}</strong>.
      </p>
      {error && (
        <Notice tone="error">{error}</Notice>
      )}
      <SchoolFields register={register} errors={errors} />
      <StepFooter submitting={isSubmitting} onBack={() => goBack()} />
    </form>
  );
}
