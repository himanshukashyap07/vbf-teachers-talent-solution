"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { paymentRequestSchema, type PaymentRequestInput } from "@/lib/validations/admin";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form-controls";
import { Notice } from "@/components/ui/notice";

export function PaymentRequestForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PaymentRequestInput>({
    resolver: zodResolver(paymentRequestSchema),
    defaultValues: { purpose: "placement-fee" },
  });

  async function onSubmit(values: PaymentRequestInput) {
    setError(null);
    const res = await fetch("/api/admin/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      setError(json?.error ?? "Could not create the request.");
      return;
    }
    toast.success(`Payment request ${json.data.receiptNo} created for ${json.data.forUser}`);
    reset({ purpose: "placement-fee" });
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {error && <Notice tone="error">{error}</Notice>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="User (email or mobile)" htmlFor="pr-id" error={errors.identifier?.message} required>
          <Input id="pr-id" aria-invalid={!!errors.identifier} {...register("identifier")} />
        </Field>
        <Field label="Purpose" htmlFor="pr-purpose" error={errors.purpose?.message} required>
          <Select id="pr-purpose" {...register("purpose")}>
            <option value="placement-fee">Placement fee</option>
            <option value="registration">Registration fee</option>
            <option value="other">Other</option>
          </Select>
        </Field>
        <Field label="Amount (₹)" htmlFor="pr-amount" error={errors.amountRupees?.message} required>
          <Input id="pr-amount" type="number" step="0.01" min={1} inputMode="decimal" aria-invalid={!!errors.amountRupees} {...register("amountRupees", { valueAsNumber: true })} />
        </Field>
        <Field label="Vacancy ID (optional)" htmlFor="pr-vac" error={errors.vacancyId?.message} hint="Copy from the Vacancies tab">
          <Input id="pr-vac" aria-invalid={!!errors.vacancyId} {...register("vacancyId")} />
        </Field>
        <Field label="Description shown on the receipt" htmlFor="pr-desc" error={errors.description?.message} required className="sm:col-span-2">
          <Input id="pr-desc" placeholder="e.g. Placement fee — TGT Mathematics, Test Public School" aria-invalid={!!errors.description} {...register("description")} />
        </Field>
      </div>
      <Button type="submit" loading={isSubmitting}>Create payment request</Button>
    </form>
  );
}
