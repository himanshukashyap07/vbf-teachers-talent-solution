"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validations/account";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form-controls";
import { Notice } from "@/components/ui/notice";

export function ForgotPasswordForm() {
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });

  async function onSubmit(values: ForgotPasswordInput) {
    setError(null);
    const res = await fetch("/api/account/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      setError(json?.error ?? "Something went wrong. Please try again.");
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="space-y-4">
        <Notice tone="success">
          If an account exists for that email or mobile number, we have sent a link to reset the password to the
          email address on the account. The link works for 1 hour. Check your spam folder too.
        </Notice>
        <Button asChild variant="outline"><Link href="/login">Back to log in</Link></Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {error && <Notice tone="error">{error}</Notice>}
      <Field label="Email or mobile number" htmlFor="identifier" error={errors.identifier?.message} hint="We will email the link to the address on your account.">
        <Input id="identifier" autoComplete="username" aria-invalid={!!errors.identifier} {...register("identifier")} />
      </Field>
      <Button type="submit" className="w-full" loading={isSubmitting}>Send reset link</Button>
      <p className="text-center text-sm text-base-content/70">
        <Link href="/login" className="font-semibold text-primary underline underline-offset-2">Back to log in</Link>
      </p>
    </form>
  );
}
