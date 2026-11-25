import { z } from "zod";

/** Indian mobile: 10 digits starting 6-9. Accepts +91 / 0 prefixes and spaces. */
export function normalizePhone(input: string): string | null {
  let digits = input.replace(/[\s\-()]/g, "");
  // Strip a country/trunk prefix only when the remainder is exactly 10 digits,
  // so a real number that happens to start with "91" or "0" is never mangled.
  if (/^(\+91|91)\d{10}$/.test(digits)) digits = digits.replace(/^(\+91|91)/, "");
  else if (/^0\d{10}$/.test(digits)) digits = digits.slice(1);
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
}

export function normalizeEmail(input: string): string {
  return input.trim().toLowerCase();
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Email OR mobile number, returned in normalized form. */
export function parseIdentifier(
  input: string,
): { type: "email" | "phone"; value: string } | null {
  const trimmed = input.trim();
  if (emailRegex.test(trimmed)) return { type: "email", value: normalizeEmail(trimmed) };
  const phone = normalizePhone(trimmed);
  return phone ? { type: "phone", value: phone } : null;
}

export const emailField = z
  .string()
  .trim()
  .min(1, "Email is required")
  .regex(emailRegex, "Enter a valid email address")
  .transform((v) => v.toLowerCase());

export const phoneField = z
  .string()
  .trim()
  .min(1, "Mobile number is required")
  .refine((v) => normalizePhone(v) !== null, "Enter a valid 10-digit Indian mobile number")
  .transform((v) => normalizePhone(v) as string);

export const nameField = z
  .string()
  .trim()
  .min(2, "Name must be at least 2 characters")
  .max(80, "Name is too long");

export const passwordField = z
  .string()
  .min(8, "Use at least 8 characters")
  .max(72, "Password is too long")
  // bcrypt only uses the first 72 BYTES, so non-English characters (2-4 bytes each) must not push
  // a password past that, or two different passwords could be treated as the same one.
  .refine((v) => new TextEncoder().encode(v).length <= 72, "Password is too long (use fewer special or non-English characters)")
  .regex(/[A-Za-z]/, "Include at least one letter")
  .regex(/\d/, "Include at least one number");
