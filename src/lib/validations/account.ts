import { z } from "zod";
import { parseIdentifier, passwordField } from "./common";

export const forgotPasswordSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, "Enter your email or mobile number")
    .refine((v) => parseIdentifier(v) !== null, "Enter a valid email or 10-digit mobile number"),
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

const tokenField = z.string().regex(/^[a-f0-9]{64}$/, "This link is not valid.");

export const resetPasswordSchema = z
  .object({
    token: tokenField,
    password: passwordField,
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((d) => d.password === d.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match" });
export type ResetPasswordInput = z.input<typeof resetPasswordSchema>;

export const verifyEmailSchema = z.object({ token: tokenField });
