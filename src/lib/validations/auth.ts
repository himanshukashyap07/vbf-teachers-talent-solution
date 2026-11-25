import { z } from "zod";
import { boards, gradeLevels, qualifications, upDistricts } from "@/config/site";
import { emailField, nameField, parseIdentifier, passwordField, phoneField } from "./common";

export const roles = ["candidate", "school"] as const;
export type Role = (typeof roles)[number];

/* ---------- Login ---------- */
export const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, "Enter your email or mobile number")
    .refine((v) => parseIdentifier(v) !== null, "Enter a valid email or 10-digit mobile number"),
  password: z.string().min(1, "Enter your password"),
});
export type LoginInput = z.infer<typeof loginSchema>;

/* ---------- Signup step 1: account ---------- */
export const accountStepSchema = z
  .object({
    name: nameField,
    role: z.enum(roles, { error: "Choose whether you are a school or a teacher" }),
    email: emailField,
    phone: phoneField,
    password: passwordField,
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });
export type AccountStepInput = z.input<typeof accountStepSchema>;

/* ---------- Role-specific details ---------- */
const districtField = z.enum(upDistricts, { error: "Select a district" });

export const candidateDetailsSchema = z.object({
  qualification: z.enum(qualifications, { error: "Select your highest qualification" }),
  subjects: z.string().trim().min(2, "List the subjects you teach").max(200),
  gradeLevel: z.enum(gradeLevels, { error: "Select the level you teach" }),
  experienceYears: z
    .number({ error: "Enter years of experience (0 if fresher)" })
    .min(0, "Cannot be negative")
    .max(50, "Enter a realistic value"),
  district: districtField,
  expectedSalary: z
    .number({ error: "Enter a monthly amount in rupees" })
    .min(0)
    .max(500000)
    .optional(),
  sharingConsent: z.boolean().refine((v) => v === true, {
    message: "We need your consent to share your profile with schools you are matched to",
  }),
});
export type CandidateDetailsInput = z.input<typeof candidateDetailsSchema>;

export const schoolDetailsSchema = z.object({
  schoolName: z.string().trim().min(3, "Enter the school name").max(120),
  board: z.enum(boards, { error: "Select the board" }),
  district: districtField,
  designation: z.string().trim().min(2, "Enter your role at the school").max(60),
  expectedHires: z
    .number({ error: "Enter an approximate number" })
    .int("Whole numbers only")
    .min(0)
    .max(500)
    .optional(),
  termsAccepted: z.boolean().refine((v) => v === true, {
    message: "Please accept the terms to continue",
  }),
});
export type SchoolDetailsInput = z.input<typeof schoolDetailsSchema>;

/* ---------- Full signup (server) ---------- */
const accountBase = z.object({
  name: nameField,
  email: emailField,
  phone: phoneField,
  password: passwordField,
});

export const signupSchema = z.discriminatedUnion("role", [
  accountBase.extend({ role: z.literal("candidate"), details: candidateDetailsSchema }),
  accountBase.extend({ role: z.literal("school"), details: schoolDetailsSchema }),
]);
export type SignupInput = z.infer<typeof signupSchema>;

/* ---------- Onboarding for OAuth users (no password) ---------- */
export const onboardingSchema = z.discriminatedUnion("role", [
  z.object({
    role: z.literal("candidate"),
    phone: phoneField,
    details: candidateDetailsSchema,
  }),
  z.object({
    role: z.literal("school"),
    phone: phoneField,
    details: schoolDetailsSchema,
  }),
]);
export type OnboardingInput = z.infer<typeof onboardingSchema>;

/* ---------- Contact ---------- */
export const contactSchema = z.object({
  name: nameField,
  email: emailField,
  phone: phoneField.optional().or(z.literal("")),
  audience: z.enum(["school", "teacher", "other"], { error: "Select who you are" }),
  message: z.string().trim().min(10, "Please write at least 10 characters").max(2000),
});
export type ContactInput = z.input<typeof contactSchema>;
