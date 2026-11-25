"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { safeRedirectPath } from "@/lib/safe-redirect";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form-controls";
import { Notice } from "@/components/ui/notice";
import { OAuthButtons } from "./oauth-buttons";

const oauthErrors: Record<string, string> = {
  NoEmail: "Your account did not share an email address, so we could not sign you in.",
  OAuthAccountNotLinked: "This email is already registered. Log in with your password.",
  AccessDenied: "Sign-in was cancelled or not allowed.",
};

export function LoginForm({
  googleEnabled,
  linkedinEnabled,
}: {
  googleEnabled: boolean;
  linkedinEnabled: boolean;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = safeRedirectPath(params.get("callbackUrl"));
  const urlError = params.get("error");
  const [serverError, setServerError] = useState<string | null>(
    urlError ? (oauthErrors[urlError] ?? "Sign-in failed. Please try again.") : null,
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginInput) {
    setServerError(null);
    const res = await signIn("credentials", { ...values, redirect: false });
    if (!res || res.error) {
      setServerError(
        res?.error && res.error !== "CredentialsSignin"
          ? res.error
          : "Incorrect email/mobile number or password.",
      );
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <OAuthButtons googleEnabled={googleEnabled} linkedinEnabled={linkedinEnabled} callbackUrl={callbackUrl} />

      <div className="flex items-center gap-3 text-xs uppercase tracking-wider text-base-content/50">
        <span className="h-px flex-1 bg-base-300" /> or with password <span className="h-px flex-1 bg-base-300" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {serverError && <Notice tone="error">{serverError}</Notice>}

        <Field label="Email or mobile number" htmlFor="identifier" error={errors.identifier?.message}>
          <Input id="identifier" autoComplete="username" inputMode="email" aria-invalid={!!errors.identifier} {...register("identifier")} />
        </Field>

        <div>
          <Field label="Password" htmlFor="password" error={errors.password?.message}>
            <Input id="password" type="password" autoComplete="current-password" aria-invalid={!!errors.password} {...register("password")} />
          </Field>
          <p className="mt-1.5 text-right text-sm">
            <Link href="/forgot-password" className="font-medium text-primary underline underline-offset-2">
              Forgot password?
            </Link>
          </p>
        </div>

        <Button type="submit" className="w-full" loading={isSubmitting}>
          Log in
        </Button>
      </form>

      <p className="text-center text-sm text-base-content/70">
        New here?{" "}
        <Link href="/signup" className="font-semibold text-primary underline underline-offset-2">
          Create an account
        </Link>
      </p>
    </div>
  );
}
