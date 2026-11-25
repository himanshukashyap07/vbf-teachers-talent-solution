"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { contactSchema, type ContactInput } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form-controls";
import { Notice } from "@/components/ui/notice";

export function ContactForm() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactInput>({ resolver: zodResolver(contactSchema) });

  async function onSubmit(values: ContactInput) {
    setError(null);
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      setError(json?.error ?? "Could not send your message.");
      return;
    }
    toast.success("Message received. We will get back to you soon.");
    setSent(true);
    reset();
  }

  if (sent) {
    return (
      <Notice tone="success">
        Thank you. We have received your message and will contact you by phone or email.{" "}
        <button type="button" className="underline" onClick={() => setSent(false)}>
          Send another message
        </button>
      </Notice>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {error && <Notice tone="error">{error}</Notice>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name" htmlFor="c-name" error={errors.name?.message} required>
          <Input id="c-name" autoComplete="name" aria-invalid={!!errors.name} {...register("name")} />
        </Field>
        <Field label="I am a" htmlFor="c-audience" error={errors.audience?.message} required>
          <Select id="c-audience" defaultValue="" placeholder="Select" aria-invalid={!!errors.audience} {...register("audience")}>
            <option value="school">School / institute</option>
            <option value="teacher">Teacher</option>
            <option value="other">Something else</option>
          </Select>
        </Field>
        <Field label="Email" htmlFor="c-email" error={errors.email?.message} required>
          <Input id="c-email" type="email" autoComplete="email" aria-invalid={!!errors.email} {...register("email")} />
        </Field>
        <Field label="Mobile number" htmlFor="c-phone" error={errors.phone?.message} hint="Optional, for a call back">
          <Input id="c-phone" type="tel" inputMode="tel" autoComplete="tel" aria-invalid={!!errors.phone} {...register("phone")} />
        </Field>
      </div>
      <Field label="How can we help?" htmlFor="c-message" error={errors.message?.message} required>
        <Textarea id="c-message" rows={5} aria-invalid={!!errors.message} {...register("message")} />
      </Field>
      <Button type="submit" loading={isSubmitting}>
        Send message
      </Button>
    </form>
  );
}
