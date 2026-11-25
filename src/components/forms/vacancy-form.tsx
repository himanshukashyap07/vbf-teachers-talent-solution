"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { gradeLevels, qualifications, upDistricts } from "@/config/site";
import { vacancySchema, type VacancyInput } from "@/lib/validations/vacancy";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form-controls";
import { Notice } from "@/components/ui/notice";

export function VacancyForm({ defaultDistrict }: { defaultDistrict?: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<VacancyInput>({
    resolver: zodResolver(vacancySchema),
    defaultValues: { district: defaultDistrict as VacancyInput["district"], salaryBasis: "gross", employmentType: "full-time" },
  });

  async function onSubmit(values: VacancyInput) {
    setError(null);
    const res = await fetch("/api/vacancies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      setError(json?.error ?? "Could not save the vacancy.");
      return;
    }
    toast.success("Requirement received. We will call you to confirm it.");
    reset();
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {error && <Notice tone="error">{error}</Notice>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Position title" htmlFor="v-title" error={errors.title?.message} required>
          <Input id="v-title" placeholder="e.g. TGT Mathematics" aria-invalid={!!errors.title} {...register("title")} />
        </Field>
        <Field label="Subject" htmlFor="v-subject" error={errors.subject?.message} required>
          <Input id="v-subject" aria-invalid={!!errors.subject} {...register("subject")} />
        </Field>
        <Field label="Level" htmlFor="v-grade" error={errors.gradeLevel?.message} required>
          <Select id="v-grade" defaultValue="" placeholder="Select" aria-invalid={!!errors.gradeLevel} {...register("gradeLevel")}>
            {gradeLevels.map((g) => <option key={g} value={g}>{g}</option>)}
          </Select>
        </Field>
        <Field label="Minimum qualification" htmlFor="v-qual" error={errors.qualification?.message} required>
          <Select id="v-qual" defaultValue="" placeholder="Select" aria-invalid={!!errors.qualification} {...register("qualification")}>
            {qualifications.map((q) => <option key={q} value={q}>{q}</option>)}
          </Select>
        </Field>
        <Field label="Minimum experience (years)" htmlFor="v-exp" error={errors.minExperienceYears?.message} required>
          <Input id="v-exp" type="number" min={0} step="0.5" inputMode="decimal" aria-invalid={!!errors.minExperienceYears} {...register("minExperienceYears", { valueAsNumber: true })} />
        </Field>
        <Field label="Employment type" htmlFor="v-type" error={errors.employmentType?.message} required>
          <Select id="v-type" aria-invalid={!!errors.employmentType} {...register("employmentType")}>
            <option value="full-time">Full-time</option>
            <option value="part-time">Part-time</option>
          </Select>
        </Field>
        <Field label="Salary from (₹ / month)" htmlFor="v-smin" error={errors.salaryMin?.message} required>
          <Input id="v-smin" type="number" min={0} step={500} inputMode="numeric" aria-invalid={!!errors.salaryMin} {...register("salaryMin", { valueAsNumber: true })} />
        </Field>
        <Field label="Salary up to (₹ / month)" htmlFor="v-smax" error={errors.salaryMax?.message} required>
          <Input id="v-smax" type="number" min={0} step={500} inputMode="numeric" aria-invalid={!!errors.salaryMax} {...register("salaryMax", { valueAsNumber: true })} />
        </Field>
        <Field label="Salary basis" htmlFor="v-basis" error={errors.salaryBasis?.message} hint="Gross = before deductions" required>
          <Select id="v-basis" aria-invalid={!!errors.salaryBasis} {...register("salaryBasis")}>
            <option value="gross">Gross</option>
            <option value="take-home">Take-home</option>
          </Select>
        </Field>
        <Field label="District" htmlFor="v-district" error={errors.district?.message} required>
          <Select id="v-district" defaultValue={defaultDistrict ?? ""} placeholder="Select" aria-invalid={!!errors.district} {...register("district")}>
            {upDistricts.map((d) => <option key={d} value={d}>{d}</option>)}
          </Select>
        </Field>
        <Field label="Expected joining date" htmlFor="v-join" error={errors.joiningDate?.message} hint="Optional" className="sm:col-span-2">
          <Input id="v-join" type="date" {...register("joiningDate", { setValueAs: (v: string) => v || undefined })} />
        </Field>
      </div>
      <Field label="Other requirements" htmlFor="v-notes" error={errors.notes?.message} hint="Working hours, skills, anything else the candidate should know. Optional.">
        <Textarea id="v-notes" rows={4} {...register("notes")} />
      </Field>
      <Button type="submit" loading={isSubmitting}>Submit requirement</Button>
    </form>
  );
}
