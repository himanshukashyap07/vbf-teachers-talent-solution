"use client";

import type { FieldErrors, UseFormRegister } from "react-hook-form";
import {
  boards,
  gradeLevels,
  qualifications,
  siteConfig,
  upDistricts,
} from "@/config/site";
import { Checkbox, Field, Input, Select } from "@/components/ui/form-controls";
import type { CandidateDetailsInput, SchoolDetailsInput } from "@/lib/validations/auth";
import Link from "next/link";

const msg = (e?: { message?: string }) => e?.message;

export function CandidateFields({
  register,
  errors,
}: {
  register: UseFormRegister<CandidateDetailsInput>;
  errors: FieldErrors<CandidateDetailsInput>;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Highest qualification" htmlFor="qualification" error={msg(errors.qualification)} required>
        <Select id="qualification" defaultValue="" placeholder="Select" aria-invalid={!!errors.qualification} {...register("qualification")}>
          {qualifications.map((q) => (
            <option key={q} value={q}>{q}</option>
          ))}
        </Select>
      </Field>

      <Field label="Level you teach" htmlFor="gradeLevel" error={msg(errors.gradeLevel)} required>
        <Select id="gradeLevel" defaultValue="" placeholder="Select" aria-invalid={!!errors.gradeLevel} {...register("gradeLevel")}>
          {gradeLevels.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </Select>
      </Field>

      <Field
        label="Subjects you teach"
        htmlFor="subjects"
        error={msg(errors.subjects)}
        hint="Separate with commas, e.g. Mathematics, Physics"
        required
        className="sm:col-span-2"
      >
        <Input id="subjects" placeholder="Mathematics, Science" aria-invalid={!!errors.subjects} {...register("subjects")} />
      </Field>

      <Field label="Teaching experience (years)" htmlFor="experienceYears" error={msg(errors.experienceYears)} hint="Enter 0 if you are a fresher" required>
        <Input id="experienceYears" type="number" inputMode="decimal" min={0} step="0.5" aria-invalid={!!errors.experienceYears} {...register("experienceYears", { valueAsNumber: true })} />
      </Field>

      <Field label="District" htmlFor="district" error={msg(errors.district)} required>
        <Select id="district" defaultValue="" placeholder="Select" aria-invalid={!!errors.district} {...register("district")}>
          {upDistricts.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </Select>
      </Field>

      <Field
        label="Expected monthly salary (₹)"
        htmlFor="expectedSalary"
        error={msg(errors.expectedSalary)}
        hint="Optional. Helps us match you to realistic vacancies."
        className="sm:col-span-2"
      >
        <Input
          id="expectedSalary"
          type="number"
          inputMode="numeric"
          min={0}
          step={500}
          aria-invalid={!!errors.expectedSalary}
          {...register("expectedSalary", { setValueAs: (v) => (v === "" || v == null ? undefined : Number(v)) })}
        />
      </Field>

      <div className="sm:col-span-2">
        <label className="flex gap-3 text-sm leading-6">
          <Checkbox {...register("sharingConsent")} />
          <span>
            I confirm the details above are accurate, and I agree that {siteConfig.name} may share my profile
            and interview summary only with schools it matches me to. I have read the{" "}
            <Link href="/privacy" target="_blank" className="text-primary underline">privacy notice</Link>.
          </span>
        </label>
        {errors.sharingConsent && (
          <p role="alert" className="mt-1 text-xs font-medium text-error">{errors.sharingConsent.message}</p>
        )}
      </div>
    </div>
  );
}

export function SchoolFields({
  register,
  errors,
}: {
  register: UseFormRegister<SchoolDetailsInput>;
  errors: FieldErrors<SchoolDetailsInput>;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="School name" htmlFor="schoolName" error={msg(errors.schoolName)} required className="sm:col-span-2">
        <Input id="schoolName" autoComplete="organization" aria-invalid={!!errors.schoolName} {...register("schoolName")} />
      </Field>

      <Field label="Board" htmlFor="board" error={msg(errors.board)} required>
        <Select id="board" defaultValue="" placeholder="Select" aria-invalid={!!errors.board} {...register("board")}>
          {boards.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </Select>
      </Field>

      <Field label="District" htmlFor="district" error={msg(errors.district)} required>
        <Select id="district" defaultValue="" placeholder="Select" aria-invalid={!!errors.district} {...register("district")}>
          {upDistricts.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </Select>
      </Field>

      <Field label="Your role at the school" htmlFor="designation" error={msg(errors.designation)} hint="e.g. Principal, Director, HR / Admin" required>
        <Input id="designation" aria-invalid={!!errors.designation} {...register("designation")} />
      </Field>

      <Field label="Teachers you expect to hire this year" htmlFor="expectedHires" error={msg(errors.expectedHires)} hint="Optional, an approximate number is fine">
        <Input
          id="expectedHires"
          type="number"
          inputMode="numeric"
          min={0}
          aria-invalid={!!errors.expectedHires}
          {...register("expectedHires", { setValueAs: (v) => (v === "" || v == null ? undefined : Number(v)) })}
        />
      </Field>

      <div className="sm:col-span-2">
        <label className="flex gap-3 text-sm leading-6">
          <Checkbox {...register("termsAccepted")} />
          <span>
            I am authorised to represent this school and I accept the{" "}
            <Link href="/terms" target="_blank" className="text-primary underline">terms of use</Link> and{" "}
            <Link href="/privacy" target="_blank" className="text-primary underline">privacy notice</Link>.
          </span>
        </label>
        {errors.termsAccepted && (
          <p role="alert" className="mt-1 text-xs font-medium text-error">{errors.termsAccepted.message}</p>
        )}
      </div>
    </div>
  );
}
